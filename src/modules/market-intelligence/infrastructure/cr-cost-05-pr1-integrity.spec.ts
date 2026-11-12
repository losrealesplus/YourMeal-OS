import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("CR-COST-05 PR1: Integrity, RLS Hardening & Private Tenant Scoping", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase/migrations/20261112180000_cr_cost_05_pr1_integrity_and_rls.sql",
  );
  const rollbackPath = path.resolve(
    process.cwd(),
    "supabase/migrations/rollback/20261112180000_cr_cost_05_pr1_integrity_and_rls_down.sql",
  );

  it("verifies PR1 migration and rollback scripts exist", () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    expect(fs.existsSync(rollbackPath)).toBe(true);
  });

  it("adds nullable owner_tenant_id, FK indexes, removes redundant index, and secures trigger search_path", () => {
    const sql = fs.readFileSync(migrationPath, "utf8");

    expect(sql).toContain(
      "ADD COLUMN IF NOT EXISTS owner_tenant_id uuid NULL REFERENCES public.tenants(id) ON DELETE CASCADE",
    );
    expect(sql).toContain("DROP INDEX IF EXISTS public.idx_market_products_source_sku");
    expect(sql).toContain("CREATE INDEX IF NOT EXISTS idx_market_volume_tiers_observation");
    expect(sql).toContain("CREATE INDEX IF NOT EXISTS idx_market_price_obs_owner_product_date");
    expect(sql).toContain("SET search_path = public, pg_temp");
    expect(sql).toContain("OLD.owner_tenant_id IS DISTINCT FROM NEW.owner_tenant_id");
    expect(sql).toContain("OLD.imported_by IS DISTINCT FROM NEW.imported_by");
  });

  it("enforces RLS hardening across market_products, market_price_observations, market_volume_tiers, and product_mappings", () => {
    const sql = fs.readFileSync(migrationPath, "utf8");

    // Column-level UPDATE grant for idempotent valid_to / metadata updates only
    expect(sql).toContain(
      "GRANT UPDATE (valid_to, quality_status, promotion_status, raw_payload)\n  ON public.market_price_observations TO authenticated",
    );

    // market_products INSERT for approved staff, UPDATE strictly for SaaS admin
    expect(sql).toContain("CREATE POLICY market_products_write_staff ON public.market_products");
    expect(sql).toContain("CREATE POLICY market_products_update_staff ON public.market_products");
    expect(sql).toContain("tm.status = 'approved'");
    expect(sql).toContain("tm.deleted_at IS NULL");
    expect(sql).toContain("public.has_any_staff_role(auth.uid(), tm.tenant_id)");

    // market_price_observations: public rows (owner_tenant_id IS NULL) writable ONLY by SaaS admin;
    // private tariffs scoped strictly to owner_tenant_id staff
    expect(sql).toContain(
      "owner_tenant_id IS NULL\n    OR public.is_tenant_member(owner_tenant_id)",
    );
    expect(sql).toContain("owner_tenant_id IS NULL\n        AND public.is_saas_admin(auth.uid())");
    expect(sql).toContain(
      "CREATE POLICY market_price_obs_update_staff ON public.market_price_observations",
    );

    // market_volume_tiers scoped SELECT & missing INSERT policy
    expect(sql).toContain(
      "CREATE POLICY market_volume_tiers_insert_staff ON public.market_volume_tiers",
    );

    // product_mappings split policies including staff-gated DELETE
    expect(sql).toContain(
      "DROP POLICY IF EXISTS product_mappings_tenant_write ON public.product_mappings",
    );
    expect(sql).toContain(
      "CREATE POLICY product_mappings_tenant_insert ON public.product_mappings",
    );
    expect(sql).toContain(
      "CREATE POLICY product_mappings_tenant_update ON public.product_mappings",
    );
    expect(sql).toContain(
      "CREATE POLICY product_mappings_tenant_delete ON public.product_mappings",
    );
    expect(sql).toContain("FOR DELETE TO authenticated");
  });

  it("verifies rollback script reverses PR1 changes cleanly", () => {
    const downSql = fs.readFileSync(rollbackPath, "utf8");
    expect(downSql).toContain("DROP POLICY IF EXISTS product_mappings_tenant_delete");
    expect(downSql).toContain(
      "REVOKE UPDATE ON public.market_price_observations FROM authenticated",
    );
    expect(downSql).toContain("DROP COLUMN IF EXISTS owner_tenant_id");
  });
});
