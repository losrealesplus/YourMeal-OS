import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createServiceContext } from "@/services/types";
import { FeatureFlagService } from "@/services/feature-flag-service";
import {
  PILOT_ADMIN_MODULE_FLAGS,
  type PilotAdminModuleFlag,
} from "@/lib/pilot-feature-flags";

type FlagMap = Record<PilotAdminModuleFlag, boolean>;

const ALL_OFF = Object.fromEntries(
  Object.values(PILOT_ADMIN_MODULE_FLAGS).map((k) => [k, false]),
) as FlagMap;

/**
 * Incomplete admin modules are OFF by default (missing flag = disabled).
 * Enable via feature_flags to surface a module when it becomes real.
 */
export function usePilotAdminModuleFlags() {
  const { user, tenantId, roles } = useAuth();
  const [flags, setFlags] = useState<FlagMap>(ALL_OFF);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user || !tenantId) {
        if (!cancelled) {
          setFlags(ALL_OFF);
          setReady(true);
        }
        return;
      }
      try {
        const ctx = await createServiceContext({
          supabase,
          userId: user.id,
          tenantId,
          roles,
        });
        const entries = await Promise.all(
          Object.values(PILOT_ADMIN_MODULE_FLAGS).map(async (key) => {
            try {
              return [key, await FeatureFlagService.isEnabled(ctx, key)] as const;
            } catch {
              return [key, false] as const;
            }
          }),
        );
        if (!cancelled) {
          setFlags(Object.fromEntries(entries) as FlagMap);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setFlags(ALL_OFF);
          setReady(true);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user, tenantId, roles]);

  return { flags, ready };
}
