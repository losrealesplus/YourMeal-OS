/**
 * EP-BOOTSTRAP-001 · Development Bootstrap Mode flag.
 *
 * Default OFF. Never enable in production builds.
 * When false, zero bootstrap code paths affect identity behavior.
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

/** True only when `VITE_BOOTSTRAP_MODE` is explicitly enabled. Default: false. */
export function isBootstrapMode(): boolean {
  const fromProcess = readFlag(process.env.VITE_BOOTSTRAP_MODE);
  if (fromProcess !== undefined) return fromProcess;
  return readFlag(viteEnvFlag()) ?? false;
}
