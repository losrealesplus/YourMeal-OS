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
    <div className="bg-card border border-border rounded-2xl p-8 text-center">
      {icon ? (
        <div className="grid place-items-center size-14 rounded-2xl bg-secondary mx-auto mb-4 text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <p className="font-bold">{title}</p>
      {hint ? (
        <p className="text-sm text-muted-foreground mt-2">{hint}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
