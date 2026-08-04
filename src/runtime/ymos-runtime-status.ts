/**
 * YMOS Runtime Inspector — shared observe-only status registry.
 * Written by ANDROID-RUNTIME-001 probes / error traps; read by the overlay.
 * Never drives app behavior.
 */

export type YmosMountKey =
  | "queryClient"
  | "localization"
  | "identity"
  | "bootstrap"
  | "outlet"
  | "rootRender";

type Listener = () => void;

type Registry = {
  mounts: Partial<Record<YmosMountKey, boolean>>;
  lastException: string | null;
  lastRedirect: string | null;
  mainStarted: boolean;
  rootImported: boolean;
};

const state: Registry = {
  mounts: {},
  lastException: null,
  lastRedirect: null,
  mainStarted: false,
  rootImported: false,
};

const listeners = new Set<Listener>();

function notify() {
  for (const l of listeners) l();
}

export function subscribeYmosRuntimeStatus(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getYmosRuntimeStatus(): Readonly<Registry> {
  return state;
}

export function markYmosRuntimeMount(key: YmosMountKey): void {
  if (state.mounts[key]) return;
  state.mounts[key] = true;
  notify();
}

export function markYmosRuntimeMainStarted(): void {
  state.mainStarted = true;
  notify();
}

export function markYmosRuntimeRootImported(): void {
  state.rootImported = true;
  notify();
}

export function recordYmosRuntimeException(message: string): void {
  state.lastException = message;
  notify();
}

export function recordYmosRuntimeRedirect(from: string, to: string): void {
  state.lastRedirect = `${from} → ${to}`;
  notify();
}

const LABEL_TO_KEY: Record<string, YmosMountKey> = {
  "QueryClientProvider mounted": "queryClient",
  "LocalizationProvider mounted": "localization",
  "IdentityProvider mounted": "identity",
  "BootstrapShell mounted": "bootstrap",
  "Outlet rendered": "outlet",
};

/** Map RUNTIME-001 probe labels → registry keys. */
export function markYmosRuntimeMountFromLabel(label: string): void {
  const key = LABEL_TO_KEY[label];
  if (key) markYmosRuntimeMount(key);
}
