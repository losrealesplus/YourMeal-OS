import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** CTA principal grande, mobile-first (touch target ≥ 56px). */
export function PrimaryCTA({
  children,
  onClick,
  disabled,
  variant = "solid",
  type = "button",
  className,
  trailingIcon = true,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "solid" | "outline";
  type?: "button" | "submit";
  className?: string;
  trailingIcon?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative w-full h-14 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none inline-flex items-center justify-center gap-2",
        variant === "solid"
          ? "hero-emerald text-primary-foreground"
          : "bg-card border border-border text-foreground hover:border-primary/40",
        className,
      )}
    >
      <span>{children}</span>
      {trailingIcon ? (
        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      ) : null}
    </button>
  );
}
