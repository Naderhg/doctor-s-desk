import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageShell } from "@/components/page-shell";
import { getDoctorSchedule, updateAppointmentStatus } from "@/lib/doctor";

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

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function DoctorSchedule() {
  const [date, setDate] = useState(todayYmd);
  const queryClient = useQueryClient();
  const schedule = useQuery({ queryKey: ["doctor-schedule", date], queryFn: () => getDoctorSchedule(date) });
  const status = useMutation({
    mutationFn: ({ id, next }: { id: string; next: "confirmed" | "cancelled" | "completed" | "no_show" }) =>
      updateAppointmentStatus(id, next),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["doctor-schedule"] });
      await queryClient.invalidateQueries({ queryKey: ["doctor-overview"] });
    },
  });
  const days = schedule.data?.days ?? [];
  const slots = schedule.data?.slots ?? [];
  const appointments = schedule.data?.appointments ?? [];

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
          {schedule.isLoading ? <p className="mt-4 text-sm text-muted-foreground">جارٍ التحميل...</p> : null}
          <ul className="mt-4 space-y-2 text-sm">
            {appointments.map((a) => (
              <li key={a.id} className="glass-soft space-y-3 rounded-2xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{a.time}</span>
                  <Link to="/doctor/patient/$id" params={{ id: a.patientId }} className="hover:text-primary">
                    {a.patient}
                  </Link>
                  <span className="text-muted-foreground">{a.type}</span>
                  <span className="chip">{a.status}</span>
                </div>
                {a.statusKey === "cancelled" || a.statusKey === "completed" ? null : (
                  <div className="flex flex-wrap gap-2">
                    {a.statusKey === "pending_payment" ? (
                      <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => status.mutate({ id: a.id, next: "confirmed" })}>
                        تأكيد
                      </button>
                    ) : null}
                    <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => status.mutate({ id: a.id, next: "completed" })}>
                      حضور
                    </button>
                    <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => status.mutate({ id: a.id, next: "no_show" })}>
                      غياب
                    </button>
                    <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => status.mutate({ id: a.id, next: "cancelled" })}>
                      إلغاء
                    </button>
                    <Link to="/doctor/visit" search={{ patientId: a.patientId, appointmentId: a.id }} className="btn-primary px-3 py-1.5 text-xs">
                      تسجيل زيارة
                    </Link>
                  </div>
                )}
              </li>
            ))}
            {!schedule.isLoading && appointments.length === 0 ? (
              <li className="text-sm text-muted-foreground">لا توجد حجوزات في هذا اليوم.</li>
            ) : null}
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
