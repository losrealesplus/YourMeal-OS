import { describe, it, expect } from "vitest";
import {
  EATCLEAN_PARTIAL_LAUNCH_CONFIG,
  isEatCleanOrderCreationFrozen,
  isEatCleanCrmMutationFrozen,
  isEatCleanStaffOrderCaptureFrozen,
} from "./eatclean-partial-launch";
import { OrderIntakeService } from "@/modules/order-intake";
import { DomainError } from "@/domain/errors";

describe("EatClean Partial Launch Feature Barriers", () => {
  it("enforces partial launch configuration flags", () => {
    expect(EATCLEAN_PARTIAL_LAUNCH_CONFIG.isPartialLaunch).toBe(true);
    expect(EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.catalogConsultation).toBe(true);
    expect(EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.weeklyMenuConsultation).toBe(true);
    expect(EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.existingOrdersConsultation).toBe(true);
    expect(EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.adminDashboardRead).toBe(true);

    // Frozen modules
    expect(EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.orderCreation).toBe(false);
    expect(EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.staffOrderCapture).toBe(false);
    expect(EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.crmIdentityMutations).toBe(false);
    expect(EATCLEAN_PARTIAL_LAUNCH_CONFIG.features.kitchenStateMutations).toBe(false);
  });

  it("checks helper functions identify frozen modules", () => {
    expect(isEatCleanCrmMutationFrozen()).toBe(true);
    expect(isEatCleanStaffOrderCaptureFrozen()).toBe(true);
  });

  it("blocks OrderIntakeService.intakeDraft when order creation is frozen", async () => {
    process.env.EATCLEAN_TEST_FORCE_FREEZE = "true";
    try {
      expect(isEatCleanOrderCreationFrozen()).toBe(true);
      await expect(
        OrderIntakeService.intakeDraft(
          {} as any,
          {
            tenantId: "t-1",
            roles: ["customer"],
            client: {} as any,
          },
          {
            weekStart: "2026-10-12",
            deliveryAddressId: "addr-1",
            source: "customer_app",
            lines: [],
          }
        )
      ).rejects.toThrow(DomainError);
    } finally {
      delete process.env.EATCLEAN_TEST_FORCE_FREEZE;
    }
  });
});
