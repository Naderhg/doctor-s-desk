import { Router } from "express";
import { and, desc, eq, gte, lt, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import {
  appointments,
  attachments,
  clinicSettings,
  medicalProfiles,
  prescriptionItems,
  prescriptions,
  prescriptionTests,
  users,
  visits,
  visitTypes,
  workingHours,
} from "../db/schema.js";
import {
  arabicDays,
  doctorStatusAr,
  formatDateAr,
  formatFileSize,
  formatTimeAr,
  monthName,
  parseYmd,
  toArabicDigits,
} from "../lib/format.js";
import { notify } from "../lib/notify.js";
import { handleError, sendError } from "../lib/http.js";
import { generateSlots } from "../lib/slots.js";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireRole("doctor", "admin", "receptionist"));

function ymd(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function serializeAppt(
  row: typeof appointments.$inferSelect,
  visit: typeof visitTypes.$inferSelect,
  patient: { id: string; name: string; phone: string | null },
) {
  const startsAt = new Date(row.startsAt);
  return {
    id: row.id,
    patientId: patient.id,
    patient: patient.name,
    phone: patient.phone ?? "—",
    time: formatTimeAr(startsAt),
    type: visit.label,
    visitTypeId: visit.id,
    status: doctorStatusAr[row.status],
    statusKey: row.status,
    reason: row.reason,
    dateIso: row.startsAt.toISOString(),
  };
}

router.get("/overview", async (_req: AuthedRequest, res) => {
  try {
    const [clinic] = await db.select().from(clinicSettings).limit(1);
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayRows = await db
      .select({ appointment: appointments, visit: visitTypes, patient: users })
      .from(appointments)
      .innerJoin(visitTypes, eq(appointments.visitTypeId, visitTypes.id))
      .innerJoin(users, eq(appointments.patientId, users.id))
      .where(and(gte(appointments.startsAt, todayStart), lt(appointments.startsAt, todayEnd)))
      .orderBy(appointments.startsAt);

    const today = todayRows.map((r) => serializeAppt(r.appointment, r.visit, r.patient));
    const completed = today.filter((a) => a.statusKey === "completed").length;
    const waiting = today.filter((a) => a.statusKey === "pending_payment" || a.statusKey === "confirmed").length;

    const [rxCount] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(prescriptions)
      .where(gte(prescriptions.createdAt, monthStart));

    const recentPatients = await db
      .select({
        id: users.id,
        name: users.name,
        lastVisit: sql<Date>`max(${appointments.startsAt})`,
      })
      .from(users)
      .innerJoin(appointments, eq(appointments.patientId, users.id))
      .where(eq(users.role, "patient"))
      .groupBy(users.id, users.name)
      .orderBy(desc(sql`max(${appointments.startsAt})`))
      .limit(5);

    res.json({
      doctorName: clinic?.doctorName ?? "",
      stats: {
        todayCount: today.length,
        completed,
        waiting,
        prescriptionsThisMonth: rxCount?.n ?? 0,
      },
      today: today.slice(0, 6),
      recentPatients: recentPatients.map((p) => ({
        id: p.id,
        name: p.name,
        lastVisit: p.lastVisit ? formatDateAr(new Date(p.lastVisit)) : "—",
      })),
    });
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/schedule", async (req: AuthedRequest, res) => {
  try {
    const dateStr = String(req.query.date ?? ymd(new Date()));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      sendError(res, 400, "تاريخ غير صالح");
      return;
    }
    const date = parseYmd(dateStr);
    const rows = await db
      .select({ appointment: appointments, visit: visitTypes, patient: users })
      .from(appointments)
      .innerJoin(visitTypes, eq(appointments.visitTypeId, visitTypes.id))
      .innerJoin(users, eq(appointments.patientId, users.id))
      .where(and(gte(appointments.startsAt, startOfDay(date)), lt(appointments.startsAt, endOfDay(date))))
      .orderBy(appointments.startsAt);

    const types = await db.select().from(visitTypes);
    const duration = types[0]?.durationMin ?? 30;
    const slots = await generateSlots(dateStr, duration);

    const hours = await db.select().from(workingHours);
    const byDay = new Map(hours.map((h) => [h.dayOfWeek, h]));
    const days = [];
    const base = startOfDay(new Date());
    for (let i = 0; i < 8; i++) {
      const d = new Date(base.getTime() + i * 86400000);
      const row = byDay.get(d.getDay());
      days.push({
        date: ymd(d),
        dayName: arabicDays[d.getDay()]!,
        dayNum: toArabicDigits(d.getDate()),
        closed: !row || row.closed,
      });
    }

    res.json({
      date: dateStr,
      days,
      closed: slots.closed,
      slots: slots.slots,
      appointments: rows.map((r) => serializeAppt(r.appointment, r.visit, r.patient)),
    });
  } catch (error) {
    handleError(res, error);
  }
});

const statusSchema = z.object({
  status: z.enum(["confirmed", "cancelled", "completed", "no_show"]),
});

router.post("/appointments/:id/status", async (req: AuthedRequest, res) => {
  try {
    const body = statusSchema.parse(req.body);
    const [row] = await db
      .select({ appointment: appointments, visit: visitTypes, patient: users })
      .from(appointments)
      .innerJoin(visitTypes, eq(appointments.visitTypeId, visitTypes.id))
      .innerJoin(users, eq(appointments.patientId, users.id))
      .where(eq(appointments.id, req.params.id))
      .limit(1);
    if (!row) {
      sendError(res, 404, "الحجز غير موجود");
      return;
    }
    const [updated] = await db
      .update(appointments)
      .set({ status: body.status })
      .where(eq(appointments.id, row.appointment.id))
      .returning();
    const labels = { confirmed: "تم تأكيد موعدك", cancelled: "تم إلغاء موعدك من العيادة", completed: "تم تسجيل حضورك", no_show: "تم تسجيل غيابك عن الموعد" };
    await notify(row.patient.id, "appointment_status", "تحديث الموعد", labels[body.status], { appointmentId: row.appointment.id });
    res.json({ appointment: serializeAppt(updated!, row.visit, row.patient) });
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/patients", async (req: AuthedRequest, res) => {
  try {
    const q = String(req.query.q ?? "").trim();
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        phone: users.phone,
        ageYears: medicalProfiles.ageYears,
        lastVisit: sql<Date | null>`max(${appointments.startsAt})`,
        visits: sql<number>`count(${appointments.id})::int`,
      })
      .from(users)
      .leftJoin(medicalProfiles, eq(medicalProfiles.userId, users.id))
      .leftJoin(appointments, eq(appointments.patientId, users.id))
      .where(
        q
          ? and(eq(users.role, "patient"), or(sql`${users.name} ilike ${"%" + q + "%"}`, sql`coalesce(${users.phone}, '') ilike ${"%" + q + "%"}`))
          : eq(users.role, "patient"),
      )
      .groupBy(users.id, users.name, users.phone, medicalProfiles.ageYears)
      .orderBy(users.name);

    res.json({
      patients: rows.map((p) => ({
        id: p.id,
        name: p.name,
        phone: p.phone ?? "—",
        age: p.ageYears ? String(p.ageYears) : "—",
        lastVisit: p.lastVisit ? formatDateAr(new Date(p.lastVisit)) : "—",
        visits: String(p.visits ?? 0),
      })),
    });
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/patients/:id", async (req: AuthedRequest, res) => {
  try {
    const [patient] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, req.params.id), eq(users.role, "patient")))
      .limit(1);
    if (!patient) {
      sendError(res, 404, "المريض غير موجود");
      return;
    }
    const [profile] = await db.select().from(medicalProfiles).where(eq(medicalProfiles.userId, patient.id)).limit(1);
    const files = await db.select().from(attachments).where(eq(attachments.userId, patient.id)).orderBy(desc(attachments.createdAt));
    const visitRows = await db.select().from(visits).where(eq(visits.patientId, patient.id)).orderBy(desc(visits.createdAt));
    const apptCount = await db
      .select({ n: sql<number>`count(*)::int`, last: sql<Date | null>`max(${appointments.startsAt})` })
      .from(appointments)
      .where(eq(appointments.patientId, patient.id));

    const history = [];
    for (const v of visitRows) {
      const [rx] = await db.select().from(prescriptions).where(eq(prescriptions.visitId, v.id)).limit(1);
      const items = rx ? await db.select().from(prescriptionItems).where(eq(prescriptionItems.prescriptionId, rx.id)) : [];
      const tests = rx ? await db.select().from(prescriptionTests).where(eq(prescriptionTests.prescriptionId, rx.id)) : [];
      const appt = v.appointmentId
        ? (await db.select().from(appointments).where(eq(appointments.id, v.appointmentId)).limit(1))[0]
        : undefined;
      const type = appt
        ? (await db.select().from(visitTypes).where(eq(visitTypes.id, appt.visitTypeId)).limit(1))[0]
        : undefined;
      history.push({
        id: v.id,
        date: formatDateAr(v.createdAt),
        time: formatTimeAr(v.createdAt),
        type: type?.label ?? "زيارة",
        complaint: v.complaint ?? "",
        diagnosis: v.diagnosis ?? "",
        notes: v.notes ?? "",
        vitals: v.vitals ?? {},
        labs: v.labs ?? {},
        prescription: items.map((i) => ({ drug: i.drug, dose: i.dose, duration: i.duration })),
        tests: tests.map((t) => t.name),
      });
    }

    res.json({
      patient: {
        id: patient.id,
        name: patient.name,
        phone: patient.phone ?? "—",
        age: profile?.ageYears ? `${profile.ageYears} سنة` : "—",
        gender: profile?.gender ?? "—",
        bloodType: profile?.bloodType ?? "—",
        chronic: profile?.chronic ?? [],
        allergies: profile?.allergies ?? [],
        medications: profile?.medications ?? [],
        lastVisit: apptCount[0]?.last ? formatDateAr(new Date(apptCount[0].last)) : "—",
        visitsCount: String(apptCount[0]?.n ?? 0),
        attachments: files.map((f) => ({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          date: formatDateAr(f.createdAt),
          size: formatFileSize(f.sizeBytes),
        })),
        visits: history,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
});

const visitSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional().nullable(),
  complaint: z.string().trim().max(1000).optional().default(""),
  diagnosis: z.string().trim().min(1, "اكتب التشخيص"),
  notes: z.string().trim().max(2000).optional().default(""),
  items: z.array(z.object({ drug: z.string().trim(), dose: z.string().trim(), duration: z.string().trim() })),
  tests: z.array(z.string().trim()).optional().default([]),
});

router.post("/visits", requireRole("doctor", "admin"), async (req: AuthedRequest, res) => {
  try {
    const body = visitSchema.parse(req.body);
    const [patient] = await db.select().from(users).where(and(eq(users.id, body.patientId), eq(users.role, "patient"))).limit(1);
    if (!patient) {
      sendError(res, 404, "المريض غير موجود");
      return;
    }
    const [visit] = await db
      .insert(visits)
      .values({
        patientId: patient.id,
        appointmentId: body.appointmentId ?? null,
        complaint: body.complaint,
        diagnosis: body.diagnosis,
        notes: body.notes,
      })
      .returning();
    const [rx] = await db
      .insert(prescriptions)
      .values({ patientId: patient.id, visitId: visit!.id, diagnosis: body.diagnosis })
      .returning();
    const drugs = body.items.filter((i) => i.drug);
    if (drugs.length) {
      await db.insert(prescriptionItems).values(drugs.map((i) => ({ prescriptionId: rx!.id, ...i })));
    }
    const tests = body.tests.filter(Boolean);
    if (tests.length) {
      await db.insert(prescriptionTests).values(tests.map((name) => ({ prescriptionId: rx!.id, name })));
    }
    if (body.appointmentId) {
      await db.update(appointments).set({ status: "completed" }).where(eq(appointments.id, body.appointmentId));
    }
    await notify(patient.id, "prescription_new", "روشتة جديدة", "روشتة جديدة متاحة في حسابك", { visitId: visit!.id, prescriptionId: rx!.id });
    res.status(201).json({ ok: true, visitId: visit!.id, prescriptionId: rx!.id });
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/settings", requireRole("admin"), async (_req: AuthedRequest, res) => {
  try {
    const [clinic] = await db.select().from(clinicSettings).limit(1);
    const types = await db.select().from(visitTypes);
    const hours = await db.select().from(workingHours);
    res.json({
      clinic: clinic
        ? {
            doctorName: clinic.doctorName,
            clinicName: clinic.clinicName,
            specialty: clinic.specialty,
            address: clinic.address,
            phone: clinic.phone,
            cancelHours: clinic.cancelHours,
          }
        : null,
      visitTypes: types,
      workingHours: hours.sort((a, b) => a.dayOfWeek - b.dayOfWeek),
    });
  } catch (error) {
    handleError(res, error);
  }
});

const settingsSchema = z.object({
  clinic: z.object({
    doctorName: z.string().trim().min(2),
    clinicName: z.string().trim().min(2),
    specialty: z.string().trim().min(2),
    address: z.string().trim().min(2),
    phone: z.string().trim().min(5),
    cancelHours: z.number().int().min(0).max(72),
  }),
  workingHours: z.array(
    z.object({
      id: z.string().uuid(),
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.string().nullable(),
      endTime: z.string().nullable(),
      closed: z.boolean(),
    }),
  ),
  visitTypes: z.array(
    z.object({
      id: z.string().uuid(),
      label: z.string().trim().min(1),
      durationMin: z.number().int().min(5).max(180),
      price: z.number().int().min(0),
      deposit: z.number().int().min(0),
    }),
  ),
});

router.put("/settings", requireRole("admin"), async (req: AuthedRequest, res) => {
  try {
    const body = settingsSchema.parse(req.body);
    const hoursDisplay = body.workingHours
      .slice()
      .sort((a, b) => ((a.dayOfWeek + 6) % 7) - ((b.dayOfWeek + 6) % 7))
      .map((h) => ({
        day: arabicDays[h.dayOfWeek]!,
        time: h.closed || !h.startTime || !h.endTime ? "مغلق" : `${h.startTime} – ${h.endTime}`,
      }));
    await db
      .update(clinicSettings)
      .set({ ...body.clinic, hoursDisplay })
      .where(eq(clinicSettings.id, 1));
    for (const h of body.workingHours) {
      await db
        .update(workingHours)
        .set({ startTime: h.closed ? null : h.startTime, endTime: h.closed ? null : h.endTime, closed: h.closed })
        .where(eq(workingHours.id, h.id));
    }
    for (const t of body.visitTypes) {
      await db
        .update(visitTypes)
        .set({ label: t.label, durationMin: t.durationMin, price: t.price, deposit: t.deposit })
        .where(eq(visitTypes.id, t.id));
    }
    res.json({ ok: true });
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/reports", requireRole("doctor", "admin"), async (req: AuthedRequest, res) => {
  try {
    const now = new Date();
    const months = Array.from({ length: 3 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return {
        id: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: `${monthName(d.getMonth())} ${toArabicDigits(d.getFullYear())}`,
        start: d,
        end: new Date(d.getFullYear(), d.getMonth() + 1, 1),
      };
    });
    const requested = String(req.query.month ?? months[0]!.id);
    const current = months.find((m) => m.id === requested) ?? months[0]!;

    const rows = await db
      .select({ appointment: appointments, visit: visitTypes, patient: users })
      .from(appointments)
      .innerJoin(visitTypes, eq(appointments.visitTypeId, visitTypes.id))
      .innerJoin(users, eq(appointments.patientId, users.id))
      .where(and(gte(appointments.startsAt, current.start), lt(appointments.startsAt, current.end)));

    const booked = rows.length;
    const attended = rows.filter((r) => r.appointment.status === "completed").length;
    const cancelled = rows.filter((r) => r.appointment.status === "cancelled").length;
    const noShow = rows.filter((r) => r.appointment.status === "no_show").length;
    const paid = rows.filter((r) => r.appointment.status === "completed" || r.appointment.status === "confirmed");
    const revenue = paid.reduce((s, r) => s + r.visit.price, 0);
    const deposits = paid.reduce((s, r) => s + r.visit.deposit, 0);
    const newPatients = new Set(
      rows.filter((r) => r.patient.createdAt >= current.start && r.patient.createdAt < current.end).map((r) => r.patient.id),
    ).size;

    const visitRows = await db
      .select()
      .from(visits)
      .where(and(gte(visits.createdAt, current.start), lt(visits.createdAt, current.end)));
    const dxMap = new Map<string, number>();
    for (const v of visitRows) {
      const name = (v.diagnosis ?? "").trim();
      if (!name) continue;
      dxMap.set(name, (dxMap.get(name) ?? 0) + 1);
    }
    const diagnoses = [...dxMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    res.json({
      months: months.map(({ id, label }) => ({ id, label })),
      report: {
        id: current.id,
        label: current.label,
        revenue,
        deposits,
        booked,
        attended,
        cancelled,
        noShow,
        newPatients,
        diagnoses,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
