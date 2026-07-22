import type { ReactNode } from "react";

export function SectionTitle({
  overline,
  title,
  subtitle,
  trailing,
}: {
  overline?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5">
      <div className="min-w-0">
        {overline ? <p className="meta-label">{overline}</p> : null}
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight mt-1.5">{title}</h1>
        {subtitle ? (
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">{subtitle}</p>
        ) : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}
