import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

/**
 * Staff entry into the Operations Center — sits near Powered by.
 * Customers see a quiet brand footer link; staff recognize where the day starts.
 * Security is auth + RBAC, not UI obscurity.
 */
export function BrandLeafMark({ className }: { className?: string }) {
  const { t } = useTranslation("auth");

  return (
    <Link
      to="/auth/admin"
      aria-label={t("adminEntryAria")}
      className={cn(
        "text-[10px] font-medium tracking-[0.04em] text-[#9a8f7c]/55",
        "transition-colors duration-300 hover:text-[#9a8f7c]/90",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:rounded-sm",
        className,
      )}
    >
      {t("adminEntryLabel")}
    </Link>
  );
}
