import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="px-4 py-10 text-center text-sm text-muted-foreground">جارٍ التحميل...</p>;
  }

  if (!user) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">سجّل دخولك أولاً لمتابعة هذه الصفحة.</p>
        <Link to="/auth" className="btn-primary mt-4 inline-flex px-5 py-2.5 text-sm">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  return children;
}
