-- ============================================================================
-- YOURMEAL OS — COST SIMULATION SCENARIOS & DECISION INTENTS (CR-COST-03)
-- Subsystem: Platform Core / Cost Intelligence (E9 Persistence & Cockpit)
-- ============================================================================

-- 1. Tabla de Escenarios de Simulación (What-If Models)
CREATE TABLE IF NOT EXISTS public.cost_simulation_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  preset_type text NOT NULL DEFAULT 'custom',
  baseline_snapshot_id text NOT NULL,
  baseline_snapshot jsonb NOT NULL,
  applied_variables jsonb NOT NULL DEFAULT '{}'::jsonb,
  simulation_result jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_scenario_status CHECK (status IN ('draft', 'simulated', 'archived')),
  CONSTRAINT check_preset_type CHECK (preset_type IN ('custom', 'supplier_hike', 'item_inflation', 'energy_surge', 'labor_escalation', 'yield_optimization'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cost_simulation_scenarios TO authenticated;
GRANT ALL ON public.cost_simulation_scenarios TO service_role;
ALTER TABLE public.cost_simulation_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY cost_simulation_scenarios_staff ON public.cost_simulation_scenarios
  FOR ALL TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
  )
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
  );

CREATE INDEX IF NOT EXISTS idx_cost_sim_scenarios_tenant_created
  ON public.cost_simulation_scenarios(tenant_id, created_at DESC);

-- 2. Tabla de Intenciones de Decisión (Operator Action Audit Trail)
CREATE TABLE IF NOT EXISTS public.cost_decision_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  scenario_id uuid NOT NULL REFERENCES public.cost_simulation_scenarios(id) ON DELETE CASCADE,
  intent_type text NOT NULL,
  target_entity_type text,
  target_entity_id uuid,
  rationale text NOT NULL,
  planned_effective_date date,
  status text NOT NULL DEFAULT 'pending_action',
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_intent_type CHECK (intent_type IN ('renegotiate_supplier', 'adjust_menu_price', 'reformulate_recipe', 'accept_margin_compression', 'other')),
  CONSTRAINT check_intent_status CHECK (status IN ('pending_action', 'completed_manually', 'abandoned'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cost_decision_intents TO authenticated;
GRANT ALL ON public.cost_decision_intents TO service_role;
ALTER TABLE public.cost_decision_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY cost_decision_intents_staff ON public.cost_decision_intents
  FOR ALL TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
  )
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
  );

CREATE INDEX IF NOT EXISTS idx_cost_decision_intents_tenant_scenario
  ON public.cost_decision_intents(tenant_id, scenario_id);
