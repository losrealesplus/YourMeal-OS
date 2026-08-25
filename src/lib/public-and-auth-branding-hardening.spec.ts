import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { resolveInstanceLogoUrl } from "@/components/tenant/tenant-logo";
import { getPublicClientsDirectory } from "@/lib/public-clients-registry";
import {
  resolveInstanceRuntimeConfig,
  validateInstanceRuntimeConfig,
  type InstanceRuntimeConfig,
} from "@/lib/instance-runtime-boundary";

describe("PR #447: Official Brand Assets and Instance-Aware Branding Hardening", () => {
  describe("1. Public Logo Resolution (Runtime Mapping)", () => {
    it("A. YourMeal OS host -> YourMeal OS logo", () => {
      const logo = resolveInstanceLogoUrl("www.yourmealos.com");
      expect(logo).toBe("/assets/yourmeal-os-logo.png");
    });

    it("B. Clientes host -> YourMeal OS logo", () => {
      const logo = resolveInstanceLogoUrl("clientes.yourmealos.com");
      expect(logo).toBe("/assets/yourmeal-os-logo.png");
    });

    it("C. EatClean host -> EatClean logo", () => {
      const logo = resolveInstanceLogoUrl("eatclean.yourmealos.com");
      expect(logo).toBe("/assets/eatclean-logo.png");
    });

    it("D. EatClean staging -> EatClean logo", () => {
      const logo = resolveInstanceLogoUrl("eatclean-staging.yourmealos.com");
      expect(logo).toBe("/assets/eatclean-logo.png");
    });

    it("E. Unknown host -> YourMeal OS logo (NEVER EatClean)", () => {
      const logo = resolveInstanceLogoUrl("random-unrecognized-domain.org");
      expect(logo).toBe("/assets/yourmeal-os-logo.png");
    });

    it("F. Undefined hostname -> YourMeal OS logo", () => {
      const logo = resolveInstanceLogoUrl(undefined);
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

  describe("3. Physical Official Assets Validation", () => {
    it("ensures public/assets/yourmeal-os-logo.png is valid official RGBA PNG", () => {
      const p = path.resolve(process.cwd(), "public/assets/yourmeal-os-logo.png");
      expect(fs.existsSync(p)).toBe(true);
      const buf = fs.readFileSync(p);
      expect(buf.toString("ascii", 1, 4)).toBe("PNG");
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      expect(width).toBe(932);
      expect(height).toBe(1024);
    });

    it("ensures public/assets/eatclean-logo.png is valid official RGBA PNG", () => {
      const p = path.resolve(process.cwd(), "public/assets/eatclean-logo.png");
      expect(fs.existsSync(p)).toBe(true);
      const buf = fs.readFileSync(p);
      expect(buf.toString("ascii", 1, 4)).toBe("PNG");
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      expect(width).toBe(1024);
      expect(height).toBe(1024);
    });

    it("ensures src/tenant/resources/logo.png contains official YourMeal OS fallback", () => {
      const p = path.resolve(process.cwd(), "src/tenant/resources/logo.png");
      expect(fs.existsSync(p)).toBe(true);
      const buf = fs.readFileSync(p);
      expect(buf.toString("ascii", 1, 4)).toBe("PNG");
      const width = buf.readUInt32BE(16);
      const height = buf.readUInt32BE(20);
      expect(width).toBe(932);
      expect(height).toBe(1024);
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
