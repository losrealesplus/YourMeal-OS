/**
 * Phase 2.1 — tenant_join_code domain (association credential).
 *
 * DISTINCT from companies.company_code (intra-tenant company identity).
 */

export const TENANT_JOIN_CODE_PREFIX = "TJ-";

/** Canonical format: TJ- + 6..16 alphanumeric (server uses 8 hex chars). */
const JOIN_CODE_RE = /^TJ-[A-Z0-9]{6,16}$/i;

export function normalizeTenantJoinCode(code: string): string {
  return code.trim().toUpperCase();
}

export function isValidTenantJoinCodeFormat(code: string): boolean {
  const norm = normalizeTenantJoinCode(code);
  if (!JOIN_CODE_RE.test(norm)) return false;
  // Semantic boundary: never accept company-code shaped credentials.
  if (norm.startsWith("EC-")) return false;
  return true;
}

export type ResolvedTenantJoin = {
  tenantId: string;
  displayName: string;
};

export function parseResolvedTenantJoinPayload(
  payload: unknown,
): ResolvedTenantJoin {
  if (!payload || typeof payload !== "object") {
    throw new Error("invalid join resolution payload");
  }
  const row = payload as Record<string, unknown>;
  const tenantId = row.tenant_id;
  const displayName = row.display_name;
  if (typeof tenantId !== "string" || !tenantId) {
    throw new Error("invalid join resolution payload");
  }
  if (typeof displayName !== "string" || !displayName) {
    throw new Error("invalid join resolution payload");
  }
  return { tenantId, displayName };
}
