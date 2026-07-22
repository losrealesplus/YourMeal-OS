import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
};

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-12 grid place-items-center text-xs text-muted-foreground">
        {empty ?? "No data"}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "meta-label font-mono px-5 pb-3 border-b border-border whitespace-nowrap",
                  c.className,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border/60 last:border-0 hover:bg-secondary/40 transition-colors"
            >
              {columns.map((c) => (
                <td key={c.key} className={cn("px-5 py-3.5 align-middle", c.className)}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
