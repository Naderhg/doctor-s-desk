import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/page-shell";
import { AuthGate } from "@/components/auth-gate";
import { getPrescriptions } from "@/lib/patient";

export const Route = createFileRoute("/prescriptions")({
  head: () => ({
    meta: [
      { title: "الروشتات — عيادة د. كريم النجار" },
      { name: "description", content: "اعرض واطبع روشتاتك بجرعات ومدة واضحة، مع طلبات التحاليل والأشعة." },
      { property: "og:title", content: "الروشتات — عيادة د. كريم النجار" },
      { property: "og:description", content: "روشتات إلكترونية جاهزة للطباعة أو التحميل." },
    ],
  }),
  component: PrescriptionsPage,
});

function PrescriptionsPage() {
  return (
    <AuthGate>
      <PrescriptionsContent />
    </AuthGate>
  );
}

function PrescriptionsContent() {
  const rxQuery = useQuery({ queryKey: ["prescriptions"], queryFn: getPrescriptions });
  const prescriptions = rxQuery.data?.prescriptions ?? [];

  return (
    <PageShell eyebrow="حسابي" title="الروشتات" description="كل روشتة كتبها الدكتور بعد الزيارة، جاهزة للطباعة.">
      {rxQuery.isLoading ? <p className="mb-4 text-sm text-muted-foreground">جارٍ التحميل...</p> : null}
      {!rxQuery.isLoading && prescriptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">لا توجد روشتات بعد. تظهر هنا بعد ما الدكتور يكتبها.</p>
      ) : null}
      <div className="space-y-5">
        {prescriptions.map((rx) => (
          <article key={rx.id} className="glass rounded-3xl p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
              <div>
                <p className="font-display text-lg">{rx.diagnosis}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {rx.doctorName} · {rx.date} · رقم {rx.id.slice(0, 8)}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="btn-ghost px-4 py-2 text-sm" onClick={() => window.print()}>
                  طباعة
                </button>
                <button className="btn-primary px-4 py-2 text-sm">تحميل PDF</button>
              </div>
            </div>

            <ul className="mt-4 space-y-2">
              {rx.items.map((it) => (
                <li key={it.drug} className="glass-soft flex flex-wrap items-center justify-between gap-2 rounded-2xl p-4 text-sm">
                  <span className="font-semibold">{it.drug}</span>
                  <span className="text-muted-foreground">{it.dose}</span>
                  <span className="chip">{it.duration}</span>
                </li>
              ))}
            </ul>

            {rx.tests.length ? (
              <div className="mt-4">
                <p className="mb-2 text-xs text-muted-foreground">تحاليل وأشعة مطلوبة</p>
                <div className="flex flex-wrap gap-2">
                  {rx.tests.map((t) => (
                    <span key={t} className="chip">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </PageShell>
  );
}
