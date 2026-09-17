import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/page-shell";
import { getDoctorOverview } from "@/lib/doctor";

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
  const overview = useQuery({ queryKey: ["doctor-overview"], queryFn: getDoctorOverview });
  const stats = [
    { label: "مواعيد اليوم", value: overview.data?.stats.todayCount ?? 0 },
    { label: "تم الكشف", value: overview.data?.stats.completed ?? 0 },
    { label: "بانتظار الدور", value: overview.data?.stats.waiting ?? 0 },
    { label: "روشتات هذا الشهر", value: overview.data?.stats.prescriptionsThisMonth ?? 0 },
  ];

  return (
    <PageShell
      eyebrow="لوحة التحكم"
      title={`أهلاً ${overview.data?.doctorName ?? ""}`}
      description="ملخص يومك في العيادة."
    >
      {overview.isLoading ? <p className="mb-4 text-sm text-muted-foreground">جارٍ التحميل...</p> : null}
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
            {(overview.data?.today ?? []).map((a) => (
              <li key={a.id} className="glass-soft flex flex-wrap items-center justify-between gap-2 rounded-2xl p-4 text-sm">
                <span className="font-semibold">{a.time}</span>
                <span>{a.patient}</span>
                <span className="text-muted-foreground">{a.type}</span>
                <span className="chip">{a.status}</span>
              </li>
            ))}
            {!overview.isLoading && (overview.data?.today ?? []).length === 0 ? (
              <li className="text-sm text-muted-foreground">لا توجد مواعيد اليوم.</li>
            ) : null}
          </ul>
        </div>

        <div className="glass rounded-3xl p-6">
          <h2 className="font-display text-lg">آخر المرضى</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {(overview.data?.recentPatients ?? []).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 border-b border-border pb-2 last:border-0">
                <Link to="/doctor/patient/$id" params={{ id: p.id }} className="hover:text-primary">
                  {p.name}
                </Link>
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
