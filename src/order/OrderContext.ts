/**
 * Order Capability contracts (ADR 0062) — operational commitment, not ecommerce.
 * @see docs/05-architecture/ORDER_CAPABILITY.md
 */

export type OrderWeek = {
  weekStart: string;
  label?: string;
};

export type OrderDeliverySlot = {
  dayDate: string;
  timeWindowLabel?: string | null;
  deliveryLocation:
    | { kind: "customer_address"; addressId: string }
    | {
        kind: "company_site";
        siteId: string;
        deliveryGroupId?: string | null;
      }
    | { kind: "unresolved" };
};

export type OrderStatus =
  | "draft"
  | "confirmed"
  | "in_production"
  | "prepared"
  | "ready_for_delivery"
  | "out_for_delivery"
  | "delivered"
  | "delivery_issue"
  | "cancelled";

export type OrderBillingFacet = {
  billable: boolean;
  invoiced: boolean;
  invoiceIds: string[];
};

export type OrderErrorCode =
  | "NOT_FOUND"
  | "TENANT_MISMATCH"
  | "PERMISSION_DENIED"
  | "INVALID_STATE"
  | "WEEK_CLOSED"
  | "MENU_NOT_PUBLISHED"
  | "PARTY_REQUIRED"
  | "LINE_INVALID"
  | "ALLERGEN_CONFLICT"
  | "UNIMPLEMENTED"
  | "UNKNOWN";

export type OrderError = {
  code: OrderErrorCode;
  message: string;
  recoverable: boolean;
  evidence?: Record<string, unknown>;
};

export type OrderLineSummary = {
  id: string;
  dayDate: string;
  dishId: string;
  dishName: string;
  quantity: number;
  modifications?: string[];
  allergenNotes?: string[];
};

export type OrderSummary = {
  id: string;
  week: OrderWeek;
  status: OrderStatus;
  demandChannel: "individual" | "company";
  orderSource: string;
  partyRef: {
    kind: "individual" | "company_account";
    id: string;
    displayName: string;
  };
  deliveryDayPrimary: string | null;
  itemCount: number;
  total: number;
  currency: string;
  tenantId: string;
};

export type OrderDetails = {
  summary: OrderSummary;
  lines: OrderLineSummary[];
  deliverySlots: OrderDeliverySlot[];
  menuRef: { weeklyMenuId: string | null; weekStart: string };
  billing: OrderBillingFacet;
  constraints: {
    allergens: string[];
    modifications: string[];
  };
  timeline: { key: string; label: string; reached: boolean }[];
};

export type OrderContext = {
  details: OrderDetails;
  permissions: {
    canRead: boolean;
    canWrite: boolean;
    canConfirm: boolean;
    canKitchen: boolean;
    canLogistics: boolean;
  };
  customerContextRef: {
    partyKind: "individual" | "company_account";
    partyId: string;
  };
};

export type OrderResult = {
  ok: boolean;
  context: OrderContext | null;
  errors: OrderError[];
};

export type OrderCommandResult = {
  ok: boolean;
  orderId: string | null;
  status: OrderStatus | null;
  context: OrderContext | null;
  errors: OrderError[];
};
