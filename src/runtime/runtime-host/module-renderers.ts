/**
 * Host-side renderer registry — keeps React out of Runtime Core.
 * Modules register UI via registerModuleRenderer(id, render).
 */

import type { ReactNode } from "react";

type Renderer = () => ReactNode;

const renderers = new Map<string, Renderer>();

export function registerModuleRenderer(id: string, render: Renderer): void {
  renderers.set(id, render);
}

export function unregisterModuleRenderer(id: string): void {
  renderers.delete(id);
}

export function getModuleRenderer(id: string): Renderer | undefined {
  return renderers.get(id);
}

export function hasModuleRenderer(id: string): boolean {
  return renderers.has(id);
}

/** Test helper */
export function resetModuleRenderers(): void {
  renderers.clear();
}
