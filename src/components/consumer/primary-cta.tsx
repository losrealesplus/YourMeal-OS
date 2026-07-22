import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** CTA principal grande, mobile-first (touch target ≥ 48px). */
export function PrimaryCTA({
  children,
  onClick,
  disabled,
  variant = "solid",
  type = "button",
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "solid" | "outline";
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full h-14 rounded-2xl text-sm font-bold uppercase tracking-widest transition-transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
        variant === "solid"
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-card border border-border text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}
