import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PanelCard({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "bg-card border border-border ring-1 ring-black/[0.03] rounded-2xl p-5",
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-center justify-between mb-4">
          {title ? <p className="meta-label">{title}</p> : <span />}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
