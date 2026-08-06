import type { BootstrapStageHandler } from "./BootstrapStage";

function readEnv(name: string): string | undefined {
  const vite = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
  const fromVite = vite?.[name];
  if (typeof fromVite === "string" && fromVite.length > 0) return fromVite;
  if (typeof process !== "undefined" && process.env?.[name]) {
    return process.env[name];
  }
  return undefined;
}

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const v = value.trim();
  if (!v) return true;
  return /REPLACE_ME|your-project|changeme|todo/i.test(v);
}

/**
 * Environment — required Vite/env contract for Product Core.
 * Does not write .env; mirrors ADR 0049 required keys for in-app boot.
 */
export const EnvironmentStage: BootstrapStageHandler = {
  id: "environment",
  blocking: true,
  async run() {
    const url = readEnv("VITE_SUPABASE_URL") || readEnv("SUPABASE_URL");
    const key =
      readEnv("VITE_SUPABASE_PUBLISHABLE_KEY") ||
      readEnv("SUPABASE_PUBLISHABLE_KEY");

    const missing: string[] = [];
    if (isPlaceholder(url)) missing.push("VITE_SUPABASE_URL");
    if (isPlaceholder(key)) missing.push("VITE_SUPABASE_PUBLISHABLE_KEY");

    if (missing.length > 0) {
      return {
        status: "failed",
        error: {
          code: "ENV_INVALID",
          stage: "environment",
          message: `Missing or placeholder environment: ${missing.join(", ")}`,
          recoverable: true,
          evidence: { missing },
        },
        evidence: { missing },
      };
    }

    return {
      status: "ok",
      notes: ["environment:required_keys_present"],
      evidence: {
        hasSupabaseUrl: true,
        hasSupabaseKey: true,
      },
    };
  },
};
