/**
 * TenantBootstrapService — bind ActiveTenant from session identity data.
 * Does not re-query; SessionBootstrapService already loaded membership.
 */

import type { ActiveTenant } from "@/hooks/use-auth-types";
import type { SessionIdentityData } from "./SessionBootstrapService";

export type TenantBootstrapResult = {
  tenant: ActiveTenant | null;
  tenantId: string | null;
};

export function resolveTenantFromSessionIdentity(
  data: SessionIdentityData,
): TenantBootstrapResult {
  const tenant = data.tenant;
  return {
    tenant,
    tenantId: tenant?.id ?? null,
  };
}
