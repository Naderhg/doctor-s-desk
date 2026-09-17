import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageShell } from "@/components/page-shell";
import { getDoctorPatients } from "@/lib/doctor";

export const Route = createFileRoute("/doctor/patients")({
  head: () => ({
    meta: [
      { title: "المرضى — لوحة الدكتور" },
      { name: "description", content: "قائمة المرضى المسجلين مع بيانات التواصل وعدد الزيارات وآخر زيارة." },
      { property: "og:title", content: "المرضى — لوحة الدكتور" },
      { property: "og:description", content: "بحث سريع في سجل المرضى وزياراتهم." },
    ],
  }),
  component: DoctorPatients,
});

function DoctorPatients() {
  const [q, setQ] = useState("");
  const patients = useQuery({ queryKey: ["doctor-patients", q], queryFn: () => getDoctorPatients(q) });
  const list = patients.data?.patients ?? [];

  return (
    <PageShell eyebrow="لوحة التحكم" title="المرضى" description="ابحث بالاسم أو رقم الهاتف.">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ابحث عن مريض…"
        className="glass-soft mb-5 w-full rounded-2xl px-4 py-3 text-sm outline-none sm:max-w-sm"
      />

      <div className="glass overflow-x-auto rounded-3xl p-2">
        <table className="w-full min-w-[520px] text-right text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="p-3 font-normal">الاسم</th>
              <th className="p-3 font-normal">السن</th>
              <th className="p-3 font-normal">الهاتف</th>
              <th className="p-3 font-normal">آخر زيارة</th>
              <th className="p-3 font-normal">الزيارات</th>
              <th className="p-3 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-t border-border transition-colors hover:bg-foreground/5">
                <td className="p-3 font-semibold">
                  <Link to="/doctor/patient/$id" params={{ id: p.id }} className="hover:text-primary">
                    {p.name}
                  </Link>
                </td>
                <td className="p-3 text-muted-foreground">{p.age}</td>
                <td className="p-3 text-muted-foreground">{p.phone}</td>
                <td className="p-3 text-muted-foreground">{p.lastVisit}</td>
                <td className="p-3">{p.visits}</td>
                <td className="p-3">
                  <Link
                    to="/doctor/patient/$id"
                    params={{ id: p.id }}
                    className="btn-ghost inline-block px-3 py-1.5 text-xs"
                  >
                    فتح الملف
                  </Link>
                </td>
              </tr>
            ))}
            {list.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  لا توجد نتائج مطابقة.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
