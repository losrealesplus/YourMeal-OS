/** Explicit local-only staging contract. All credentials here are synthetic, never cloud keys. */
import type { InstanceRuntimeConfig } from "./instance-runtime-boundary";
export const LOCAL_STAGING_URL = "http://127.0.0.1:54331";
export const LOCAL_STAGING_PUBLIC_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJwMzQtbG9jYWwtc3ludGhldGljIiwicm9sZSI6ImFub24ifQ.z2pUjMp_cFMba16ShIt-TtReuggUPen10BpncZD9GJs";
export const LOCAL_STAGING_CONFIG: InstanceRuntimeConfig = Object.freeze({
  instanceType: "local_staging",
  runtimeEnvironment: "staging_local",
  tenantSlug: "eatclean-staging",
  coreVersion: "0.1.0",
  supabaseProjectRef: "p34-local-synthetic",
  supabaseUrl: LOCAL_STAGING_URL,
  supabasePublishableKey: LOCAL_STAGING_PUBLIC_KEY,
});
export function isLocalStaging(config: InstanceRuntimeConfig): boolean {
  return (
    config.runtimeEnvironment === "staging_local" ||
    config.instanceType === "local_staging" ||
    config.tenantSlug === "eatclean-staging"
  );
}
export function validateLocalStaging(config: InstanceRuntimeConfig): void {
  if (
    Object.keys(config).length !== Object.keys(LOCAL_STAGING_CONFIG).length ||
    Object.entries(LOCAL_STAGING_CONFIG).some(
      ([k, v]) => config[k as keyof InstanceRuntimeConfig] !== v,
    )
  )
    throw new Error("SECURITY_VIOLATION: Invalid local staging binding.");
}
export function assertLocalStagingHost(host?: string): void {
  if (host && !["localhost", "127.0.0.1", "[::1]", "::1"].includes(host.toLowerCase()))
    throw new Error("SECURITY_VIOLATION: Local staging requires a loopback application host.");
}
export function localStagingFromEnvironment(
  env: Record<string, string | undefined>,
): InstanceRuntimeConfig | undefined {
  const mode = env.YOURMEAL_RUNTIME_ENV;
  if (!mode && env.TENANT_SLUG !== "eatclean-staging") return undefined;
  if (
    mode !== "staging_local" ||
    env.TENANT_SLUG !== "eatclean-staging" ||
    env.SUPABASE_URL !== LOCAL_STAGING_URL ||
    env.SUPABASE_PUBLISHABLE_KEY !== LOCAL_STAGING_PUBLIC_KEY
  )
    throw new Error("SECURITY_VIOLATION: Incomplete or mixed staging environment.");
  return LOCAL_STAGING_CONFIG;
}
export function assertLocalStagingRequest(input: RequestInfo | URL): void {
  const url = new URL(input instanceof Request ? input.url : String(input));
  if (url.origin !== LOCAL_STAGING_URL || url.username || url.password)
    throw new Error("SECURITY_VIOLATION: Staging cannot fetch a non-local backend.");
}
