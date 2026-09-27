-- ============================================================================
-- CR-COST-07C ROLLBACK: DECISION INTELLIGENCE
-- Subsystem: Core Cost Intelligence (E9) · Food Production Vertical
-- Purpose: Complete and idempotent removal of CR-COST-07C structures
-- ============================================================================

DROP POLICY IF EXISTS study_decisions_tenant_isolation ON public.study_decisions;
DROP TABLE IF EXISTS public.study_decisions CASCADE;
