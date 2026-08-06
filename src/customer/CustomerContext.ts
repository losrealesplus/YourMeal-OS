/**
 * Customer Capability contracts (ADR 0058) — business concepts, not tables.
 * @see docs/05-architecture/CUSTOMER_CAPABILITY.md
 */

export type CustomerStatus =
  | "unlinked"
  | "provisioned"
  | "active"
  | "inactive"
  | "archived"
  | "merged";

export type CustomerErrorCode =
  | "NOT_FOUND"
  | "TENANT_MISMATCH"
  | "PERMISSION_DENIED"
  | "INVALID_STATE"
  | "DUPLICATE"
  | "COMPANY_CODE_INVALID"
  | "LINK_CONFLICT"
  | "UNIMPLEMENTED"
  | "UNKNOWN";

export type CustomerError = {
  code: CustomerErrorCode;
  message: string;
  recoverable: boolean;
  evidence?: Record<string, unknown>;
};

export type PartyKind = "individual" | "company_account";

export type PartyRef = {
  kind: PartyKind;
  id: string;
};

/** Staff directory card / search hit. */
export type CustomerSummary = {
  partyKind: PartyKind;
  /** Individual: customers.id · Company: companies.id */
  id: string;
  displayName: string;
  status: CustomerStatus;
  demandChannelDefault: "individual" | "company";
  tenantId: string;
  tags: string[];
  /** Optional Identity link */
  userId: string | null;
};

/** Individual person party (maps to customers + facets). */
export type CustomerProfile = {
  id: string;
  kind: "individual";
  fullName: string | null;
  email: string | null;
  phones: { id: string; e164: string; label?: string }[];
  addresses: {
    id: string;
    label?: string;
    line1: string;
    city?: string;
    postalCode?: string;
    isDefaultDelivery?: boolean;
  }[];
  allergens: { id: string; code: string; note?: string }[];
  preferences: Record<string, unknown>;
  communicationPreferences: {
    channels: Record<string, boolean>;
    quietHours?: { start: string; end: string } | null;
  };
  status: CustomerStatus;
  userId: string | null;
  tenantId: string;
  tags: string[];
};

/** Resolved “where do we deliver this demand?” */
export type DeliveryLocationRef =
  | { kind: "customer_address"; addressId: string }
  | { kind: "company_site"; siteId: string; deliveryGroupId?: string | null };

/**
 * Canonical operational read for modules that need “the customer in context”.
 * Always authorized via Identity (tenant + caps).
 */
export type CustomerContext = {
  summary: CustomerSummary;
  profile: CustomerProfile | null;
  companyAccountId: string | null;
  deliveryLocation: DeliveryLocationRef | null;
  identityUserId: string | null;
  permissions: {
    canRead: boolean;
    canWrite: boolean;
    canSupport: boolean;
    canSelf: boolean;
  };
};

export type CustomerResult = {
  ok: boolean;
  context: CustomerContext | null;
  errors: CustomerError[];
};

export type CustomerCommandResult = {
  ok: boolean;
  partyRef: PartyRef | null;
  context: CustomerContext | null;
  errors: CustomerError[];
};
