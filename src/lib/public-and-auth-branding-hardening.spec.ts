import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { resolveInstanceLogoUrl } from "@/components/tenant/tenant-logo";
import { getPublicClientsDirectory } from "@/lib/public-clients-registry";
import {
  resolveInstanceRuntimeConfig,
  validateInstanceRuntimeConfig,
  CANONICAL_INSTANCE_BINDINGS,
  type InstanceRuntimeConfig,
} from "@/lib/instance-runtime-boundary";

describe("Block B3.6.11A: Public Identity and Auth Branding Hardening", () => {
  describe("1. Public Logo Resolution", () => {
    it("resolves EatClean logo for eatclean hostname", () => {
      const logo = resolveInstanceLogoUrl("eatclean.yourmealos.com");
      expect(logo).toBe("/assets/eatclean-logo.png");
    });

    it("resolves EatClean logo for eatclean staging hostname", () => {
      const logo = resolveInstanceLogoUrl("eatclean-staging.yourmealos.com");
      expect(logo).toBe("/assets/eatclean-logo.png");
    });

    it("resolves YourMeal OS logo for www hostname", () => {
      const logo = resolveInstanceLogoUrl("www.yourmealos.com");
      expect(logo).toBe("/assets/yourmeal-os-logo.png");
    });

    it("resolves YourMeal OS logo for clientes portal hostname", () => {
      const logo = resolveInstanceLogoUrl("clientes.yourmealos.com");
      expect(logo).toBe("/assets/yourmeal-os-logo.png");
    });

    it("fails safe to YourMeal OS logo for unknown/undefined hostname (NEVER EatClean)", () => {
      const logo = resolveInstanceLogoUrl("unknown-domain.com");
      expect(logo).toBe("/assets/yourmeal-os-logo.png");
    });
  });

  describe("2. Public Client Directory Registry", () => {
    const clients = getPublicClientsDirectory();

    it("includes YourMeal OS as Demo oficial with correct logo URL", () => {
      const demo = clients.find((c) => c.slug === "yourmeal-os");
      expect(demo).toBeDefined();
      expect(demo?.type).toBe("platform_demo");
      expect(demo?.label).toBe("Demo oficial");
      expect(demo?.logoUrl).toBe("/assets/yourmeal-os-logo.png");
    });

    it("includes EatClean as Cliente de YourMeal OS with correct logo URL", () => {
      const eatclean = clients.find((c) => c.slug === "eatclean");
      expect(eatclean).toBeDefined();
      expect(eatclean?.type).toBe("customer");
      expect(eatclean?.label).toBe("Cliente de YourMeal OS");
      expect(eatclean?.logoUrl).toBe("/assets/eatclean-logo.png");
    });
  });

  describe("3. Physical Assets in public/assets/", () => {
    it("ensures public/assets/yourmeal-os-logo.png exists and is non-empty", () => {
      const p = path.resolve(process.cwd(), "public/assets/yourmeal-os-logo.png");
      expect(fs.existsSync(p)).toBe(true);
      const stat = fs.statSync(p);
      expect(stat.size).toBeGreaterThan(1000);
    });

    it("ensures public/assets/eatclean-logo.png exists and is non-empty", () => {
      const p = path.resolve(process.cwd(), "public/assets/eatclean-logo.png");
      expect(fs.existsSync(p)).toBe(true);
      const stat = fs.statSync(p);
      expect(stat.size).toBeGreaterThan(1000);
    });
  });

  describe("4. Red Team & Hostname Boundary Enforcement", () => {
    it("Attack A: www hostname cannot bind to EatClean Supabase DB", () => {
      const maliciousConfig: InstanceRuntimeConfig = {
        instanceType: "core_demo",
        tenantSlug: "yourmeal-os",
        coreVersion: "0.1.0",
        supabaseProjectRef: "nhirlpkuvonggctdzzad",
        supabaseUrl: "https://nhirlpkuvonggctdzzad.supabase.co",
      };
      expect(() => validateInstanceRuntimeConfig(maliciousConfig)).toThrowError(
        /SECURITY_VIOLATION/,
      );
    });

    it("Attack B: eatclean hostname cannot bind to Demo Supabase DB", () => {
      const maliciousConfig: InstanceRuntimeConfig = {
        instanceType: "customer_tenant",
        tenantSlug: "eatclean",
        coreVersion: "0.1.0",
        supabaseProjectRef: "djangucecsphnejplvic",
        supabaseUrl: "https://djangucecsphnejplvic.supabase.co",
      };
      expect(() => validateInstanceRuntimeConfig(maliciousConfig)).toThrowError(
        /SECURITY_VIOLATION/,
      );
    });

    it("Attack C: unconfigured hostname must default to yourmeal-os (NEVER EatClean)", () => {
      const resolved = resolveInstanceRuntimeConfig("random-domain-spoof.com");
      expect(resolved.tenantSlug).toBe("yourmeal-os");
      expect(resolved.instanceType).toBe("core_demo");
      expect(resolved.supabaseProjectRef).toBe("djangucecsphnejplvic");
    });
  });
});
