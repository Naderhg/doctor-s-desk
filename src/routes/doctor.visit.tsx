import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/page-shell";
import { ApiError } from "@/lib/api";
import { createVisit, getDoctorPatients } from "@/lib/doctor";

type Search = { patientId?: string | undefined; appointmentId?: string | undefined };

export const Route = createFileRoute("/doctor/visit")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    patientId: typeof search["patientId"] === "string" ? search["patientId"] : undefined,
    appointmentId: typeof search["appointmentId"] === "string" ? search["appointmentId"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "تسجيل زيارة — لوحة الدكتور" },
      { name: "description", content: "تسجيل التشخيص وكتابة الروشتة وطلب التحاليل بعد كشف المريض." },
      { property: "og:title", content: "تسجيل زيارة — لوحة الدكتور" },
      { property: "og:description", content: "روشتة إلكترونية سريعة بأدوية محفوظة." },
    ],
  }),
  component: DoctorVisit,
});

type Item = { drug: string; dose: string; duration: string };

function DoctorVisit() {
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  const patientsQuery = useQuery({ queryKey: ["doctor-patients", ""], queryFn: () => getDoctorPatients("") });
  const patients = patientsQuery.data?.patients ?? [];
  const [patientId, setPatientId] = useState(search.patientId ?? "");
  const [diagnosis, setDiagnosis] = useState("");
  const [complaint, setComplaint] = useState("");
  const [tests, setTests] = useState("");
  const [items, setItems] = useState<Item[]>([{ drug: "", dose: "", duration: "" }]);

  useEffect(() => {
    if (!patientId && patients[0]) setPatientId(patients[0].id);
  }, [patients, patientId]);

  const save = useMutation({
    mutationFn: createVisit,
    onSuccess: async () => {
      toast.success("تم حفظ الزيارة والروشتة");
      await queryClient.invalidateQueries({ queryKey: ["doctor-overview"] });
      await queryClient.invalidateQueries({ queryKey: ["doctor-patients"] });
      await queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      setDiagnosis("");
      setComplaint("");
      setTests("");
      setItems([{ drug: "", dose: "", duration: "" }]);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "تعذّر حفظ الزيارة"),
  });

  const selected = patients.find((p) => p.id === patientId);

  const update = (i: number, key: keyof Item, value: string) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [key]: value } : it)));

  return (
    <PageShell eyebrow="لوحة التحكم" title="تسجيل زيارة" description="اكتب التشخيص والروشتة وأرسلها للمريض.">
      <form
        className="grid gap-5 lg:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!patientId) return;
          save.mutate({
            patientId,
            appointmentId: search.appointmentId ?? null,
            complaint,
            diagnosis,
            items,
            tests: tests.split(/[،,]/).map((t) => t.trim()).filter(Boolean),
          });
        }}
      >
        <div className="glass space-y-4 rounded-3xl p-6 lg:col-span-2">
          <div>
            <label className="mb-2 block text-xs text-muted-foreground">المريض</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="glass-soft w-full rounded-2xl px-4 py-3 text-sm outline-none"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs text-muted-foreground">الشكوى</label>
            <textarea
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              rows={2}
              className="glass-soft w-full rounded-2xl px-4 py-3 text-sm outline-none"
              placeholder="شكوى المريض"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs text-muted-foreground">التشخيص</label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              rows={3}
              className="glass-soft w-full rounded-2xl px-4 py-3 text-sm outline-none"
              placeholder="مثال: ارتفاع ضغط الدم — متابعة"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs text-muted-foreground">الأدوية</label>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-3">
                  <input
                    list="saved-drugs"
                    value={it.drug}
                    onChange={(e) => update(i, "drug", e.target.value)}
                    placeholder="اسم الدواء"
                    className="glass-soft rounded-2xl px-4 py-3 text-sm outline-none"
                  />
                  <input
                    value={it.dose}
                    onChange={(e) => update(i, "dose", e.target.value)}
                    placeholder="الجرعة"
                    className="glass-soft rounded-2xl px-4 py-3 text-sm outline-none"
                  />
                  <input
                    value={it.duration}
                    onChange={(e) => update(i, "duration", e.target.value)}
                    placeholder="المدة"
                    className="glass-soft rounded-2xl px-4 py-3 text-sm outline-none"
                  />
                </div>
              ))}
            </div>
            <datalist id="saved-drugs">
              {["كونكور ٥ مجم", "أسبرين ٧٥ مجم", "إلتروكسين ٥٠ ميكروجرام", "أوجمنتين ١ جم", "بانادول إكسترا", "نكسيوم ٤٠ مجم"].map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
            <button
              type="button"
              onClick={() => setItems((p) => [...p, { drug: "", dose: "", duration: "" }])}
              className="btn-ghost mt-3 px-4 py-2 text-sm"
            >
              + إضافة دواء
            </button>
          </div>

          <div>
            <label className="mb-2 block text-xs text-muted-foreground">تحاليل وأشعة مطلوبة</label>
            <input
              value={tests}
              onChange={(e) => setTests(e.target.value)}
              placeholder="افصل بينها بفاصلة"
              className="glass-soft w-full rounded-2xl px-4 py-3 text-sm outline-none"
            />
          </div>

          <button type="submit" className="btn-primary px-5 py-3 text-sm" disabled={save.isPending || !patientId}>
            {save.isPending ? "جارٍ الحفظ..." : "حفظ الزيارة والروشتة"}
          </button>
        </div>

        <aside className="glass h-fit rounded-3xl p-6">
          <h2 className="font-display text-lg">معاينة الروشتة</h2>
          <p className="mt-2 text-xs text-muted-foreground">{selected?.name ?? "اختر مريضاً"}</p>
          <p className="mt-3 text-sm">{diagnosis || "— لم يُكتب تشخيص بعد"}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {items
              .filter((i) => i.drug)
              .map((i, idx) => (
                <li key={idx} className="glass-soft rounded-2xl p-3">
                  <span className="font-semibold">{i.drug}</span>
                  <span className="block text-xs text-muted-foreground">
                    {i.dose} {i.duration ? `· ${i.duration}` : ""}
                  </span>
                </li>
              ))}
          </ul>
          {tests ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {tests
                .split("،")
                .flatMap((t) => t.split(","))
                .filter((t) => t.trim())
                .map((t) => (
                  <span key={t} className="chip">
                    {t.trim()}
                  </span>
                ))}
            </div>
          ) : null}
        </aside>
      </form>
    </PageShell>
  );
}
