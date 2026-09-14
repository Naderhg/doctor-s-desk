import { Link } from "@tanstack/react-router";
import { clinic } from "@/lib/clinic-data";

const links = [
  { to: "/", label: "الرئيسية" },
  { to: "/booking", label: "احجز" },
  { to: "/appointments", label: "مواعيدي" },
  { to: "/medical-file", label: "ملفي الطبي" },
  { to: "/prescriptions", label: "الروشتات" },
  { to: "/doctor", label: "لوحة الدكتور" },
] as const;

export function SiteHeader() {
  return (
    <header className="relative z-20 px-4 py-5 sm:px-8">
      <div className="glass flex items-center justify-between gap-4 rounded-2xl px-5 py-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-primary to-brand font-display text-lg font-bold text-primary-foreground">
            د
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block font-display font-bold">{clinic.clinicName}</span>
            <span className="block text-xs text-muted-foreground">{clinic.specialty}</span>
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
          <Link to="/auth" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
            دخول
          </Link>
          <Link to="/booking" className="btn-primary px-4 py-2.5 text-sm">
            احجز الآن
          </Link>
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
