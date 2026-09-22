import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { PageShell } from "@/components/page-shell";
import { AuthGate } from "@/components/auth-gate";
import { ApiError } from "@/lib/api";
import { getDoctors } from "@/lib/auth";
import {
  checkIn,
  dischargeEncounter,
  listEncounters,
  lookupPatients,
  registerPatient,
  type Department,
  type PatientLookup,
} from "@/lib/hospital";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/front-desk")({
  head: () => ({
    meta: [
      { title: "الاستعلامات والاستقبال — المستشفى" },
      { name: "description", content: "تسجيل دخول المرضى وتوجيههم للأقسام مع فتح الحساب تلقائياً." },
    ],
  }),
  component: FrontDeskPage,
});

const departments: { value: Department; label: string }[] = [
  { value: "er", label: "الطوارئ" },
  { value: "opd", label: "العيادات الخارجية" },
  { value: "ipd", label: "الأقسام الداخلية" },
  { value: "or", label: "العمليات" },
];

const triageLabels: Record<string, string> = { red: "حرجة", yellow: "متوسطة", green: "بسيطة" };
const statusLabels: Record<string, string> = { active: "نشط", discharged: "خرج", cancelled: "ملغي" };

function FrontDeskPage() {
  return (
    <AuthGate>
      <RoleGate>
        <FrontDeskContent />
      </RoleGate>
    </AuthGate>
  );
}

function RoleGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user || !["receptionist", "admin"].includes(user.role)) {
    return (
      <PageShell title="غير مصرح" description="هذه الصفحة للاستقبال والإدارة فقط">
        <p className="text-sm text-muted-foreground">لا تملك صلاحية الوصول لهذه الصفحة.</p>
      </PageShell>
    );
  }
  return children;
}

function FrontDeskContent() {
  const queryClient = useQueryClient();
  const [deptFilter, setDeptFilter] = useState<string>("");
  const encounters = useQuery({
    queryKey: ["encounters", deptFilter],
    queryFn: () => listEncounters({ status: "active", department: deptFilter || undefined }),
    refetchInterval: 15000,
  });

  const discharge = useMutation({
    mutationFn: dischargeEncounter,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["encounters"] }),
  });

  return (
    <PageShell
      eyebrow="الاستعلامات"
      title="تسجيل دخول المرضى"
      description="ابحث عن المريض أو سجّله، ثم وجّهه للقسم — الحساب يُفتح تلقائياً لدى الحسابات"
    >
      <CheckInForm onDone={() => queryClient.invalidateQueries({ queryKey: ["encounters"] })} />

      <div className="mt-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h3 className="font-display text-lg">المرضى الموجودون الآن</h3>
          <div className="flex gap-1.5">
            <button
              className={`chip cursor-pointer ${deptFilter === "" ? "bg-primary/20 font-semibold" : ""}`}
              onClick={() => setDeptFilter("")}
            >
              الكل
            </button>
            {departments.map((d) => (
              <button
                key={d.value}
                className={`chip cursor-pointer ${deptFilter === d.value ? "bg-primary/20 font-semibold" : ""}`}
                onClick={() => setDeptFilter(d.value)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {encounters.isLoading ? <p className="text-sm text-muted-foreground">جارٍ التحميل...</p> : null}
        {encounters.error instanceof ApiError ? (
          <p className="text-sm text-destructive">{encounters.error.message}</p>
        ) : null}
        {discharge.error instanceof ApiError ? (
          <p className="mb-3 text-sm text-destructive">{discharge.error.message}</p>
        ) : null}

        <div className="space-y-3">
          {(encounters.data?.encounters ?? []).length === 0 && !encounters.isLoading ? (
            <p className="text-sm text-muted-foreground">لا يوجد مرضى حالياً.</p>
          ) : null}
          {(encounters.data?.encounters ?? []).map((e) => (
            <article key={e.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 font-display text-lg font-bold text-primary">
                  {e.patientName.charAt(0)}
                </span>
                <div>
                  <p className="font-semibold">{e.patientName}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {e.mrn} · {e.patientPhone}
                  </p>
                  {e.chiefComplaint ? <p className="text-xs text-muted-foreground">{e.chiefComplaint}</p> : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {e.triageLevel ? (
                  <span
                    className={`chip ${
                      e.triageLevel === "red" ? "bg-destructive/15 text-destructive" : e.triageLevel === "yellow" ? "bg-amber-500/15 text-amber-600" : "bg-emerald-500/15 text-emerald-600"
                    }`}
                  >
                    {triageLabels[e.triageLevel]}
                  </span>
                ) : null}
                <span className="chip">{e.departmentLabel}</span>
                {e.doctorName ? <span className="chip">{e.doctorName}</span> : null}
                <span className="text-xs text-muted-foreground">{e.admittedTime}</span>
                <button
                  className="rounded-lg px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                  onClick={() => discharge.mutate(e.id)}
                  disabled={discharge.isPending}
                >
                  تسجيل خروج
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

function CheckInForm({ onDone }: { onDone: () => void }) {
  const doctors = useQuery({ queryKey: ["doctors"], queryFn: getDoctors });
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PatientLookup | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [department, setDepartment] = useState<Department>("opd");
  const [complaint, setComplaint] = useState("");
  const [triage, setTriage] = useState<"red" | "yellow" | "green">("green");
  const [doctorId, setDoctorId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const lookup = useQuery({
    queryKey: ["patient-lookup", query],
    queryFn: () => lookupPatients(query),
    enabled: query.trim().length >= 2,
  });

  const checkInMut = useMutation({
    mutationFn: checkIn,
    onSuccess: (data) => {
      setSuccess(`تم تسجيل دخول ${data.encounter.patientName} — ${data.encounter.departmentLabel} — فُتح الحساب لدى الحسابات`);
      setSelected(null);
      setQuery("");
      setComplaint("");
      onDone();
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "تعذّر تسجيل الدخول"),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!selected) {
      setError("اختر مريضاً من نتائج البحث أو سجّل مريضاً جديداً");
      return;
    }
    checkInMut.mutate({
      patientId: selected.id,
      department,
      chiefComplaint: complaint,
      triageLevel: department === "er" ? triage : undefined,
      assignedDoctorId: doctorId || null,
    });
  }

  return (
    <form onSubmit={submit} className="glass rounded-3xl p-6">
      <h3 className="mb-4 font-display text-lg">تذكرة دخول جديدة</h3>

      {/* Patient search */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs text-muted-foreground">ابحث بالرقم الطبي / الموبايل / الرقم القومي / الاسم</label>
        <div className="flex gap-2">
          <input
            className="field flex-1"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            placeholder="MRN-000001 أو 010... أو اسم المريض"
          />
          <button type="button" className="btn-primary px-4 py-2 text-sm" onClick={() => setShowRegister((v) => !v)}>
            {showRegister ? "إلغاء" : "+ مريض جديد"}
          </button>
        </div>
      </div>

      {showRegister ? (
        <RegisterPatientInline
          onCreated={(p) => {
            setSelected(p);
            setShowRegister(false);
            setQuery(p.mrn ?? p.name);
          }}
        />
      ) : null}

      {/* Search results */}
      {query.trim().length >= 2 && !selected ? (
        <div className="mb-4 space-y-1.5">
          {lookup.isLoading ? <p className="text-xs text-muted-foreground">جارٍ البحث...</p> : null}
          {(lookup.data?.patients ?? []).map((p) => (
            <button
              key={p.id}
              type="button"
              className="glass-soft flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-right text-sm hover:bg-primary/5"
              onClick={() => setSelected(p)}
            >
              <span className="font-semibold">{p.name}</span>
              <span className="text-xs text-muted-foreground" dir="ltr">
                {p.mrn ?? "—"} · {p.phone ?? "—"}
              </span>
            </button>
          ))}
          {lookup.data && lookup.data.patients.length === 0 ? (
            <p className="text-xs text-muted-foreground">لا توجد نتائج — سجّل مريضاً جديداً</p>
          ) : null}
        </div>
      ) : null}

      {selected ? (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3">
          <div>
            <p className="font-semibold">{selected.name}</p>
            <p className="text-xs text-muted-foreground" dir="ltr">
              {selected.mrn ?? "—"} · {selected.phone ?? "—"}
            </p>
          </div>
          <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setSelected(null)}>
            تغيير
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">القسم</label>
          <select className="field" value={department} onChange={(e) => setDepartment(e.target.value as Department)}>
            {departments.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-muted-foreground">الطبيب المسؤول (اختياري)</label>
          <select className="field" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
            <option value="">بدون تحديد</option>
            {(doctors.data?.doctors ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        {department === "er" ? (
          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">درجة الفرز (Triage)</label>
            <select className="field" value={triage} onChange={(e) => setTriage(e.target.value as "red" | "yellow" | "green")}>
              <option value="red">حرجة — أحمر</option>
              <option value="yellow">متوسطة — أصفر</option>
              <option value="green">بسيطة — أخضر</option>
            </select>
          </div>
        ) : null}
        <div className={department === "er" ? "" : "sm:col-span-2"}>
          <label className="mb-1.5 block text-xs text-muted-foreground">الشكوى / سبب الدخول</label>
          <input className="field" value={complaint} onChange={(e) => setComplaint(e.target.value)} placeholder="مثال: ألم في الصدر" />
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      {success ? <p className="mt-3 text-sm text-emerald-600">{success}</p> : null}

      <button type="submit" className="btn-primary mt-4 px-5 py-2.5 text-sm" disabled={checkInMut.isPending || !selected}>
        {checkInMut.isPending ? "جارٍ التسجيل..." : "تسجيل الدخول وفتح الحساب"}
      </button>
    </form>
  );
}

function RegisterPatientInline({ onCreated }: { onCreated: (p: PatientLookup) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const register = useMutation({
    mutationFn: registerPatient,
    onSuccess: (data) => onCreated(data.patient),
    onError: (err) => setError(err instanceof ApiError ? err.message : "تعذّر تسجيل المريض"),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    register.mutate({ name, phone, nationalId: nationalId || undefined });
  }

  return (
    <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <p className="mb-3 text-sm font-semibold">تسجيل مريض جديد (يُنشأ رقم طبي تلقائياً)</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} required placeholder="اسم المريض" />
        <input className="field" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="رقم الموبايل" />
        <input className="field" dir="ltr" value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="الرقم القومي (اختياري)" />
      </div>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      <button type="button" className="btn-primary mt-3 px-4 py-2 text-xs" onClick={submit} disabled={register.isPending}>
        {register.isPending ? "جارٍ التسجيل..." : "تسجيل واختيار"}
      </button>
    </div>
  );
}
