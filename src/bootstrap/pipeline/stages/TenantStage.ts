import type { BootstrapStageHandler } from "./BootstrapStage";
import { resolveTenantFromSessionIdentity } from "../services/TenantBootstrapService";
import { loadSessionIdentity } from "../services/SessionBootstrapService";
import {
  getBootstrapIdentitySnapshot,
  publishBootstrapIdentitySnapshot,
} from "../BootstrapIdentityStore";

/**
 * TenantStage — owns tenant bind for startup (RI-001).
 * Who starts Tenant? → TenantStage (ADR 0052).
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

    try {
      const snap = getBootstrapIdentitySnapshot();
      const data =
        snap.userId === ctx.userId && snap.status !== "idle"
          ? {
              userId: snap.userId,
              roles: snap.roles,
              profile: snap.profile,
              tenant: snap.tenant,
            }
          : await loadSessionIdentity(ctx.userId);

      const { tenant, tenantId } = resolveTenantFromSessionIdentity(data);

      publishBootstrapIdentitySnapshot({
        userId: ctx.userId,
        tenant,
        status: "loading",
      });

      // Null tenant is allowed (e.g. pure saas_admin) — identical to prior Provider.
      return {
        status: "ok",
        notes: [
          "tenant:owned_by_tenant_stage",
          tenantId
            ? "tenant:bound"
            : "tenant:none_membership_ok_for_platform",
        ],
        evidence: { tenantId, hasTenant: Boolean(tenantId) },
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
