import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/page-shell";
import { getDoctorPatient } from "@/lib/doctor";

export const Route = createFileRoute("/doctor/patient/$id")({
  head: () => ({
    meta: [
      { title: "ملف المريض — لوحة الدكتور" },
      { name: "description", content: "الملف الطبي الكامل للمريض: البيانات، الحالة الصحية، وتاريخ الزيارات والروشتات." },
      { property: "og:title", content: "ملف المريض — لوحة الدكتور" },
      { property: "og:description", content: "تتبع كل زيارة بتشخيصها وروشتتها والتحاليل المطلوبة." },
    ],
  }),
  component: PatientFile,
});

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="chip">{children}</span>;
}

function PatientFile() {
  const { id } = Route.useParams();
  const file = useQuery({ queryKey: ["doctor-patient", id], queryFn: () => getDoctorPatient(id) });
  const p = file.data?.patient;

  if (file.isLoading) {
    return (
      <PageShell title="ملف المريض" description="جارٍ التحميل...">
        <p className="text-sm text-muted-foreground">جارٍ جلب الملف الطبي.</p>
      </PageShell>
    );
  }

  if (!p) {
    return (
      <PageShell title="المريض غير موجود" description="تأكد من اختيار مريض من القائمة.">
        <Link to="/doctor/patients" className="btn-primary inline-block px-4 py-2.5 text-sm">
          رجوع لقائمة المرضى
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell eyebrow="ملف طبي" title={p.name} description={`${p.age} · ${p.gender} · ${p.phone}`}>
      <div className="mb-5">
        <Link to="/doctor/patients" className="btn-ghost inline-block px-4 py-2 text-sm">
          ← كل المرضى
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-5">
          <div className="glass rounded-3xl p-5">
            <h2 className="mb-3 font-display text-lg">البيانات الأساسية</h2>
            <dl className="space-y-2 text-sm">
              {[
                ["السن", p.age],
                ["النوع", p.gender],
                ["فصيلة الدم", p.bloodType],
                ["الهاتف", p.phone],
                ["آخر زيارة", p.lastVisit],
                ["عدد الزيارات", p.visitsCount],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="glass rounded-3xl p-5">
            <h2 className="mb-3 font-display text-lg">الحالة الصحية</h2>
            <p className="mb-1 text-xs text-muted-foreground">أمراض مزمنة</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {p.chronic.map((c) => (
                <Tag key={c}>{c}</Tag>
              ))}
            </div>
            <p className="mb-1 text-xs text-muted-foreground">حساسية</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {p.allergies.map((c) => (
                <Tag key={c}>{c}</Tag>
              ))}
            </div>
            <p className="mb-1 text-xs text-muted-foreground">أدوية حالية</p>
            <div className="flex flex-wrap gap-2">
              {p.medications.map((c) => (
                <Tag key={c}>{c}</Tag>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl p-5">
            <h2 className="mb-3 font-display text-lg">المرفقات</h2>
            {p.attachments.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد مرفقات.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {p.attachments.map((a) => (
                  <li key={a.id} className="glass-soft flex items-center justify-between gap-3 rounded-2xl px-3 py-2">
                    <span className="truncate">{a.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{a.size}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <section>
          <h2 className="mb-3 font-display text-lg">تتبع الزيارات ({p.visits.length})</h2>
          <ol className="relative space-y-4 border-r border-border pr-5">
            {p.visits.map((v) => (
              <li key={v.id} className="relative">
                <span className="absolute -right-[26px] top-5 size-3 rounded-full bg-primary" />
                <article className="glass rounded-3xl p-5">
                  <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-display text-base">{v.diagnosis}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.date} · {v.time} · {v.type}
                      </p>
                    </div>
                    <Link to="/doctor/visit" search={{ patientId: p.id }} className="chip">
                      زيارة جديدة
                    </Link>
                  </header>

                  <p className="mb-3 text-sm">
                    <span className="text-muted-foreground">الشكوى: </span>
                    {v.complaint}
                  </p>
                  {v.notes ? <p className="mb-3 text-sm text-muted-foreground">{v.notes}</p> : null}

                  {v.vitals ? (
                    <div className="mb-3 flex flex-wrap gap-2 text-xs">
                      {v.vitals.bp ? <span className="chip">ضغط {v.vitals.bp}</span> : null}
                      {v.vitals.temp ? <span className="chip">حرارة {v.vitals.temp}</span> : null}
                      {v.vitals.weight ? <span className="chip">وزن {v.vitals.weight}</span> : null}
                    </div>
                  ) : null}

                  <div className="glass-soft rounded-2xl p-4">
                    <p className="mb-2 text-xs text-muted-foreground">الروشتة</p>
                    <ul className="space-y-1 text-sm">
                      {v.prescription.map((d, i) => (
                        <li key={i} className="flex flex-wrap justify-between gap-2">
                          <span className="font-semibold">{d.drug}</span>
                          <span className="text-muted-foreground">
                            {d.dose} · {d.duration}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {v.tests.length > 0 ? (
                      <>
                        <p className="mb-2 mt-3 text-xs text-muted-foreground">تحاليل وأشعة</p>
                        <div className="flex flex-wrap gap-2">
                          {v.tests.map((t) => (
                            <Tag key={t}>{t}</Tag>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </PageShell>
  );
}
