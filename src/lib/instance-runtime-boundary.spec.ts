import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import {
  validateInstanceRuntimeConfig,
  resolveInstanceRuntimeConfig,
  resolveServerInstanceRuntimeConfig,
  CANONICAL_INSTANCE_BINDINGS,
  type InstanceRuntimeConfig,
} from "./instance-runtime-boundary";

describe("Block C0: Instance Runtime Boundary & Anti-Leak Guards", () => {
  it("1. Demo binding: yourmeal-os resolves to djangucecsphnejplvic successfully", () => {
    const demoConfig = CANONICAL_INSTANCE_BINDINGS["yourmeal-os"];
    expect(demoConfig.instanceType).toBe("core_demo");
    expect(demoConfig.supabaseProjectRef).toBe("djangucecsphnejplvic");
    expect(demoConfig.supabasePublishableKey).toBe("sb_publishable_PUfHKoTQ5aQO8IlG759-pg_adAFsa8A");
    expect(() => validateInstanceRuntimeConfig(demoConfig)).not.toThrow();
  });

  it("2. EatClean binding: eatclean resolves to nhirlpkuvonggctdzzad successfully", () => {
    const eatcleanConfig = CANONICAL_INSTANCE_BINDINGS["eatclean"];
    expect(eatcleanConfig.instanceType).toBe("customer_tenant");
    expect(eatcleanConfig.supabaseProjectRef).toBe("nhirlpkuvonggctdzzad");
    expect(eatcleanConfig.supabasePublishableKey).toBe("sb_publishable_qgT9AjzgqzMPgtLRjTZaiQ_yjsQ2ChH");
    expect(() => validateInstanceRuntimeConfig(eatcleanConfig)).not.toThrow();
  });

  it("3. Anti-leak: Cross-binding attack (EatClean pointing to Demo DB) throws Security Violation", () => {
    const maliciousEatCleanConfig: InstanceRuntimeConfig = {
      instanceType: "customer_tenant",
      tenantSlug: "eatclean",
      coreVersion: "0.1.0",
      supabaseProjectRef: "djangucecsphnejplvic", // Injected Demo DB
      supabaseUrl: "https://djangucecsphnejplvic.supabase.co",
    };

    expect(() => validateInstanceRuntimeConfig(maliciousEatCleanConfig)).toThrowError(
      /SECURITY_VIOLATION/,
    );
  });

  it("4. Anti-leak: Cross-binding attack (Demo pointing to EatClean DB) throws Security Violation", () => {
    const maliciousDemoConfig: InstanceRuntimeConfig = {
      instanceType: "core_demo",
      tenantSlug: "yourmeal-os",
      coreVersion: "0.1.0",
      supabaseProjectRef: "nhirlpkuvonggctdzzad", // Injected EatClean DB
      supabaseUrl: "https://nhirlpkuvonggctdzzad.supabase.co",
    };

    expect(() => validateInstanceRuntimeConfig(maliciousDemoConfig)).toThrowError(
      /SECURITY_VIOLATION/,
    );
  });

  it("5. Hostname resolution: eatclean.yourmealos.com resolves exclusively to nhirlpkuvonggctdzzad", () => {
    const resolved = resolveInstanceRuntimeConfig("eatclean.yourmealos.com");
    expect(resolved.tenantSlug).toBe("eatclean");
    expect(resolved.supabaseProjectRef).toBe("nhirlpkuvonggctdzzad");
    expect(resolved.supabaseUrl).toContain("nhirlpkuvonggctdzzad");
  });

  it("6. Hostname resolution: clientes.yourmealos.com resolves to official demo (djangucecsphnejplvic)", () => {
    const resolved = resolveInstanceRuntimeConfig("clientes.yourmealos.com");
    expect(resolved.tenantSlug).toBe("yourmeal-os");
    expect(resolved.supabaseProjectRef).toBe("djangucecsphnejplvic");
  });

  it("7. Legacy tenant slug 'eatclean-tenerife' is not present in canonical bindings dictionary", () => {
    expect(CANONICAL_INSTANCE_BINDINGS["eatclean-tenerife"]).toBeUndefined();
    expect(CANONICAL_INSTANCE_BINDINGS["eatclean"]).toBeDefined();
    expect(CANONICAL_INSTANCE_BINDINGS["eatclean"].tenantSlug).toBe("eatclean");
  });

  it("8. Server instance resolution: EatClean server binds to customer instance and rejects demo database", () => {
    const resolved = resolveServerInstanceRuntimeConfig({ TENANT_SLUG: "eatclean" });
    expect(resolved.tenantSlug).toBe("eatclean");
    expect(resolved.supabaseProjectRef).toBe("nhirlpkuvonggctdzzad");

    expect(() =>
      resolveServerInstanceRuntimeConfig({
        TENANT_SLUG: "eatclean",
        SUPABASE_URL: "https://djangucecsphnejplvic.supabase.co",
      }),
    ).toThrowError(/SECURITY_VIOLATION.*Demo Supabase/);
  });

  it("9. Server instance resolution: Demo server binds to core_demo and rejects EatClean database", () => {
    const resolved = resolveServerInstanceRuntimeConfig({ TENANT_SLUG: "yourmeal-os" });
    expect(resolved.tenantSlug).toBe("yourmeal-os");
    expect(resolved.supabaseProjectRef).toBe("djangucecsphnejplvic");

    expect(() =>
      resolveServerInstanceRuntimeConfig({
        TENANT_SLUG: "yourmeal-os",
        SUPABASE_URL: "https://nhirlpkuvonggctdzzad.supabase.co",
      }),
    ).toThrowError(/SECURITY_VIOLATION.*EatClean Supabase/);
  });

  it("10. Server instance resolution: Unrecognized server tenant slug throws Security Violation", () => {
    expect(() =>
      resolveServerInstanceRuntimeConfig({ TENANT_SLUG: "unknown-rogue-tenant" }),
    ).toThrowError(/SECURITY_VIOLATION.*Unrecognized server tenant slug/);
  });

  it("11. EatClean Production Worker Configuration: wrangler.prod.json binds exclusively to EatClean canonical project", () => {
    const wranglerProdPath = path.resolve(__dirname, "../../instances/yourmeal-eatclean/wrangler.prod.json");
    const raw = fs.readFileSync(wranglerProdPath, "utf-8");
    const parsed = JSON.parse(raw);

    const eatcleanConfig = CANONICAL_INSTANCE_BINDINGS["eatclean"];
    const demoConfig = CANONICAL_INSTANCE_BINDINGS["yourmeal-os"];

    // 1. Worker name and routes
    expect(parsed.name).toBe("yourmeal-instance-eatclean");
    expect(parsed.routes).toEqual([
      { pattern: "eatclean.yourmealos.com", custom_domain: true },
    ]);

    // 2. Canonical EatClean vars
    expect(parsed.vars.TENANT_SLUG).toBe("eatclean");
    expect(parsed.vars.CORE_VERSION).toBe("0.1.0");
    expect(parsed.vars.SUPABASE_URL).toBe(eatcleanConfig.supabaseUrl);
    expect(parsed.vars.SUPABASE_PUBLISHABLE_KEY).toBe(eatcleanConfig.supabasePublishableKey);

    // 3. Strict isolation from Core Demo
    expect(parsed.vars.SUPABASE_URL).not.toContain(demoConfig.supabaseProjectRef);
    expect(parsed.vars.SUPABASE_PUBLISHABLE_KEY).not.toBe(demoConfig.supabasePublishableKey);

    // 4. Secret preservation: SUPABASE_SERVICE_ROLE_KEY must NEVER be in wrangler.prod.json
    expect(parsed.vars.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
    expect(raw).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(raw).not.toContain("sb_secret_");
  });

  it("12. Staging Worker Isolation: wrangler.staging.json strictly forbids production Supabase reference", () => {
    const wranglerStagingPath = path.resolve(__dirname, "../../instances/yourmeal-eatclean/wrangler.staging.json");
    const raw = fs.readFileSync(wranglerStagingPath, "utf-8");
    const parsed = JSON.parse(raw);

    const eatcleanConfig = CANONICAL_INSTANCE_BINDINGS["eatclean"];

    // Staging configuration must NEVER point to the production database or project ref
    expect(raw).not.toContain(eatcleanConfig.supabaseProjectRef);
    expect(parsed.vars.SUPABASE_URL).not.toBe(eatcleanConfig.supabaseUrl);
    expect(parsed.vars.SUPABASE_URL).not.toContain(eatcleanConfig.supabaseProjectRef);
    expect(parsed.vars.SUPABASE_PUBLISHABLE_KEY).not.toBe(eatcleanConfig.supabasePublishableKey);
  });
});


