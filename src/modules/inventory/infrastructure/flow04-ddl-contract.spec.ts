import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("FLOW-04 Inventory Consumption Persistence Bridge DDL Contract Verification", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase/migrations/20261024190000_flow04_inventory_consumption_persistence.sql",
  );
  const rollbackPath = path.resolve(
    process.cwd(),
    "supabase/migrations/rollback/20261024190000_flow04_inventory_consumption_persistence_down.sql",
  );

  it("verifies migration and rollback SQL files exist", () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    expect(fs.existsSync(rollbackPath)).toBe(true);
  });

  it("defines schema tables, constraints, indexes and strict direct write protection RLS policies", () => {
    const sql = fs.readFileSync(migrationPath, "utf8");

    // 1. inventory_consumptions table
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.inventory_consumptions");
    expect(sql).toContain("tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE");
    expect(sql).toContain("delivery_date date NOT NULL");
    expect(sql).toContain("status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'applied', 'sealed'))");
    expect(sql).toContain("CONSTRAINT uq_inventory_consumption_day UNIQUE (tenant_id, delivery_date)");
    expect(sql).toContain("ALTER TABLE public.inventory_consumptions ENABLE ROW LEVEL SECURITY;");
    expect(sql).toContain("REVOKE ALL ON public.inventory_consumptions FROM PUBLIC, anon, authenticated;");
    expect(sql).toContain("GRANT SELECT ON public.inventory_consumptions TO authenticated;");
    expect(sql).toContain("CREATE POLICY inventory_consumptions_staff ON public.inventory_consumptions");

    // 2. inventory_consumption_lines table
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.inventory_consumption_lines");
    expect(sql).toContain("consumption_id uuid NOT NULL REFERENCES public.inventory_consumptions(id) ON DELETE CASCADE");
    expect(sql).toContain("tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE");
    expect(sql).toContain("ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE RESTRICT");
    expect(sql).toContain("quantity numeric(12,3) NOT NULL CHECK (quantity > 0)");
    expect(sql).toContain("ALTER TABLE public.inventory_consumption_lines ENABLE ROW LEVEL SECURITY;");
    expect(sql).toContain("REVOKE ALL ON public.inventory_consumption_lines FROM PUBLIC, anon, authenticated;");
    expect(sql).toContain("GRANT SELECT ON public.inventory_consumption_lines TO authenticated;");
    expect(sql).toContain("CREATE POLICY inventory_consumption_lines_staff ON public.inventory_consumption_lines");
  });

  it("defines atomic plan creation RPC (T1) with idempotency, validation and actor security", () => {
    const sql = fs.readFileSync(migrationPath, "utf8");

    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.create_inventory_consumption_plan_v1");
    expect(sql).toContain("SECURITY DEFINER");
    expect(sql).toContain("SET search_path = public, auth, pg_temp");
    expect(sql).toContain("REVOKE ALL ON FUNCTION public.create_inventory_consumption_plan_v1 FROM PUBLIC, anon;");
    expect(sql).toContain("GRANT EXECUTE ON FUNCTION public.create_inventory_consumption_plan_v1 TO authenticated, service_role;");
    expect(sql).toContain("actor mismatch");
    expect(sql).toContain("FOR UPDATE");
  });

  it("defines atomic apply RPC (T2) with deterministic locking, grouped pre-validation, stock decrement and audit movement", () => {
    const sql = fs.readFileSync(migrationPath, "utf8");

    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.apply_inventory_consumption_v1");
    expect(sql).toContain("SECURITY DEFINER");
    expect(sql).toContain("SET search_path = public, auth, pg_temp");
    expect(sql).toContain("REVOKE ALL ON FUNCTION public.apply_inventory_consumption_v1 FROM PUBLIC, anon;");
    expect(sql).toContain("GRANT EXECUTE ON FUNCTION public.apply_inventory_consumption_v1 TO authenticated, service_role;");

    // Deterministic locking (ORDER BY id ASC FOR UPDATE)
    expect(sql).toContain("ORDER BY id ASC");
    expect(sql).toContain("FOR UPDATE");

    // Idempotency (FLOW04-I2)
    expect(sql).toContain("v_cons.status IN ('applied', 'sealed')");

    // Pre-validation before mutation (FLOW04-I3)
    expect(sql).toContain("insufficient_stock");

    // Stock movements logging & untouched WAC
    expect(sql).toContain("INSERT INTO public.stock_movements");
    expect(sql).toContain("'PRODUCTION_CONSUMPTION'");
    expect(sql).toContain("'PRODUCTION_ORDER'");
    expect(sql).toContain("v_ing.cost");
  });

  it("defines atomic seal RPC (T3) with terminal transition and no stock mutation", () => {
    const sql = fs.readFileSync(migrationPath, "utf8");

    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.seal_inventory_consumption_v1");
    expect(sql).toContain("SECURITY DEFINER");
    expect(sql).toContain("SET search_path = public, auth, pg_temp");
    expect(sql).toContain("REVOKE ALL ON FUNCTION public.seal_inventory_consumption_v1 FROM PUBLIC, anon;");
    expect(sql).toContain("GRANT EXECUTE ON FUNCTION public.seal_inventory_consumption_v1 TO authenticated, service_role;");
    expect(sql).toContain("status = 'sealed'");
  });

  it("defines non-destructive rollback script preserving audit data if records exist", () => {
    const sql = fs.readFileSync(rollbackPath, "utf8");
    expect(sql).toContain("REVOKE EXECUTE ON FUNCTION public.create_inventory_consumption_plan_v1");
    expect(sql).toContain("REVOKE EXECUTE ON FUNCTION public.apply_inventory_consumption_v1");
    expect(sql).toContain("REVOKE EXECUTE ON FUNCTION public.seal_inventory_consumption_v1");
    expect(sql).toContain("DROP FUNCTION IF EXISTS public.create_inventory_consumption_plan_v1");
    expect(sql).toContain("DROP FUNCTION IF EXISTS public.apply_inventory_consumption_v1");
    expect(sql).toContain("DROP FUNCTION IF EXISTS public.seal_inventory_consumption_v1");
    expect(sql).toContain("inventory_consumptions");
    expect(sql).toContain("pérdida de datos");
  });
});
