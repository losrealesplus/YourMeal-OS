-- ============================================================================
-- YOURMEAL OS — PRODUCTION & OPERATIONAL COST ENGINE (CR-COST-07B)
-- Subsystem: Core Cost Intelligence (E9) · Food Vertical
-- Phase 07B DDL Specification & Migration Contract
-- Constitutional Rules:
-- 1. NO FALSE ZERO (Unconfigured Labor/Energy/Packaging is NULL)
-- 2. DISCRETE BATCH CEILING (Integer batches unless fractional allowed)
-- 3. UNCONFIGURED SURPLUS BLOCKS EFFECTIVE SOLD UNIT COST
-- ============================================================================

-- 1. Study Operation Configurations (Labor, Energy & Packaging Parameters per Version)
CREATE TABLE IF NOT EXISTS public.study_operation_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.study_versions(id) ON DELETE CASCADE,
  labor_setup_minutes numeric(8,2) DEFAULT 0.0,
  labor_batch_minutes numeric(8,2) DEFAULT 0.0,
  labor_unit_minutes numeric(8,2) DEFAULT 0.0,
  labor_cleaning_minutes numeric(8,2) DEFAULT 0.0,
  labor_hourly_rate numeric(8,2), -- NULL means [NO CONFIGURADO]
  energy_method text NOT NULL DEFAULT 'UNCONFIGURED',
  energy_power_kw numeric(8,2),
  energy_cycle_hours numeric(8,2),
  energy_tariff_kwh numeric(8,4),
  energy_percentage_rate numeric(5,2),
  energy_flat_fee numeric(10,2),
  packaging_mode text NOT NULL DEFAULT 'UNCONFIGURED',
  packaging_unit_cost numeric(10,4),
  packaging_secondary_cost numeric(10,4),
  packaging_secondary_capacity int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_study_op_config_version UNIQUE (version_id),
  CONSTRAINT check_op_energy_method CHECK (
    energy_method IN ('QUANTITATIVE', 'PERCENTAGE', 'MANUAL_FLAT', 'NOT_APPLICABLE', 'UNCONFIGURED')
  ),
  CONSTRAINT check_op_packaging_mode CHECK (
    packaging_mode IN ('CONFIGURED', 'NOT_APPLICABLE', 'UNCONFIGURED')
  ),
  CONSTRAINT check_op_labor_minutes CHECK (
    labor_setup_minutes >= 0 AND
    labor_batch_minutes >= 0 AND
    labor_unit_minutes >= 0 AND
    labor_cleaning_minutes >= 0
  ),
  CONSTRAINT check_op_hourly_rate CHECK (labor_hourly_rate IS NULL OR labor_hourly_rate >= 0),
  CONSTRAINT check_op_energy_power CHECK (energy_power_kw IS NULL OR energy_power_kw >= 0),
  CONSTRAINT check_op_energy_cycle CHECK (energy_cycle_hours IS NULL OR energy_cycle_hours >= 0),
  CONSTRAINT check_op_energy_tariff CHECK (energy_tariff_kwh IS NULL OR energy_tariff_kwh >= 0),
  CONSTRAINT check_op_packaging_costs CHECK (
    (packaging_unit_cost IS NULL OR packaging_unit_cost >= 0) AND
    (packaging_secondary_cost IS NULL OR packaging_secondary_cost >= 0)
  )
);

ALTER TABLE public.study_operation_configs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_operation_configs TO authenticated;
GRANT ALL ON public.study_operation_configs TO service_role;

DROP POLICY IF EXISTS study_op_configs_tenant_isolation ON public.study_operation_configs;
CREATE POLICY study_op_configs_tenant_isolation ON public.study_operation_configs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.study_versions sv
      JOIN public.economic_studies es ON es.id = sv.study_id
      JOIN public.tenant_members tm ON tm.tenant_id = es.tenant_id
      WHERE sv.id = study_operation_configs.version_id
        AND tm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.study_versions sv
      JOIN public.economic_studies es ON es.id = sv.study_id
      JOIN public.tenant_members tm ON tm.tenant_id = es.tenant_id
      WHERE sv.id = study_operation_configs.version_id
        AND tm.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_study_op_configs_version
  ON public.study_operation_configs(version_id);

-- 2. Study Scenarios (Multi-Volume Production Runs with Discrete Ceilings)
CREATE TABLE IF NOT EXISTS public.study_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.study_versions(id) ON DELETE CASCADE,
  scenario_demand_units int NOT NULL,
  batches_required numeric(8,2) NOT NULL,
  units_produced numeric(8,2) NOT NULL,
  surplus_units numeric(8,2) NOT NULL,
  surplus_financial_status text NOT NULL DEFAULT 'UNCONFIGURED',
  total_raw_material_cost numeric(12,4) NOT NULL,
  total_labor_cost numeric(12,4), -- NULL if unconfigured
  total_energy_cost numeric(12,4), -- NULL if unconfigured
  total_packaging_cost numeric(12,4), -- NULL if unconfigured
  total_known_direct_cost numeric(12,4) NOT NULL,
  cost_per_sold_unit numeric(12,4), -- NULL if surplus_financial_status == 'UNCONFIGURED'
  gross_margin_pct numeric(5,2), -- NULL if cost_per_sold_unit or target_pvp is null
  is_custom_scenario boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_study_scenarios_version_demand UNIQUE (version_id, scenario_demand_units),
  CONSTRAINT check_scenario_demand CHECK (scenario_demand_units > 0),
  CONSTRAINT check_scenario_batches CHECK (batches_required > 0),
  CONSTRAINT check_scenario_units CHECK (units_produced >= scenario_demand_units),
  CONSTRAINT check_scenario_surplus CHECK (surplus_units >= 0),
  CONSTRAINT check_scenario_surplus_status CHECK (
    surplus_financial_status IN (
      'UNCONFIGURED',
      'STOCK_REFRIGERADO',
      'STOCK_CONGELADO',
      'VENTA_POSTERIOR',
      'MERMA_DESPERDICIO',
      'CONSUMO_INTERNO'
    )
  ),
  CONSTRAINT check_scenario_costs CHECK (
    total_raw_material_cost >= 0 AND
    total_known_direct_cost >= total_raw_material_cost
  )
);

ALTER TABLE public.study_scenarios ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_scenarios TO authenticated;
GRANT ALL ON public.study_scenarios TO service_role;

DROP POLICY IF EXISTS study_scenarios_tenant_isolation ON public.study_scenarios;
CREATE POLICY study_scenarios_tenant_isolation ON public.study_scenarios
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.study_versions sv
      JOIN public.economic_studies es ON es.id = sv.study_id
      JOIN public.tenant_members tm ON tm.tenant_id = es.tenant_id
      WHERE sv.id = study_scenarios.version_id
        AND tm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.study_versions sv
      JOIN public.economic_studies es ON es.id = sv.study_id
      JOIN public.tenant_members tm ON tm.tenant_id = es.tenant_id
      WHERE sv.id = study_scenarios.version_id
        AND tm.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_study_scenarios_version_demand
  ON public.study_scenarios(version_id, scenario_demand_units);
