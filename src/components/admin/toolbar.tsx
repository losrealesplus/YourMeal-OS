import type { ReactNode } from "react";
import { Search } from "lucide-react";

export function Toolbar({
  searchPlaceholder,
  actions,
}: {
  searchPlaceholder?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          placeholder={searchPlaceholder ?? "Search…"}
          className="w-full h-10 rounded-xl border border-border bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>
      {actions}
    </div>
  );
}
