-- ============================================================================
-- YOURMEAL OS — COST INTELLIGENCE INCREMENTO 1A
-- Script de Preflight y Auditoría de Solo Lectura (Pre-Instalación SQL)
-- ============================================================================
-- Seguridad: ESTRICTAMENTE SOLO LECTURA (default_transaction_read_only = ON).
--            Garantizado a nivel de motor PostgreSQL: cualquier intento de
--            mutación (INSERT, UPDATE, DELETE, ALTER, DROP) fallará de inmediato.
-- Propósito: Certificar que la base de datos destino cumple todos los
--            prerrequisitos técnicos, permisos y dependencias antes de
--            autorizar la ejecución de las migraciones del Incremento 1A.
-- ============================================================================

\set ON_ERROR_STOP on

-- Garantía absoluta de transacción de solo lectura
BEGIN TRANSACTION READ ONLY;

-- ----------------------------------------------------------------------------
-- SECCIÓN 1: Identificación Inequívoca de la Base de Datos y Entorno
-- ----------------------------------------------------------------------------
SELECT
  current_database() AS database_name,
  current_user AS connected_user,
  inet_server_addr() AS server_ip,
  inet_server_port() AS server_port,
  now() AS preflight_timestamp,
  version() AS postgresql_version;

-- Tenants registrados y estado operativo
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

-- Últimas 10 migraciones aplicadas en la base de datos destino
SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 10;

-- ----------------------------------------------------------------------------
-- SECCIÓN 4: Existencia y Compatibilidad de Tablas Base Previas
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
-- SECCIÓN 5: Detección de Aplicaciones Parciales (Estructuras 1A)
-- ----------------------------------------------------------------------------
WITH struct_1a AS (
  SELECT
    -- Tablas
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_receipt_executions') AS t_receipt_exec,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_movements') AS t_stock_movements,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_consumptions') AS t_inv_consumptions,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_consumption_lines') AS t_inv_lines,
    -- Funciones RPC
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'receive_purchase_invoice_v1') AS f_receive_invoice,
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'create_inventory_consumption_plan_v1') AS f_create_plan,
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'apply_inventory_consumption_v1') AS f_apply_cons,
    EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'seal_inventory_consumption_v1') AS f_seal_cons
)
SELECT
  t_receipt_exec,
  t_stock_movements,
  t_inv_consumptions,
  t_inv_lines,
  f_receive_invoice,
  f_create_plan,
  f_apply_cons,
  f_seal_cons,
  CASE
    WHEN NOT (t_receipt_exec OR t_stock_movements OR t_inv_consumptions OR t_inv_lines OR f_receive_invoice OR f_create_plan OR f_apply_cons OR f_seal_cons)
      THEN 'CLEAN_PRE_INSTALL (Listo para instalar ambas migraciones secuencialmente)'
    WHEN (t_receipt_exec AND t_stock_movements AND t_inv_consumptions AND t_inv_lines AND f_receive_invoice AND f_create_plan AND f_apply_cons AND f_seal_cons)
      THEN 'FULLY_INSTALLED (Estructuras 1A completas y activas)'
    ELSE 'PARTIALLY_APPLIED (Alerta: existen estructuras parciales, verificar antes de aplicar)'
  END AS partial_application_status
FROM struct_1a;

-- ----------------------------------------------------------------------------
-- SECCIÓN 6: Auditoría de Datos Existentes (Facturas Históricas y Stock Inicial)
-- ----------------------------------------------------------------------------
-- Distribución de facturas de compra históricas por estado
SELECT
  status AS invoice_status,
  count(*) AS total_invoices,
  COALESCE(sum(total_amount), 0) AS total_amount_eur
FROM public.purchase_invoices
GROUP BY status
ORDER BY total_invoices DESC;

-- Estado actual de existencias e inventario en ingredients
SELECT
  tenant_id,
  count(*) AS total_ingredients,
  count(*) FILTER (WHERE stock > 0) AS ingredients_with_positive_stock,
  count(*) FILTER (WHERE cost > 0) AS ingredients_with_cost,
  COALESCE(sum(stock), 0) AS total_aggregate_stock_units
FROM public.ingredients
GROUP BY tenant_id;

-- Detección de facturas marcadas como received antes de 1A (sin asiento en purchase_receipt_executions)
SELECT
  count(*) AS legacy_received_invoices_without_receipt_execution
FROM public.purchase_invoices pi
WHERE pi.status = 'received'
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_receipt_executions'
  );

-- ----------------------------------------------------------------------------
-- SECCIÓN 7: Veredicto Global del Preflight
-- ----------------------------------------------------------------------------
SELECT
  CASE
    WHEN (
      EXISTS(SELECT 1 FROM pg_roles WHERE rolname = 'cr_order_writer') AND
      has_schema_privilege('cr_order_writer', 'auth', 'USAGE') AND
      has_function_privilege('cr_order_writer', 'auth.uid()', 'EXECUTE')
    ) THEN 'READY_FOR_MIGRATION'
    ELSE 'BLOCKED_MISSING_AUTH_PREREQUISITE'
  END AS global_preflight_verdict,
  '20261024180000_cr_cost_1a_atomic_purchase_receipt.sql -> 20261024190000_flow04_inventory_consumption_persistence.sql' AS recommended_migration_order,
  'READ-ONLY TRANSACTION COMPLETED' AS execution_mode;

COMMIT;
