-- ============================================================================
-- YOURMEAL OS — COST INTELLIGENCE INCREMENTO 1A
-- Script de Preflight y Auditoría de Solo Lectura (Pre-Instalación SQL)
-- ============================================================================
-- Seguridad: ESTRICTAMENTE SOLO LECTURA (default_transaction_read_only = ON).
--            Garantizado a nivel de motor PostgreSQL: cualquier intento de
--            mutación (INSERT, UPDATE, DELETE, ALTER, DROP) fallará de inmediato.
-- Propósito: Certificar que la base de datos destino cumple todos los
--            prerrequisitos técnicos, verificación de destino (tenant/base),
--            permisos y dependencias antes de autorizar la ejecución de las
--            migraciones del Incremento 1A.
-- Parámetros Opcionales de Sesión:
--   SET LOCAL app.expected_tenant_slug = 'eatclean';  -- (Por defecto: 'eatclean')
--   SET LOCAL app.expected_database_name = 'postgres'; -- (Por defecto: ignora check de db si no se define)
-- ============================================================================

\set ON_ERROR_STOP on

-- Garantía absoluta de transacción de solo lectura
BEGIN TRANSACTION READ ONLY;

-- ----------------------------------------------------------------------------
-- SECCIÓN 1: Identificación y Verificación de Destino (Target Destination)
-- ----------------------------------------------------------------------------
WITH target_config AS (
  SELECT
    COALESCE(NULLIF(current_setting('app.expected_tenant_slug', true), ''), 'eatclean') AS expected_tenant_slug,
    NULLIF(current_setting('app.expected_database_name', true), '') AS expected_database_name
),
target_eval AS (
  SELECT
    tc.expected_tenant_slug,
    tc.expected_database_name,
    current_database() AS actual_database,
    current_user AS connected_user,
    inet_server_addr() AS server_ip,
    inet_server_port() AS server_port,
    now() AS preflight_timestamp,
    version() AS postgresql_version,
    EXISTS(SELECT 1 FROM public.tenants WHERE slug = tc.expected_tenant_slug) AS tenant_verified,
    (tc.expected_database_name IS NULL OR tc.expected_database_name = current_database()) AS database_verified
  FROM target_config tc
)
SELECT
  actual_database,
  connected_user,
  server_ip,
  server_port,
  preflight_timestamp,
  expected_tenant_slug,
  tenant_verified,
  expected_database_name,
  database_verified,
  CASE
    WHEN tenant_verified AND database_verified THEN 'DESTINATION_VERIFIED (Destino confirmado)'
    WHEN NOT tenant_verified THEN 'DESTINATION_UNVERIFIED (Tenant objetivo no encontrado)'
    ELSE 'DESTINATION_UNVERIFIED (Discrepancia en nombre de base de datos)'
  END AS destination_verdict
FROM target_eval;

-- Tenants registrados y estado operativo en el entorno
SELECT
  id AS tenant_id,
  name AS tenant_name,
  slug AS tenant_slug,
  created_at AS registered_at
FROM public.tenants
ORDER BY created_at ASC;

-- ----------------------------------------------------------------------------
-- SECCIÓN 2: Permisos Reales de cr_order_writer sobre auth.uid() (Prerrequisito)
-- ----------------------------------------------------------------------------
WITH role_check AS (
  SELECT
    EXISTS(SELECT 1 FROM pg_roles WHERE rolname = 'cr_order_writer') AS has_writer_role,
    EXISTS(SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') AS has_authenticated_role,
    EXISTS(SELECT 1 FROM pg_roles WHERE rolname = 'service_role') AS has_service_role
)
SELECT
  has_writer_role,
  has_authenticated_role,
  has_service_role,
  CASE
    WHEN has_writer_role THEN has_schema_privilege('cr_order_writer', 'auth', 'USAGE')
    ELSE false
  END AS cr_order_writer_auth_usage,
  CASE
    WHEN has_writer_role THEN has_function_privilege('cr_order_writer', 'auth.uid()', 'EXECUTE')
    ELSE false
  END AS cr_order_writer_auth_uid_execute,
  CASE
    WHEN has_writer_role
      AND has_schema_privilege('cr_order_writer', 'auth', 'USAGE')
      AND has_function_privilege('cr_order_writer', 'auth.uid()', 'EXECUTE')
    THEN 'PASS (Permiso verificado)'
    ELSE 'FAIL (Falta migración 20261010155728 o privilegios auth)'
  END AS auth_preflight_verdict
FROM role_check;

-- ----------------------------------------------------------------------------
-- SECCIÓN 3: Historial y Secuencia de Migraciones en schema_migrations
-- ----------------------------------------------------------------------------
SELECT
  version,
  name,
  CASE
    WHEN version = '20261010155728' THEN 'PREREQUISITO: release_cr_order_writer_auth_usage'
    WHEN version = '20261024180000' THEN '1A-PARTE-1: cr_cost_1a_atomic_purchase_receipt (PR #553)'
    WHEN version = '20261024190000' THEN '1A-PARTE-2: flow04_inventory_consumption_persistence (PR #554)'
    ELSE 'OTRA_MIGRACION'
  END AS migration_identification
FROM supabase_migrations.schema_migrations
WHERE version IN ('20261010155728', '20261024180000', '20261024190000')
ORDER BY version ASC;

-- Comprobación de integridad del prerrequisito de migraciones
SELECT
  EXISTS(
    SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20261010155728'
  ) AS prereq_migration_20261010155728_registered,
  CASE
    WHEN EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20261010155728')
      THEN 'PASS (Prerrequisito de migración registrado)'
    ELSE 'FAIL (Migración base 20261010155728 no registrada)'
  END AS migration_prereq_verdict;

-- Últimas 10 migraciones aplicadas en la base de datos destino
SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 10;

-- ----------------------------------------------------------------------------
-- SECCIÓN 4: Existencia y Compatibilidad de Tablas y Columnas Base Previas
-- ----------------------------------------------------------------------------
SELECT
  table_name,
  EXISTS(
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = t.table_name
  ) AS exists_in_database
FROM (VALUES
  ('tenants'),
  ('suppliers'),
  ('ingredients'),
  ('purchase_invoices'),
  ('purchase_invoice_items'),
  ('dishes'),
  ('dish_ingredients'),
  ('weekly_menus'),
  ('weekly_menu_slots'),
  ('orders'),
  ('order_items')
) AS t(table_name);

-- Tipos de columnas críticas en ingredients y compras
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'ingredients' AND column_name IN ('id', 'stock', 'cost', 'unit', 'tenant_id')) OR
    (table_name = 'purchase_invoices' AND column_name IN ('id', 'status', 'tenant_id', 'total_amount')) OR
    (table_name = 'purchase_invoice_items' AND column_name IN ('id', 'item_id', 'quantity', 'unit_price', 'line_total'))
  )
ORDER BY table_name, column_name;

-- ----------------------------------------------------------------------------
-- SECCIÓN 5: Detección Precisa del Estado de Instalación (Estructuras 1A)
-- ----------------------------------------------------------------------------
WITH struct_1a AS (
  SELECT
    -- Tablas Parte 1 (PR #553)
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_receipt_executions') AS t_receipt_exec,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_movements') AS t_stock_movements,
    -- Funciones RPC Parte 1
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'receive_purchase_invoice_v1') AS f_receive_invoice,
    -- Migración Parte 1
    EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20261024180000') AS m_part1_exists,

    -- Tablas Parte 2 (PR #554 / FLOW-04)
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_consumptions') AS t_inv_consumptions,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_consumption_lines') AS t_inv_lines,
    -- Funciones RPC Parte 2
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'create_inventory_consumption_plan_v1') AS f_create_plan,
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'apply_inventory_consumption_v1') AS f_apply_cons,
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'seal_inventory_consumption_v1') AS f_seal_cons,
    -- Migración Parte 2
    EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20261024190000') AS m_part2_exists
)
SELECT
  t_receipt_exec,
  t_stock_movements,
  f_receive_invoice,
  m_part1_exists,
  t_inv_consumptions,
  t_inv_lines,
  f_create_plan,
  f_apply_cons,
  f_seal_cons,
  m_part2_exists,
  CASE
    -- Caso 1: Nada instalado (base limpia previa a 1A)
    WHEN NOT (t_receipt_exec OR t_stock_movements OR f_receive_invoice OR m_part1_exists OR
              t_inv_consumptions OR t_inv_lines OR f_create_plan OR f_apply_cons OR f_seal_cons OR m_part2_exists)
      THEN 'CLEAN_PRE_INSTALL (Base limpia: listo para instalar ambas migraciones en orden)'

    -- Caso 2: Solo Parte 1 instalada de forma coherente
    WHEN (t_receipt_exec AND t_stock_movements AND f_receive_invoice AND m_part1_exists)
      AND NOT (t_inv_consumptions OR t_inv_lines OR f_create_plan OR f_apply_cons OR f_seal_cons OR m_part2_exists)
      THEN 'RECEIPT_ONLY_INSTALLED (Parte 1 instalada: listo para instalar Parte 2 - FLOW-04)'

    -- Caso 3: Ambas partes completamente instaladas y coherentes
    WHEN (t_receipt_exec AND t_stock_movements AND f_receive_invoice AND m_part1_exists)
      AND (t_inv_consumptions AND t_inv_lines AND f_create_plan AND f_apply_cons AND f_seal_cons AND m_part2_exists)
      THEN 'FULLY_INSTALLED (Estructuras 1A completas y registradas en schema_migrations)'

    -- Caso 4: Inconsistencia, deriva o instalación parcial no registrada
    ELSE 'INCONSISTENT_STATE (Alerta: estructuras parciales o migraciones no registradas)'
  END AS installation_state
FROM struct_1a;

-- ----------------------------------------------------------------------------
-- SECCIÓN 6: Auditoría de Datos Existentes (Facturas Históricas y Stock por Unidad)
-- ----------------------------------------------------------------------------
-- Distribución de facturas de compra históricas por estado
SELECT
  status AS invoice_status,
  count(*) AS total_invoices,
  COALESCE(sum(total_amount), 0) AS total_amount_eur
FROM public.purchase_invoices
GROUP BY status
ORDER BY total_invoices DESC;

-- Estado actual de existencias e inventario en ingredients, agrupado estrictamente por unidad de medida
-- (Evita sumar magnitudes incompatibles como kilogramos y gramos)
SELECT
  tenant_id,
  COALESCE(unit, 'SIN_UNIDAD') AS unit,
  count(*) AS total_ingredients,
  count(*) FILTER (WHERE stock > 0) AS ingredients_with_positive_stock,
  count(*) FILTER (WHERE cost > 0) AS ingredients_with_cost,
  COALESCE(sum(stock), 0) AS total_stock_in_unit
FROM public.ingredients
GROUP BY tenant_id, unit
ORDER BY tenant_id, unit;

-- Detección segura de facturas recibidas pre-1A sin registro en purchase_receipt_executions
-- (Funciona tanto si purchase_receipt_executions existe como si aún no ha sido creada)
SELECT
  CASE
    WHEN to_regclass('public.purchase_receipt_executions') IS NOT NULL THEN
      COALESCE((xpath('/table/row/count/text()', query_to_xml(
        'SELECT count(*) AS count FROM public.purchase_invoices pi ' ||
        'LEFT JOIN public.purchase_receipt_executions pre ON pre.invoice_id = pi.id ' ||
        'WHERE pi.status = ''received'' AND pre.id IS NULL',
        true, false, ''
      )))[1]::text::bigint, 0)
    ELSE
      (SELECT count(*) FROM public.purchase_invoices WHERE status = 'received')
  END AS legacy_received_invoices_without_receipt_execution,
  (SELECT count(*) FROM public.purchase_invoices WHERE status = 'received') AS total_received_invoices;

-- ----------------------------------------------------------------------------
-- SECCIÓN 7: Veredicto Global del Preflight y Recomendación Operativa
-- ----------------------------------------------------------------------------
WITH preflight_data AS (
  SELECT
    -- Verificación de destino
    EXISTS(
      SELECT 1 FROM public.tenants
      WHERE slug = COALESCE(NULLIF(current_setting('app.expected_tenant_slug', true), ''), 'eatclean')
    ) AS tenant_verified,
    (
      NULLIF(current_setting('app.expected_database_name', true), '') IS NULL
      OR NULLIF(current_setting('app.expected_database_name', true), '') = current_database()
    ) AS database_verified,

    -- Permisos de cr_order_writer
    (
      EXISTS(SELECT 1 FROM pg_roles WHERE rolname = 'cr_order_writer')
      AND has_schema_privilege('cr_order_writer', 'auth', 'USAGE')
      AND has_function_privilege('cr_order_writer', 'auth.uid()', 'EXECUTE')
    ) AS auth_prereq_ok,

    -- Migración prerrequisito
    (
      EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'supabase_migrations' AND table_name = 'schema_migrations')
      AND EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20261010155728')
    ) AS migration_prereq_ok,

    -- Tablas base (11 tablas requeridas)
    (
      (SELECT count(*) FROM (VALUES
        ('tenants'), ('suppliers'), ('ingredients'), ('purchase_invoices'), ('purchase_invoice_items'),
        ('dishes'), ('dish_ingredients'), ('weekly_menus'), ('weekly_menu_slots'), ('orders'), ('order_items')
      ) AS t(n) WHERE EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t.n)) = 11
    ) AS base_tables_ok,

    -- Columnas base críticas (14 columnas requeridas)
    (
      (SELECT count(*) FROM (VALUES
        ('ingredients', 'id'), ('ingredients', 'stock'), ('ingredients', 'cost'), ('ingredients', 'unit'), ('ingredients', 'tenant_id'),
        ('purchase_invoices', 'id'), ('purchase_invoices', 'status'), ('purchase_invoices', 'tenant_id'), ('purchase_invoices', 'total_amount'),
        ('purchase_invoice_items', 'id'), ('purchase_invoice_items', 'item_id'), ('purchase_invoice_items', 'quantity'), ('purchase_invoice_items', 'unit_price'), ('purchase_invoice_items', 'line_total')
      ) AS c(t, col) WHERE EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = c.t AND column_name = c.col)) = 14
    ) AS base_columns_ok,

    -- Objetos Parte 1
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_receipt_executions') AS t_receipt_exec,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_movements') AS t_stock_movements,
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'receive_purchase_invoice_v1') AS f_receive_invoice,
    EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20261024180000') AS m_part1_exists,

    -- Objetos Parte 2
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_consumptions') AS t_inv_consumptions,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_consumption_lines') AS t_inv_lines,
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'create_inventory_consumption_plan_v1') AS f_create_plan,
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'apply_inventory_consumption_v1') AS f_apply_cons,
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'seal_inventory_consumption_v1') AS f_seal_cons,
    EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20261024190000') AS m_part2_exists
),
state_eval AS (
  SELECT
    tenant_verified AND database_verified AS destination_verified,
    auth_prereq_ok,
    migration_prereq_ok,
    base_tables_ok,
    base_columns_ok,
    CASE
      WHEN NOT (t_receipt_exec OR t_stock_movements OR f_receive_invoice OR m_part1_exists OR
                t_inv_consumptions OR t_inv_lines OR f_create_plan OR f_apply_cons OR f_seal_cons OR m_part2_exists)
        THEN 'CLEAN_PRE_INSTALL'
      WHEN (t_receipt_exec AND t_stock_movements AND f_receive_invoice AND m_part1_exists)
        AND NOT (t_inv_consumptions OR t_inv_lines OR f_create_plan OR f_apply_cons OR f_seal_cons OR m_part2_exists)
        THEN 'RECEIPT_ONLY_INSTALLED'
      WHEN (t_receipt_exec AND t_stock_movements AND f_receive_invoice AND m_part1_exists)
        AND (t_inv_consumptions AND t_inv_lines AND f_create_plan AND f_apply_cons AND f_seal_cons AND m_part2_exists)
        THEN 'FULLY_INSTALLED'
      ELSE 'INCONSISTENT_STATE'
    END AS installation_state
  FROM preflight_data
)
SELECT
  CASE
    WHEN NOT destination_verified THEN 'BLOCKED: DESTINATION_UNVERIFIED (Verifique el tenant o la base de datos destino)'
    WHEN NOT auth_prereq_ok THEN 'BLOCKED: MISSING_AUTH_PREREQUISITE (cr_order_writer requiere privilegios sobre auth.uid())'
    WHEN NOT migration_prereq_ok THEN 'BLOCKED: MISSING_MIGRATION_PREREQUISITE (Falta registro de migración 20261010155728)'
    WHEN NOT base_tables_ok THEN 'BLOCKED: MISSING_BASE_TABLES (Faltan tablas base del sistema)'
    WHEN NOT base_columns_ok THEN 'BLOCKED: MISSING_BASE_COLUMNS (Faltan columnas requeridas en el esquema base)'
    WHEN installation_state = 'INCONSISTENT_STATE' THEN 'BLOCKED: INCONSISTENT_PARTIAL_STATE (Existe deriva de objetos o migraciones no registradas)'
    WHEN installation_state = 'CLEAN_PRE_INSTALL' THEN 'READY_FOR_MIGRATION (CLEAN_PRE_INSTALL)'
    WHEN installation_state = 'RECEIPT_ONLY_INSTALLED' THEN 'READY_FOR_MIGRATION (RECEIPT_ONLY_INSTALLED)'
    WHEN installation_state = 'FULLY_INSTALLED' THEN 'ALREADY_FULLY_INSTALLED (NO_ACTION_REQUIRED)'
  END AS global_preflight_verdict,

  installation_state,

  CASE
    WHEN NOT destination_verified THEN 'NO-GO: Ejecute SET LOCAL app.expected_tenant_slug = ... con el slug correcto antes de continuar.'
    WHEN NOT auth_prereq_ok THEN 'NO-GO: Aplique primero la migración 20261010155728_release_cr_order_writer_auth_usage.sql.'
    WHEN NOT migration_prereq_ok THEN 'NO-GO: Verifique el historial de supabase_migrations.schema_migrations.'
    WHEN NOT (base_tables_ok AND base_columns_ok) THEN 'NO-GO: El esquema base público presenta divergencias críticas.'
    WHEN installation_state = 'INCONSISTENT_STATE' THEN 'NO-GO: Audite manualmente los objetos huérfanos o registre las migraciones correspondientes antes de proceder.'
    WHEN installation_state = 'CLEAN_PRE_INSTALL' THEN 'GO: Autorizado para aplicar secuencialmente ambas migraciones: 20261024180000 -> 20261024190000.'
    WHEN installation_state = 'RECEIPT_ONLY_INSTALLED' THEN 'GO: Autorizado para aplicar la migración restante: 20261024190000_flow04_inventory_consumption_persistence.sql.'
    WHEN installation_state = 'FULLY_INSTALLED' THEN 'GO: Sistema 1A completamente instalado. No ejecutar migraciones adicionales.'
  END AS recommended_action,

  CASE
    WHEN installation_state = 'CLEAN_PRE_INSTALL' THEN '20261024180000_cr_cost_1a_atomic_purchase_receipt.sql -> 20261024190000_flow04_inventory_consumption_persistence.sql'
    WHEN installation_state = 'RECEIPT_ONLY_INSTALLED' THEN '20261024190000_flow04_inventory_consumption_persistence.sql'
    ELSE 'NONE'
  END AS recommended_migration_order,

  'STRICTLY READ-ONLY TRANSACTION (NO MUTATIONS PERMITTED)' AS execution_mode
FROM state_eval;

COMMIT;
