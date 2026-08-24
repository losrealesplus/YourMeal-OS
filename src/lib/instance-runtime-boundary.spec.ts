import { describe, it, expect } from "vitest";
import {
  validateInstanceRuntimeConfig,
  resolveInstanceRuntimeConfig,
  CANONICAL_INSTANCE_BINDINGS,
  type InstanceRuntimeConfig,
} from "./instance-runtime-boundary";

describe("Block C0: Instance Runtime Boundary & Anti-Leak Guards", () => {
  it("1. Demo binding: yourmeal-os resolves to djangucecsphnejplvic successfully", () => {
    const demoConfig = CANONICAL_INSTANCE_BINDINGS["yourmeal-os"];
    expect(demoConfig.instanceType).toBe("core_demo");
    expect(demoConfig.supabaseProjectRef).toBe("djangucecsphnejplvic");
    expect(() => validateInstanceRuntimeConfig(demoConfig)).not.toThrow();
  });

  it("2. EatClean binding: eatclean resolves to nhirlpkuvonggctdzzad successfully", () => {
    const eatcleanConfig = CANONICAL_INSTANCE_BINDINGS["eatclean"];
    expect(eatcleanConfig.instanceType).toBe("customer_tenant");
    expect(eatcleanConfig.supabaseProjectRef).toBe("nhirlpkuvonggctdzzad");
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
});
