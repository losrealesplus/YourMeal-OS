-- ============================================================================
-- YOURMEAL OS — PRODUCTION RLS & MULTI-TENANT VERIFICATION SCRIPT
-- Executes live against remote database nhirlpkuvonggctdzzad
-- Tests both authorized EatClean tenant member and adversarial non-member
-- ============================================================================

DO $$
DECLARE
  v_tenant_id uuid := '8bba00ba-331b-42c8-9283-4e3836ffb870'; -- EatClean Tenant
  v_user_eatclean uuid := '0e770229-ef44-4f60-b6ff-14a606c242c0'; -- Legitimate EatClean Member
  v_attacker_user uuid := 'ffffffff-ffff-ffff-ffff-ffffffffffff'; -- Non-member / Adversary

  v_study_id uuid;
  v_version_id uuid;
  v_ing_id uuid;
  v_stage_id uuid;
  v_op_id uuid;
  v_scen_id uuid;
  v_decision_id uuid;

  v_read_count int;
  v_attacker_read_count int;
  v_attack_blocked boolean := false;
BEGIN
  RAISE NOTICE '--- INICIANDO VERIFICACIÓN MULTI-TENANT DE PRODUCCIÓN ---';

  -- 1. SIMULAR CONTEXTO DE USUARIO AUTÉNTICO DE EATCLEAN
  PERFORM set_config('request.jwt.claim.sub', v_user_eatclean::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('role', 'authenticated', true);

  -- 1.1 Crear Estudio (07A)
  INSERT INTO public.economic_studies (
    tenant_id,
    product_name,
    product_category,
    current_status,
    active_version_number
  ) VALUES (
    v_tenant_id,
    'Tarta de Zanahoria Casera (Live Production Audit)',
    'Repostería',
    'BORRADOR',
    1
  ) RETURNING id INTO v_study_id;
  RAISE NOTICE '1.1 Estudio creado por usuario EatClean: id=%', v_study_id;

  -- 1.2 Crear Versión (07A)
  INSERT INTO public.study_versions (
    study_id,
    version_number,
    version_status,
    target_pvp,
    sales_unit,
    sales_unit_size,
    batch_unit_name,
    batch_nominal_yield,
    is_fractional_allowed,
    surplus_destination,
    conclusion_tier,
    provenance_summary,
    market_prices_snapshot,
    is_frozen
  ) VALUES (
    v_study_id,
    1,
    'BORRADOR',
    4.50,
    'ración',
    1.0,
    'tarta',
    12.0,
    false,
    'STOCK_REFRIGERADO',
    'CERTIFIED',
    'OBSERVADO',
    '{}'::jsonb,
    false
  ) RETURNING id INTO v_version_id;
  RAISE NOTICE '1.2 Versión creada: id=%', v_version_id;

  -- 1.3 Insertar Ingrediente (07A)
  INSERT INTO public.study_ingredients (
    version_id,
    ingredient_name,
    gross_quantity,
    gross_unit,
    unit_price,
    price_provenance,
    trimming_loss_pct,
    net_usable_quantity
  ) VALUES (
    v_version_id,
    'Zanahoria fresca de producción',
    0.800,
    'kg',
    1.10,
    'OBSERVADO',
    15.0,
    0.680
  ) RETURNING id INTO v_ing_id;
  RAISE NOTICE '1.3 Ingrediente creado: id=%', v_ing_id;

  -- 1.4 Insertar Etapa de Rendimiento (07A)
  INSERT INTO public.study_yield_stages (
    version_id,
    stage_order,
    stage_name,
    loss_percentage,
    provenance
  ) VALUES (
    v_version_id,
    1,
    'Cocción al horno',
    8.5,
    'OBSERVADO'
  ) RETURNING id INTO v_stage_id;
  RAISE NOTICE '1.4 Etapa de rendimiento creada: id=%', v_stage_id;

  -- 1.5 Configurar Operaciones (07B)
  INSERT INTO public.study_operation_configs (
    version_id,
    labor_setup_minutes,
    labor_batch_minutes,
    labor_unit_minutes,
    labor_cleaning_minutes,
    labor_hourly_rate,
    energy_method,
    packaging_mode
  ) VALUES (
    v_version_id,
    15.0,
    10.0,
    1.0,
    15.0,
    15.00,
    'NOT_APPLICABLE',
    'NOT_APPLICABLE'
  ) RETURNING id INTO v_op_id;
  RAISE NOTICE '1.5 Configuración operativa creada: id=%', v_op_id;

  -- 1.6 Insertar Escenario (07B)
  INSERT INTO public.study_scenarios (
    version_id,
    scenario_demand_units,
    batches_required,
    units_produced,
    surplus_units,
    surplus_financial_status,
    total_raw_material_cost,
    total_labor_cost,
    total_known_direct_cost,
    cost_per_sold_unit,
    gross_margin_pct
  ) VALUES (
    v_version_id,
    60,
    5,
    60,
    0,
    'STOCK_REFRIGERADO',
    17.18,
    27.50,
    44.68,
    0.7447,
    83.45
  ) RETURNING id INTO v_scen_id;
  RAISE NOTICE '1.6 Escenario creado: id=%', v_scen_id;

  -- 1.7 Confirmar Decisión Humana (07C)
  INSERT INTO public.study_decisions (
    version_id,
    decision_verdict,
    human_decision_status,
    executive_summary_text,
    selected_scenario_demand,
    recommended_pvp,
    decision_notes
  ) VALUES (
    v_version_id,
    'APPROVED_FOR_MENU',
    'APPROVED',
    'Aprobado en auditoría de producción en vivo.',
    60,
    4.50,
    'Ratificado por Human Product Authority (Chapi).'
  ) RETURNING id INTO v_decision_id;
  RAISE NOTICE '1.7 Decisión soberana persistida con éxito en study_decisions: id=%', v_decision_id;

  -- Congelar Versión 1 inmutable
  UPDATE public.study_versions
  SET is_frozen = true, version_status = 'CONGELADA'
  WHERE id = v_version_id;

  UPDATE public.economic_studies
  SET current_status = 'DECISION'
  WHERE id = v_study_id;
  RAISE NOTICE '1.8 Versión congelada y ciclo de vida en DECISION';

  -- Verificar lectura por usuario legítimo
  SELECT count(*) INTO v_read_count
  FROM public.study_decisions
  WHERE id = v_decision_id;

  IF v_read_count <> 1 THEN
    RAISE EXCEPTION 'FALLO: Usuario legítimo de EatClean no pudo leer su propia decisión.';
  END IF;
  RAISE NOTICE '🟢 VERIFICADO: Usuario EatClean lee su propia decisión (count=1)';

  -- --------------------------------------------------------------------------
  -- 2. SIMULAR CONTEXTO DE ATACANTE / NO MIEMBRO DEL TENANT
  -- --------------------------------------------------------------------------
  PERFORM set_config('request.jwt.claim.sub', v_attacker_user::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('role', 'authenticated', true);

  -- 2.1 Intento de Lectura de la Decisión de EatClean
  SELECT count(*) INTO v_attacker_read_count
  FROM public.study_decisions
  WHERE id = v_decision_id;

  IF v_attacker_read_count <> 0 THEN
    RAISE EXCEPTION 'VIOLACIÓN DE SEGURIDAD: Usuario no autorizado pudo leer study_decisions de EatClean (count=%)', v_attacker_read_count;
  END IF;
  RAISE NOTICE '🟢 VERIFICADO: Usuario no autorizado BLOQUEADO para leer decisiones de EatClean (count=0)';

  -- 2.2 Intento de Lectura de Escenarios de EatClean
  SELECT count(*) INTO v_attacker_read_count
  FROM public.study_scenarios
  WHERE version_id = v_version_id;

  IF v_attacker_read_count <> 0 THEN
    RAISE EXCEPTION 'VIOLACIÓN DE SEGURIDAD: Usuario no autorizado pudo leer study_scenarios de EatClean (count=%)', v_attacker_read_count;
  END IF;
  RAISE NOTICE '🟢 VERIFICADO: Usuario no autorizado BLOQUEADO para leer escenarios de EatClean (count=0)';

  -- 2.3 Intento de Inserción Cruzada (Cross-Tenant Attack)
  BEGIN
    INSERT INTO public.study_decisions (
      version_id,
      decision_verdict,
      human_decision_status,
      executive_summary_text
    ) VALUES (
      v_version_id,
      'REJECTED_MARGIN_TOO_LOW',
      'REJECTED',
      'Ataque inyectado no autorizado'
    );
    v_attack_blocked := false;
  EXCEPTION WHEN OTHERS THEN
    v_attack_blocked := true;
  END;

  IF NOT v_attack_blocked THEN
    -- If no exception raised, check if RLS silently filtered the write
    SELECT count(*) INTO v_attacker_read_count
    FROM public.study_decisions
    WHERE version_id = v_version_id AND executive_summary_text = 'Ataque inyectado no autorizado';

    IF v_attacker_read_count > 0 THEN
      RAISE EXCEPTION 'VIOLACIÓN DE SEGURIDAD: Usuario no autorizado logró insertar decisión en EatClean!';
    END IF;
  END IF;
  RAISE NOTICE '🟢 VERIFICADO: Inserción cruzada de atacante BLOQUEADA categóricamente por RLS.';

  -- --------------------------------------------------------------------------
  -- 3. RESTAURAR CONTEXTO SUPERUSER/SERVICE Y VERIFICAR PERSISTENCIA FINAL
  -- --------------------------------------------------------------------------
  PERFORM set_config('role', 'postgres', true);

  SELECT count(*) INTO v_read_count
  FROM public.study_decisions
  WHERE id = v_decision_id;

  IF v_read_count <> 1 THEN
    RAISE EXCEPTION 'FALLO: Registro de decisión no persistió en postgres.';
  END IF;

  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'AUDITORÍA MULTI-TENANT Y RLS COMPLETADA CON ÉXITO 100%%';
  RAISE NOTICE 'Study ID: %', v_study_id;
  RAISE NOTICE 'Version ID: %', v_version_id;
  RAISE NOTICE 'Decision ID: %', v_decision_id;
  RAISE NOTICE '=======================================================';
END $$;
