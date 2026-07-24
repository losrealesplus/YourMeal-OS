/**
 * Bootstrap integrity — pure preconditions (no I/O).
 * Prevents impossible operational states for a new tenant.
 *
 * @see docs/05-architecture/BOOTSTRAP_STATE_MACHINE.md
 * @see docs/00-status/OP_001_1_BOOTSTRAP_VALIDATION.md
 */

export type IntegrityVerdict = {
  ok: boolean;
  code: string;
  message: string;
};

function fail(code: string, message: string): IntegrityVerdict {
  return { ok: false, code, message };
}

function pass(code: string, message = "ok"): IntegrityVerdict {
  return { ok: true, code, message };
}

/** Case 5 — Menu without dishes */
export function canComposeWeeklyMenu(input: {
  activeDishCount: number;
}): IntegrityVerdict {
  if (input.activeDishCount <= 0) {
    return fail(
      "BOOTSTRAP_NO_DISHES",
      "Cannot build weekly menu without active dishes in the Dish Library",
    );
  }
  return pass("BOOTSTRAP_DISHES_READY");
}

/** Publish requires at least one slot (and thus dishes on offer) */
export function canPublishWeeklyMenu(input: {
  slotCount: number;
  activeDishCount: number;
}): IntegrityVerdict {
  const dishes = canComposeWeeklyMenu(input);
  if (!dishes.ok) return dishes;
  if (input.slotCount <= 0) {
    return fail(
      "BOOTSTRAP_EMPTY_MENU",
      "Cannot publish an empty weekly menu — add at least one dish to a day",
    );
  }
  return pass("BOOTSTRAP_MENU_PUBLISHABLE");
}

/** Case 1 — Orders without published menu */
export function canAcceptOrders(input: {
  publishedMenuCount: number;
}): IntegrityVerdict {
  if (input.publishedMenuCount <= 0) {
    return fail(
      "BOOTSTRAP_NO_PUBLISHED_MENU",
      "Cannot accept orders without a published weekly menu",
    );
  }
  return pass("BOOTSTRAP_ORDERS_OPEN");
}

/** Case 2 — Production / kitchen without orders */
export function canOperateKitchen(input: {
  confirmedOrInKitchenCount: number;
}): IntegrityVerdict {
  if (input.confirmedOrInKitchenCount <= 0) {
    return fail(
      "BOOTSTRAP_NO_KITCHEN_DEMAND",
      "Cannot operate kitchen / production without confirmed orders",
    );
  }
  return pass("BOOTSTRAP_KITCHEN_READY");
}

/** Case 3 — Delivery without production output */
export function canOperateDelivery(input: {
  readyForDeliveryCount: number;
}): IntegrityVerdict {
  if (input.readyForDeliveryCount <= 0) {
    return fail(
      "BOOTSTRAP_NO_DELIVERY_DEMAND",
      "Cannot operate delivery without orders ready for delivery (kitchen must finish first)",
    );
  }
  return pass("BOOTSTRAP_DELIVERY_READY");
}

/** Case 4 — Staff invite without Company Admin */
export function canInviteOperationalStaff(input: {
  companyAdminCount: number;
  role: string;
}): IntegrityVerdict {
  const isCompanyAdminRole = input.role === "company_admin";
  if (!isCompanyAdminRole && input.companyAdminCount <= 0) {
    return fail(
      "BOOTSTRAP_NO_COMPANY_ADMIN",
      "Cannot invite kitchen/delivery staff before a Company Admin exists on the tenant",
    );
  }
  return pass("BOOTSTRAP_STAFF_INVITE_OK");
}

export type BootstrapStage =
  | "no_tenant"
  | "tenant"
  | "company_admin"
  | "staff"
  | "dish_library"
  | "weekly_menu"
  | "customer_orders"
  | "kitchen"
  | "delivery"
  | "operational";

export type BootstrapSnapshot = {
  tenantCount: number;
  companyAdminCount: number;
  staffCount: number;
  activeDishCount: number;
  publishedMenuCount: number;
  customerCount: number;
  confirmedOrderCount: number;
  kitchenQueueCount: number;
  readyForDeliveryCount: number;
  deliveredCount: number;
};

/** Derive the furthest completed stage from counts (integrity ladder). */
export function resolveBootstrapStage(
  snap: BootstrapSnapshot,
): BootstrapStage {
  if (snap.tenantCount <= 0) return "no_tenant";
  if (snap.companyAdminCount <= 0) return "tenant";
  if (snap.activeDishCount <= 0) return "company_admin";
  if (snap.publishedMenuCount <= 0) {
    return snap.staffCount > 0 ? "staff" : "dish_library";
  }
  if (snap.confirmedOrderCount + snap.kitchenQueueCount <= 0) {
    return snap.customerCount > 0 ? "customer_orders" : "weekly_menu";
  }
  if (snap.readyForDeliveryCount + snap.deliveredCount <= 0) return "kitchen";
  if (snap.deliveredCount <= 0) return "delivery";
  return "operational";
}

export type IntegrityAuditItem = {
  id: string;
  label: string;
  verdict: IntegrityVerdict;
};

/** Full integrity audit for a tenant snapshot (WP-7). */
export function auditBootstrapIntegrity(
  snap: BootstrapSnapshot,
): IntegrityAuditItem[] {
  return [
    {
      id: "dishes_before_menu",
      label: "Menu requires dishes",
      verdict: canComposeWeeklyMenu({
        activeDishCount: snap.activeDishCount,
      }),
    },
    {
      id: "menu_before_orders",
      label: "Orders require published menu",
      verdict: canAcceptOrders({
        publishedMenuCount: snap.publishedMenuCount,
      }),
    },
    {
      id: "orders_before_kitchen",
      label: "Kitchen requires confirmed orders",
      verdict: canOperateKitchen({
        confirmedOrInKitchenCount:
          snap.confirmedOrderCount + snap.kitchenQueueCount,
      }),
    },
    {
      id: "kitchen_before_delivery",
      label: "Delivery requires ready-for-delivery orders",
      verdict: canOperateDelivery({
        readyForDeliveryCount: snap.readyForDeliveryCount,
      }),
    },
    {
      id: "admin_before_staff",
      label: "Staff invite requires Company Admin",
      verdict: canInviteOperationalStaff({
        companyAdminCount: snap.companyAdminCount,
        role: "kitchen",
      }),
    },
  ];
}
