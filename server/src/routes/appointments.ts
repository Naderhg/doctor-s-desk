import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { appointments, clinicSettings, notifications, users, visitTypes } from "../db/schema.js";
import { handleError, sendError } from "../lib/http.js";
import { arabicDays, appointmentStatusAr, formatDateAr, formatTimeAr, relativeTimeAr } from "../lib/format.js";
import { assertSlotAvailable } from "../lib/slots.js";
import { notify } from "../lib/notify.js";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireRole("patient"));

const bookSchema = z.object({
  visitTypeId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  reason: z.string().trim().max(500).default(""),
});

function serializeAppointment(
  row: typeof appointments.$inferSelect,
  visit: typeof visitTypes.$inferSelect,
) {
  const startsAt = new Date(row.startsAt);
  return {
    id: row.id,
    date: formatDateAr(startsAt),
    dateIso: row.startsAt.toISOString(),
    dayLabel: arabicDays[startsAt.getDay()]!,
    time: formatTimeAr(startsAt),
    time24: `${String(startsAt.getHours()).padStart(2, "0")}:${String(startsAt.getMinutes()).padStart(2, "0")}`,
    type: visit.label,
    visitTypeId: visit.id,
    visitSlug: visit.slug,
    status: appointmentStatusAr[row.status],
    statusKey: row.status,
    reason: row.reason,
    video: visit.video,
    price: visit.price,
    deposit: visit.deposit,
  };
}


router.get("/", async (req: AuthedRequest, res) => {
  try {
    const rows = await db
      .select({ appointment: appointments, visit: visitTypes })
      .from(appointments)
      .innerJoin(visitTypes, eq(appointments.visitTypeId, visitTypes.id))
      .where(eq(appointments.patientId, req.user!.id))
      .orderBy(desc(appointments.startsAt));

    const now = new Date();
    const mapped = rows.map((r) => serializeAppointment(r.appointment, r.visit));
    res.json({
      upcoming: mapped.filter((a) => new Date(a.dateIso).getTime() >= now.getTime() && a.statusKey !== "cancelled"),
      past: mapped.filter((a) => new Date(a.dateIso).getTime() < now.getTime() || a.statusKey === "cancelled" || a.statusKey === "completed"),
    });
  } catch (error) {
    handleError(res, error);
  }
});

router.post("/", async (req: AuthedRequest, res) => {
  try {
    const body = bookSchema.parse(req.body);
    const { visit, startsAt, endsAt } = await assertSlotAvailable(body.date, body.time, body.visitTypeId);
    const [created] = await db
      .insert(appointments)
      .values({
        patientId: req.user!.id,
        visitTypeId: visit.id,
        startsAt,
        endsAt,
        reason: body.reason,
        status: "pending_payment",
      })
      .returning();
    if (!created) {
      sendError(res, 500, "تعذّر إنشاء الحجز");
      return;
    }
    await notify(req.user!.id, "appointment_new", "تأكيد الحجز", `تم استلام حجز ${visit.label} يوم ${arabicDays[startsAt.getDay()]} ${formatTimeAr(startsAt)}`, { appointmentId: created.id });
    const [doctor] = await db.select({ id: users.id }).from(users).where(eq(users.role, "doctor")).limit(1);
    if (doctor) {
      await notify(doctor.id, "appointment_new", "حجز جديد", `حجز جديد من ${req.user!.name} — ${visit.label} يوم ${arabicDays[startsAt.getDay()]} ${formatTimeAr(startsAt)}`, { appointmentId: created.id, patientId: req.user!.id });
    }
    res.status(201).json({ appointment: serializeAppointment(created, visit) });
  } catch (error) {
    handleError(res, error);
  }
});

router.post("/:id/cancel", async (req: AuthedRequest, res) => {
  try {
    const [row] = await db
      .select({ appointment: appointments, visit: visitTypes })
      .from(appointments)
      .innerJoin(visitTypes, eq(appointments.visitTypeId, visitTypes.id))
      .where(and(eq(appointments.id, req.params.id), eq(appointments.patientId, req.user!.id)))
      .limit(1);
    if (!row) {
      sendError(res, 404, "الحجز غير موجود");
      return;
    }
    if (row.appointment.status === "cancelled" || row.appointment.status === "completed") {
      sendError(res, 400, "لا يمكن إلغاء هذا الحجز");
      return;
    }
    const [clinic] = await db.select().from(clinicSettings).limit(1);
    const hours = clinic?.cancelHours ?? 24;
    const diff = new Date(row.appointment.startsAt).getTime() - Date.now();
    if (diff < hours * 60 * 60 * 1000) {
      sendError(res, 400, `الإلغاء المجاني متاح قبل الموعد بـ ${hours} ساعة`);
      return;
    }
    const [updated] = await db
      .update(appointments)
      .set({ status: "cancelled" })
      .where(eq(appointments.id, row.appointment.id))
      .returning();
    await notify(req.user!.id, "appointment_status", "إلغاء الموعد", "تم إلغاء موعدك");
    const [doctor] = await db.select({ id: users.id }).from(users).where(eq(users.role, "doctor")).limit(1);
    if (doctor) {
      await notify(doctor.id, "appointment_status", "إلغاء موعد", `ألغى المريض ${req.user!.name} موعد ${row.visit.label}`, { appointmentId: row.appointment.id });
    }
    res.json({ appointment: serializeAppointment(updated!, row.visit) });
  } catch (error) {
    handleError(res, error);
  }
});

router.post("/:id/reschedule", async (req: AuthedRequest, res) => {
  try {
    const body = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time: z.string().regex(/^\d{2}:\d{2}$/) }).parse(req.body);
    const [row] = await db
      .select({ appointment: appointments, visit: visitTypes })
      .from(appointments)
      .innerJoin(visitTypes, eq(appointments.visitTypeId, visitTypes.id))
      .where(and(eq(appointments.id, req.params.id), eq(appointments.patientId, req.user!.id)))
      .limit(1);
    if (!row) {
      sendError(res, 404, "الحجز غير موجود");
      return;
    }
    if (row.appointment.status === "cancelled" || row.appointment.status === "completed") {
      sendError(res, 400, "لا يمكن تأجيل هذا الحجز");
      return;
    }
    const { startsAt, endsAt } = await assertSlotAvailable(body.date, body.time, row.visit.id);
    const [updated] = await db
      .update(appointments)
      .set({ startsAt, endsAt })
      .where(eq(appointments.id, row.appointment.id))
      .returning();
    await notify(req.user!.id, "appointment_status", "تأجيل الموعد", `تم تأجيل موعدك إلى ${arabicDays[startsAt.getDay()]} ${formatTimeAr(startsAt)}`);
    const [doctor] = await db.select({ id: users.id }).from(users).where(eq(users.role, "doctor")).limit(1);
    if (doctor) {
      await notify(doctor.id, "appointment_status", "تأجيل موعد", `أجّل المريض ${req.user!.name} موعد إلى ${arabicDays[startsAt.getDay()]} ${formatTimeAr(startsAt)}`, { appointmentId: row.appointment.id });
    }
    res.json({ appointment: serializeAppointment(updated!, row.visit) });
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/notifications", async (req: AuthedRequest, res) => {
  try {
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, req.user!.id))
      .orderBy(desc(notifications.createdAt))
      .limit(20);
    res.json({
      notifications: rows.map((n) => ({
        id: n.id,
        text: n.text,
        unread: !n.read,
        time: relativeTimeAr(n.createdAt),
      })),
    });
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
