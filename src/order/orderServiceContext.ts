/**
 * INTERNAL — resolve ServiceContext for OrderFacade.
 * UI never imports this. Supabase stays behind the facade.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  createServiceContext,
  type ServiceContext,
} from "@/services/types";
import type { IdentityFacadeView } from "@/identity/IdentityFacade";
import type { AppRole } from "@/hooks/use-auth";
import type { OrderError } from "./OrderContext";
import type { OrderCapabilityBits } from "./mapOrder";

export type OrderRuntimeIdentity = Pick<
  IdentityFacadeView,
  "session" | "tenant" | "permissions" | "currentUser"
>;

export async function resolveOrderServiceContext(
  identity: OrderRuntimeIdentity,
): Promise<
  { ok: true; ctx: ServiceContext } | { ok: false; error: OrderError }
> {
  const userId = identity.session.userId;
  const tenantId = identity.tenant?.id ?? null;

  if (!identity.session.present || !userId) {
    return {
      ok: false,
      error: {
        code: "PERMISSION_DENIED",
        message: "Authenticated session required for Order operations",
        recoverable: true,
      },
    };
  }

  if (!tenantId) {
    return {
      ok: false,
      error: {
        code: "TENANT_MISMATCH",
        message: "Tenant required for Order operations",
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

export function orderCapabilityBitsFromIdentity(
  identity: OrderRuntimeIdentity,
): OrderCapabilityBits {
  const caps = new Set(identity.permissions.capabilities);
  return {
    canRead: caps.has("orders.read"),
    canWrite: caps.has("orders.write"),
    canConfirm: caps.has("orders.write"),
    canKitchen: caps.has("kitchen.operate"),
    canLogistics: caps.has("logistics.operate"),
  };
}
