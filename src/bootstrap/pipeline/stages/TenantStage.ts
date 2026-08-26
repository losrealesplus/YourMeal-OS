import type { BootstrapStageHandler } from "./BootstrapStage";
import { resolveTenantFromSessionIdentity } from "../services/TenantBootstrapService";
import { loadSessionIdentity } from "../services/SessionBootstrapService";
import { ensureCustomerForActiveTenant } from "../services/CustomerMaterializationService";
import {
  getBootstrapIdentitySnapshot,
  publishBootstrapIdentitySnapshot,
} from "../BootstrapIdentityStore";
import { supabase } from "@/integrations/supabase/client";

/**
 * TenantStage — owns tenant bind for startup (RI-001).
 * Who starts Tenant? → TenantStage (ADR 0052).
 *
 * When ActiveTenant is bound (approved membership only), materializes the
 * individual Customer via existing `ensure_individual_customer` RPC.
 */
export const TenantStage: BootstrapStageHandler = {
  id: "tenant",
  blocking: true,
  async run(ctx) {
    if (!ctx.hasSession || !ctx.userId) {
      return {
        status: "failed",
        error: {
          code: "TENANT_MISSING",
          stage: "tenant",
          message: "Tenant stage requires session",
          recoverable: true,
        },
      };
    }

    const userId = ctx.userId;

    try {
      const snap = getBootstrapIdentitySnapshot();
      const data =
        snap.userId === userId && snap.status !== "idle"
          ? {
              userId,
              roles: snap.roles,
              profile: snap.profile,
              tenant: snap.tenant,
            }
          : await loadSessionIdentity(userId);

      const { tenant, tenantId } = resolveTenantFromSessionIdentity(data);

      publishBootstrapIdentitySnapshot({
        userId,
        tenant,
        status: "loading",
      });

      const notes = [
        "tenant:owned_by_tenant_stage",
        tenantId
          ? "tenant:bound"
          : "tenant:none_membership_ok_for_platform",
      ];
      const evidence: Record<string, unknown> = {
        tenantId,
        hasTenant: Boolean(tenantId),
      };

      // Operational Invariant (AUTH USER != CUSTOMER):
      // TenantStage owns tenant binding only (ADR 0052).
      // Administrators and staff are NOT automatically materialized as customers in public.customers.
      // Customer records are created exclusively via customer onboarding or customer-specific registration flows.
      if (tenantId) {
        notes.push("customer:independent_domain_model");
      } else {
        notes.push("customer:skipped_no_active_tenant");
      }

      return {
        status: "ok",
        notes,
        evidence,
        patch: { tenantId },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        status: "failed",
        error: {
          code: "TENANT_MISSING",
          stage: "tenant",
          message,
          recoverable: true,
        },
      };
    }
  },
};
