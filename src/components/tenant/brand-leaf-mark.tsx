import { Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

/**
 * EatClean brand leaf — visual mark near Powered by.
 * For customers: decorative brand detail.
 * For staff: opens Admin login. Security is auth + RBAC, not UI obscurity.
 */
export function BrandLeafMark({ className }: { className?: string }) {
  const { t } = useTranslation("auth");

  return (
    <Link
      to="/auth/admin"
      aria-label={t("adminEntryAria")}
      className={cn(
        "inline-flex text-primary/35 transition-opacity duration-300",
        "hover:text-primary/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:rounded-sm",
        className,
      )}
    >
      <Leaf className="size-[1.125rem]" strokeWidth={1.5} aria-hidden />
    </Link>
  );
}
