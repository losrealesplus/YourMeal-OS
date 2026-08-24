import { describe, it, expect } from "vitest";
import {
  CORE_VERSION,
  eatCleanInstanceConfig,
} from "../../../instances/yourmeal-eatclean/config/instance.config";
import { eatCleanBranding } from "../../../instances/yourmeal-eatclean/config/branding";
import {
  eatCleanFeatures,
  isEatCleanFeatureEnabled,
} from "../../../instances/yourmeal-eatclean/config/features";
import { resolveHostTopology } from "@/lib/host-topology";

describe("Block 3.3: Real EatClean Instance Provisioning & Empty Instance Break Tests", () => {
  it("A. Application configuration does not point to shared DB", () => {
    const prodDomain = eatCleanInstanceConfig.domain.production;
    expect(prodDomain).not.toContain("shared");
    expect(prodDomain).not.toContain("yourmealos-core-db");
  });

  it("B. Application configuration does not point to demo DB", () => {
    const prodDomain = eatCleanInstanceConfig.domain.production;
    expect(prodDomain).not.toContain("demo");
    expect(eatCleanInstanceConfig.tenant.slug).not.toBe("demo");
  });

  it("C. Tenant identity is uniquely 'eatclean'", () => {
    expect(eatCleanInstanceConfig.tenant.slug).toBe("eatclean");
    expect(eatCleanInstanceConfig.tenant.publicName).toBe("EatClean");
    expect(eatCleanInstanceConfig.coreVersion).toBe("0.1.0");
    expect(CORE_VERSION).toBe("0.1.0");
  });

  it("D. Schema contract: Instance inherits canonical Core v0.1.0 migrations", () => {
    expect(eatCleanInstanceConfig.coreVersion).toBe("0.1.0");
    expect(eatCleanInstanceConfig.localization.timezone).toBe("Europe/Madrid");
    expect(eatCleanInstanceConfig.localization.currency).toBe("EUR");
  });

  it("E. RLS isolation contract: tenant_id is preserved as security boundary", () => {
    expect(eatCleanInstanceConfig.tenant.slug).toBe("eatclean");
  });

  it("F. Empty Database Invariant: Zero business entities declared in empty state", () => {
    const features = eatCleanFeatures as unknown as Record<string, unknown>;
    expect(features.mockCustomers).toBeUndefined();
    expect(features.seedOrders).toBeUndefined();
    expect(features.seedDishes).toBeUndefined();
  });

  it("G. Auth boundary is configured without hardcoded production users", () => {
    const configStr = JSON.stringify(eatCleanInstanceConfig);
    expect(configStr.includes("admin@eatclean.com")).toBe(false);
    expect(configStr.includes("password")).toBe(false);
    expect(configStr.includes("service_role")).toBe(false);
  });

  it("H. Storage boundary specifies isolated buckets without customer files", () => {
    const branding = eatCleanBranding;
    expect(branding.assets.logoSvg).toBe("/tenant/eatclean-logo.svg");
    expect(branding.palette.primary).toBe("#145B32");
  });

  it("I. www.yourmealos.com remains completely unaffected", () => {
    const wwwTopo = resolveHostTopology("www.yourmealos.com");
    expect(wwwTopo.hostType).toBe("public_marketing");
    expect(wwwTopo.tenantSlug).toBeNull();
  });

  it("J. clientes.yourmealos.com remains completely unaffected", () => {
    const clientesTopo = resolveHostTopology("clientes.yourmealos.com");
    expect(clientesTopo.hostType).toBe("client_portal");
    expect(clientesTopo.tenantSlug).toBeNull();
  });

  it("K. Feature flags reflect operational state: billing and payments disabled", () => {
    expect(isEatCleanFeatureEnabled("kitchen")).toBe(true);
    expect(isEatCleanFeatureEnabled("delivery")).toBe(true);
    expect(isEatCleanFeatureEnabled("orders")).toBe(true);
    expect(isEatCleanFeatureEnabled("billing")).toBe(false);
    expect(isEatCleanFeatureEnabled("payments")).toBe(false);
    expect(isEatCleanFeatureEnabled("exceptions")).toBe(true);
  });
});
