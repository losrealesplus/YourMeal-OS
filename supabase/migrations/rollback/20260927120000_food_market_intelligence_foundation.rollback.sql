-- ============================================================================
-- YOURMEAL OS — ROLLBACK FOR 20260927120000_food_market_intelligence_foundation.sql
-- Reverses CR-COST-05 Market Intelligence tables in strict foreign key order
-- ============================================================================

DROP TRIGGER IF EXISTS trg_market_price_obs_immutability ON public.market_price_observations;
DROP FUNCTION IF EXISTS public.trg_guard_market_observation_immutability();

DROP TABLE IF EXISTS public.product_mappings CASCADE;
DROP TABLE IF EXISTS public.market_volume_tiers CASCADE;
DROP TABLE IF EXISTS public.market_price_observations CASCADE;
DROP TABLE IF EXISTS public.market_products CASCADE;
DROP TABLE IF EXISTS public.market_sources CASCADE;
