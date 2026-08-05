/**
 * RuntimeHost — Developer Platform Shell.
 * Asks the Registry for modules; never imports Assets/DOM/Consistency.
 * DEVELOPER-PLATFORM-003
 */
import { useMemo } from "react";
import {
  emitRuntimeCoreEvent,
  getModules,
  isEnabled,
  type RuntimeModule,
  type RuntimePlatform,
} from "../runtime-core";
import {
  detectRuntimePlatform,
  moduleSupportsPlatform,
} from "./RuntimeCategory";
import { RuntimeSidebar } from "./RuntimeSidebar";
import { RuntimeModuleRenderer } from "./RuntimeModuleRenderer";

export type RuntimeHostProps = {
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Legacy Inspector panel for the selected module (bridge). */
  legacyPanel?: React.ReactNode;
  /** Override platform detection (tests). */
  platform?: RuntimePlatform;
};

export function RuntimeHost({
  selectedId,
  onSelect,
  legacyPanel,
  platform: platformProp,
}: RuntimeHostProps) {
  const platform = platformProp ?? detectRuntimePlatform();

  const modules = useMemo(() => {
    return getModules().filter(
      (m) =>
        m.visible !== false &&
        isEnabled(m.id) &&
        moduleSupportsPlatform(m, platform),
    );
  }, [platform, selectedId]); // selectedId bounce ensures re-read after late registration

  const selected: RuntimeModule | null =
    (selectedId && modules.find((m) => m.id === selectedId)) ||
    modules[0] ||
    null;

  const effectiveId = selected?.id ?? null;

  return (
    <div className="flex min-h-0 flex-1 gap-2">
      <aside className="w-[7.5rem] shrink-0 border-r border-white/10 pr-1">
        <RuntimeSidebar
          modules={modules}
          selectedId={effectiveId}
          onSelect={(id) => {
            emitRuntimeCoreEvent("host-module-selected", { id });
            onSelect(id);
          }}
        />
      </aside>
      <section className="min-w-0 flex-1 overflow-auto">
        <RuntimeModuleRenderer module={selected} legacyPanel={legacyPanel} />
      </section>
    </div>
  );
}
