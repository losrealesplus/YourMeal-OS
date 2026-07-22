import type { ReactNode } from "react";

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between px-6 pt-2 pb-3">
      <p className="meta-label">{title}</p>
      {action ? <div className="text-xs">{action}</div> : null}
    </div>
  );
}
