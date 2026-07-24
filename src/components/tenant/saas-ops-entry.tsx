import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

/**
 * WP-3 · Dual Operations Entry Point.
 *
 * Sits directly below `BrandLeafMark` ("Centro de Operaciones").
 * Renders ONLY when the current session is `saas_admin`. Visibility reuses
 * the existing RBAC signal (`useAuth().isSaasAdmin`); no duplicated logic.
 * Navigates to `/saas` via TanStack Router — no hardcoded URL, no redirect.
 */
export function SaasOpsEntry({ className }: { className?: string }) {
  const { t } = useTranslation("auth");
  const { isSaasAdmin, loading } = useAuth();

  if (loading || !isSaasAdmin) return null;

  return (
    <Link
      to="/saas"
      aria-label={t("saasEntryAria")}
      className={cn(
        "group flex flex-col items-center gap-0.5",
        "text-[11px] font-medium tracking-[0.08em] text-muted-foreground",
        "transition-colors duration-300 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:rounded-sm",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5 underline-offset-4 group-hover:underline">
        <Layers className="h-3 w-3" aria-hidden />
        {t("saasEntryLabel")}
      </span>
      <span className="text-[9px] font-normal tracking-[0.06em] text-muted-foreground/80">
        {t("saasEntrySubtitle")}
      </span>
    </Link>
  );
}
