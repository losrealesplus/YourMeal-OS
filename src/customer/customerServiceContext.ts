/**
 * INTERNAL — resolve ServiceContext for CustomerFacade.
 *
 * UI / Operational Modules never import this. Supabase stays behind the facade.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  createServiceContext,
  type ServiceContext,
} from "@/services/types";
import type { IdentityFacadeView } from "@/identity/IdentityFacade";
import type { AppRole } from "@/hooks/use-auth";
import type { CustomerError } from "./CustomerContext";

export type CustomerRuntimeIdentity = Pick<
  IdentityFacadeView,
  "session" | "tenant" | "permissions" | "currentUser"
>;

export async function resolveCustomerServiceContext(
  identity: CustomerRuntimeIdentity,
): Promise<{ ok: true; ctx: ServiceContext } | { ok: false; error: CustomerError }> {
  const userId = identity.session.userId;
  const tenantId = identity.tenant?.id ?? null;

  if (!identity.session.present || !userId) {
    return {
      ok: false,
      error: {
        code: "PERMISSION_DENIED",
        message: "Authenticated session required for Customer operations",
        recoverable: true,
      },
    };
  }

  if (!tenantId) {
    return {
      ok: false,
      error: {
        code: "TENANT_MISMATCH",
        message: "Tenant required for Customer operations",
        recoverable: true,
      },
    };
  }

  try {
    const ctx = await createServiceContext({
      supabase,
      userId,
      tenantId,
      roles: identity.permissions.roles as readonly AppRole[],
    });
    return { ok: true, ctx };
  } catch (e) {
    return {
      ok: false,
      error: {
        code: "UNKNOWN",
        message: e instanceof Error ? e.message : String(e),
        recoverable: false,
      },
    };
  }
}

export function capabilityBitsFromIdentity(
  identity: CustomerRuntimeIdentity,
): {
  canRead: boolean;
  canWrite: boolean;
  canSupport: boolean;
  canSelf: boolean;
} {
  const caps = new Set(identity.permissions.capabilities);
  return {
    canRead: caps.has("customers.read") || caps.has("support.read"),
    canWrite: caps.has("customers.write"),
    canSupport: caps.has("support.read") || caps.has("support.write"),
    canSelf: Boolean(identity.session.present),
  };
}
