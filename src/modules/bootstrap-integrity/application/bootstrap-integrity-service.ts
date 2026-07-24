/**
 * BootstrapIntegrityService — load tenant snapshot and audit impossible states.
 * Used by admin readiness UI and `npm run bootstrap:verify`.
 */
import type { ServiceContext } from "@/services/types";
import { requireCapability } from "@/permissions";
import {
  auditBootstrapIntegrity,
  resolveBootstrapStage,
  type BootstrapSnapshot,
  type IntegrityAuditItem,
} from "../domain/bootstrap-preconditions";

export type BootstrapIntegrityReport = {
  tenantId: string;
  stage: ReturnType<typeof resolveBootstrapStage>;
  snapshot: BootstrapSnapshot;
  items: IntegrityAuditItem[];
  blocked: IntegrityAuditItem[];
};

async function count(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  table: string,
  apply: (q: any) => any,
): Promise<number> {
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  q = apply(q);
  const { count: n, error } = await q;
  if (error) throw error;
  return n ?? 0;
}

export const BootstrapIntegrityService = {
  async snapshotForTenant(
    ctx: ServiceContext,
  ): Promise<BootstrapSnapshot> {
    requireCapability(ctx.roles, "orders.read");
    const db = ctx.supabase;
    const tenantId = ctx.tenantId;

    const [
      companyAdminCount,
      staffCount,
      activeDishCount,
      publishedMenuCount,
      customerCount,
      confirmedOrderCount,
      kitchenQueueCount,
      readyForDeliveryCount,
      deliveredCount,
    ] = await Promise.all([
      count(db, "user_roles", (q) =>
        q.eq("tenant_id", tenantId).eq("role", "company_admin"),
      ),
      count(db, "user_roles", (q) =>
        q
          .eq("tenant_id", tenantId)
          .in("role", ["kitchen", "delivery", "operations_manager", "logistics"]),
      ),
      count(db, "dishes", (q) =>
        q.eq("tenant_id", tenantId).eq("status", "active").is("deleted_at", null),
      ),
      count(db, "weekly_menus", (q) =>
        q
          .eq("tenant_id", tenantId)
          .eq("status", "published")
          .is("deleted_at", null),
      ),
      count(db, "customers", (q) => q.eq("tenant_id", tenantId)),
      count(db, "orders", (q) =>
        q.eq("tenant_id", tenantId).eq("status", "confirmed"),
      ),
      count(db, "orders", (q) =>
        q
          .eq("tenant_id", tenantId)
          .in("status", ["confirmed", "in_production", "prepared"]),
      ),
      count(db, "orders", (q) =>
        q.eq("tenant_id", tenantId).eq("status", "ready_for_delivery"),
      ),
      count(db, "orders", (q) =>
        q.eq("tenant_id", tenantId).eq("status", "delivered"),
      ),
    ]);

    return {
      tenantCount: 1,
      companyAdminCount,
      staffCount,
      activeDishCount,
      publishedMenuCount,
      customerCount,
      confirmedOrderCount,
      kitchenQueueCount,
      readyForDeliveryCount,
      deliveredCount,
    };
  },

  async audit(ctx: ServiceContext): Promise<BootstrapIntegrityReport> {
    const snapshot = await this.snapshotForTenant(ctx);
    const items = auditBootstrapIntegrity(snapshot);
    return {
      tenantId: ctx.tenantId,
      stage: resolveBootstrapStage(snapshot),
      snapshot,
      items,
      blocked: items.filter((i) => !i.verdict.ok),
    };
  },
};
