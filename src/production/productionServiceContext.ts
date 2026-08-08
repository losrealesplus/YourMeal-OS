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
  // Canonical RBAC: production.operate + pilot kitchen.operate mapping
  // (PRODUCTION_CAPABILITY.md). Fine-grained production.read/plan/release
  // are not Capability literals — do not reintroduce them.
  const canProduction = caps.has("production.operate");
  const canKitchen = caps.has("kitchen.operate");
  return {
    canRead: canProduction || canKitchen || caps.has("orders.read"),
    canPlan: canProduction || canKitchen,
    canRelease: canProduction || canKitchen,
    canViewKitchen: canKitchen,
  };
}
