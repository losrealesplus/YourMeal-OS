import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface-raised border border-dashed border-border rounded-3xl p-8 text-center flex flex-col items-center gap-3">
      {icon ? (
        <div className="grid place-items-center size-12 rounded-2xl bg-secondary text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <div className="space-y-1">
        <p className="font-bold">{title}</p>
        {hint ? (
          <p className="text-xs text-muted-foreground max-w-[28ch] mx-auto leading-relaxed">
            {hint}
          </p>
        ) : null}
      </div>
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
