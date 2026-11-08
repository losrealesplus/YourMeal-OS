import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { assertNonNegativePhysicalStock } from "../domain/spatial-topology";

const DB_CONTAINER = "supabase_db_djangucecsphnejplvic";

function runPsql(sql: string): string {
  return execFileSync(
    "docker",
    ["exec", "-i", DB_CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-t", "-A", "-c", sql],
    { encoding: "utf8" },
  ).trim();
}

function extractLastJson(output: string): any {
  const lines = output.split("\n").filter((l) => l.trim().startsWith("{"));
  if (lines.length === 0) throw new Error(`No JSON line found in psql output:\n${output}`);
  return JSON.parse(lines[lines.length - 1].trim());
}

describe("Gate B · PR B1: Spatial Inventory Topology, Composite Integrity & Backfill Suite", () => {
  const migration1Path = path.resolve(
    process.cwd(),
    "supabase/migrations/20261107210000_gate_b1_spatial_topology_and_inventory_balances.sql",
  );
  const migration2Path = path.resolve(
    process.cwd(),
    "supabase/migrations/20261107210100_gate_b1_inventory_backfill_procedure.sql",
  );
  const migration3Path = path.resolve(
    process.cwd(),
    "supabase/migrations/20261107210200_gate_b1_spatial_transactional_bridge.sql",
  );
  const rollback1Path = path.resolve(
    process.cwd(),
    "supabase/migrations/rollback/20261107210000_gate_b1_spatial_topology_and_inventory_balances_down.sql",
  );
  const rollback2Path = path.resolve(
    process.cwd(),
    "supabase/migrations/rollback/20261107210100_gate_b1_inventory_backfill_procedure_down.sql",
  );
  const rollback3Path = path.resolve(
    process.cwd(),
    "supabase/migrations/rollback/20261107210200_gate_b1_spatial_transactional_bridge_down.sql",
  );

  it("verifies migration and rollback SQL files exist and are strictly ordered before 20261108", () => {
    expect(fs.existsSync(migration1Path)).toBe(true);
    expect(fs.existsSync(migration2Path)).toBe(true);
    expect(fs.existsSync(migration3Path)).toBe(true);
    expect(fs.existsSync(rollback1Path)).toBe(true);
    expect(fs.existsSync(rollback2Path)).toBe(true);
    expect(fs.existsSync(rollback3Path)).toBe(true);

    const m1Name = path.basename(migration1Path);
    const m2Name = path.basename(migration2Path);
    const m3Name = path.basename(migration3Path);
    expect(m1Name.startsWith("20261107")).toBe(true);
    expect(m2Name.startsWith("20261107")).toBe(true);
    expect(m3Name.startsWith("20261107")).toBe(true);
    expect(m1Name < m2Name).toBe(true);
    expect(m2Name < m3Name).toBe(true);
  });

  it("domain helper enforces physical non-negativity constraint", () => {
    expect(() => assertNonNegativePhysicalStock(10.5)).not.toThrow();
    expect(() => assertNonNegativePhysicalStock(0)).not.toThrow();
    expect(() => assertNonNegativePhysicalStock(-0.001)).toThrow(/PHYSICAL_STOCK_CANNOT_BE_NEGATIVE/);
  });

  // ==========================================================================
  // Test B1-T01: Multi-Tenant RLS Isolation
  // ==========================================================================
  it("B1-T01: isolates inventory balances between tenants under RLS", () => {
    const res = runPsql(`
      BEGIN;
      INSERT INTO public.tenants (id, name, slug) VALUES 
        ('ba010000-0000-0000-0000-000000000001', 'Tenant Alpha B1', 'tenant-alpha-b1'),
        ('ba010000-0000-0000-0000-000000000002', 'Tenant Beta B1', 'tenant-beta-b1');

      INSERT INTO public.production_centers (id, tenant_id, code, name) VALUES
        ('ca010000-0000-0000-0000-000000000001', 'ba010000-0000-0000-0000-000000000001', 'C-ALPHA', 'Center Alpha'),
        ('ca010000-0000-0000-0000-000000000002', 'ba010000-0000-0000-0000-000000000002', 'C-BETA', 'Center Beta');

      INSERT INTO public.warehouses (id, tenant_id, center_id, code, name) VALUES
        ('da010000-0000-0000-0000-000000000001', 'ba010000-0000-0000-0000-000000000001', 'ca010000-0000-0000-0000-000000000001', 'W-ALPHA', 'Warehouse Alpha'),
        ('da010000-0000-0000-0000-000000000002', 'ba010000-0000-0000-0000-000000000002', 'ca010000-0000-0000-0000-000000000002', 'W-BETA', 'Warehouse Beta');

      INSERT INTO public.inventory_locations (id, tenant_id, center_id, warehouse_id, code, name) VALUES
        ('ea010000-0000-0000-0000-000000000001', 'ba010000-0000-0000-0000-000000000001', 'ca010000-0000-0000-0000-000000000001', 'da010000-0000-0000-0000-000000000001', 'LOC-A', 'Loc Alpha'),
        ('ea010000-0000-0000-0000-000000000002', 'ba010000-0000-0000-0000-000000000002', 'ca010000-0000-0000-0000-000000000002', 'da010000-0000-0000-0000-000000000002', 'LOC-B', 'Loc Beta');

      INSERT INTO public.ingredients (id, tenant_id, name, unit, cost, stock) VALUES
        ('fa010000-0000-0000-0000-000000000001', 'ba010000-0000-0000-0000-000000000001', 'Harina Alpha', 'kg', 1.0, 100),
        ('fa010000-0000-0000-0000-000000000002', 'ba010000-0000-0000-0000-000000000002', 'Harina Beta', 'kg', 1.0, 200);

      INSERT INTO public.inventory_balances (id, tenant_id, center_id, warehouse_id, location_id, ingredient_id, stock_quantity) VALUES
        ('aa010000-0000-0000-0000-000000000001', 'ba010000-0000-0000-0000-000000000001', 'ca010000-0000-0000-0000-000000000001', 'da010000-0000-0000-0000-000000000001', 'ea010000-0000-0000-0000-000000000001', 'fa010000-0000-0000-0000-000000000001', 50.000),
        ('aa010000-0000-0000-0000-000000000002', 'ba010000-0000-0000-0000-000000000002', 'ca010000-0000-0000-0000-000000000002', 'da010000-0000-0000-0000-000000000002', 'ea010000-0000-0000-0000-000000000002', 'fa010000-0000-0000-0000-000000000002', 80.000);

      INSERT INTO auth.users (id, email) VALUES ('fa010000-0000-0000-0000-000000000099', 'user-alpha@test.com') ON CONFLICT DO NOTHING;
      INSERT INTO public.tenant_members (user_id, tenant_id, status) VALUES ('fa010000-0000-0000-0000-000000000099', 'ba010000-0000-0000-0000-000000000001', 'approved') ON CONFLICT DO NOTHING;
      INSERT INTO public.user_roles (user_id, tenant_id, role) VALUES ('fa010000-0000-0000-0000-000000000099', 'ba010000-0000-0000-0000-000000000001', 'company_admin'::public.app_role) ON CONFLICT DO NOTHING;

      -- Test as User Alpha under RLS
      SET LOCAL ROLE authenticated;
      SET LOCAL "request.jwt.claim.sub" = 'fa010000-0000-0000-0000-000000000099';
      SET LOCAL "request.jwt.claims" = '{"sub":"fa010000-0000-0000-0000-000000000099","role":"authenticated"}';

      SELECT json_build_object(
        'visible_balances_count', (SELECT count(*) FROM public.inventory_balances),
        'visible_tenants', (SELECT array_agg(DISTINCT tenant_id) FROM public.inventory_balances)
      );
      ROLLBACK;
    `);

    const parsed = extractLastJson(res);
    expect(parsed.visible_balances_count).toBe(1);
    expect(parsed.visible_tenants).toEqual(["ba010000-0000-0000-0000-000000000001"]);
  });

  // ==========================================================================
  // Test B1-T02: Inter-Center RBAC Isolation
  // ==========================================================================
  it("B1-T02: restricts center operator to only assigned center balances", () => {
    const res = runPsql(`
      BEGIN;
      INSERT INTO public.tenants (id, name, slug) VALUES 
        ('ba020000-0000-0000-0000-000000000001', 'Tenant Multi-Center', 'tenant-multi-center');

      INSERT INTO public.production_centers (id, tenant_id, code, name) VALUES
        ('ca020000-0000-0000-0000-000000000001', 'ba020000-0000-0000-0000-000000000001', 'C-NORTE', 'Centro Norte'),
        ('ca020000-0000-0000-0000-000000000002', 'ba020000-0000-0000-0000-000000000001', 'C-SUR', 'Centro Sur');

      INSERT INTO public.warehouses (id, tenant_id, center_id, code, name) VALUES
        ('da020000-0000-0000-0000-000000000001', 'ba020000-0000-0000-0000-000000000001', 'ca020000-0000-0000-0000-000000000001', 'W-NORTE', 'Almacén Norte'),
        ('da020000-0000-0000-0000-000000000002', 'ba020000-0000-0000-0000-000000000001', 'ca020000-0000-0000-0000-000000000002', 'W-SUR', 'Almacén Sur');

      INSERT INTO public.inventory_locations (id, tenant_id, center_id, warehouse_id, code, name) VALUES
        ('ea020000-0000-0000-0000-000000000001', 'ba020000-0000-0000-0000-000000000001', 'ca020000-0000-0000-0000-000000000001', 'da020000-0000-0000-0000-000000000001', 'LOC-N1', 'Loc Norte 1'),
        ('ea020000-0000-0000-0000-000000000002', 'ba020000-0000-0000-0000-000000000001', 'ca020000-0000-0000-0000-000000000002', 'da020000-0000-0000-0000-000000000002', 'LOC-S1', 'Loc Sur 1');

      INSERT INTO public.ingredients (id, tenant_id, name, unit, cost, stock) VALUES
        ('fa020000-0000-0000-0000-000000000001', 'ba020000-0000-0000-0000-000000000001', 'Aceite Oliva', 'l', 5.0, 50);

      INSERT INTO public.inventory_balances (id, tenant_id, center_id, warehouse_id, location_id, ingredient_id, stock_quantity) VALUES
        ('aa020000-0000-0000-0000-000000000001', 'ba020000-0000-0000-0000-000000000001', 'ca020000-0000-0000-0000-000000000001', 'da020000-0000-0000-0000-000000000001', 'ea020000-0000-0000-0000-000000000001', 'fa020000-0000-0000-0000-000000000001', 20.000),
        ('aa020000-0000-0000-0000-000000000002', 'ba020000-0000-0000-0000-000000000001', 'ca020000-0000-0000-0000-000000000002', 'da020000-0000-0000-0000-000000000002', 'ea020000-0000-0000-0000-000000000002', 'fa020000-0000-0000-0000-000000000001', 30.000);

      INSERT INTO auth.users (id, email) VALUES ('fa020000-0000-0000-0000-000000000099', 'cook-norte@test.com') ON CONFLICT DO NOTHING;
      INSERT INTO public.tenant_members (user_id, tenant_id, status) VALUES ('fa020000-0000-0000-0000-000000000099', 'ba020000-0000-0000-0000-000000000001', 'approved') ON CONFLICT DO NOTHING;
      INSERT INTO public.user_roles (user_id, tenant_id, role) VALUES ('fa020000-0000-0000-0000-000000000099', 'ba020000-0000-0000-0000-000000000001', 'kitchen'::public.app_role) ON CONFLICT DO NOTHING;

      -- Explicit assignment to Centro Norte only
      INSERT INTO public.user_center_assignments (tenant_id, user_id, center_id) VALUES
        ('ba020000-0000-0000-0000-000000000001', 'fa020000-0000-0000-0000-000000000099', 'ca020000-0000-0000-0000-000000000001');

      -- Test as cook-norte under RLS
      SET LOCAL ROLE authenticated;
      SET LOCAL "request.jwt.claim.sub" = 'fa020000-0000-0000-0000-000000000099';
      SET LOCAL "request.jwt.claims" = '{"sub":"fa020000-0000-0000-0000-000000000099","role":"authenticated"}';

      SELECT json_build_object(
        'visible_centers', (SELECT array_agg(DISTINCT center_id) FROM public.inventory_balances),
        'visible_count', (SELECT count(*) FROM public.inventory_balances)
      );
      ROLLBACK;
    `);

    const parsed = extractLastJson(res);
    expect(parsed.visible_count).toBe(1);
    expect(parsed.visible_centers).toEqual(["ca020000-0000-0000-0000-000000000001"]);
  });

  // ==========================================================================
  // Test B1-T03: Backfill Idempotency
  // ==========================================================================
  it("B1-T03: executes backfill multiple times idempotently without duplicating balances", () => {
    const res = runPsql(`
      BEGIN;
      INSERT INTO public.tenants (id, name, slug) VALUES 
        ('ba030000-0000-0000-0000-000000000001', 'Tenant Idempotent', 'tenant-idempotent');

      INSERT INTO public.ingredients (id, tenant_id, name, unit, cost, stock) VALUES
        ('fa030000-0000-0000-0000-000000000001', 'ba030000-0000-0000-0000-000000000001', 'Arroz', 'kg', 1.2, 75.000),
        ('fa030000-0000-0000-0000-000000000002', 'ba030000-0000-0000-0000-000000000001', 'Lentejas', 'kg', 1.5, 40.000);

      -- Run backfill pass 1
      SELECT public.execute_gate_b1_backfill_v1();
      
      -- Run backfill pass 2 (immediate re-run)
      SELECT public.execute_gate_b1_backfill_v1();

      SELECT json_build_object(
        'final_count', (SELECT count(*) FROM public.inventory_balances WHERE tenant_id = 'ba030000-0000-0000-0000-000000000001'),
        'centers_count', (SELECT count(*) FROM public.production_centers WHERE tenant_id = 'ba030000-0000-0000-0000-000000000001')
      );
      ROLLBACK;
    `);

    const lastJson = extractLastJson(res);
    expect(lastJson.final_count).toBe(2);
    expect(lastJson.centers_count).toBe(1);
  });

  // ==========================================================================
  // Test B1-T04: Surgical Rollback Limited by Execution ID
  // ==========================================================================
  it("B1-T04: rolls back only entities and balances created by that specific execution", () => {
    // Step 1: Ensure clean state for tenant, then create test tenant with a pre-existing manual center and run backfill
    const step1 = runPsql(`
      DELETE FROM public.inventory_balances WHERE tenant_id = 'ba040000-0000-0000-0000-000000000001';
      DELETE FROM public.inventory_backfill_discrepancies WHERE tenant_id = 'ba040000-0000-0000-0000-000000000001';
      DELETE FROM public.inventory_backfill_executions WHERE tenant_id = 'ba040000-0000-0000-0000-000000000001';
      DELETE FROM public.inventory_locations WHERE tenant_id = 'ba040000-0000-0000-0000-000000000001';
      DELETE FROM public.warehouses WHERE tenant_id = 'ba040000-0000-0000-0000-000000000001';
      DELETE FROM public.production_centers WHERE tenant_id = 'ba040000-0000-0000-0000-000000000001';
      DELETE FROM public.tenants WHERE id = 'ba040000-0000-0000-0000-000000000001';

      BEGIN;
      INSERT INTO public.tenants (id, name, slug) VALUES 
        ('ba040000-0000-0000-0000-000000000001', 'Tenant Rollback Lab', 'tenant-rollback-lab');

      -- Pre-existing center created manually before backfill
      INSERT INTO public.production_centers (id, tenant_id, code, name) VALUES
        ('ca040000-0000-0000-0000-000000000099', 'ba040000-0000-0000-0000-000000000001', 'CENTRO-PREEXISTENTE', 'Centro Manual');

      INSERT INTO public.ingredients (id, tenant_id, name, unit, cost, stock) VALUES
        ('fa040000-0000-0000-0000-000000000001', 'ba040000-0000-0000-0000-000000000001', 'Sal Marina', 'kg', 0.5, 15.000);

      -- Run backfill
      SELECT public.execute_gate_b1_backfill_v1();

      -- Return the execution ID as JSON
      SELECT json_build_object(
        'execution_id', (
          SELECT execution_id FROM public.inventory_backfill_executions 
          WHERE tenant_id = 'ba040000-0000-0000-0000-000000000001'
          ORDER BY executed_at DESC LIMIT 1
        )
      );
      COMMIT;
    `);

    const { execution_id } = extractLastJson(step1);
    expect(execution_id).toBeDefined();

    // Step 2: Rollback the backfill using execution_id and assert surgical precision
    const rollbackRes = runPsql(`
      BEGIN;
      SELECT public.rollback_gate_b1_backfill_v1('${execution_id}'::uuid);

      SELECT json_build_object(
        'preexisting_center_still_exists', EXISTS (
          SELECT 1 FROM public.production_centers 
          WHERE id = 'ca040000-0000-0000-0000-000000000099'
        ),
        'migrated_balances_remaining', (
          SELECT count(*) FROM public.inventory_balances 
          WHERE tenant_id = 'ba040000-0000-0000-0000-000000000001'
        )
      );
      -- Clean up test tenant
      DELETE FROM public.inventory_balances WHERE tenant_id = 'ba040000-0000-0000-0000-000000000001';
      DELETE FROM public.inventory_backfill_discrepancies WHERE tenant_id = 'ba040000-0000-0000-0000-000000000001';
      DELETE FROM public.inventory_backfill_executions WHERE tenant_id = 'ba040000-0000-0000-0000-000000000001';
      DELETE FROM public.inventory_locations WHERE tenant_id = 'ba040000-0000-0000-0000-000000000001';
      DELETE FROM public.warehouses WHERE tenant_id = 'ba040000-0000-0000-0000-000000000001';
      DELETE FROM public.production_centers WHERE tenant_id = 'ba040000-0000-0000-0000-000000000001';
      DELETE FROM public.tenants WHERE id = 'ba040000-0000-0000-0000-000000000001';
      COMMIT;
    `);

    const finalResult = extractLastJson(rollbackRes);
    expect(finalResult.preexisting_center_still_exists).toBe(true);
    expect(finalResult.migrated_balances_remaining).toBe(0);
  });

  // ==========================================================================
  // Test B1-T05: Legacy Negative Stock Preserved as Audit Discrepancy
  // ==========================================================================
  it("B1-T05: records legacy negative stock as discrepancy without silent truncation", () => {
    const res = runPsql(`
      BEGIN;
      INSERT INTO public.tenants (id, name, slug) VALUES 
        ('ba050000-0000-0000-0000-000000000001', 'Tenant Negative Stock Lab', 'tenant-negative-stock');

      -- Ingredient with legacy negative stock
      INSERT INTO public.ingredients (id, tenant_id, name, unit, cost, stock) VALUES
        ('fa050000-0000-0000-0000-000000000001', 'ba050000-0000-0000-0000-000000000001', 'Solomillo Negativo', 'kg', 24.0, -18.500);

      -- Run backfill
      SELECT public.execute_gate_b1_backfill_v1();

      SELECT json_build_object(
        'physical_stock', (
          SELECT stock_quantity FROM public.inventory_balances 
          WHERE tenant_id = 'ba050000-0000-0000-0000-000000000001' 
            AND ingredient_id = 'fa050000-0000-0000-0000-000000000001'
        ),
        'discrepancy_legacy_qty', (
          SELECT legacy_stock_quantity FROM public.inventory_backfill_discrepancies 
          WHERE tenant_id = 'ba050000-0000-0000-0000-000000000001' 
            AND ingredient_id = 'fa050000-0000-0000-0000-000000000001'
        ),
        'discrepancy_qty', (
          SELECT discrepancy_quantity FROM public.inventory_backfill_discrepancies 
          WHERE tenant_id = 'ba050000-0000-0000-0000-000000000001' 
            AND ingredient_id = 'fa050000-0000-0000-0000-000000000001'
        ),
        'discrepancy_status', (
          SELECT status FROM public.inventory_backfill_discrepancies 
          WHERE tenant_id = 'ba050000-0000-0000-0000-000000000001' 
            AND ingredient_id = 'fa050000-0000-0000-0000-000000000001'
        )
      );
      ROLLBACK;
    `);

    const out = extractLastJson(res);
    expect(Number(out.physical_stock)).toBe(0.0);
    expect(Number(out.discrepancy_legacy_qty)).toBe(-18.5);
    expect(Number(out.discrepancy_qty)).toBe(18.5);
    expect(out.discrepancy_status).toBe("PENDING_AUDIT_REGULARIZATION");
  });

  // ==========================================================================
  // Test B1-T06: Single Default Location Per Warehouse Invariant
  // ==========================================================================
  it("B1-T06: rejects second default location in the same warehouse (unique index violation)", () => {
    let errorCaught = false;
    try {
      runPsql(`
        BEGIN;
        INSERT INTO public.tenants (id, name, slug) VALUES 
          ('ba060000-0000-0000-0000-000000000001', 'Tenant Default Loc', 'tenant-default-loc');

        INSERT INTO public.production_centers (id, tenant_id, code, name) VALUES
          ('ca060000-0000-0000-0000-000000000001', 'ba060000-0000-0000-0000-000000000001', 'C-DEF', 'Center Default');

        INSERT INTO public.warehouses (id, tenant_id, center_id, code, name) VALUES
          ('da060000-0000-0000-0000-000000000001', 'ba060000-0000-0000-0000-000000000001', 'ca060000-0000-0000-0000-000000000001', 'W-DEF', 'Warehouse Default');

        -- Location 1 with is_default = true
        INSERT INTO public.inventory_locations (id, tenant_id, center_id, warehouse_id, code, name, is_default) VALUES
          ('ea060000-0000-0000-0000-000000000001', 'ba060000-0000-0000-0000-000000000001', 'ca060000-0000-0000-0000-000000000001', 'da060000-0000-0000-0000-000000000001', 'LOC-D1', 'Default 1', true);

        -- Location 2 with is_default = true in same warehouse (MUST FAIL)
        INSERT INTO public.inventory_locations (id, tenant_id, center_id, warehouse_id, code, name, is_default) VALUES
          ('ea060000-0000-0000-0000-000000000002', 'ba060000-0000-0000-0000-000000000001', 'ca060000-0000-0000-0000-000000000001', 'da060000-0000-0000-0000-000000000001', 'LOC-D2', 'Default 2', true);
        ROLLBACK;
      `);
    } catch (err: any) {
      errorCaught = true;
      expect(err.message || "").toContain("uq_warehouse_single_default_location");
    }
    expect(errorCaught).toBe(true);
  });

  // ==========================================================================
  // Test B1-T07: Composite Foreign Key Hierarchy (Cross-Reference Rejection)
  // ==========================================================================
  it("B1-T07: rejects cross-referencing locations from different centers via composite FK", () => {
    let errorCaught = false;
    try {
      runPsql(`
        BEGIN;
        INSERT INTO public.tenants (id, name, slug) VALUES 
          ('ba070000-0000-0000-0000-000000000001', 'Tenant Cross-FK', 'tenant-cross-fk');

        INSERT INTO public.production_centers (id, tenant_id, code, name) VALUES
          ('ca070000-0000-0000-0000-000000000001', 'ba070000-0000-0000-0000-000000000001', 'C-1', 'Center 1'),
          ('ca070000-0000-0000-0000-000000000002', 'ba070000-0000-0000-0000-000000000001', 'C-2', 'Center 2');

        INSERT INTO public.warehouses (id, tenant_id, center_id, code, name) VALUES
          ('da070000-0000-0000-0000-000000000001', 'ba070000-0000-0000-0000-000000000001', 'ca070000-0000-0000-0000-000000000001', 'W-1', 'Wh 1'),
          ('da070000-0000-0000-0000-000000000002', 'ba070000-0000-0000-0000-000000000001', 'ca070000-0000-0000-0000-000000000002', 'W-2', 'Wh 2');

        INSERT INTO public.inventory_locations (id, tenant_id, center_id, warehouse_id, code, name) VALUES
          ('ea070000-0000-0000-0000-000000000001', 'ba070000-0000-0000-0000-000000000001', 'ca070000-0000-0000-0000-000000000001', 'da070000-0000-0000-0000-000000000001', 'L-1', 'Loc 1'),
          ('ea070000-0000-0000-0000-000000000002', 'ba070000-0000-0000-0000-000000000001', 'ca070000-0000-0000-0000-000000000002', 'da070000-0000-0000-0000-000000000002', 'L-2', 'Loc 2');

        INSERT INTO public.ingredients (id, tenant_id, name, unit, cost, stock) VALUES
          ('fa070000-0000-0000-0000-000000000001', 'ba070000-0000-0000-0000-000000000001', 'Tomate', 'kg', 1.8, 10);

        -- ILLEGAL: Center 1 paired with Warehouse 2 & Location 2 (which belong to Center 2)
        -- Must fail with foreign_key_violation on composite FK
        INSERT INTO public.inventory_balances (
          tenant_id, center_id, warehouse_id, location_id, ingredient_id, stock_quantity
        ) VALUES (
          'ba070000-0000-0000-0000-000000000001',
          'ca070000-0000-0000-0000-000000000001', -- Center 1
          'da070000-0000-0000-0000-000000000002', -- Wh 2 (belongs to Center 2!)
          'ea070000-0000-0000-0000-000000000002', -- Loc 2 (belongs to Wh 2 / Center 2!)
          'fa070000-0000-0000-0000-000000000001',
          5.000
        );
        ROLLBACK;
      `);
    } catch (err: any) {
      errorCaught = true;
      expect(err.message || "").toContain("fk_inventory_balances_location_composite");
    }
    expect(errorCaught).toBe(true);
  });

  // ==========================================================================
  // Test B1-T08: RBAC Privileges & Direct Write Protection
  // ==========================================================================
  it("B1-T08: revokes direct write permissions (INSERT/UPDATE/DELETE) on inventory_balances for authenticated users", () => {
    let insertDenied = false;
    try {
      runPsql(`
        BEGIN;
        INSERT INTO public.tenants (id, name, slug) VALUES 
          ('ba080000-0000-0000-0000-000000000001', 'Tenant Direct DML Denied', 'tenant-direct-dml');

        INSERT INTO auth.users (id, email) VALUES ('fa080000-0000-0000-0000-000000000099', 'hacker@test.com') ON CONFLICT DO NOTHING;
        INSERT INTO public.tenant_members (user_id, tenant_id, status) VALUES ('fa080000-0000-0000-0000-000000000099', 'ba080000-0000-0000-0000-000000000001', 'approved') ON CONFLICT DO NOTHING;

        -- Test as authenticated user attempting direct INSERT
        SET LOCAL ROLE authenticated;
        SET LOCAL "request.jwt.claim.sub" = 'fa080000-0000-0000-0000-000000000099';
        SET LOCAL "request.jwt.claims" = '{"sub":"fa080000-0000-0000-0000-000000000099","role":"authenticated"}';

        INSERT INTO public.inventory_balances (
          tenant_id, center_id, warehouse_id, location_id, ingredient_id, stock_quantity
        ) VALUES (
          'ba080000-0000-0000-0000-000000000001',
          gen_random_uuid(),
          gen_random_uuid(),
          gen_random_uuid(),
          gen_random_uuid(),
          999.000
        );
        ROLLBACK;
      `);
    } catch (err: any) {
      insertDenied = true;
      expect(err.message || "").toContain("permission denied for table inventory_balances");
    }
    expect(insertDenied).toBe(true);
  });

  // ==========================================================================
  // Test B1-T09: Transactional Bridge (Receipt -> Consumption -> View),
  // Absent Row Handling, Multi-Center Fail-Closed & Anti-Spoofing
  // ==========================================================================
  it("B1-T09: maintains zero divergence across purchase receipt, FLOW-04 consumption, and v_ingredient_stocks with fail-closed safeguards", () => {
    const res = runPsql(`
      BEGIN;
      INSERT INTO public.tenants (id, name, slug) VALUES 
        ('ba090000-0000-0000-0000-000000000001', 'Tenant B1-T09 Suite', 'tenant-b1-t09');

      INSERT INTO auth.users (id, email) VALUES 
        ('fa090000-0000-0000-0000-000000000001', 'b1-t09-op1@test.com'),
        ('fa090000-0000-0000-0000-000000000002', 'b1-t09-op2@test.com')
      ON CONFLICT DO NOTHING;

      INSERT INTO public.tenant_members (user_id, tenant_id, status) VALUES 
        ('fa090000-0000-0000-0000-000000000001', 'ba090000-0000-0000-0000-000000000001', 'approved'),
        ('fa090000-0000-0000-0000-000000000002', 'ba090000-0000-0000-0000-000000000001', 'approved')
      ON CONFLICT DO NOTHING;

      INSERT INTO public.user_roles (user_id, tenant_id, role) VALUES 
        ('fa090000-0000-0000-0000-000000000001', 'ba090000-0000-0000-0000-000000000001', 'kitchen'::public.app_role),
        ('fa090000-0000-0000-0000-000000000002', 'ba090000-0000-0000-0000-000000000001', 'kitchen'::public.app_role)
      ON CONFLICT DO NOTHING;

      INSERT INTO public.production_centers (id, tenant_id, code, name, is_active) VALUES
        ('ca090000-0000-0000-0000-000000000001', 'ba090000-0000-0000-0000-000000000001', 'CTR-09-A', 'Center 09 A', true);

      INSERT INTO public.warehouses (id, tenant_id, center_id, code, name, is_active) VALUES
        ('da090000-0000-0000-0000-000000000001', 'ba090000-0000-0000-0000-000000000001', 'ca090000-0000-0000-0000-000000000001', 'WH-09-A', 'Warehouse 09 A', true);

      INSERT INTO public.inventory_locations (id, tenant_id, center_id, warehouse_id, code, name, is_default, is_active) VALUES
        ('ea090000-0000-0000-0000-000000000001', 'ba090000-0000-0000-0000-000000000001', 'ca090000-0000-0000-0000-000000000001', 'da090000-0000-0000-0000-000000000001', 'LOC-09-A', 'Location 09 A', true, true);

      INSERT INTO public.user_center_assignments (id, tenant_id, user_id, center_id) VALUES
        (gen_random_uuid(), 'ba090000-0000-0000-0000-000000000001', 'fa090000-0000-0000-0000-000000000001', 'ca090000-0000-0000-0000-000000000001');

      INSERT INTO public.suppliers (id, tenant_id, name) VALUES
        ('ba090000-0000-0000-0000-0000000000a1', 'ba090000-0000-0000-0000-000000000001', 'Supplier 09');

      INSERT INTO public.ingredients (id, tenant_id, name, unit, cost, stock) VALUES
        ('ba090000-0000-0000-0000-0000000000b1', 'ba090000-0000-0000-0000-000000000001', 'Aceite Oliva T09', 'kg', 10.0000, 0.000);

      -- Check 1: Initial absent row
      SELECT count(*) INTO TEMPORARY TABLE t09_initial_absent
      FROM public.inventory_balances
      WHERE tenant_id = 'ba090000-0000-0000-0000-000000000001' AND ingredient_id = 'ba090000-0000-0000-0000-0000000000b1';

      -- Check 2: Execute Purchase Receipt (+8.000 kg)
      INSERT INTO public.purchase_invoices (id, tenant_id, supplier_id, invoice_number, invoice_date, status, total_amount) VALUES
        ('ba090000-0000-0000-0000-0000000000f1', 'ba090000-0000-0000-0000-000000000001', 'ba090000-0000-0000-0000-0000000000a1', 'INV-09-01', CURRENT_DATE, 'draft', 80.00);

      INSERT INTO public.purchase_invoice_items (
        id, purchase_invoice_id, tenant_id, item_nature, item_id, item_name, quantity, unit, unit_price, effective_unit_cost, line_total, received_quantity
      ) VALUES (
        'ba090000-0000-0000-0000-0000000000f2', 'ba090000-0000-0000-0000-0000000000f1', 'ba090000-0000-0000-0000-000000000001', 'INVENTORYABLE', 'ba090000-0000-0000-0000-0000000000b1', 'Aceite Oliva T09', 8.000, 'kg', 10.0000, 10.0000, 80.0000, 0.000
      );

      -- Emulate authenticated user 1 session claims
      SELECT set_config('request.jwt.claim.sub', 'fa090000-0000-0000-0000-000000000001', true);
      SELECT set_config('request.jwt.claim.role', 'authenticated', true);

      SELECT public.receive_purchase_invoice_v1('ba090000-0000-0000-0000-000000000001', 'ba090000-0000-0000-0000-0000000000f1') INTO TEMPORARY TABLE t09_receipt_res;

      SELECT 
        (SELECT stock FROM public.ingredients WHERE id = 'ba090000-0000-0000-0000-0000000000b1') AS legacy_post_receipt,
        (SELECT stock_quantity FROM public.inventory_balances WHERE ingredient_id = 'ba090000-0000-0000-0000-0000000000b1') AS spatial_post_receipt,
        (SELECT total_physical_stock FROM public.v_ingredient_stocks WHERE ingredient_id = 'ba090000-0000-0000-0000-0000000000b1') AS view_post_receipt
      INTO TEMPORARY TABLE t09_post_receipt;

      -- Check 3: Execute Kitchen Consumption (-3.000 kg)
      INSERT INTO public.inventory_consumptions (id, tenant_id, status, delivery_date) VALUES
        ('ba090000-0000-0000-0000-0000000000c1', 'ba090000-0000-0000-0000-000000000001', 'planned', CURRENT_DATE);

      INSERT INTO public.inventory_consumption_lines (id, consumption_id, tenant_id, ingredient_id, ingredient_name, quantity, unit) VALUES
        ('ba090000-0000-0000-0000-0000000000c2', 'ba090000-0000-0000-0000-0000000000c1', 'ba090000-0000-0000-0000-000000000001', 'ba090000-0000-0000-0000-0000000000b1', 'Aceite Oliva T09', 3.000, 'kg');

      SELECT public.apply_inventory_consumption_v1('ba090000-0000-0000-0000-000000000001', 'ba090000-0000-0000-0000-0000000000c1') INTO TEMPORARY TABLE t09_cons_res;

      SELECT 
        (SELECT stock FROM public.ingredients WHERE id = 'ba090000-0000-0000-0000-0000000000b1') AS legacy_post_cons,
        (SELECT stock_quantity FROM public.inventory_balances WHERE ingredient_id = 'ba090000-0000-0000-0000-0000000000b1') AS spatial_post_cons,
        (SELECT total_physical_stock FROM public.v_ingredient_stocks WHERE ingredient_id = 'ba090000-0000-0000-0000-0000000000b1') AS view_post_cons
      INTO TEMPORARY TABLE t09_post_consumption;

      -- Check 4: Multi-Center Fail-Closed Check
      INSERT INTO public.production_centers (id, tenant_id, code, name, is_active) VALUES
        ('ca090000-0000-0000-0000-000000000002', 'ba090000-0000-0000-0000-000000000001', 'CTR-09-B', 'Center 09 B', true);

      INSERT INTO public.warehouses (id, tenant_id, center_id, code, name, is_active) VALUES
        ('da090000-0000-0000-0000-000000000002', 'ba090000-0000-0000-0000-000000000001', 'ca090000-0000-0000-0000-000000000002', 'WH-09-B', 'Warehouse 09 B', true);

      INSERT INTO public.inventory_locations (id, tenant_id, center_id, warehouse_id, code, name, is_default, is_active) VALUES
        ('ea090000-0000-0000-0000-000000000002', 'ba090000-0000-0000-0000-000000000001', 'ca090000-0000-0000-0000-000000000002', 'da090000-0000-0000-0000-000000000002', 'LOC-09-B', 'Location 09 B', true, true);

      INSERT INTO public.inventory_consumptions (id, tenant_id, status, delivery_date) VALUES
        ('ba090000-0000-0000-0000-0000000000c3', 'ba090000-0000-0000-0000-000000000001', 'planned', CURRENT_DATE + 1);

      INSERT INTO public.inventory_consumption_lines (id, consumption_id, tenant_id, ingredient_id, ingredient_name, quantity, unit) VALUES
        ('ba090000-0000-0000-0000-0000000000c4', 'ba090000-0000-0000-0000-0000000000c3', 'ba090000-0000-0000-0000-000000000001', 'ba090000-0000-0000-0000-0000000000b1', 'Aceite Oliva T09', 1.000, 'kg');

      DO $block$
      BEGIN
        PERFORM public.apply_inventory_consumption_v1('ba090000-0000-0000-0000-000000000001', 'ba090000-0000-0000-0000-0000000000c3');
        RAISE EXCEPTION 'SHOULD_HAVE_FAILED_MULTI_CENTER';
      EXCEPTION
        WHEN SQLSTATE '22023' THEN
          CREATE TEMPORARY TABLE t09_multi_center_fail_closed (caught boolean);
          INSERT INTO t09_multi_center_fail_closed VALUES (true);
      END;
      $block$;

      -- Check 5: Anti-Spoofing check
      DO $block$
      BEGIN
        PERFORM * FROM public.resolve_inventory_location_v1('ba090000-0000-0000-0000-000000000001', NULL, NULL, 'fa090000-0000-0000-0000-000000000002');
        RAISE EXCEPTION 'SHOULD_HAVE_BLOCKED_SPOOFING';
      EXCEPTION
        WHEN SQLSTATE '42501' THEN
          CREATE TEMPORARY TABLE t09_spoofing_blocked (caught boolean);
          INSERT INTO t09_spoofing_blocked VALUES (true);
      END;
      $block$;

      SELECT json_build_object(
        'initial_absent_count', (SELECT count FROM t09_initial_absent),
        'post_receipt', (SELECT row_to_json(r) FROM t09_post_receipt r),
        'post_consumption', (SELECT row_to_json(c) FROM t09_post_consumption c),
        'multi_center_fail_closed', (SELECT caught FROM t09_multi_center_fail_closed),
        'final_stock_after_fail', (SELECT stock FROM public.ingredients WHERE id = 'ba090000-0000-0000-0000-0000000000b1'),
        'spoofing_blocked', (SELECT caught FROM t09_spoofing_blocked)
      );
      ROLLBACK;
    `);

    const parsed = extractLastJson(res);
    expect(parsed.initial_absent_count).toBe(0);

    // Post receipt: 8.000 across all 3 layers (divergence = 0)
    expect(Number(parsed.post_receipt.legacy_post_receipt)).toBe(8.0);
    expect(Number(parsed.post_receipt.spatial_post_receipt)).toBe(8.0);
    expect(Number(parsed.post_receipt.view_post_receipt)).toBe(8.0);

    // Post consumption: 5.000 across all 3 layers (divergence = 0)
    expect(Number(parsed.post_consumption.legacy_post_cons)).toBe(5.0);
    expect(Number(parsed.post_consumption.spatial_post_cons)).toBe(5.0);
    expect(Number(parsed.post_consumption.view_post_cons)).toBe(5.0);

    // Multi-center fail-closed & 0 deduction
    expect(parsed.multi_center_fail_closed).toBe(true);
    expect(Number(parsed.final_stock_after_fail)).toBe(5.0);

    // Anti-spoofing
    expect(parsed.spoofing_blocked).toBe(true);
  });
});
