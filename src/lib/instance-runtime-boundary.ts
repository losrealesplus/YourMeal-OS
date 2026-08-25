/**
 * YOURMEAL OS — INSTANCE RUNTIME BOUNDARY & ANTI-LEAK GUARDS
 *
 * Canonical runtime contract separating:
 * 1. YOURMEAL OS DEMO / SHOWCASE (`yourmeal-os` -> `djangucecsphnejplvic`)
 * 2. REAL TENANT INSTANCE (`eatclean` -> `nhirlpkuvonggctdzzad`)
 *
 * STRICT INVARIANT:
 * - A customer instance (EatClean) MUST NEVER connect to the demo/shared database.
 * - The official demo (YourMeal OS) MUST NEVER connect to a customer database.
 * - Silent fallback to Core .env is strictly blocked (FAIL FAST).
 */

export type InstanceType = "core_demo" | "customer_tenant";

export interface InstanceRuntimeConfig {
  instanceType: InstanceType;
  tenantSlug: string;
  coreVersion: string;
  supabaseProjectRef: string;
  supabaseUrl: string;
  supabasePublishableKey?: string;
}

declare global {
  interface Window {
    __INSTANCE_CONFIG__?: InstanceRuntimeConfig;
  }
}

// Canonical binding registry per tenant slug
export const CANONICAL_INSTANCE_BINDINGS: Record<string, InstanceRuntimeConfig> = {
  "yourmeal-os": {
    instanceType: "core_demo",
    tenantSlug: "yourmeal-os",
    coreVersion: "0.1.0",
    supabaseProjectRef: "djangucecsphnejplvic",
    supabaseUrl: "https://djangucecsphnejplvic.supabase.co",
    supabasePublishableKey: "sb_publishable_PUfHKoTQ5aQO8IlG759-pg_adAFsa8A",
  },
  eatclean: {
    instanceType: "customer_tenant",
    tenantSlug: "eatclean",
    coreVersion: "0.1.0",
    supabaseProjectRef: "nhirlpkuvonggctdzzad",
    supabaseUrl: "https://nhirlpkuvonggctdzzad.supabase.co",
    supabasePublishableKey: "sb_publishable_qgT9AjzgqzMPgtLRjTZaiQ_yjsQ2ChH",
  },
};

/**
 * Validates instance runtime configuration and enforces anti-leak boundaries.
 * Throws a SecurityError immediately if cross-contamination is detected.
 */
export function validateInstanceRuntimeConfig(config: InstanceRuntimeConfig): void {
  if (!config) {
    throw new Error("SECURITY_VIOLATION: Instance runtime configuration is missing.");
  }

  // 1. Tenant: yourmeal-os (Core Demo)
  if (config.tenantSlug === "yourmeal-os") {
    if (config.instanceType !== "core_demo") {
      throw new Error("SECURITY_VIOLATION: yourmeal-os must be instanceType 'core_demo'.");
    }
    if (config.supabaseProjectRef !== "djangucecsphnejplvic") {
      throw new Error(
        `SECURITY_VIOLATION: Demo instance 'yourmeal-os' must bind to 'djangucecsphnejplvic', but received '${config.supabaseProjectRef}'.`,
      );
    }
    if (config.supabaseUrl.includes("nhirlpkuvonggctdzzad")) {
      throw new Error("SECURITY_VIOLATION: Demo instance cannot reference EatClean Supabase.");
    }
  }

  // 2. Tenant: eatclean (Customer Tenant)
  if (config.tenantSlug === "eatclean") {
    if (config.instanceType !== "customer_tenant") {
      throw new Error("SECURITY_VIOLATION: eatclean must be instanceType 'customer_tenant'.");
    }
    if (config.supabaseProjectRef !== "nhirlpkuvonggctdzzad") {
      throw new Error(
        `SECURITY_VIOLATION: Customer instance 'eatclean' must bind to 'nhirlpkuvonggctdzzad', but received '${config.supabaseProjectRef}'.`,
      );
    }
    if (config.supabaseUrl.includes("djangucecsphnejplvic")) {
      throw new Error(
        "SECURITY_VIOLATION: EatClean customer instance cannot reference Demo Supabase (djangucecsphnejplvic).",
      );
    }
  }
}

/**
 * Resolves the canonical instance configuration based on hostname or environment.
 */
export function resolveInstanceRuntimeConfig(hostname?: string): InstanceRuntimeConfig {
  const host = (hostname || "").toLowerCase().trim();

  // 1. Check for explicit window injection if in browser
  if (typeof window !== "undefined" && window.__INSTANCE_CONFIG__) {
    const injected = window.__INSTANCE_CONFIG__;
    validateInstanceRuntimeConfig(injected);
    return injected;
  }

  // 2. Hostname-based deterministic resolution
  if (host.includes("eatclean")) {
    const config = CANONICAL_INSTANCE_BINDINGS["eatclean"];
    validateInstanceRuntimeConfig(config);
    return config;
  }

  // 3. Default to official demo/platform core
  const defaultConfig = CANONICAL_INSTANCE_BINDINGS["yourmeal-os"];
  validateInstanceRuntimeConfig(defaultConfig);
  return defaultConfig;
}
