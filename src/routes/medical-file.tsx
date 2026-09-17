import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PageShell } from "@/components/page-shell";
import { AuthGate } from "@/components/auth-gate";
import { ApiError } from "@/lib/api";
import { getMedicalFile, updateMedicalFile, uploadAttachment } from "@/lib/patient";

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
    <AuthGate>
      <MedicalFileContent />
    </AuthGate>
  );
}

function joinList(items: string[]) {
  return items.length ? items.join("، ") : "—";
}

function MedicalFileContent() {
  const queryClient = useQueryClient();
  const file = useQuery({ queryKey: ["medical-file"], queryFn: getMedicalFile });
  const [editing, setEditing] = useState(false);
  const [ageYears, setAgeYears] = useState("");
  const [gender, setGender] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [chronic, setChronic] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medications, setMedications] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: updateMedicalFile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["medical-file"] });
      setEditing(false);
      setMessage("تم حفظ البيانات");
    },
  });

  const upload = useMutation({
    mutationFn: uploadAttachment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["medical-file"] });
    },
  });

  function startEdit() {
    const profile = file.data?.profile;
    setAgeYears(profile?.ageYears ? String(profile.ageYears) : "");
    setGender(profile?.gender ?? "");
    setBloodType(profile?.bloodType ?? "");
    setChronic((profile?.chronic ?? []).join("، "));
    setAllergies((profile?.allergies ?? []).join("، "));
    setMedications((profile?.medications ?? []).join("، "));
    setEditing(true);
    setMessage(null);
  }

  const profile = file.data?.profile;
  const attachments = file.data?.attachments ?? [];
  const visits = file.data?.visits ?? [];

  return (
    <PageShell eyebrow="حسابي" title="ملفي الطبي" description="ملفك مرئي لك وللدكتور فقط.">
      {file.isLoading ? <p className="mb-4 text-sm text-muted-foreground">جارٍ التحميل...</p> : null}
      {file.error instanceof ApiError ? <p className="mb-4 text-sm text-destructive">{file.error.message}</p> : null}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <h2 className="font-display text-lg">البيانات الأساسية</h2>
          {editing ? (
            <form
              className="mt-5 grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate({
                  ageYears: ageYears ? Number(ageYears) : null,
                  gender: gender || null,
                  bloodType: bloodType || null,
                  chronic: chronic.split(/[،,]/).map((s) => s.trim()).filter(Boolean),
                  allergies: allergies.split(/[،,]/).map((s) => s.trim()).filter(Boolean),
                  medications: medications.split(/[،,]/).map((s) => s.trim()).filter(Boolean),
                });
              }}
            >
              <label className="text-sm">
                السن
                <input className="field mt-1" value={ageYears} onChange={(e) => setAgeYears(e.target.value)} />
              </label>
              <label className="text-sm">
                النوع
                <input className="field mt-1" value={gender} onChange={(e) => setGender(e.target.value)} />
              </label>
              <label className="text-sm">
                فصيلة الدم
                <input className="field mt-1" value={bloodType} onChange={(e) => setBloodType(e.target.value)} />
              </label>
              <label className="text-sm sm:col-span-2">
                الأمراض المزمنة
                <input className="field mt-1" value={chronic} onChange={(e) => setChronic(e.target.value)} />
              </label>
              <label className="text-sm sm:col-span-2">
                الحساسية
                <input className="field mt-1" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
              </label>
              <label className="text-sm sm:col-span-2">
                الأدوية الحالية
                <input className="field mt-1" value={medications} onChange={(e) => setMedications(e.target.value)} />
              </label>
              <div className="flex gap-2 sm:col-span-2">
                <button type="submit" className="btn-primary px-5 py-2.5 text-sm" disabled={save.isPending}>
                  {save.isPending ? "جارٍ الحفظ..." : "حفظ"}
                </button>
                <button type="button" className="btn-ghost px-5 py-2.5 text-sm" onClick={() => setEditing(false)}>
                  إلغاء
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="السن" value={profile?.ageYears ? `${profile.ageYears} سنة` : "—"} />
                <Field label="النوع" value={profile?.gender || "—"} />
                <Field label="فصيلة الدم" value={profile?.bloodType || "—"} />
                <Field label="الأمراض المزمنة" value={joinList(profile?.chronic ?? [])} />
                <Field label="الحساسية" value={joinList(profile?.allergies ?? [])} />
                <Field label="الأدوية الحالية" value={joinList(profile?.medications ?? [])} />
              </div>
              <button className="btn-ghost mt-6 px-5 py-2.5 text-sm" onClick={startEdit}>
                تعديل البيانات
              </button>
              {message ? <p className="mt-3 text-sm text-primary">{message}</p> : null}
            </>
          )}

          <h2 className="mt-9 font-display text-lg">تاريخ الزيارات</h2>
          <ul className="mt-4 space-y-3">
            {visits.map((v) => (
              <li key={v.id} className="glass-soft flex flex-wrap items-center justify-between gap-2 rounded-2xl p-4">
                <span>
                  <span className="block font-semibold">{v.date}</span>
                  <span className="block text-xs text-muted-foreground">
                    {v.type} — {v.reason || "بدون سبب مكتوب"}
                  </span>
                </span>
                <span className="chip">{v.status}</span>
              </li>
            ))}
            {!file.isLoading && visits.length === 0 ? (
              <li className="text-sm text-muted-foreground">لا توجد زيارات بعد.</li>
            ) : null}
          </ul>
        </div>

        <aside className="glass h-fit rounded-3xl p-6">
          <h2 className="font-display text-lg">التحاليل والأشعة</h2>
          <label className="mt-4 block cursor-pointer rounded-2xl border border-dashed border-border-strong bg-muted p-6 text-center text-sm text-muted-foreground">
            اسحب الملف هنا أو اضغط للرفع
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const next = e.target.files?.[0];
                if (next) upload.mutate(next);
                e.target.value = "";
              }}
            />
          </label>
          {upload.error ? <p className="mt-2 text-xs text-destructive">{upload.error.message}</p> : null}
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
