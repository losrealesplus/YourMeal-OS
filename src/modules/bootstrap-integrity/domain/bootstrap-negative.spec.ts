/**
 * OP-001.2 · Named negative regression tests for impossible bootstrap states.
 * These assert domain/service preconditions — not React UI.
 */
import { describe, expect, it } from "vitest";
import { DomainError } from "@/domain/errors";
import {
  canAcceptOrders,
  canComposeWeeklyMenu,
  canInviteOperationalStaff,
  canOperateDelivery,
  canOperateKitchen,
  canPublishWeeklyMenu,
} from "./bootstrap-preconditions";

function throwIfBlocked(verdict: { ok: boolean; code: string; message: string }) {
  if (!verdict.ok) {
    throw new DomainError("INVALID_STATE", verdict.message, {
      code: verdict.code,
    });
  }
}

describe("OP-001.2 bootstrap negative cases (service-level)", () => {
  it("cannotPublishMenuWithoutDishes", () => {
    const verdict = canPublishWeeklyMenu({
      slotCount: 3,
      activeDishCount: 0,
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.code).toBe("BOOTSTRAP_NO_DISHES");
    expect(() => throwIfBlocked(verdict)).toThrow(DomainError);
    expect(() => throwIfBlocked(verdict)).toThrow(/without active dishes/i);
  });

  it("cannotPublishEmptyMenuEvenWithDishes", () => {
    const verdict = canPublishWeeklyMenu({
      slotCount: 0,
      activeDishCount: 2,
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.code).toBe("BOOTSTRAP_EMPTY_MENU");
  });

  it("cannotCreateOrderWithoutPublishedMenu", () => {
    const verdict = canAcceptOrders({ publishedMenuCount: 0 });
    expect(verdict.ok).toBe(false);
    expect(verdict.code).toBe("BOOTSTRAP_NO_PUBLISHED_MENU");
    expect(() => throwIfBlocked(verdict)).toThrow(/published weekly menu/i);
  });

  it("cannotStartKitchenWithoutOrders", () => {
    const verdict = canOperateKitchen({ confirmedOrInKitchenCount: 0 });
    expect(verdict.ok).toBe(false);
    expect(verdict.code).toBe("BOOTSTRAP_NO_KITCHEN_DEMAND");
    expect(() => throwIfBlocked(verdict)).toThrow(/without confirmed orders/i);
  });

  it("cannotDispatchWithoutReadyProduction", () => {
    const verdict = canOperateDelivery({ readyForDeliveryCount: 0 });
    expect(verdict.ok).toBe(false);
    expect(verdict.code).toBe("BOOTSTRAP_NO_DELIVERY_DEMAND");
    expect(() => throwIfBlocked(verdict)).toThrow(/ready for delivery/i);
  });

  it("cannotInviteStaffWithoutCompanyAdmin", () => {
    const verdict = canInviteOperationalStaff({
      companyAdminCount: 0,
      role: "kitchen",
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.code).toBe("BOOTSTRAP_NO_COMPANY_ADMIN");
    expect(() => throwIfBlocked(verdict)).toThrow(/Company Admin/i);
  });

  it("cannotComposeWeeklyMenuWithoutDishes", () => {
    expect(canComposeWeeklyMenu({ activeDishCount: 0 }).ok).toBe(false);
  });
});
