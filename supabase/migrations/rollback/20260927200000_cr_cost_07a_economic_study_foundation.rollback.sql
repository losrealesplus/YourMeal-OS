-- ============================================================================
-- YOURMEAL OS — ROLLBACK: CR-COST-07A ECONOMIC STUDY FOUNDATION & BOM MULTIETAPA
-- Subsystem: Core Cost Intelligence (E9) · Food Vertical
-- ============================================================================

DROP TRIGGER IF EXISTS trg_touch_economic_studies_updated_at ON public.economic_studies;
DROP FUNCTION IF EXISTS public.fn_touch_economic_studies_updated_at();

-- Drop tables in strict reverse foreign key order
DROP TABLE IF EXISTS public.study_yield_stages CASCADE;
DROP TABLE IF EXISTS public.study_ingredients CASCADE;
DROP TABLE IF EXISTS public.study_versions CASCADE;
DROP TABLE IF EXISTS public.economic_studies CASCADE;
