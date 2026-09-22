import { Router } from "express";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "../db/index.js";
import { encounters, invoiceItems, invoices, payments, users } from "../db/schema.js";
import { handleError, sendError } from "../lib/http.js";
import { notify } from "../lib/notify.js";
import { formatTimeAr } from "../lib/format.js";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireRole("receptionist", "admin", "cashier"));

const departmentLabels: Record<string, string> = {
  er: "الطوارئ",
  opd: "العيادات الخارجية",
  ipd: "الأقسام الداخلية",
  or: "العمليات",
};

async function generateMrn(): Promise<string> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.role, "patient"));
  return `MRN-${String((row?.n ?? 0) + 1).padStart(6, "0")}`;
}

function serializeEncounter(
  enc: typeof encounters.$inferSelect,
  patient: { id: string; name: string; phone: string | null; mrn: string | null },
  doctor?: { id: string; name: string } | null,
) {
  return {
    id: enc.id,
    patientId: patient.id,
    patientName: patient.name,
    patientPhone: patient.phone ?? "—",
    mrn: patient.mrn ?? "—",
    department: enc.department,
    departmentLabel: departmentLabels[enc.department] ?? enc.department,
    status: enc.status,
    chiefComplaint: enc.chiefComplaint,
    triageLevel: enc.triageLevel,
    doctorName: doctor?.name ?? null,
    admittedAt: enc.admittedAt.toISOString(),
    admittedTime: formatTimeAr(enc.admittedAt),
    dischargedAt: enc.dischargedAt?.toISOString() ?? null,
  };
}

// ─── Patient lookup (MRN / phone / nationalId / name) ───

router.get("/patients/lookup", async (req: AuthedRequest, res) => {
  try {
    const q = String(req.query.q ?? "").trim();
    if (!q) {
      res.json({ patients: [] });
      return;
    }
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        phone: users.phone,
        mrn: users.mrn,
        nationalId: users.nationalId,
      })
      .from(users)
      .where(
        and(
          eq(users.role, "patient"),
          or(
            sql`${users.mrn} ilike ${"%" + q + "%"}`,
            sql`coalesce(${users.phone}, '') ilike ${"%" + q + "%"}`,
            sql`coalesce(${users.nationalId}, '') ilike ${"%" + q + "%"}`,
            sql`${users.name} ilike ${"%" + q + "%"}`,
          ),
        ),
      )
      .limit(10);
    res.json({ patients: rows });
  } catch (error) {
    handleError(res, error);
  }
});

// ─── Quick patient registration (front desk) ───

const registerPatientSchema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جداً").max(120),
  phone: z.string().trim().min(8, "رقم الموبايل غير صالح").max(30),
  nationalId: z.string().trim().max(30).optional(),
});

router.post("/patients", requireRole("receptionist", "admin"), async (req: AuthedRequest, res) => {
  try {
    const body = registerPatientSchema.parse(req.body);
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, "patient"), eq(users.phone, body.phone)))
      .limit(1);
    if (existing) {
      sendError(res, 409, "يوجد مريض مسجل بنفس رقم الموبايل");
      return;
    }
    const mrn = await generateMrn();
    // Front-desk patients get a placeholder email + random password (they can claim the account later)
    const passwordHash = await bcrypt.hash(crypto.randomUUID(), 12);
    const [patient] = await db
      .insert(users)
      .values({
        name: body.name,
        email: `${mrn.toLowerCase()}@patient.local`,
        phone: body.phone,
        nationalId: body.nationalId ?? null,
        passwordHash,
        role: "patient",
        mrn,
      })
      .returning();
    res.status(201).json({
      patient: {
        id: patient!.id,
        name: patient!.name,
        phone: patient!.phone,
        mrn: patient!.mrn,
        nationalId: patient!.nationalId,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ─── Check-in: open encounter + auto-create invoice + notify cashiers ───

const checkInSchema = z.object({
  patientId: z.string().uuid(),
  department: z.enum(["er", "opd", "ipd", "or"]),
  chiefComplaint: z.string().trim().max(500).default(""),
  triageLevel: z.enum(["red", "yellow", "green"]).optional(),
  assignedDoctorId: z.string().uuid().optional().nullable(),
});

router.post("/", requireRole("receptionist", "admin"), async (req: AuthedRequest, res) => {
  try {
    const body = checkInSchema.parse(req.body);
    const [patient] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, body.patientId), eq(users.role, "patient")))
      .limit(1);
    if (!patient) {
      sendError(res, 404, "المريض غير موجود");
      return;
    }

    const [active] = await db
      .select({ id: encounters.id })
      .from(encounters)
      .where(and(eq(encounters.patientId, patient.id), eq(encounters.status, "active")))
      .limit(1);
    if (active) {
      sendError(res, 409, "المريض لديه دخول نشط بالفعل — يجب إنهاء الدخول الحالي أولاً");
      return;
    }

    const [encounter] = await db
      .insert(encounters)
      .values({
        patientId: patient.id,
        department: body.department,
        chiefComplaint: body.chiefComplaint,
        triageLevel: body.department === "er" ? body.triageLevel ?? null : null,
        assignedDoctorId: body.assignedDoctorId ?? null,
        createdById: req.user!.id,
      })
      .returning();

    // Auto-open billing folio — billing hears about it instantly
    const [invoice] = await db
      .insert(invoices)
      .values({ encounterId: encounter!.id, patientId: patient.id })
      .returning();

    const deptLabel = departmentLabels[body.department] ?? body.department;
    const cashiers = await db.select({ id: users.id }).from(users).where(eq(users.role, "cashier"));
    for (const c of cashiers) {
      await notify(
        c.id,
        "system",
        "دخول جديد — حساب مفتوح",
        `دخل المريض ${patient.name} قسم ${deptLabel} — تم فتح حساب تلقائياً`,
        { encounterId: encounter!.id, invoiceId: invoice!.id, patientId: patient.id },
      );
    }
    if (body.assignedDoctorId) {
      await notify(
        body.assignedDoctorId,
        "system",
        "مريض جديد",
        `تم تسجيل المريض ${patient.name} في ${deptLabel} تحت مسؤوليتك`,
        { encounterId: encounter!.id, patientId: patient.id },
      );
    }

    let doctor: { id: string; name: string } | null = null;
    if (body.assignedDoctorId) {
      const [d] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, body.assignedDoctorId)).limit(1);
      doctor = d ?? null;
    }

    res.status(201).json({
      encounter: serializeEncounter(encounter!, patient, doctor),
      invoiceId: invoice!.id,
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ─── List encounters (active by default, filter by department) ───

router.get("/", async (req: AuthedRequest, res) => {
  try {
    const status = String(req.query.status ?? "active");
    const department = String(req.query.department ?? "");
    const rows = await db
      .select({ encounter: encounters, patient: users })
      .from(encounters)
      .innerJoin(users, eq(encounters.patientId, users.id))
      .where(
        and(
          status !== "all" ? eq(encounters.status, status as "active" | "discharged" | "cancelled") : undefined,
          department ? eq(encounters.department, department as "er" | "opd" | "ipd" | "or") : undefined,
        ),
      )
      .orderBy(desc(encounters.admittedAt))
      .limit(100);

    const doctorIds = [...new Set(rows.map((r) => r.encounter.assignedDoctorId).filter(Boolean))] as string[];
    const doctors = doctorIds.length
      ? await db.select({ id: users.id, name: users.name }).from(users).where(or(...doctorIds.map((id) => eq(users.id, id))))
      : [];
    const doctorMap = new Map(doctors.map((d) => [d.id, d]));

    res.json({
      encounters: rows.map((r) =>
        serializeEncounter(r.encounter, r.patient, r.encounter.assignedDoctorId ? doctorMap.get(r.encounter.assignedDoctorId) ?? null : null),
      ),
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ─── Encounter details (with invoice summary) ───

router.get("/:id", async (req: AuthedRequest, res) => {
  try {
    const [row] = await db
      .select({ encounter: encounters, patient: users })
      .from(encounters)
      .innerJoin(users, eq(encounters.patientId, users.id))
      .where(eq(encounters.id, req.params.id))
      .limit(1);
    if (!row) {
      sendError(res, 404, "الدخول غير موجود");
      return;
    }

    let doctor: { id: string; name: string } | null = null;
    if (row.encounter.assignedDoctorId) {
      const [d] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, row.encounter.assignedDoctorId)).limit(1);
      doctor = d ?? null;
    }

    const [invoice] = await db.select().from(invoices).where(eq(invoices.encounterId, row.encounter.id)).limit(1);
    let invoiceSummary = null;
    if (invoice) {
      const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoice.id));
      const pays = await db.select().from(payments).where(eq(payments.invoiceId, invoice.id));
      const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      const paid = pays.reduce((s, p) => s + p.amount, 0);
      invoiceSummary = { id: invoice.id, status: invoice.status, total, paid, remaining: total - paid };
    }

    res.json({
      encounter: serializeEncounter(row.encounter, row.patient, doctor),
      invoice: invoiceSummary,
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ─── Discharge (requires invoice fully paid unless admin overrides) ───

router.post("/:id/discharge", requireRole("receptionist", "admin"), async (req: AuthedRequest, res) => {
  try {
    const [encounter] = await db.select().from(encounters).where(eq(encounters.id, req.params.id)).limit(1);
    if (!encounter) {
      sendError(res, 404, "الدخول غير موجود");
      return;
    }
    if (encounter.status !== "active") {
      sendError(res, 400, "هذا الدخول منتهي بالفعل");
      return;
    }

    const [invoice] = await db.select().from(invoices).where(eq(invoices.encounterId, encounter.id)).limit(1);
    if (invoice) {
      const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoice.id));
      const pays = await db.select().from(payments).where(eq(payments.invoiceId, invoice.id));
      const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      const paid = pays.reduce((s, p) => s + p.amount, 0);
      if (total - paid > 0 && req.user!.role !== "admin") {
        sendError(res, 400, `لا يمكن الخروج — متبقي ${total - paid} جنيه في حساب المريض`);
        return;
      }
      if (total - paid <= 0 && invoice.status !== "paid") {
        await db.update(invoices).set({ status: "paid", closedAt: new Date() }).where(eq(invoices.id, invoice.id));
      }
    }

    const [updated] = await db
      .update(encounters)
      .set({ status: "discharged", dischargedAt: new Date() })
      .where(eq(encounters.id, encounter.id))
      .returning();

    const [patient] = await db.select().from(users).where(eq(users.id, encounter.patientId)).limit(1);
    res.json({ encounter: serializeEncounter(updated!, patient!) });
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
