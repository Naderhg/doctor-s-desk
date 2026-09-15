import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/page-shell";
import { patients } from "@/lib/clinic-data";

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
  const list = patients.filter((p) => p.name.includes(q.trim()) || p.phone.includes(q.trim()));

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
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3 font-semibold">{p.name}</td>
                <td className="p-3 text-muted-foreground">{p.age}</td>
                <td className="p-3 text-muted-foreground">{p.phone}</td>
                <td className="p-3 text-muted-foreground">{p.lastVisit}</td>
                <td className="p-3">{p.visits}</td>
              </tr>
            ))}
            {list.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
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
