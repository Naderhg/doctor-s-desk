import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";
import { clinic, todaySchedule, patients, prescriptions } from "@/lib/clinic-data";

export const Route = createFileRoute("/doctor/")({
  head: () => ({
    meta: [
      { title: "لوحة الدكتور — عيادة د. كريم النجار" },
      { name: "description", content: "نظرة سريعة على مواعيد اليوم، الحضور، والمرضى المسجلين في العيادة." },
      { property: "og:title", content: "لوحة الدكتور — عيادة د. كريم النجار" },
      { property: "og:description", content: "متابعة جدول اليوم والحجوزات والمرضى من مكان واحد." },
    ],
  }),
  component: DoctorHome,
});

function DoctorHome() {
  const attended = todaySchedule.filter((a) => a.status === "حضور").length;
  const waiting = todaySchedule.filter((a) => a.status === "قيد الانتظار").length;

  const stats = [
    { label: "مواعيد اليوم", value: todaySchedule.length },
    { label: "تم الكشف", value: attended },
    { label: "بانتظار الدور", value: waiting },
    { label: "روشتات هذا الشهر", value: prescriptions.length },
  ];

  return (
    <PageShell eyebrow="لوحة التحكم" title={`أهلاً ${clinic.doctorName}`} description="ملخص يومك في العيادة.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-3xl p-5">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-2 font-display text-3xl">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg">أقرب مواعيد اليوم</h2>
            <Link to="/doctor/schedule" className="text-sm text-muted-foreground hover:text-foreground">
              كل الجدول
            </Link>
          </div>
          <ul className="mt-4 space-y-2">
            {todaySchedule.slice(0, 4).map((a) => (
              <li key={a.id} className="glass-soft flex flex-wrap items-center justify-between gap-2 rounded-2xl p-4 text-sm">
                <span className="font-semibold">{a.time}</span>
                <span>{a.patient}</span>
                <span className="text-muted-foreground">{a.type}</span>
                <span className="chip">{a.status}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass rounded-3xl p-6">
          <h2 className="font-display text-lg">آخر المرضى</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {patients.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 border-b border-border pb-2 last:border-0">
                <span>{p.name}</span>
                <span className="text-xs text-muted-foreground">{p.lastVisit}</span>
              </li>
            ))}
          </ul>
          <Link to="/doctor/patients" className="btn-ghost mt-5 inline-flex px-4 py-2 text-sm">
            قائمة المرضى
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
