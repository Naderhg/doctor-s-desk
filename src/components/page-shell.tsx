import type { ReactNode } from "react";

export function PageShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="relative z-10 px-4 pb-14 sm:px-8">
      <div className="mb-6">
        {eyebrow ? <p className="text-xs text-muted-foreground">{eyebrow}</p> : null}
        <h1 className="mt-1 font-display text-2xl sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
