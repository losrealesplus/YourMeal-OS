import type { Tables } from "@/integrations/supabase/types";
import type { ServiceContext } from "./types";

type FlagRow = Pick<Tables<"feature_flags">, "key" | "enabled" | "tenant_id" | "metadata">;

/**
 * Feature flags — beta, plans, tenant features, controlled rollout.
 * Evaluation belongs here, not in ad-hoc UI conditionals.
 * @see docs/adr/0007-feature-flags.md
 */
export const FeatureFlagService = {
  async isEnabled(ctx: ServiceContext, key: string): Promise<boolean> {
    const { data, error } = await ctx.supabase
      .from("feature_flags")
      .select("key, enabled, tenant_id, metadata")
      .eq("key", key)
      .or(`tenant_id.eq.${ctx.tenantId},tenant_id.is.null`);

    if (error) {
      throw new Error(`FeatureFlagService.isEnabled failed: ${error.message}`);
    }

    const rows = (data ?? []) as FlagRow[];
    // Prefer tenant-specific flag over global (null tenant_id).
    const tenantFlag = rows.find((r) => r.tenant_id === ctx.tenantId);
    if (tenantFlag) return tenantFlag.enabled;
    const globalFlag = rows.find((r) => r.tenant_id == null);
    return globalFlag?.enabled ?? false;
  },
};
