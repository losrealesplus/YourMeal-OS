import { describe, it, expect } from "vitest";
import {
  resolveInstanceRuntimeConfig,
  validateInstanceRuntimeConfig,
  type InstanceRuntimeConfig,
} from "./instance-runtime-boundary";
import { resolveHostTopology } from "./host-topology";

describe("Live Instance Boundary Adversarial Break Test", () => {
  it("1.1 www.yourmealos.com SSR resolves to public_marketing", () => {
    expect(resolveHostTopology("www.yourmealos.com").hostType).toBe("public_marketing");
  });

  it("1.2 clientes.yourmealos.com SSR resolves to client_portal", () => {
    expect(resolveHostTopology("clientes.yourmealos.com").hostType).toBe("client_portal");
  });

  it("1.3 eatclean.yourmealos.com SSR resolves to tenant eatclean", () => {
    expect(resolveHostTopology("eatclean.yourmealos.com").tenantSlug).toBe("eatclean");
  });

  it("1.4 eatclean-staging.yourmealos.com SSR resolves to tenant eatclean", () => {
    expect(resolveHostTopology("eatclean-staging.yourmealos.com").tenantSlug).toBe("eatclean");
  });

  it("2.1 www.yourmealos.com resolves to djangucecsphnejplvic", () => {
    const config = resolveInstanceRuntimeConfig("www.yourmealos.com");
    expect(config.supabaseProjectRef).toBe("djangucecsphnejplvic");
  });

  it("2.2 clientes.yourmealos.com resolves to djangucecsphnejplvic", () => {
    const config = resolveInstanceRuntimeConfig("clientes.yourmealos.com");
    expect(config.supabaseProjectRef).toBe("djangucecsphnejplvic");
  });

  it("2.3 eatclean.yourmealos.com resolves to nhirlpkuvonggctdzzad", () => {
    const config = resolveInstanceRuntimeConfig("eatclean.yourmealos.com");
    expect(config.supabaseProjectRef).toBe("nhirlpkuvonggctdzzad");
  });

  it("3.1 Attack: Demo -> EatClean DB must throw SECURITY_VIOLATION", () => {
    const maliciousConfig: InstanceRuntimeConfig = {
      instanceType: "core_demo",
      tenantSlug: "yourmeal-os",
      coreVersion: "0.1.0",
      supabaseProjectRef: "nhirlpkuvonggctdzzad",
      supabaseUrl: "https://nhirlpkuvonggctdzzad.supabase.co",
    };
    expect(() => validateInstanceRuntimeConfig(maliciousConfig)).toThrow("SECURITY_VIOLATION");
  });

  it("3.2 Attack: EatClean -> Demo DB must throw SECURITY_VIOLATION", () => {
    const maliciousConfig: InstanceRuntimeConfig = {
      instanceType: "customer_tenant",
      tenantSlug: "eatclean",
      coreVersion: "0.1.0",
      supabaseProjectRef: "djangucecsphnejplvic",
      supabaseUrl: "https://djangucecsphnejplvic.supabase.co",
    };
    expect(() => validateInstanceRuntimeConfig(maliciousConfig)).toThrow("SECURITY_VIOLATION");
  });

  it("3.3 Attack: EatClean -> Unknown DB must throw SECURITY_VIOLATION", () => {
    const foreignConfig: InstanceRuntimeConfig = {
      instanceType: "customer_tenant",
      tenantSlug: "eatclean",
      coreVersion: "0.1.0",
      supabaseProjectRef: "foreign_db_ref_12345",
      supabaseUrl: "https://foreign.supabase.co",
    };
    expect(() => validateInstanceRuntimeConfig(foreignConfig)).toThrow("SECURITY_VIOLATION");
  });

  it("4.1 Live HTTP https://eatclean.yourmealos.com/ returns 200", async () => {
    const res = await fetch("https://eatclean.yourmealos.com/");
    expect(res.status).toBe(200);
  });

  it("4.2 Live HTTP https://clientes.yourmealos.com/ returns 200", async () => {
    const res = await fetch("https://clientes.yourmealos.com/");
    expect(res.status).toBe(200);
  });

  it("4.3 Live HTTP https://www.yourmealos.com/ returns 200", async () => {
    const res = await fetch("https://www.yourmealos.com/");
    expect(res.status).toBe(200);
  });

  it("5.1 Live EatClean JS on Edge contains runtime boundary code", async () => {
    const res = await fetch("https://eatclean.yourmealos.com/assets/client-BeqGHvru.js");
    const jsText = await res.text();
    expect(jsText).toContain("SECURITY_VIOLATION");
  });
});
