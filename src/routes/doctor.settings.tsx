import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/page-shell";
import { ApiError } from "@/lib/api";
import { getDoctorSettings, saveDoctorSettings, type DoctorSettings } from "@/lib/doctor";

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

const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function DoctorSettings() {
  const queryClient = useQueryClient();
  const settings = useQuery({ queryKey: ["doctor-settings"], queryFn: getDoctorSettings });
  const [clinic, setClinic] = useState<NonNullable<DoctorSettings["clinic"]> | null>(null);
  const [hours, setHours] = useState<DoctorSettings["workingHours"]>([]);
  const [types, setTypes] = useState<DoctorSettings["visitTypes"]>([]);

  useEffect(() => {
    if (!settings.data) return;
    setClinic(settings.data.clinic);
    setHours(settings.data.workingHours);
    setTypes(settings.data.visitTypes);
  }, [settings.data]);

  const save = useMutation({
    mutationFn: saveDoctorSettings,
    onSuccess: async () => {
      toast.success("تم حفظ الإعدادات");
      await queryClient.invalidateQueries({ queryKey: ["doctor-settings"] });
      await queryClient.invalidateQueries({ queryKey: ["clinic"] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "تعذّر حفظ الإعدادات"),
  });

  if (!clinic) {
    return (
      <PageShell eyebrow="لوحة التحكم" title="الإعدادات" description="بيانات العيادة وأنواع الكشف ومواعيد العمل.">
        <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>
      </PageShell>
    );
  }

  return (
    <PageShell eyebrow="لوحة التحكم" title="الإعدادات" description="بيانات العيادة وأنواع الكشف ومواعيد العمل.">
      <form
        className="grid gap-5 lg:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate({
            clinic,
            workingHours: hours,
            visitTypes: types.map((t) => ({
              id: t.id,
              label: t.label,
              durationMin: t.durationMin,
              price: t.price,
              deposit: t.deposit,
            })),
          });
        }}
      >
        <div className="glass space-y-4 rounded-3xl p-6">
          <h2 className="font-display text-lg">بيانات العيادة</h2>
          {(
            [
              ["doctorName", "اسم الدكتور"],
              ["specialty", "التخصص"],
              ["address", "العنوان"],
              ["phone", "رقم الهاتف"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="mb-2 block text-xs text-muted-foreground">{label}</label>
              <input
                value={clinic[key]}
                onChange={(e) => setClinic({ ...clinic, [key]: e.target.value })}
                className="glass-soft w-full rounded-2xl px-4 py-3 text-sm outline-none"
              />
            </div>
          ))}
        </div>

        <div className="space-y-5">
          <div className="glass rounded-3xl p-6">
            <h2 className="font-display text-lg">مواعيد العمل</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {hours.map((h, i) => (
                <li key={h.id} className="glass-soft grid gap-2 rounded-2xl p-4 sm:grid-cols-[7rem_1fr_1fr_auto]">
                  <span>{dayNames[h.dayOfWeek]}</span>
                  <input
                    value={h.startTime ?? ""}
                    disabled={h.closed}
                    onChange={(e) => setHours((prev) => prev.map((x, idx) => (idx === i ? { ...x, startTime: e.target.value } : x)))}
                    className="glass-soft rounded-xl px-3 py-2"
                    placeholder="09:00"
                  />
                  <input
                    value={h.endTime ?? ""}
                    disabled={h.closed}
                    onChange={(e) => setHours((prev) => prev.map((x, idx) => (idx === i ? { ...x, endTime: e.target.value } : x)))}
                    className="glass-soft rounded-xl px-3 py-2"
                    placeholder="16:00"
                  />
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={h.closed}
                      onChange={(e) => setHours((prev) => prev.map((x, idx) => (idx === i ? { ...x, closed: e.target.checked } : x)))}
                    />
                    مغلق
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass rounded-3xl p-6">
            <h2 className="font-display text-lg">أنواع الكشف والأسعار</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {types.map((v, i) => (
                <li key={v.id} className="glass-soft grid gap-2 rounded-2xl p-4 sm:grid-cols-4">
                  <input
                    value={v.label}
                    onChange={(e) => setTypes((prev) => prev.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))}
                    className="glass-soft rounded-xl px-3 py-2"
                  />
                  <input
                    type="number"
                    value={v.durationMin}
                    onChange={(e) => setTypes((prev) => prev.map((x, idx) => (idx === i ? { ...x, durationMin: Number(e.target.value) } : x)))}
                    className="glass-soft rounded-xl px-3 py-2"
                  />
                  <input
                    type="number"
                    value={v.price}
                    onChange={(e) => setTypes((prev) => prev.map((x, idx) => (idx === i ? { ...x, price: Number(e.target.value) } : x)))}
                    className="glass-soft rounded-xl px-3 py-2"
                  />
                  <input
                    type="number"
                    value={v.deposit}
                    onChange={(e) => setTypes((prev) => prev.map((x, idx) => (idx === i ? { ...x, deposit: Number(e.target.value) } : x)))}
                    className="glass-soft rounded-xl px-3 py-2"
                  />
                </li>
              ))}
            </ul>
          </div>

          <button type="submit" className="btn-primary px-5 py-3 text-sm" disabled={save.isPending}>
            {save.isPending ? "جارٍ الحفظ..." : "حفظ التعديلات"}
          </button>
        </div>
      </form>
    </PageShell>
  );
}
