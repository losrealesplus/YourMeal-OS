import { describe, it, expect } from "vitest";
import {
  EATCLEAN_PARTIAL_LAUNCH_CONFIG,
  EATCLEAN_TENANT_ID,
  EATCLEAN_TENANT_SLUG,
  isEatCleanContext,
  isEatCleanOrderCreationFrozen,
  isEatCleanCrmMutationFrozen,
  isEatCleanStaffOrderCaptureFrozen,
  isEatCleanDishMutationFrozen,
  isEatCleanMenuMutationFrozen,
  isVerifiedLocalSyntheticLab,
} from "./eatclean-partial-launch";
import { OrderIntakeService } from "@/modules/order-intake";
import { StaffOrderCaptureService } from "@/modules/orders";
import { DomainError } from "@/domain/errors";
import type { ServiceContext } from "@/services/types";
import {
  LOCAL_STAGING_PUBLIC_KEY,
  LOCAL_STAGING_URL,
} from "@/lib/local-staging-runtime";

describe("EatClean Partial Launch Feature Barriers (Zero Regressions)", () => {
  it("enforces partial launch configuration flags", () => {
    expect(EATCLEAN_PARTIAL_LAUNCH_CONFIG.isPartialLaunch).toBe(true);

    // Retained functional capabilities (Zero Regressions)
    expect(EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.catalogConsultation).toBe(true);
    expect(EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.weeklyMenuConsultation).toBe(true);
    expect(EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.existingOrdersConsultation).toBe(true);
    expect(EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.adminDashboardRead).toBe(true);
    expect(EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.dishMutations).toBe(true);
    expect(EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.menuMutations).toBe(true);
    expect(EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.customerDirectoryMutations).toBe(true);
    expect(EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.orderWorkflowMutations).toBe(true);
    expect(EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.kitchenStateMutations).toBe(true);

    // Specifically activated features following Gate 6 deployment
    expect(EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.orderCreation).toBe(true);
    expect(EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.crmIdentityMutations).toBe(false);
    expect(EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.staffOrderCapture).toBe(true);
  });

  describe("Tenant Isolation", () => {
    it("correctly identifies EatClean tenant context by ID, slug, or object", () => {
      expect(isEatCleanContext(EATCLEAN_TENANT_ID)).toBe(true);
      expect(isEatCleanContext(EATCLEAN_TENANT_SLUG)).toBe(true);
      expect(isEatCleanContext({ tenantId: EATCLEAN_TENANT_ID })).toBe(true);
      expect(isEatCleanContext({ tenantSlug: EATCLEAN_TENANT_SLUG })).toBe(true);
      expect(isEatCleanContext({ hostname: "app.eatclean.es" })).toBe(true);
    });

    it("does not match non-EatClean tenants", () => {
      expect(isEatCleanContext("other-tenant-uuid")).toBe(false);
      expect(isEatCleanContext("acme-catering")).toBe(false);
      expect(isEatCleanContext({ tenantId: "other-tenant-uuid" })).toBe(false);
      expect(isEatCleanContext({ tenantSlug: "acme" })).toBe(false);
      expect(isEatCleanContext({ hostname: "app.yourmeal.io" })).toBe(false);
      expect(isEatCleanContext(null)).toBe(false);
      expect(isEatCleanContext(undefined)).toBe(false);
    });

    it("unfreezes orderCreation for EatClean following Gate 6 deployment", () => {
      expect(isEatCleanOrderCreationFrozen(EATCLEAN_TENANT_ID)).toBe(false);
      expect(isEatCleanOrderCreationFrozen({ tenantId: EATCLEAN_TENANT_ID })).toBe(false);

      // Non-EatClean tenant is NEVER frozen
      expect(isEatCleanOrderCreationFrozen("other-tenant-uuid")).toBe(false);
      expect(isEatCleanOrderCreationFrozen({ tenantId: "other-tenant-uuid" })).toBe(false);
    });

    it("freezes CRM P34 mutations for EatClean until separate CRM lifecycle milestone", () => {
      expect(isEatCleanCrmMutationFrozen(EATCLEAN_TENANT_ID)).toBe(true);
      expect(isEatCleanCrmMutationFrozen("other-tenant-uuid")).toBe(false);
    });

    it("unfreezes staffOrderCapture for EatClean following Gate 6 deployment", () => {
      expect(isEatCleanStaffOrderCaptureFrozen(EATCLEAN_TENANT_ID)).toBe(false);
      expect(isEatCleanStaffOrderCaptureFrozen({ tenantId: EATCLEAN_TENANT_ID })).toBe(false);
      expect(isEatCleanStaffOrderCaptureFrozen("other-tenant-uuid")).toBe(false);
      expect(isEatCleanStaffOrderCaptureFrozen({ tenantId: "other-tenant-uuid" })).toBe(false);
    });

    it("keeps operational mutations enabled for all tenants including EatClean", () => {
      expect(isEatCleanDishMutationFrozen(EATCLEAN_TENANT_ID)).toBe(false);
      expect(isEatCleanDishMutationFrozen("other-tenant-uuid")).toBe(false);
      expect(isEatCleanMenuMutationFrozen(EATCLEAN_TENANT_ID)).toBe(false);
      expect(isEatCleanMenuMutationFrozen("other-tenant-uuid")).toBe(false);
    });
  });

  describe("Application Service Barriers", () => {
    it("does not block OrderIntakeService.intakeDraft for EatClean context with launch barrier", async () => {
      const eatcleanCtx = {
        tenantId: EATCLEAN_TENANT_ID,
        tenantSlug: EATCLEAN_TENANT_SLUG,
        roles: ["customer"],
        capabilities: new Set(),
        userId: "u-1",
        supabase: {} as unknown,
      } as unknown as ServiceContext;

      expect(isEatCleanOrderCreationFrozen(eatcleanCtx)).toBe(false);
    });

    it("does not block StaffOrderCaptureService.captureOrder at launch barrier", async () => {
      const eatcleanCtx = {
        tenantId: EATCLEAN_TENANT_ID,
        tenantSlug: EATCLEAN_TENANT_SLUG,
        roles: ["company_admin"],
        capabilities: new Set(["orders.write"]),
        userId: "u-staff",
        supabase: {} as unknown,
      } as unknown as ServiceContext;

      expect(isEatCleanStaffOrderCaptureFrozen(eatcleanCtx)).toBe(false);
    });

    it("does not block OrderIntakeService.intakeDraft for non-EatClean context at launch barrier", async () => {
      const otherCtx = {
        tenantId: "some-other-tenant-uuid",
        tenantSlug: "acme-tenant",
        roles: ["customer"],
        capabilities: new Set(),
        userId: "u-2",
        supabase: {} as unknown,
      } as unknown as ServiceContext;

      // Will fail on missing capability or invalid inputs, NOT on the EatClean freeze barrier
      try {
        await OrderIntakeService.intakeDraft(otherCtx, {
          channel: "app",
          weekStart: "2026-10-12",
          items: [{ dishId: "d-1", dayDate: "2026-10-12", qty: 1 }],
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        expect(message).not.toBe(EATCLEAN_PARTIAL_LAUNCH_CONFIG.frozenMessage);
      }
    });
  });

  describe("Staff Order Capture Barrier & Synthetic Lab Hardening", () => {
    const validLocalEnv = {
      YOURMEAL_RUNTIME_ENV: "staging_local",
      TENANT_SLUG: "eatclean-staging",
      SUPABASE_URL: LOCAL_STAGING_URL,
      SUPABASE_PUBLISHABLE_KEY: LOCAL_STAGING_PUBLIC_KEY,
    };

    describe("1. Positive: EatClean Production Post Gate 6", () => {
      it("unfreezes staffOrderCapture in production context post Gate 6", () => {
        expect(isEatCleanStaffOrderCaptureFrozen(EATCLEAN_TENANT_ID)).toBe(false);
        expect(isEatCleanStaffOrderCaptureFrozen({ tenantId: EATCLEAN_TENANT_ID })).toBe(false);
        expect(
          isEatCleanStaffOrderCaptureFrozen({
            tenantSlug: "eatclean",
            hostname: "eatclean.yourmealos.com",
          }),
        ).toBe(false);
        expect(
          isEatCleanStaffOrderCaptureFrozen({
            tenantSlug: "eatclean",
            hostname: "app.eatclean.es",
          }),
        ).toBe(false);
      });

      it("rejects local bypass attempt targeting production hostname", () => {
        // Even if valid local synthetic env is injected, non-loopback host fails closed
        expect(
          isVerifiedLocalSyntheticLab(
            { hostname: "eatclean.yourmealos.com", tenantSlug: "eatclean" },
            validLocalEnv,
          ),
        ).toBe(false);
      });
    });

    describe("2. Negative: Demo Instance", () => {
      it("does not qualify as EatClean or local synthetic lab", () => {
        const demoContext = { tenantSlug: "yourmeal-os", hostname: "yourmealos.com" };
        expect(isEatCleanContext(demoContext)).toBe(false);
        expect(isVerifiedLocalSyntheticLab(demoContext)).toBe(false);
        expect(isEatCleanStaffOrderCaptureFrozen(demoContext)).toBe(false);

        const demoEnv = {
          TENANT_SLUG: "yourmeal-os",
          SUPABASE_URL: "https://djangucecsphnejplvic.supabase.co",
        };
        expect(isVerifiedLocalSyntheticLab(demoContext, demoEnv)).toBe(false);
      });
    });

    describe("3. Negative: Unconfigured Cloud Staging", () => {
      it("identifies cloud staging context but rejects local synthetic lab", () => {
        const cloudStagingContext = {
          tenantSlug: "eatclean-staging",
          hostname: "eatclean-staging.yourmealos.com",
        };
        expect(isEatCleanContext(cloudStagingContext)).toBe(true);
        expect(isVerifiedLocalSyntheticLab(cloudStagingContext)).toBe(false);
      });

      it("rejects cloud staging environment variables without synthetic local binding", () => {
        const cloudStagingEnv = {
          TENANT_SLUG: "eatclean-staging-unconfigured",
          SUPABASE_URL: "https://eatclean-staging-unconfigured.supabase.co",
          SUPABASE_PUBLISHABLE_KEY: "sb_publishable_STAGING_UNCONFIGURED_REPLACE_ME",
        };
        expect(
          isVerifiedLocalSyntheticLab(
            { hostname: "eatclean-staging.yourmealos.com" },
            cloudStagingEnv,
          ),
        ).toBe(false);
      });
    });

    describe("4. Negative: Inconsistent Environment Variables", () => {
      it("rejects staging_local with production Supabase URL leak", () => {
        const leakedEnv = {
          ...validLocalEnv,
          SUPABASE_URL: "https://nhirlpkuvonggctdzzad.supabase.co",
        };
        expect(isVerifiedLocalSyntheticLab({ hostname: "127.0.0.1" }, leakedEnv)).toBe(false);
      });

      it("rejects staging_local with demo Supabase URL leak", () => {
        const leakedEnv = {
          ...validLocalEnv,
          SUPABASE_URL: "https://djangucecsphnejplvic.supabase.co",
        };
        expect(isVerifiedLocalSyntheticLab({ hostname: "127.0.0.1" }, leakedEnv)).toBe(false);
      });

      it("rejects staging_local with invalid/tampered publishable key", () => {
        const tamperedEnv = {
          ...validLocalEnv,
          SUPABASE_PUBLISHABLE_KEY: "sb_publishable_unauthorized_key",
        };
        expect(isVerifiedLocalSyntheticLab({ hostname: "127.0.0.1" }, tamperedEnv)).toBe(false);
      });

      it("rejects staging_local with wrong tenant slug", () => {
        const wrongSlugEnv = {
          ...validLocalEnv,
          TENANT_SLUG: "eatclean", // Must be eatclean-staging
        };
        expect(isVerifiedLocalSyntheticLab({ hostname: "127.0.0.1" }, wrongSlugEnv)).toBe(false);
      });

      it("rejects missing YOURMEAL_RUNTIME_ENV even if synthetic URL is supplied", () => {
        const missingEnv = {
          TENANT_SLUG: "eatclean-staging",
          SUPABASE_URL: LOCAL_STAGING_URL,
          SUPABASE_PUBLISHABLE_KEY: LOCAL_STAGING_PUBLIC_KEY,
        };
        expect(isVerifiedLocalSyntheticLab({ hostname: "127.0.0.1" }, missingEnv)).toBe(false);
      });

      it("rejects server bypass attempt using VITE_YOURMEAL_RUNTIME_ENV without authoritative YOURMEAL_RUNTIME_ENV", () => {
        const viteOnlyEnv = {
          VITE_YOURMEAL_RUNTIME_ENV: "staging_local",
          TENANT_SLUG: "eatclean-staging",
          SUPABASE_URL: LOCAL_STAGING_URL,
          SUPABASE_PUBLISHABLE_KEY: LOCAL_STAGING_PUBLIC_KEY,
        };
        expect(isVerifiedLocalSyntheticLab({ hostname: "127.0.0.1" }, viteOnlyEnv)).toBe(false);
      });
    });

    describe("5. Positive: Verified Local Synthetic Lab", () => {
      it("unfreezes staffOrderCapture strictly when loopback host and synthetic env match", () => {
        const localContext = { hostname: "127.0.0.1", tenantSlug: "eatclean-staging" };
        expect(isVerifiedLocalSyntheticLab(localContext, validLocalEnv)).toBe(true);
        expect(isEatCleanStaffOrderCaptureFrozen(localContext, validLocalEnv)).toBe(false);

        const localhostContext = { hostname: "localhost", tenantSlug: "eatclean-staging" };
        expect(isVerifiedLocalSyntheticLab(localhostContext, validLocalEnv)).toBe(true);
        expect(isEatCleanStaffOrderCaptureFrozen(localhostContext, validLocalEnv)).toBe(false);
      });

      it("unfreezes staffOrderCapture in browser context with loopback host and VITE_YOURMEAL_RUNTIME_ENV", () => {
        const originalWindow = globalThis.window;
        const originalImportMeta = import.meta.env.VITE_YOURMEAL_RUNTIME_ENV;
        try {
          // Simulate browser with window and TanStack Start process shim
          (import.meta.env as Record<string, string | undefined>).VITE_YOURMEAL_RUNTIME_ENV = "staging_local";
          (globalThis as unknown as { window: unknown }).window = {
            location: { hostname: "127.0.0.1" },
          };

          const localContext = { hostname: "127.0.0.1", tenantSlug: "eatclean-staging" };
          expect(isVerifiedLocalSyntheticLab(localContext)).toBe(true);
          expect(isEatCleanStaffOrderCaptureFrozen(localContext)).toBe(false);

          // Non-loopback host in browser fails closed
          const nonLoopback = { hostname: "eatclean.yourmealos.com", tenantSlug: "eatclean" };
          expect(isVerifiedLocalSyntheticLab(nonLoopback)).toBe(false);
        } finally {
          (globalThis as unknown as { window: unknown }).window = originalWindow;
          (import.meta.env as Record<string, string | undefined>).VITE_YOURMEAL_RUNTIME_ENV = originalImportMeta;
        }
      });
    });
  });
});
