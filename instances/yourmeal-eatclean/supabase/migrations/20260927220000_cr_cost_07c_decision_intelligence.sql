-- ============================================================================
-- CR-COST-07C: DECISION INTELLIGENCE, CAPACITY & STUDY DECISIONS
-- Subsystem: Core Cost Intelligence (E9) · Food Production Vertical
-- Pre-conditions: 20260927200000_cr_cost_07a and 20260927210000_cr_cost_07b
-- Status: NOT APPLIED TO PRODUCTION (Local Verification Only)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Table: study_decisions
-- Formal audit log of human executive decisions taken on a study version.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.study_decisions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id uuid NOT NULL REFERENCES public.study_versions(id) ON DELETE CASCADE,
    decision_verdict text NOT NULL CHECK (
        decision_verdict IN (
            'APPROVED_FOR_MENU',
            'REJECTED_MARGIN_TOO_LOW',
            'REJECTED_CAPACITY_LIMIT',
            'POSTPONED_NEEDS_RECIPE_REVISION',
            'CUSTOM'
        )
    ),
    executive_summary_text text NOT NULL,
    human_decision_status text NOT NULL CHECK (
        human_decision_status IN ('APPROVED', 'REJECTED', 'POSTPONED')
    ),
    selected_scenario_demand integer NULL,
    recommended_pvp numeric(10, 4) NULL CHECK (recommended_pvp IS NULL OR recommended_pvp >= 0),
    approved_by_user_id uuid NULL,
    decision_notes text NULL,
    decided_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_study_decisions_version UNIQUE (version_id)
);

CREATE INDEX IF NOT EXISTS idx_study_decisions_version_id 
    ON public.study_decisions(version_id);

CREATE INDEX IF NOT EXISTS idx_study_decisions_verdict 
    ON public.study_decisions(decision_verdict);

-- ----------------------------------------------------------------------------
-- 2. Row Level Security (RLS) & Multi-Tenant Isolation
-- Isolation guaranteed through study_versions -> economic_studies.tenant_id
-- ----------------------------------------------------------------------------
ALTER TABLE public.study_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY study_decisions_tenant_isolation ON public.study_decisions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.study_versions sv
            JOIN public.economic_studies es ON sv.study_id = es.id
            WHERE sv.id = public.study_decisions.version_id
              AND es.tenant_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.study_versions sv
            JOIN public.economic_studies es ON sv.study_id = es.id
            WHERE sv.id = public.study_decisions.version_id
              AND es.tenant_id = auth.uid()
        )
    );
