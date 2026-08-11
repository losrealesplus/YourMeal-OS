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

      // ActiveTenant only exists for approved membership — gate for materialization.
      if (tenantId) {
        try {
          const { data: authUser } = await supabase.auth.getUser();
          const email = authUser.user?.email ?? null;
          const displayName =
            data.profile?.fullName ??
            (authUser.user?.user_metadata?.full_name as string | undefined) ??
            null;
          const { customerId } = await ensureCustomerForActiveTenant({
            userId,
            tenantId,
            displayName,
            email,
          });
          notes.push("customer:materialized");
          evidence.customerId = customerId;
        } catch (matErr) {
          // Do not block navigation — membership/access already decided.
          // Surface in evidence for operators / E2E forensic.
          const matMsg =
            matErr instanceof Error ? matErr.message : String(matErr);
          notes.push("customer:materialization_failed");
          evidence.customerMaterializationError = matMsg;
        }
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
