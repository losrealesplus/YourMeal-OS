/**
 * RuntimeModuleRenderer — renders Host UI for a module id (dynamic).
 * Falls back to a bridge notice when no React renderer is registered
 * (legacy Suite panels stay in the Inspector body).
 */
import type { ReactNode } from "react";
import type { RuntimeModule } from "../runtime-core";
import { getModuleRenderer } from "./module-renderers";
import { legacyTabForModuleId } from "./legacy-bridges";

export function RuntimeModuleRenderer({
  module,
  legacyPanel,
}: {
  module: RuntimeModule | null;
  /** Existing Inspector tab body for legacy bridges. */
  legacyPanel?: ReactNode;
}) {
  if (!module) {
    return (
      <p className="text-[10px] text-zinc-500">Select a module from the sidebar.</p>
    );
  }

  const render = getModuleRenderer(module.id);
  if (render) {
    return <>{render()}</>;
  }

  const legacyTab = legacyTabForModuleId(module.id);
  if (legacyTab && legacyPanel) {
    return <>{legacyPanel}</>;
  }

  return (
    <div className="space-y-2 text-[10px] text-zinc-300">
      <p className="font-semibold text-zinc-100">{module.title}</p>
      <p className="text-zinc-500">{module.description}</p>
      <p className="font-mono text-zinc-600">
        id={module.id} · v{module.version} · {module.category}
      </p>
      <p className="text-zinc-500">
        No Host renderer registered yet. Future modules supply{" "}
        <code className="text-zinc-400">registerModuleRenderer()</code>.
      </p>
    </div>
  );
}
