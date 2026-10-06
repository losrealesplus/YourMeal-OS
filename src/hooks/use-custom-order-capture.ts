import { useEffect, useState } from "react";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { can } from "@/permissions";
import { FeatureFlagService } from "@/services/feature-flag-service";
import { createServiceContext } from "@/services/types";
import { supabase } from "@/integrations/supabase/client";

export const CUSTOM_ORDER_CAPTURE_FLAG = "orders_custom_capture";
export function customCaptureRoleEligible(roles: readonly AppRole[], channel: string): boolean {
  return (
    channel === "individual" &&
    can(roles, "orders.write") &&
    roles.some((role) => ["company_admin", "operations_manager", "saas_admin"].includes(role))
  );
}

/** Scoped state prevents one tenant/user's resolved flag from flashing in another context. */
export function useCustomOrderCapture(channel = "individual") {
  const { user, tenantId, roles } = useAuth();
  const userId = user?.id;
  const rolesKey = [...roles].sort().join(",");
  const identity = `${tenantId ?? ""}:${userId ?? ""}:${channel}:${rolesKey}`;
  const [resolved, setResolved] = useState<{ identity: string; enabled: boolean } | null>(null);
  const eligible = customCaptureRoleEligible(roles, channel);
  useEffect(() => {
    let cancelled = false;
    if (!userId || !tenantId || !eligible) return;
    void createServiceContext({
      supabase,
      userId,
      tenantId,
      roles: rolesKey.split(",") as AppRole[],
    })
      .then((ctx) => FeatureFlagService.isTenantEnabled(ctx, CUSTOM_ORDER_CAPTURE_FLAG))
      .then((enabled) => {
        if (!cancelled) setResolved({ identity, enabled });
      })
      .catch(() => {
        if (!cancelled) setResolved({ identity, enabled: false });
      });
    return () => {
      cancelled = true;
    };
  }, [identity, eligible, userId, tenantId, rolesKey]);
  return Boolean(eligible && resolved?.identity === identity && resolved.enabled);
}
