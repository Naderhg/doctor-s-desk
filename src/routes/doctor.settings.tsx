import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageShell } from "@/components/page-shell";
import { clinic, visitTypes } from "@/lib/clinic-data";

export const Route = createFileRoute("/doctor/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات — لوحة الدكتور" },
      { name: "description", content: "بيانات العيادة، مواعيد العمل، وأنواع الكشف وأسعارها." },
      { property: "og:title", content: "الإعدادات — لوحة الدكتور" },
      { property: "og:description", content: "تعديل بيانات العيادة والأسعار ومواعيد العمل." },
    ],
  }),
  component: DoctorSettings,
});

function DoctorSettings() {
  return (
    <PageShell eyebrow="لوحة التحكم" title="الإعدادات" description="بيانات العيادة وأنواع الكشف ومواعيد العمل.">
      <form
        className="grid gap-5 lg:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("تم حفظ الإعدادات (عرض تجريبي)");
        }}
      >
        <div className="glass space-y-4 rounded-3xl p-6">
          <h2 className="font-display text-lg">بيانات العيادة</h2>
          {[
            { label: "اسم الدكتور", value: clinic.doctorName },
            { label: "التخصص", value: clinic.specialty },
            { label: "العنوان", value: clinic.address },
            { label: "رقم الهاتف", value: clinic.phone },
          ].map((f) => (
            <div key={f.label}>
              <label className="mb-2 block text-xs text-muted-foreground">{f.label}</label>
              <input defaultValue={f.value} className="glass-soft w-full rounded-2xl px-4 py-3 text-sm outline-none" />
            </div>
          ))}
        </div>

        <div className="space-y-5">
          <div className="glass rounded-3xl p-6">
            <h2 className="font-display text-lg">مواعيد العمل</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {clinic.hours.map((h) => (
                <li key={h.day} className="glass-soft flex items-center justify-between rounded-2xl p-4">
                  <span>{h.day}</span>
                  <span className="text-muted-foreground">{h.time}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass rounded-3xl p-6">
            <h2 className="font-display text-lg">أنواع الكشف والأسعار</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {visitTypes.map((v) => (
                <li key={v.id} className="glass-soft flex flex-wrap items-center justify-between gap-2 rounded-2xl p-4">
                  <span className="font-semibold">{v.label}</span>
                  <span className="text-muted-foreground">{v.duration}</span>
                  <span className="chip">{v.price} ج.م</span>
                </li>
              ))}
            </ul>
          </div>

          <button type="submit" className="btn-primary px-5 py-3 text-sm">
            حفظ التعديلات
          </button>
        </div>
      </form>
    </PageShell>
  );
}
