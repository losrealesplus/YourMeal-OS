/**
 * EP-BOOTSTRAP-001 · Development Bootstrap Mode flag.
 *
 * Bootstrap Mode is opt-in via VITE_BOOTSTRAP_MODE and must never be forced on.
 * Production always uses Supabase Auth.
 */

function readFlag(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const s = String(value).trim().toLowerCase();
  if (s === "true" || s === "1" || s === "yes" || s === "on") return true;
  if (s === "false" || s === "0" || s === "no" || s === "off") return false;
  return undefined;
}

function viteEnvFlag(): unknown {
  try {
    return import.meta.env.VITE_BOOTSTRAP_MODE;
  } catch {
    return undefined;
  }
}

/** Bootstrap Mode gate — env driven, defaults to OFF. */
export function isBootstrapMode(): boolean {
  const fromProcess = readFlag(
    typeof process !== "undefined" ? process.env?.VITE_BOOTSTRAP_MODE : undefined,
  );
  if (fromProcess !== undefined) return fromProcess;
  return readFlag(viteEnvFlag()) ?? false;
}
