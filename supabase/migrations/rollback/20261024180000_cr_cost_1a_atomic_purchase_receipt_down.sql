-- ============================================================================
-- YOURMEAL OS — ROLLBACK: ATOMIC PURCHASE RECEIPT & STOCK INTEGRATION (CR-COST-1A)
-- Subsystem: Platform Core / Cost Intelligence
-- ============================================================================

-- 1. Drop function
DROP FUNCTION IF EXISTS public.receive_purchase_invoice_v1(uuid, uuid, uuid, jsonb, uuid);

-- 2. Drop idempotency table
DROP TABLE IF EXISTS public.purchase_receipt_executions CASCADE;

-- 3. Drop stock movements table
DROP TABLE IF EXISTS public.stock_movements CASCADE;

-- 4. Revert purchase_invoice_items columns & constraints
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_pii_item_nature'
  ) THEN
    ALTER TABLE public.purchase_invoice_items DROP CONSTRAINT check_pii_item_nature;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_pii_received_qty'
  ) THEN
    ALTER TABLE public.purchase_invoice_items DROP CONSTRAINT check_pii_received_qty;
  END IF;
END $$;

ALTER TABLE public.purchase_invoice_items
  DROP COLUMN IF EXISTS item_nature,
  DROP COLUMN IF EXISTS received_quantity;

-- 5. Revert purchase_invoices columns & status constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_pi_status'
  ) THEN
    ALTER TABLE public.purchase_invoices DROP CONSTRAINT check_pi_status;
  END IF;
  ALTER TABLE public.purchase_invoices
    ADD CONSTRAINT check_pi_status
    CHECK (status IN ('draft', 'received', 'posted', 'cancelled'));
END $$;

ALTER TABLE public.purchase_invoices
  DROP COLUMN IF EXISTS received_at,
  DROP COLUMN IF EXISTS received_by;
