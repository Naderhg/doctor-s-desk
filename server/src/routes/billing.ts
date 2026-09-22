import { Router } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { encounters, invoiceItems, invoices, payments, services, users } from "../db/schema.js";
import { handleError, sendError } from "../lib/http.js";
import { notify } from "../lib/notify.js";
import { formatTimeAr } from "../lib/format.js";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireRole("cashier", "admin", "receptionist"));

const departmentLabels: Record<string, string> = {
  er: "الطوارئ",
  opd: "العيادات الخارجية",
  ipd: "الأقسام الداخلية",
  or: "العمليات",
};

const methodLabels: Record<string, string> = {
  cash: "نقدي",
  card: "بطاقة",
  insurance: "تأمين",
  transfer: "تحويل",
};

async function invoiceTotals(invoiceId: string) {
  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  const pays = await db.select().from(payments).where(eq(payments.invoiceId, invoiceId));
  const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const paid = pays.reduce((s, p) => s + p.amount, 0);
  return { total, paid, remaining: total - paid };
}

async function refreshInvoiceStatus(invoiceId: string) {
  const { total, remaining } = await invoiceTotals(invoiceId);
  const status = remaining <= 0 && total > 0 ? "paid" : remaining < total ? "partially_paid" : "open";
  await db
    .update(invoices)
    .set({ status, closedAt: status === "paid" ? new Date() : null })
    .where(eq(invoices.id, invoiceId));
  return status;
}

// ─── Service catalog ───

router.get("/services", async (_req: AuthedRequest, res) => {
  try {
    const rows = await db.select().from(services).orderBy(services.category, services.name);
    res.json({ services: rows });
  } catch (error) {
    handleError(res, error);
  }
});

const serviceSchema = z.object({
  code: z.string().trim().min(1).max(30),
  name: z.string().trim().min(2).max(160),
  category: z.string().trim().min(1).max(40),
  price: z.number().int().min(0),
  department: z.enum(["er", "opd", "ipd", "or"]).optional().nullable(),
});

router.post("/services", requireRole("admin"), async (req: AuthedRequest, res) => {
  try {
    const body = serviceSchema.parse(req.body);
    const [existing] = await db.select({ id: services.id }).from(services).where(eq(services.code, body.code)).limit(1);
    if (existing) {
      sendError(res, 409, "كود الخدمة مسجل بالفعل");
      return;
    }
    const [service] = await db.insert(services).values({ ...body, department: body.department ?? null }).returning();
    res.status(201).json({ service });
  } catch (error) {
    handleError(res, error);
  }
});

// ─── Invoices ───

router.get("/invoices", async (req: AuthedRequest, res) => {
  try {
    const status = String(req.query.status ?? "");
    const rows = await db
      .select({ invoice: invoices, patient: users, encounter: encounters })
      .from(invoices)
      .innerJoin(users, eq(invoices.patientId, users.id))
      .innerJoin(encounters, eq(invoices.encounterId, encounters.id))
      .where(status ? eq(invoices.status, status as "open" | "partially_paid" | "paid" | "cancelled") : undefined)
      .orderBy(desc(invoices.createdAt))
      .limit(100);

    const result = [];
    for (const r of rows) {
      const { total, paid, remaining } = await invoiceTotals(r.invoice.id);
      result.push({
        id: r.invoice.id,
        encounterId: r.invoice.encounterId,
        status: r.invoice.status,
        patientName: r.patient.name,
        mrn: r.patient.mrn ?? "—",
        department: r.encounter.department,
        departmentLabel: departmentLabels[r.encounter.department] ?? r.encounter.department,
        encounterStatus: r.encounter.status,
        total,
        paid,
        remaining,
        createdAt: r.invoice.createdAt.toISOString(),
      });
    }
    res.json({ invoices: result });
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/invoices/:id", async (req: AuthedRequest, res) => {
  try {
    const [row] = await db
      .select({ invoice: invoices, patient: users, encounter: encounters })
      .from(invoices)
      .innerJoin(users, eq(invoices.patientId, users.id))
      .innerJoin(encounters, eq(invoices.encounterId, encounters.id))
      .where(eq(invoices.id, req.params.id))
      .limit(1);
    if (!row) {
      sendError(res, 404, "الفاتورة غير موجودة");
      return;
    }

    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, row.invoice.id)).orderBy(invoiceItems.createdAt);
    const pays = await db.select().from(payments).where(eq(payments.invoiceId, row.invoice.id)).orderBy(desc(payments.createdAt));
    const { total, paid, remaining } = await invoiceTotals(row.invoice.id);

    res.json({
      invoice: {
        id: row.invoice.id,
        status: row.invoice.status,
        encounterId: row.invoice.encounterId,
        patientName: row.patient.name,
        mrn: row.patient.mrn ?? "—",
        department: row.encounter.department,
        departmentLabel: departmentLabels[row.encounter.department] ?? row.encounter.department,
        encounterStatus: row.encounter.status,
        total,
        paid,
        remaining,
        createdAt: row.invoice.createdAt.toISOString(),
      },
      items: items.map((i) => ({
        id: i.id,
        description: i.description,
        category: i.category,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.unitPrice * i.quantity,
        time: formatTimeAr(i.createdAt),
      })),
      payments: pays.map((p) => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        methodLabel: methodLabels[p.method] ?? p.method,
        time: formatTimeAr(p.createdAt),
      })),
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ─── Add charge item (from catalog or manual) ───

const itemSchema = z.object({
  serviceId: z.string().uuid().optional(),
  description: z.string().trim().min(1).max(255).optional(),
  category: z.string().trim().max(40).optional(),
  quantity: z.number().int().min(1).max(1000).default(1),
  unitPrice: z.number().int().min(0).optional(),
});

router.post("/invoices/:id/items", async (req: AuthedRequest, res) => {
  try {
    const body = itemSchema.parse(req.body);
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, req.params.id)).limit(1);
    if (!invoice) {
      sendError(res, 404, "الفاتورة غير موجودة");
      return;
    }
    if (invoice.status === "paid" || invoice.status === "cancelled") {
      sendError(res, 400, "لا يمكن إضافة بنود لفاتورة مغلقة");
      return;
    }

    let description = body.description;
    let category = body.category ?? "other";
    let unitPrice = body.unitPrice;

    if (body.serviceId) {
      const [service] = await db.select().from(services).where(eq(services.id, body.serviceId)).limit(1);
      if (!service) {
        sendError(res, 404, "الخدمة غير موجودة");
        return;
      }
      description = description ?? service.name;
      category = service.category;
      unitPrice = unitPrice ?? service.price;
    }

    if (!description || unitPrice === undefined) {
      sendError(res, 400, "أدخل وصف البند وسعره");
      return;
    }

    const [item] = await db
      .insert(invoiceItems)
      .values({
        invoiceId: invoice.id,
        serviceId: body.serviceId ?? null,
        description,
        category,
        quantity: body.quantity,
        unitPrice,
        createdById: req.user!.id,
      })
      .returning();

    await refreshInvoiceStatus(invoice.id);
    res.status(201).json({ item });
  } catch (error) {
    handleError(res, error);
  }
});

router.delete("/invoices/:id/items/:itemId", async (req: AuthedRequest, res) => {
  try {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, req.params.id)).limit(1);
    if (!invoice) {
      sendError(res, 404, "الفاتورة غير موجودة");
      return;
    }
    if (invoice.status === "paid" || invoice.status === "cancelled") {
      sendError(res, 400, "لا يمكن حذف بنود من فاتورة مغلقة");
      return;
    }
    await db.delete(invoiceItems).where(and(eq(invoiceItems.id, req.params.itemId), eq(invoiceItems.invoiceId, invoice.id)));
    await refreshInvoiceStatus(invoice.id);
    res.json({ ok: true });
  } catch (error) {
    handleError(res, error);
  }
});

// ─── Record payment ───

const paymentSchema = z.object({
  amount: z.number().int().min(1, "المبلغ يجب أن يكون أكبر من صفر"),
  method: z.enum(["cash", "card", "insurance", "transfer"]).default("cash"),
});

router.post("/invoices/:id/payments", requireRole("cashier", "admin"), async (req: AuthedRequest, res) => {
  try {
    const body = paymentSchema.parse(req.body);
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, req.params.id)).limit(1);
    if (!invoice) {
      sendError(res, 404, "الفاتورة غير موجودة");
      return;
    }
    if (invoice.status === "cancelled") {
      sendError(res, 400, "الفاتورة ملغاة");
      return;
    }
    const { remaining } = await invoiceTotals(invoice.id);
    if (body.amount > remaining) {
      sendError(res, 400, `المبلغ أكبر من المتبقي (${remaining} جنيه)`);
      return;
    }

    const [payment] = await db
      .insert(payments)
      .values({ invoiceId: invoice.id, amount: body.amount, method: body.method, receivedById: req.user!.id })
      .returning();

    const status = await refreshInvoiceStatus(invoice.id);

    // Notify reception that the account is settled (enables discharge)
    if (status === "paid") {
      const receptionists = await db.select({ id: users.id }).from(users).where(eq(users.role, "receptionist"));
      const [patient] = await db.select().from(users).where(eq(users.id, invoice.patientId)).limit(1);
      for (const r of receptionists) {
        await notify(
          r.id,
          "system",
          "حساب مسدد بالكامل",
          `تم سداد حساب المريض ${patient?.name ?? ""} بالكامل — يمكن إتمام الخروج`,
          { invoiceId: invoice.id, encounterId: invoice.encounterId },
        );
      }
    }

    res.status(201).json({ payment, invoiceStatus: status });
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
