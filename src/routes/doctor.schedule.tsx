import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/page-shell";
import { nextDays, slotsForDate, todaySchedule } from "@/lib/clinic-data";

export const Route = createFileRoute("/doctor/schedule")({
  head: () => ({
    meta: [
      { title: "الجدول والمواعيد — لوحة الدكتور" },
      { name: "description", content: "إدارة أيام العمل والمواعيد المتاحة ومتابعة حجوزات اليوم." },
      { property: "og:title", content: "الجدول والمواعيد — لوحة الدكتور" },
      { property: "og:description", content: "فتح وإغلاق المواعيد ومتابعة حالة كل حجز." },
    ],
  }),
  component: DoctorSchedule,
});

function DoctorSchedule() {
  const days = nextDays(8);
  const [date, setDate] = useState(days[0]!.date);
  const slots = slotsForDate(date);

  return (
    <PageShell eyebrow="لوحة التحكم" title="الجدول والمواعيد" description="اختر اليوم لعرض المواعيد وحالتها.">
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {days.map((d) => (
          <button
            key={d.date}
            disabled={d.closed}
            onClick={() => setDate(d.date)}
            className={`glass-soft min-w-20 shrink-0 rounded-2xl px-4 py-3 text-center text-sm transition ${
              d.date === date ? "border-border-strong text-foreground" : "text-muted-foreground"
            } ${d.closed ? "opacity-40" : "hover:text-foreground"}`}
          >
            <span className="block text-xs">{d.dayName}</span>
            <span className="block font-display text-lg">{d.dayNum}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="glass rounded-3xl p-6">
          <h2 className="font-display text-lg">مواعيد اليوم المحجوزة</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {todaySchedule.map((a) => (
              <li key={a.id} className="glass-soft flex flex-wrap items-center justify-between gap-2 rounded-2xl p-4">
                <span className="font-semibold">{a.time}</span>
                <span>{a.patient}</span>
                <span className="text-muted-foreground">{a.type}</span>
                <span className="chip">{a.status}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass rounded-3xl p-6">
          <h2 className="font-display text-lg">المواعيد المتاحة</h2>
          <p className="mt-1 text-xs text-muted-foreground">الرمادي يعني محجوز بالفعل.</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-sm sm:grid-cols-4">
            {slots.map((s) => (
              <span
                key={s.time}
                className={`rounded-xl px-3 py-2 text-center ${
                  s.taken ? "glass-soft text-muted-foreground line-through" : "chip text-foreground"
                }`}
              >
                {s.time}
              </span>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
