import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useClinic } from "@/hooks/use-clinic";
import { NotificationBell } from "@/components/notification-bell";

export function SiteHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data } = useClinic();
  const clinicName = data?.clinic.clinicName ?? "عيادة د. كريم النجار";
  const specialty = data?.clinic.specialty ?? "باطنية عامة · استشارات ومتابعة";
  const isDoctor = user?.role === "doctor";
  const isAdmin = user?.role === "admin";
  const isReceptionist = user?.role === "receptionist";
  const isCashier = user?.role === "cashier";
  const isStaff = isDoctor || isAdmin || isReceptionist;
  const links = isCashier
    ? ([{ to: "/billing", label: "الحسابات" }] as const)
    : isStaff
    ? ([...(isAdmin ? [{ to: "/admin", label: "الإدارة" } as const] : []),
        { to: "/front-desk", label: "الاستعلامات" },
        { to: "/billing", label: "الحسابات" },
        { to: "/doctor", label: "لوحة الدكتور" },
        { to: "/doctor/schedule", label: "الجدول" },
        { to: "/doctor/patients", label: "المرضى" },
        ...(isDoctor || isAdmin ? [{ to: "/doctor/reports", label: "التقارير" } as const] : []),
        ...(isAdmin ? [{ to: "/doctor/settings", label: "الإعدادات" } as const] : []),
      ] as const)
    : ([
        { to: "/", label: "الرئيسية" },
        { to: "/booking", label: "احجز" },
        { to: "/appointments", label: "مواعيدي" },
        { to: "/medical-file", label: "ملفي الطبي" },
        { to: "/prescriptions", label: "الروشتات" },
      ] as const);

  return (
    <header className="relative z-20 px-4 py-5 sm:px-8">
      <div className="glass flex items-center justify-between gap-4 rounded-2xl px-5 py-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-primary to-brand font-display text-lg font-bold text-primary-foreground">
            د
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block font-display font-bold">{clinicName}</span>
            <span className="block text-xs text-muted-foreground">{specialty}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm lg:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground font-semibold" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? <NotificationBell /> : null}
          {user ? (
            <>
              <span className="hidden max-w-[9rem] truncate text-sm text-muted-foreground sm:inline">{user.name}</span>
              <button
                type="button"
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                onClick={async () => {
                  await logout();
                  await navigate({ to: "/" });
                }}
              >
                خروج
              </button>
            </>
          ) : (
            <Link to="/auth" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
              دخول
            </Link>
          )}
          {isCashier ? (
            <Link to="/billing" className="btn-primary px-4 py-2.5 text-sm">
              الحسابات
            </Link>
          ) : isStaff ? (
            <Link to="/doctor" className="btn-primary px-4 py-2.5 text-sm">
              اللوحة
            </Link>
          ) : (
            <Link to="/booking" className="btn-primary px-4 py-2.5 text-sm">
              احجز الآن
            </Link>
          )}
        </div>
      </div>

      <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 text-sm lg:hidden">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="chip shrink-0"
            activeProps={{ className: "chip shrink-0 text-foreground border-border-strong" }}
            activeOptions={{ exact: l.to === "/" }}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
