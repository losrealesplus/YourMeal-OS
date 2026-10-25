import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("CR-COST-1A Atomic Purchase Receipt & Stock DDL Contract Verification", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase/migrations/20261024180000_cr_cost_1a_atomic_purchase_receipt.sql",
  );
  const rollbackPath = path.resolve(
    process.cwd(),
    "supabase/migrations/rollback/20261024180000_cr_cost_1a_atomic_purchase_receipt_down.sql",
  );

  it("verifies migration and rollback SQL files exist", () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    expect(fs.existsSync(rollbackPath)).toBe(true);
  });

  it("defines schema extensions, constraints, and atomic RPC with safe search_path and permissions", () => {
    const sql = fs.readFileSync(migrationPath, "utf8");

    // 1. purchase_invoices extension
    expect(sql).toContain("ALTER TABLE public.purchase_invoices");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS received_at timestamptz");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS received_by uuid REFERENCES auth.users(id)");
    expect(sql).toContain("CONSTRAINT check_pi_status");
    expect(sql).toContain("'draft', 'partially_received', 'received', 'posted', 'cancelled'");

    // 2. purchase_invoice_items extension
    expect(sql).toContain("ALTER TABLE public.purchase_invoice_items");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS item_nature text NOT NULL DEFAULT 'INVENTORYABLE'");
    expect(sql).toContain("ADD COLUMN IF NOT EXISTS received_quantity numeric(12,3) NOT NULL DEFAULT 0");
    expect(sql).toContain("CONSTRAINT check_pii_item_nature");
    expect(sql).toContain("'INVENTORYABLE', 'EXPENSE_SERVICE', 'CAPEX_ASSET'");
    expect(sql).toContain("CONSTRAINT check_pii_received_qty");
    expect(sql).toContain("CHECK (received_quantity >= 0)");

    // 3. stock_movements table
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.stock_movements");
    expect(sql).toContain("tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE");
    expect(sql).toContain("ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE RESTRICT");
    expect(sql).toContain("movement_type text NOT NULL CHECK");
    expect(sql).toContain("'PURCHASE_RECEIPT', 'PRODUCTION_CONSUMPTION', 'MANUAL_ADJUSTMENT', 'WASTE_DISPOSAL'");
    expect(sql).toContain("reference_document_type text NOT NULL CHECK");
    expect(sql).toContain("'PURCHASE_INVOICE', 'DELIVERY_NOTE', 'PRODUCTION_ORDER', 'ADJUSTMENT_NOTE'");

    // 4. purchase_receipt_executions (idempotency ledger)
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.purchase_receipt_executions");
    expect(sql).toContain("CONSTRAINT uq_receipt_execution UNIQUE (tenant_id, receipt_id)");

    // 5. RPC receive_purchase_invoice_v1
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.receive_purchase_invoice_v1");
    expect(sql).toContain("SECURITY DEFINER");
    expect(sql).toContain("SET search_path = public, auth, pg_temp");
    expect(sql).toContain("REVOKE ALL ON FUNCTION public.receive_purchase_invoice_v1 FROM PUBLIC, anon;");
    expect(sql).toContain("GRANT EXECUTE ON FUNCTION public.receive_purchase_invoice_v1 TO authenticated, service_role;");
  });

  it("disables receipt without deleting historical evidence", () => {
    const sql = fs.readFileSync(rollbackPath, "utf8");
    expect(sql).toContain("REVOKE EXECUTE");
    expect(sql).not.toMatch(/DROP (TABLE|COLUMN|FUNCTION)|DELETE FROM|TRUNCATE/i);
  });
});
