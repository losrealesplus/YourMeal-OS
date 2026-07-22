import { AlertCircle } from "lucide-react";

export function AllergenBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-[var(--brand-cream)] text-[var(--brand-clay)] border border-[var(--brand-sand)] rounded-full px-2.5 py-1">
      <AlertCircle className="size-3" />
      {label}
    </span>
  );
}
