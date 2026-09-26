-- ============================================================================
-- YOURMEAL OS — FOOD RECIPE COSTING EXTENSION (CR-COST-02)
-- Instance: EatClean Dedicated DB DDL Mirror
-- ============================================================================

-- 1. Extensión de 'public.ingredients' con Merma / Yield Loss Factor
ALTER TABLE public.ingredients
  ADD COLUMN IF NOT EXISTS waste_percentage numeric(5,2) NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_ingredients_waste_percentage'
  ) THEN
    ALTER TABLE public.ingredients
      ADD CONSTRAINT check_ingredients_waste_percentage
      CHECK (waste_percentage >= 0 AND waste_percentage < 100);
  END IF;
END $$;

-- 2. Extensión de 'public.dishes' con Overheads de Producción y Margen
ALTER TABLE public.dishes
  ADD COLUMN IF NOT EXISTS labor_cost numeric(12,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS energy_cost numeric(12,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS packaging_cost numeric(12,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS margin_pct numeric(5,2) NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_dishes_production_overheads'
  ) THEN
    ALTER TABLE public.dishes
      ADD CONSTRAINT check_dishes_production_overheads
      CHECK (labor_cost >= 0 AND energy_cost >= 0 AND packaging_cost >= 0);
  END IF;
END $$;
