import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { clinicSettings, reviews, visitTypes, workingHours } from "../db/schema.js";
import { handleError, sendError } from "../lib/http.js";
import { arabicDays, toArabicDigits } from "../lib/format.js";
import { generateSlots } from "../lib/slots.js";

const router = Router();

function durationLabel(min: number) {
  return `${toArabicDigits(min)} دقيقة`;
}

router.get("/", async (_req, res) => {
  try {
    const [clinic] = await db.select().from(clinicSettings).limit(1);
    if (!clinic) {
      sendError(res, 500, "إعدادات العيادة غير موجودة. شغّل npm run db:seed");
      return;
    }
    const types = await db.select().from(visitTypes);
    const hours = await db.select().from(workingHours);
    const clinicReviews = await db.select().from(reviews);

    res.json({
      clinic: {
        doctorName: clinic.doctorName,
        clinicName: clinic.clinicName,
        specialty: clinic.specialty,
        address: clinic.address,
        phone: clinic.phone,
        cancelHours: clinic.cancelHours,
        hours: clinic.hoursDisplay,
      },
      visitTypes: types.map((t) => ({
        id: t.id,
        slug: t.slug,
        label: t.label,
        durationMin: t.durationMin,
        duration: durationLabel(t.durationMin),
        price: t.price,
        deposit: t.deposit,
        video: t.video,
      })),
      workingHours: hours,
      reviews: clinicReviews,
    });
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/days", async (req, res) => {
  try {
    const count = Math.min(14, Math.max(1, Number(req.query.count ?? 10)));
    const hours = await db.select().from(workingHours);
    const byDay = new Map(hours.map((h) => [h.dayOfWeek, h]));
    const days = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    for (let i = 0; i < count; i++) {
      const d = new Date(base.getTime() + i * 86400000);
      const row = byDay.get(d.getDay());
      days.push({
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
        dayName: arabicDays[d.getDay()]!,
        dayNum: toArabicDigits(d.getDate()),
        closed: !row || row.closed,
      });
    }
    res.json({ days });
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/slots", async (req, res) => {
  try {
    const date = String(req.query.date ?? "");
    const visitTypeId = String(req.query.visitTypeId ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !visitTypeId) {
      sendError(res, 400, "حدد اليوم ونوع الكشف");
      return;
    }
    const [visit] = await db.select().from(visitTypes).where(eq(visitTypes.id, visitTypeId)).limit(1);
    if (!visit) {
      sendError(res, 400, "نوع الكشف غير موجود");
      return;
    }
    const result = await generateSlots(date, visit.durationMin);
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
});

export default router;
