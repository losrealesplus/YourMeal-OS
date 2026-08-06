/**
 * INTERNAL — resolve ServiceContext for ProductionFacade.
 * UI never imports this. Supabase stays behind the facade.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  createServiceContext,
  type ServiceContext,
} from "@/services/types";
import type { IdentityFacadeView } from "@/identity/IdentityFacade";
import type { AppRole } from "@/hooks/use-auth";
import type {
  ProductionCapabilityBits,
  ProductionError,
} from "./ProductionContext";

export type ProductionRuntimeIdentity = Pick<
  IdentityFacadeView,
  "session" | "tenant" | "permissions" | "currentUser"
>;

export async function resolveProductionServiceContext(
  identity: ProductionRuntimeIdentity,
): Promise<
  { ok: true; ctx: ServiceContext } | { ok: false; error: ProductionError }
> {
  const userId = identity.session.userId;
  const tenantId = identity.tenant?.id ?? null;

  if (!identity.session.present || !userId) {
    return {
      ok: false,
      error: {
        code: "PERMISSION_DENIED",
        message: "Authenticated session required for Production operations",
        recoverable: true,
      },
    };
  }

  if (!tenantId) {
    return {
      ok: false,
      error: {
        code: "TENANT_MISMATCH",
        message: "Tenant required for Production operations",
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

export function productionCapabilityBitsFromIdentity(
  identity: ProductionRuntimeIdentity,
): ProductionCapabilityBits {
  const caps = new Set(identity.permissions.capabilities);
  const canKitchen = caps.has("kitchen.operate");
  return {
    canRead:
      caps.has("production.read") || canKitchen || caps.has("orders.read"),
    canPlan: caps.has("production.plan") || canKitchen,
    canRelease: caps.has("production.release") || canKitchen,
    canViewKitchen: canKitchen,
  };
}
