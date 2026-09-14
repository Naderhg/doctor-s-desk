import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";
import { attachments, medicalProfile, pastAppointments } from "@/lib/clinic-data";

export const Route = createFileRoute("/medical-file")({
  head: () => ({
    meta: [
      { title: "ملفي الطبي — عيادة د. كريم النجار" },
      { name: "description", content: "بياناتك الصحية الأساسية، الأمراض المزمنة والحساسية، مرفقات التحاليل وتاريخ الزيارات." },
      { property: "og:title", content: "ملفي الطبي — عيادة د. كريم النجار" },
      { property: "og:description", content: "كل بياناتك الصحية ومرفقاتك في مكان واحد." },
    ],
  }),
  component: MedicalFilePage,
});

function MedicalFilePage() {
  return (
    <PageShell eyebrow="حسابي" title="ملفي الطبي" description="ملفك مرئي لك وللدكتور فقط.">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <h2 className="font-display text-lg">البيانات الأساسية</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="السن" value={medicalProfile.age} />
            <Field label="النوع" value={medicalProfile.gender} />
            <Field label="فصيلة الدم" value={medicalProfile.bloodType} />
            <Field label="الأمراض المزمنة" value={medicalProfile.chronic.join("، ")} />
            <Field label="الحساسية" value={medicalProfile.allergies.join("، ")} />
            <Field label="الأدوية الحالية" value={medicalProfile.medications.join("، ")} />
          </div>
          <button className="btn-ghost mt-6 px-5 py-2.5 text-sm">تعديل البيانات</button>

          <h2 className="mt-9 font-display text-lg">تاريخ الزيارات</h2>
          <ul className="mt-4 space-y-3">
            {pastAppointments.map((v) => (
              <li key={v.id} className="glass-soft flex flex-wrap items-center justify-between gap-2 rounded-2xl p-4">
                <span>
                  <span className="block font-semibold">{v.date}</span>
                  <span className="block text-xs text-muted-foreground">
                    {v.type} — {v.reason}
                  </span>
                </span>
                <span className="chip">{v.status}</span>
              </li>
            ))}
          </ul>
        </div>

        <aside className="glass h-fit rounded-3xl p-6">
          <h2 className="font-display text-lg">التحاليل والأشعة</h2>
          <label className="mt-4 block cursor-pointer rounded-2xl border border-dashed border-border-strong bg-muted p-6 text-center text-sm text-muted-foreground">
            اسحب الملف هنا أو اضغط للرفع
            <input type="file" className="hidden" />
          </label>
          <ul className="mt-4 space-y-3">
            {attachments.map((f) => (
              <li key={f.id} className="glass-soft rounded-2xl p-4">
                <p className="text-sm font-medium">{f.name}</p>
                <p className="mt-1 text-xs text-subtle">
                  {f.date} · {f.size}
                </p>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </PageShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-soft rounded-2xl p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
