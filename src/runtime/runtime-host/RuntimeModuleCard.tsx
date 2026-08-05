/**
 * RuntimeModuleCard — single module entry in the Host sidebar.
 */
import { cn } from "@/lib/utils";
import type { RuntimeModule } from "../runtime-core";

export function RuntimeModuleCard({
  module,
  selected,
  onSelect,
}: {
  module: RuntimeModule;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(module.id)}
      className={cn(
        "flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left transition-colors",
        selected
          ? "bg-sky-500/90 text-zinc-950"
          : "bg-white/5 text-zinc-300 hover:bg-white/10",
      )}
    >
      <span className="text-[10px] font-semibold leading-tight">
        {module.title}
      </span>
      {module.description ? (
        <span
          className={cn(
            "line-clamp-2 text-[9px] leading-snug",
            selected ? "text-zinc-800/80" : "text-zinc-500",
          )}
        >
          {module.description}
        </span>
      ) : null}
    </button>
  );
}
