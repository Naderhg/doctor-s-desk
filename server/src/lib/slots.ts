import { and, eq, gte, lt, ne } from "drizzle-orm";
import { db } from "../db/index.js";
import { appointments, visitTypes, workingHours } from "../db/schema.js";
import { endOfDay, minutesToTime, parseYmd, startOfDay, timeToMinutes } from "./format.js";

export async function getHoursForDate(date: Date) {
  const [row] = await db
    .select()
    .from(workingHours)
    .where(eq(workingHours.dayOfWeek, date.getDay()))
    .limit(1);
  return row;
}

export async function generateSlots(dateYmd: string, durationMin: number) {
  const date = parseYmd(dateYmd);
  const hours = await getHoursForDate(date);
  if (!hours || hours.closed || !hours.startTime || !hours.endTime) {
    return { closed: true, slots: [] as { time: string; taken: boolean }[] };
  }

  const start = timeToMinutes(hours.startTime);
  const end = timeToMinutes(hours.endTime);
  const times: string[] = [];
  for (let t = start; t + durationMin <= end; t += durationMin) {
    times.push(minutesToTime(t));
  }

  const booked = await db
    .select({ startsAt: appointments.startsAt, status: appointments.status })
    .from(appointments)
    .where(
      and(
        gte(appointments.startsAt, startOfDay(date)),
        lt(appointments.startsAt, endOfDay(date)),
        ne(appointments.status, "cancelled"),
      ),
    );

  const taken = new Set(
    booked.map((row) => {
      const d = new Date(row.startsAt);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }),
  );

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  return {
    closed: false,
    slots: times.map((time) => {
      const [h, m] = time.split(":").map(Number);
      const slotDate = new Date(date);
      slotDate.setHours(h ?? 0, m ?? 0, 0, 0);
      const past = isToday && slotDate.getTime() <= now.getTime();
      return { time, taken: past || taken.has(time) };
    }),
  };
}

export async function assertSlotAvailable(dateYmd: string, time: string, visitTypeId: string) {
  const [visit] = await db.select().from(visitTypes).where(eq(visitTypes.id, visitTypeId)).limit(1);
  if (!visit) throw Object.assign(new Error("نوع الكشف غير موجود"), { status: 400 });

  const { closed, slots } = await generateSlots(dateYmd, visit.durationMin);
  if (closed) throw Object.assign(new Error("العيادة مغلقة في هذا اليوم"), { status: 400 });
  const slot = slots.find((s) => s.time === time);
  if (!slot) throw Object.assign(new Error("هذا الموعد غير متاح"), { status: 400 });
  if (slot.taken) throw Object.assign(new Error("هذا الموعد محجوز بالفعل"), { status: 409 });

  const date = parseYmd(dateYmd);
  const [h, m] = time.split(":").map(Number);
  const startsAt = new Date(date);
  startsAt.setHours(h ?? 0, m ?? 0, 0, 0);
  const endsAt = new Date(startsAt.getTime() + visit.durationMin * 60000);
  return { visit, startsAt, endsAt };
}
