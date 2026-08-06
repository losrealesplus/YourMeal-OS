/**
 * INTERNAL — map directory / company records → Customer Capability contracts.
 * Not a public storage model.
 */

import type {
  CompanyDirectoryRecord,
  IndividualCustomerRecord,
} from "@/modules/customer-directory";
import type { Site } from "@/modules/company-account";
import type {
  CustomerContext,
  CustomerError,
  CustomerErrorCode,
  CustomerProfile,
  CustomerStatus,
  CustomerSummary,
  DeliveryLocationRef,
  PartyRef,
} from "./CustomerContext";
import { DomainError } from "@/domain/errors";

export type CapabilityBits = {
  canRead: boolean;
  canWrite: boolean;
  canSupport: boolean;
  canSelf: boolean;
};

export function activityToCustomerStatus(
  status: "active" | "inactive" | "new",
): CustomerStatus {
  if (status === "inactive") return "inactive";
  return "active";
}

export function mapIndividualSummary(
  row: IndividualCustomerRecord,
  tenantId: string,
): CustomerSummary {
  return {
    partyKind: "individual",
    id: row.id,
    displayName: row.displayName?.trim() || "Sin nombre",
    status: activityToCustomerStatus(row.status),
    demandChannelDefault: row.companyId ? "company" : "individual",
    tenantId,
    tags: row.kind === "company_employee" ? ["company_employee"] : [],
    userId: null,
  };
}

export function mapCompanySummary(
  row: CompanyDirectoryRecord,
  tenantId: string,
): CustomerSummary {
  return {
    partyKind: "company_account",
    id: row.id,
    displayName: row.name,
    status: row.status === "inactive" ? "inactive" : "active",
    demandChannelDefault: "company",
    tenantId,
    tags: row.companyCode ? [`code:${row.companyCode}`] : [],
    userId: null,
  };
}

export function mapIndividualProfile(
  row: IndividualCustomerRecord,
  tenantId: string,
): CustomerProfile {
  const phones = row.phone
    ? [{ id: `${row.id}:phone`, e164: row.phone }]
    : [];
  const addresses = row.city
    ? [
        {
          id: `${row.id}:city`,
          line1: "",
          city: row.city,
          isDefaultDelivery: true,
        },
      ]
    : [];

  return {
    id: row.id,
    kind: "individual",
    fullName: row.displayName,
    email: row.email,
    phones,
    addresses,
    allergens: [],
    preferences: {},
    communicationPreferences: { channels: {} },
    status: activityToCustomerStatus(row.status),
    userId: null,
    tenantId,
    tags: row.kind === "company_employee" ? ["company_employee"] : [],
  };
}

export function buildIndividualContext(
  row: IndividualCustomerRecord,
  tenantId: string,
  permissions: CapabilityBits,
): CustomerContext {
  const summary = mapIndividualSummary(row, tenantId);
  return {
    summary,
    profile: mapIndividualProfile(row, tenantId),
    companyAccountId: row.companyId,
    deliveryLocation: null,
    identityUserId: null,
    permissions,
  };
}

export function buildCompanyContext(
  row: CompanyDirectoryRecord,
  tenantId: string,
  permissions: CapabilityBits,
): CustomerContext {
  const summary = mapCompanySummary(row, tenantId);
  return {
    summary,
    profile: null,
    companyAccountId: row.id,
    deliveryLocation: null,
    identityUserId: null,
    permissions,
  };
}

export function sitesToDeliveryLocations(sites: Site[]): DeliveryLocationRef[] {
  return sites
    .filter((s) => s.isActive)
    .map((s) => ({ kind: "company_site" as const, siteId: s.id }));
}

export function mapDomainError(err: unknown): CustomerError {
  if (err instanceof DomainError) {
    const code = domainCodeToCustomer(err.code);
    return {
      code,
      message: err.message,
      recoverable: code === "PERMISSION_DENIED" || code === "UNIMPLEMENTED",
      evidence: err.details,
    };
  }
  if (err && typeof err === "object" && "message" in err) {
    return {
      code: "UNKNOWN",
      message: String((err as { message: unknown }).message),
      recoverable: false,
    };
  }
  return {
    code: "UNKNOWN",
    message: String(err),
    recoverable: false,
  };
}

function domainCodeToCustomer(
  code: DomainError["code"],
): CustomerErrorCode {
  switch (code) {
    case "PERMISSION_DENIED":
      return "PERMISSION_DENIED";
    case "TENANT_MISMATCH":
      return "TENANT_MISMATCH";
    case "NOT_FOUND":
    case "DISH_NOT_FOUND":
    case "INGREDIENT_NOT_FOUND":
      return "NOT_FOUND";
    case "INVALID_STATE":
    case "ORDER_CLOSED":
    case "MENU_LOCKED":
    case "INVALID_RECIPE":
      return "INVALID_STATE";
    case "DISH_ALREADY_EXISTS":
      return "DUPLICATE";
    case "UNIMPLEMENTED":
      return "UNIMPLEMENTED";
    default:
      return "UNKNOWN";
  }
}

export function unimplementedError(
  command: string,
  evidence?: Record<string, unknown>,
): CustomerError {
  return {
    code: "UNIMPLEMENTED",
    message: `${command} substrate not available yet — facade exposes intent only`,
    recoverable: true,
    evidence,
  };
}

export function failCommand(
  errors: CustomerError[],
  partyRef: PartyRef | null = null,
) {
  return {
    ok: false as const,
    partyRef,
    context: null,
    errors,
  };
}

export function failResult(errors: CustomerError[]) {
  return {
    ok: false as const,
    context: null,
    errors,
  };
}
