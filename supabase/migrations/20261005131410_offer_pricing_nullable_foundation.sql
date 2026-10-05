-- Offer Pricing M1 / ADR 0103. File only; provider application needs separate authorization.
-- No default/backfill, catalogue mutation, policy/grant change or order snapshot rewrite.
-- PostgreSQL numeric(12,4) rounds scale on input: application validates before cast.
BEGIN;
ALTER TABLE public.weekly_menu_slots
  ADD COLUMN unit_price numeric(12,4) NULL,
  ADD CONSTRAINT weekly_menu_slots_unit_price_valid CHECK (
    unit_price IS NULL OR (
      unit_price >= 0
      AND unit_price NOT IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)
    )
  );
COMMIT;
