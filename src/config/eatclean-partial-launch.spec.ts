import { describe, it, expect } from "vitest";
import {
  EATCLEAN_PARTIAL_LAUNCH_CONFIG,
  EATCLEAN_TENANT_ID,
  EATCLEAN_TENANT_SLUG,
  isEatCleanContext,
  isEatCleanOrderCreationFrozen,
  isEatCleanCrmMutationFrozen,
  isEatCleanDishMutationFrozen,
  isEatCleanMenuMutationFrozen,
} from "./eatclean-partial-launch";
import { OrderIntakeService } from "@/modules/order-intake";
import { DomainError } from "@/domain/errors";
import type { ServiceContext } from "@/services/types";

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

    // Specifically frozen features requiring pending Supabase migrations
    expect(EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.orderCreation).toBe(false);
    expect(EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.crmIdentityMutations).toBe(false);
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

    it("freezes orderCreation ONLY for EatClean", () => {
      expect(isEatCleanOrderCreationFrozen(EATCLEAN_TENANT_ID)).toBe(true);
      expect(isEatCleanOrderCreationFrozen({ tenantId: EATCLEAN_TENANT_ID })).toBe(true);

      // Non-EatClean tenant is NEVER frozen
      expect(isEatCleanOrderCreationFrozen("other-tenant-uuid")).toBe(false);
      expect(isEatCleanOrderCreationFrozen({ tenantId: "other-tenant-uuid" })).toBe(false);
    });

    it("freezes CRM P34 mutations ONLY for EatClean", () => {
      expect(isEatCleanCrmMutationFrozen(EATCLEAN_TENANT_ID)).toBe(true);
      expect(isEatCleanCrmMutationFrozen("other-tenant-uuid")).toBe(false);
    });

    it("keeps operational mutations enabled for all tenants including EatClean", () => {
      expect(isEatCleanDishMutationFrozen(EATCLEAN_TENANT_ID)).toBe(false);
      expect(isEatCleanDishMutationFrozen("other-tenant-uuid")).toBe(false);
      expect(isEatCleanMenuMutationFrozen(EATCLEAN_TENANT_ID)).toBe(false);
      expect(isEatCleanMenuMutationFrozen("other-tenant-uuid")).toBe(false);
    });
  });

  describe("Application Service Barriers", () => {
    it("blocks OrderIntakeService.intakeDraft for EatClean context", async () => {
      const eatcleanCtx = {
        tenantId: EATCLEAN_TENANT_ID,
        tenantSlug: EATCLEAN_TENANT_SLUG,
        roles: ["customer"],
        capabilities: new Set(),
        userId: "u-1",
        supabase: {} as unknown,
      } as unknown as ServiceContext;

      await expect(
        OrderIntakeService.intakeDraft(eatcleanCtx, {
          channel: "app",
          weekStart: "2026-10-12",
          items: [{ dishId: "d-1", dayDate: "2026-10-12", qty: 1 }],
        }),
      ).rejects.toThrow(DomainError);
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
});
