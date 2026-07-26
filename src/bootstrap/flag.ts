/**
 * EP-BOOTSTRAP-001 · Development Bootstrap Mode flag.
 *
 * ⚠️ DIAGNOSTIC SMOKE (temporary) — 2026-07-26
 * Forced ON to answer: is Lovable serving this commit?
 *
 * Mundo A — Bootstrap UI appears → code runs; env injection was the failure.
 * Mundo B — still /auth login → preview is NOT this build. Stop app changes.
 *
 * REVERT after the test. Production must never ship with FORCE_ON.
 */

/** @diagnostic hard-coded true — do not merge as permanent */
const BOOTSTRAP_SMOKE_FORCE_ON = true;

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

/**
 * Bootstrap Mode gate.
 * During smoke diagnostic: always true (ignores env).
 */
export function isBootstrapMode(): boolean {
  if (BOOTSTRAP_SMOKE_FORCE_ON) return true;

  const fromProcess = readFlag(process.env.VITE_BOOTSTRAP_MODE);
  if (fromProcess !== undefined) return fromProcess;
  return readFlag(viteEnvFlag()) ?? false;
}
