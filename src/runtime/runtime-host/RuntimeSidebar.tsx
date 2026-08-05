/**
 * RuntimeSidebar — categories + module cards from Registry (no hard-coded modules).
 */
import type { RuntimeModule } from "../runtime-core";
import {
  groupModulesByCategory,
  type HostModuleGroup,
} from "./RuntimeCategory";
import { RuntimeModuleCard } from "./RuntimeModuleCard";

export function RuntimeSidebar({
  modules,
  selectedId,
  onSelect,
}: {
  modules: RuntimeModule[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const groups: HostModuleGroup[] = groupModulesByCategory(modules);

  if (groups.length === 0) {
    return (
      <p className="px-2 py-3 text-[10px] text-zinc-500">
        No modules registered.
      </p>
    );
  }

  return (
    <nav
      className="flex max-h-full flex-col gap-3 overflow-y-auto px-1 py-1"
      aria-label="Developer Platform modules"
    >
      {groups.map((group) => (
        <div key={group.category} className="space-y-1">
          <p className="px-2 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.modules.map((mod) => (
              <li key={mod.id}>
                <RuntimeModuleCard
                  module={mod}
                  selected={selectedId === mod.id}
                  onSelect={onSelect}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
