-- ============================================================================
-- YOURMEAL OS — PRODUCT ECONOMICS FOUNDATION & MULTI-STAGE BOM (CR-COST-07A)
-- Subsystem: Core Cost Intelligence (E9) · Market Intelligence (E10) · Food Vertical
-- Phase 07A DDL Specification & Migration Contract
-- Constitutional Rules:
-- 1. ZERO ASSUMED DENSITIES (L/ml requires explicit density_kg_per_l)
-- 2. NULL TRIMMING LOSS means [NO CONFIGURADO] (NEVER assume 0%)
-- ============================================================================

-- 1. Master Economic Studies (Tenant Isolated & Life Cycle Container)
CREATE TABLE IF NOT EXISTS public.economic_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  product_category text NOT NULL DEFAULT 'general',
  current_status text NOT NULL DEFAULT 'BORRADOR',
  active_version_number int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_study_status CHECK (
    current_status IN ('BORRADOR', 'EN_CONFIGURACION', 'LISTO_SIMULAR', 'ESTUDIADO', 'DECISION')
  ),
  CONSTRAINT check_study_active_version CHECK (active_version_number >= 1)
);

ALTER TABLE public.economic_studies ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.economic_studies TO authenticated;
GRANT ALL ON public.economic_studies TO service_role;

DROP POLICY IF EXISTS economic_studies_tenant_isolation ON public.economic_studies;
CREATE POLICY economic_studies_tenant_isolation ON public.economic_studies
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = economic_studies.tenant_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.tenant_id = economic_studies.tenant_id
    )
  );

CREATE INDEX IF NOT EXISTS idx_economic_studies_tenant_status
  ON public.economic_studies(tenant_id, current_status);

-- 2. Study Versions (Immutable Historical Snapshots & Production Specifications)
CREATE TABLE IF NOT EXISTS public.study_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id uuid NOT NULL REFERENCES public.economic_studies(id) ON DELETE CASCADE,
  version_number int NOT NULL DEFAULT 1,
  version_status text NOT NULL DEFAULT 'BORRADOR',
  target_pvp numeric(12,4),
  sales_unit text NOT NULL DEFAULT 'ración',
  sales_unit_size numeric(12,4) NOT NULL DEFAULT 1.0,
  batch_unit_name text NOT NULL DEFAULT 'lote',
  batch_nominal_yield numeric(12,4) NOT NULL DEFAULT 1.0,
  is_fractional_allowed boolean NOT NULL DEFAULT false,
  surplus_destination text NOT NULL DEFAULT 'UNCONFIGURED',
  conclusion_tier text NOT NULL DEFAULT 'INSUFFICIENT_DATA',
  provenance_summary text NOT NULL DEFAULT 'MANUAL',
  market_prices_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_frozen boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_study_version_number UNIQUE (study_id, version_number),
  CONSTRAINT check_study_version_status CHECK (
    version_status IN ('BORRADOR', 'CONGELADA', 'ARCHIVADA')
  ),
  CONSTRAINT check_version_surplus_dest CHECK (
    surplus_destination IN (
      'UNCONFIGURED',
      'STOCK_REFRIGERADO',
      'STOCK_CONGELADO',
      'VENTA_POSTERIOR',
      'MERMA_DESPERDICIO',
      'CONSUMO_INTERNO'
    )
  ),
  CONSTRAINT check_version_conclusion_tier CHECK (
    conclusion_tier IN ('CERTIFIED', 'CONDITIONED', 'INSUFFICIENT_DATA')
  ),
  CONSTRAINT check_version_nominal_yield CHECK (batch_nominal_yield > 0),
  CONSTRAINT check_version_sales_unit_size CHECK (sales_unit_size > 0)
);

ALTER TABLE public.study_versions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_versions TO authenticated;
GRANT ALL ON public.study_versions TO service_role;

DROP POLICY IF EXISTS study_versions_tenant_isolation ON public.study_versions;
CREATE POLICY study_versions_tenant_isolation ON public.study_versions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.economic_studies es
      JOIN public.tenant_members tm ON tm.tenant_id = es.tenant_id
      WHERE es.id = study_versions.study_id
        AND tm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.economic_studies es
      JOIN public.tenant_members tm ON tm.tenant_id = es.tenant_id
      WHERE es.id = study_versions.study_id
        AND tm.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_study_versions_study_num
  ON public.study_versions(study_id, version_number);

-- 3. Study Ingredients (BOM Specification with Explicit Trimming Loss & Density)
CREATE TABLE IF NOT EXISTS public.study_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.study_versions(id) ON DELETE CASCADE,
  ingredient_name text NOT NULL,
  gross_quantity numeric(12,4) NOT NULL,
  gross_unit text NOT NULL DEFAULT 'kg',
  market_price_id uuid REFERENCES public.market_price_observations(id) ON DELETE SET NULL,
  unit_price numeric(12,4) NOT NULL DEFAULT 0.0,
  price_provenance text NOT NULL DEFAULT 'MANUAL',
  density_kg_per_l numeric(8,4), -- NULL if unconfigured; NEVER ASSUME 1.0
  piece_mass_kg numeric(8,4), -- NULL if unconfigured; NEVER ASSUME 0.06
  trimming_loss_pct numeric(5,2), -- NULL means [NO CONFIGURADO]; 0 means explicitly 0% loss
  net_usable_quantity numeric(12,4), -- NULL if trimming is unconfigured
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_ingredient_gross_qty CHECK (gross_quantity > 0),
  CONSTRAINT check_ingredient_gross_unit CHECK (
    gross_unit IN ('kg', 'g', 'l', 'ml', 'unit')
  ),
  CONSTRAINT check_ingredient_unit_price CHECK (unit_price >= 0),
  CONSTRAINT check_ingredient_provenance CHECK (
    price_provenance IN ('REAL', 'OBSERVADO', 'MANUAL')
  ),
  CONSTRAINT check_ingredient_density CHECK (
    density_kg_per_l IS NULL OR density_kg_per_l > 0
  ),
  CONSTRAINT check_ingredient_piece_mass CHECK (
    piece_mass_kg IS NULL OR piece_mass_kg > 0
  ),
  CONSTRAINT check_ingredient_trimming_pct CHECK (
    trimming_loss_pct IS NULL OR (trimming_loss_pct >= 0 AND trimming_loss_pct < 100)
  ),
  CONSTRAINT check_ingredient_net_qty CHECK (
    net_usable_quantity IS NULL OR net_usable_quantity >= 0
  )
);

ALTER TABLE public.study_ingredients ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_ingredients TO authenticated;
GRANT ALL ON public.study_ingredients TO service_role;

DROP POLICY IF EXISTS study_ingredients_tenant_isolation ON public.study_ingredients;
CREATE POLICY study_ingredients_tenant_isolation ON public.study_ingredients
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.study_versions sv
      JOIN public.economic_studies es ON es.id = sv.study_id
      JOIN public.tenant_members tm ON tm.tenant_id = es.tenant_id
      WHERE sv.id = study_ingredients.version_id
        AND tm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.study_versions sv
      JOIN public.economic_studies es ON es.id = sv.study_id
      JOIN public.tenant_members tm ON tm.tenant_id = es.tenant_id
      WHERE sv.id = study_ingredients.version_id
        AND tm.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_study_ingredients_version
  ON public.study_ingredients(version_id);

-- 4. Study Yield Stages (Quantitative Multi-Stage Yield Cascade)
CREATE TABLE IF NOT EXISTS public.study_yield_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.study_versions(id) ON DELETE CASCADE,
  stage_order int NOT NULL DEFAULT 1,
  stage_name text NOT NULL,
  loss_percentage numeric(5,2) NOT NULL DEFAULT 0.0,
  provenance text NOT NULL DEFAULT 'MANUAL',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_study_yield_stage_order UNIQUE (version_id, stage_order),
  CONSTRAINT check_yield_stage_order CHECK (stage_order >= 1),
  CONSTRAINT check_yield_stage_loss_pct CHECK (
    loss_percentage >= 0 AND loss_percentage < 100
  ),
  CONSTRAINT check_yield_stage_provenance CHECK (
    provenance IN ('OBSERVADO', 'MANUAL')
  )
);

ALTER TABLE public.study_yield_stages ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_yield_stages TO authenticated;
GRANT ALL ON public.study_yield_stages TO service_role;

DROP POLICY IF EXISTS study_yield_stages_tenant_isolation ON public.study_yield_stages;
CREATE POLICY study_yield_stages_tenant_isolation ON public.study_yield_stages
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.study_versions sv
      JOIN public.economic_studies es ON es.id = sv.study_id
      JOIN public.tenant_members tm ON tm.tenant_id = es.tenant_id
      WHERE sv.id = study_yield_stages.version_id
        AND tm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.study_versions sv
      JOIN public.economic_studies es ON es.id = sv.study_id
      JOIN public.tenant_members tm ON tm.tenant_id = es.tenant_id
      WHERE sv.id = study_yield_stages.version_id
        AND tm.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_study_yield_stages_version_order
  ON public.study_yield_stages(version_id, stage_order);

-- 5. Updated_at Trigger for economic_studies
CREATE OR REPLACE FUNCTION public.fn_touch_economic_studies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_economic_studies_updated_at ON public.economic_studies;
CREATE TRIGGER trg_touch_economic_studies_updated_at
  BEFORE UPDATE ON public.economic_studies
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_touch_economic_studies_updated_at();
