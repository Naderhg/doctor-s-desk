import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/doctor")({
  component: DoctorLayout,
});

const tabs = [
  { to: "/doctor", label: "نظرة عامة", exact: true },
  { to: "/doctor/schedule", label: "الجدول والمواعيد" },
  { to: "/doctor/patients", label: "المرضى" },
  { to: "/doctor/visit", label: "تسجيل زيارة" },
  { to: "/doctor/reports", label: "التقرير الشهري" },
  { to: "/doctor/settings", label: "الإعدادات" },
] as const;

function DoctorLayout() {
  return (
    <div className="relative z-10">
      <div className="px-4 sm:px-8">
        <nav className="glass-soft flex gap-2 overflow-x-auto rounded-2xl p-2 text-sm">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="shrink-0 rounded-xl px-4 py-2 text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "shrink-0 rounded-xl px-4 py-2 bg-primary/15 text-foreground font-semibold" }}
              activeOptions={{ exact: "exact" in t }}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
