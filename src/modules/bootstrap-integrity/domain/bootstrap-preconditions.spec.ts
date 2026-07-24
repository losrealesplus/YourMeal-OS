import { describe, expect, it } from "vitest";
import {
  auditBootstrapIntegrity,
  auditBootstrapRelations,
  canAcceptOrders,
  canComposeWeeklyMenu,
  canInviteOperationalStaff,
  canOperateDelivery,
  canOperateKitchen,
  canPublishWeeklyMenu,
  resolveBootstrapStage,
  type BootstrapSnapshot,
} from "./bootstrap-preconditions";

const empty: BootstrapSnapshot = {
  tenantCount: 0,
  companyAdminCount: 0,
  staffCount: 0,
  activeDishCount: 0,
  publishedMenuCount: 0,
  customerCount: 0,
  confirmedOrderCount: 0,
  kitchenQueueCount: 0,
  readyForDeliveryCount: 0,
  deliveredCount: 0,
};

describe("bootstrap preconditions", () => {
  it("blocks menu without dishes (case 5)", () => {
    expect(canComposeWeeklyMenu({ activeDishCount: 0 }).ok).toBe(false);
    expect(canComposeWeeklyMenu({ activeDishCount: 1 }).ok).toBe(true);
  });

  it("blocks publish of empty menu", () => {
    expect(
      canPublishWeeklyMenu({ slotCount: 0, activeDishCount: 2 }).ok,
    ).toBe(false);
    expect(
      canPublishWeeklyMenu({ slotCount: 1, activeDishCount: 2 }).ok,
    ).toBe(true);
  });

  it("blocks orders without published menu (case 1)", () => {
    expect(canAcceptOrders({ publishedMenuCount: 0 }).ok).toBe(false);
    expect(canAcceptOrders({ publishedMenuCount: 1 }).ok).toBe(true);
  });

  it("blocks kitchen without orders (case 2)", () => {
    expect(canOperateKitchen({ confirmedOrInKitchenCount: 0 }).ok).toBe(false);
    expect(canOperateKitchen({ confirmedOrInKitchenCount: 1 }).ok).toBe(true);
  });

  it("blocks delivery without production output (case 3)", () => {
    expect(canOperateDelivery({ readyForDeliveryCount: 0 }).ok).toBe(false);
    expect(canOperateDelivery({ readyForDeliveryCount: 1 }).ok).toBe(true);
  });

  it("blocks staff invite without company admin (case 4)", () => {
    expect(
      canInviteOperationalStaff({ companyAdminCount: 0, role: "kitchen" }).ok,
    ).toBe(false);
    expect(
      canInviteOperationalStaff({
        companyAdminCount: 0,
        role: "company_admin",
      }).ok,
    ).toBe(true);
    expect(
      canInviteOperationalStaff({ companyAdminCount: 1, role: "delivery" }).ok,
    ).toBe(true);
  });

  it("resolves stage ladder", () => {
    expect(resolveBootstrapStage(empty)).toBe("no_tenant");
    expect(
      resolveBootstrapStage({ ...empty, tenantCount: 1 }),
    ).toBe("tenant");
    expect(
      resolveBootstrapStage({
        ...empty,
        tenantCount: 1,
        companyAdminCount: 1,
        activeDishCount: 3,
        publishedMenuCount: 1,
        confirmedOrderCount: 2,
        readyForDeliveryCount: 1,
        deliveredCount: 1,
      }),
    ).toBe("operational");
  });

  it("audit lists all integrity cases", () => {
    const items = auditBootstrapIntegrity(empty);
    expect(items.map((i) => i.id)).toEqual([
      "dishes_before_menu",
      "menu_before_orders",
      "orders_before_kitchen",
      "kitchen_before_delivery",
      "admin_before_staff",
    ]);
    expect(items.every((i) => !i.verdict.ok)).toBe(true);
  });

  it("relationship chain requires connected ladder", () => {
    const gaps = auditBootstrapRelations(empty);
    expect(gaps.some((l) => l.id === "tenant_to_company_admin" && !l.ok)).toBe(
      true,
    );
    const operational = auditBootstrapRelations({
      ...empty,
      tenantCount: 1,
      companyAdminCount: 1,
      staffCount: 2,
      activeDishCount: 3,
      publishedMenuCount: 1,
      customerCount: 5,
      confirmedOrderCount: 2,
      kitchenQueueCount: 2,
      readyForDeliveryCount: 1,
      deliveredCount: 1,
      routeCount: 0,
    });
    expect(
      operational.filter((l) => l.id !== "delivery_to_routes").every((l) => l.ok),
    ).toBe(true);
  });
});
