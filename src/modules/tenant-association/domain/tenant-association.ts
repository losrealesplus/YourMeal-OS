/**
 * Phase 2.2 — cold tenant association result (join code → pending membership).
 */

export type TenantAssociationResult = {
  tenantId: string;
  displayName: string;
  membershipId: string;
  status: "pending" | "approved" | "rejected" | "suspended" | "revoked";
  created: boolean;
};

export function parseTenantAssociationPayload(
  data: unknown,
): TenantAssociationResult {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("invalid association payload");
  }
  const row = data as Record<string, unknown>;
  const tenantId = row.tenant_id;
  const displayName = row.display_name;
  const membershipId = row.membership_id;
  const status = row.status;
  const created = row.created;
  if (typeof tenantId !== "string" || !tenantId) {
    throw new Error("invalid association payload");
  }
  if (typeof displayName !== "string") {
    throw new Error("invalid association payload");
  }
  if (typeof membershipId !== "string" || !membershipId) {
    throw new Error("invalid association payload");
  }
  if (
    status !== "pending" &&
    status !== "approved" &&
    status !== "rejected" &&
    status !== "suspended" &&
    status !== "revoked"
  ) {
    throw new Error("invalid association payload");
  }
  if (typeof created !== "boolean") {
    throw new Error("invalid association payload");
  }
  return {
    tenantId,
    displayName,
    membershipId,
    status,
    created,
  };
}
