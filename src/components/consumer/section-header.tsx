import type { ReactNode } from "react";

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-6 pt-6 pb-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="h-3 w-0.5 rounded-full bg-primary/70" aria-hidden />
        <p className="meta-label truncate">{title}</p>
      </div>
      {action ? <div className="text-xs font-bold">{action}</div> : null}
    </div>
  );
}
