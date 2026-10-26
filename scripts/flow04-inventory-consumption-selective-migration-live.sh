#!/usr/bin/env bash
# ==============================================================================
# YOURMEAL OS — FLOW-04 INVENTORY CONSUMPTION SELECTIVE CUTOVER
# MIGRACIÓN PRODUCTIVA EXCLUSIVA: 20261024190000
#
# Target: EatClean Production Dedicated Supabase (nhirlpkuvonggctdzzad)
# Host: aws-0-eu-central-1.pooler.supabase.com:5432 OR db.nhirlpkuvonggctdzzad.supabase.co:5432
# Database: postgres
# User: postgres.nhirlpkuvonggctdzzad (pooler) / postgres (direct)
# Migration: supabase/migrations/20261024190000_flow04_inventory_consumption_persistence.sql
# Migration SHA-256: 72bebe319e282d7de135cca14194a796a945b94fa569cdb76a58cd03f383c849
#
# Security & Operational Guarantees:
# 1. Enforces verify-full TLS with official CA certificate (/Users/alex/Downloads/prod-ca-2021.crt)
# 2. Strict exact-match hostname and project validation; rejects Demo (djangucecsphnejplvic) fail-closed
# 3. Interactive hidden password input (read -rs); zero credentials saved or echoed
# 4. Strict precheck:
#    - Project: nhirlpkuvonggctdzzad, Database: postgres
#    - Tenant EatClean: 8bba00ba-331b-42c8-9283-4e3836ffb870 / eatclean
#    - Prerequisite 20261024175900 (identidad) must be registered (1)
#    - Prerequisite 20261024180000 (compras 1A) must be registered (1)
#    - Target 20261024190000 (consumo 1A) must NOT be applied yet (0)
#    - Tables inventory_consumptions and inventory_consumption_lines must NOT exist yet (0)
#    - Functions create/apply/seal consumption must NOT exist yet (0)
# 5. Read-only preflight and zero writes on --dry-run (exits 0)
# 6. Single atomic transaction: DDL + ledger registration (20261024190000) in one commit
# 7. Postcheck: Ledger registered, tables exist with RLS, 3 RPC functions verified (postgres, SECDEF, ACLs)
# 8. Requires explicit confirmation token for live execution to prevent accidental execution
# ==============================================================================
set -euo pipefail

EXPECTED_PROJECT="nhirlpkuvonggctdzzad"
EXPECTED_POOLER_HOST="aws-0-eu-central-1.pooler.supabase.com"
EXPECTED_DIRECT_HOST="db.nhirlpkuvonggctdzzad.supabase.co"
EXPECTED_PORT="5432"
EXPECTED_DB="postgres"

CONFIRMATION_TOKEN="APPLY_20261024190000_TO_EATCLEAN_PROD"

DRY_RUN="false"
APPLY_FLAG="false"
for arg in "$@"; do
  if [ "$arg" = "--dry-run" ]; then
    DRY_RUN="true"
  elif [ "$arg" = "--apply" ]; then
    APPLY_FLAG="true"
  fi
done

# Guard de Ejecución Accidental: Por defecto, si no se especifica --apply, opera en --dry-run
if [ "$APPLY_FLAG" = "false" ] && [ "$DRY_RUN" = "false" ]; then
  echo "INFO: No se especificó modo de ejecución. Activando por defecto --dry-run (100% READ ONLY)."
  DRY_RUN="true"
fi

if [ "${LAB_ISOLATED_PG17:-}" = "true" ]; then
  EXPECTED_PROJECT="lab-isolated-pg17"
  EXPECTED_POOLER_HOST="127.0.0.1"
  EXPECTED_DIRECT_HOST="127.0.0.1"
  EXPECTED_PORT="${PGPORT:-54322}"
  TARGET_HOST="127.0.0.1"
  TARGET_PORT="${PGPORT:-54322}"
  TARGET_USER="${PGUSER:-postgres}"
  TARGET_DB="${PGDATABASE:-postgres}"
  PGPASSWORD="${PGPASSWORD:-postgres}"
  export PGPASSWORD
else
  TARGET_HOST="${SUPABASE_DB_HOST:-$EXPECTED_POOLER_HOST}"
  TARGET_PORT="${PGPORT:-$EXPECTED_PORT}"
  TARGET_USER="${PGUSER:-postgres.$EXPECTED_PROJECT}"
  TARGET_DB="${PGDATABASE:-$EXPECTED_DB}"
fi

MIGRATION_VERSION="20261024190000"
MIGRATION_FILE_REL="supabase/migrations/20261024190000_flow04_inventory_consumption_persistence.sql"
EXPECTED_MIGRATION_SHA="72bebe319e282d7de135cca14194a796a945b94fa569cdb76a58cd03f383c849"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATION_FILE="$ROOT_DIR/$MIGRATION_FILE_REL"

# ------------------------------------------------------------------------------
# 0. SEGURIDAD Y VALIDACIÓN DE DESTINO (EXACT-MATCH & FAIL-CLOSED)
# ------------------------------------------------------------------------------

# Guard 1: Prohibir taxativamente cualquier referencia al entorno de Demo (djangucecsphnejplvic)
if [ "${LAB_ISOLATED_PG17:-}" != "true" ]; then
  if [[ "$TARGET_HOST" == *"djangucecsphnejplvic"* ]] || [[ "$TARGET_USER" == *"djangucecsphnejplvic"* ]]; then
    echo "FATAL SECURITY_VIOLATION: EatClean FLOW-04 migration cannot connect to Demo project (djangucecsphnejplvic)!" >&2
    exit 1
  fi
fi

# Guard 2: Validación de coincidencia exacta de hostname y usuario
if [ "${LAB_ISOLATED_PG17:-}" = "true" ]; then
  if [ "$TARGET_HOST" != "127.0.0.1" ] || [ "$TARGET_USER" != "postgres" ]; then
    echo "FATAL SECURITY_VIOLATION: En modo laboratorio aislado se exige '127.0.0.1' y 'postgres'!" >&2
    exit 1
  fi
elif [ "$TARGET_HOST" = "$EXPECTED_POOLER_HOST" ]; then
  if [ "$TARGET_USER" != "postgres.$EXPECTED_PROJECT" ]; then
    echo "FATAL SECURITY_VIOLATION: Conexión al pooler '$TARGET_HOST' requiere usuario exacto 'postgres.$EXPECTED_PROJECT', pero se recibió '$TARGET_USER'!" >&2
    exit 1
  fi
elif [ "$TARGET_HOST" = "$EXPECTED_DIRECT_HOST" ]; then
  if [ "$TARGET_USER" != "postgres" ] && [ "$TARGET_USER" != "postgres.$EXPECTED_PROJECT" ]; then
    echo "FATAL SECURITY_VIOLATION: Conexión directa a '$TARGET_HOST' requiere usuario 'postgres', pero se recibió '$TARGET_USER'!" >&2
    exit 1
  fi
else
  echo "FATAL SECURITY_VIOLATION: Host no autorizado '$TARGET_HOST'!" >&2
  exit 1
fi

if [ "$TARGET_PORT" != "$EXPECTED_PORT" ]; then
  echo "FATAL SECURITY_VIOLATION: Puerto no autorizado '$TARGET_PORT' (esperado '$EXPECTED_PORT')!" >&2
  exit 1
fi

if [ "$TARGET_DB" != "$EXPECTED_DB" ]; then
  echo "FATAL SECURITY_VIOLATION: Base de datos no autorizada '$TARGET_DB' (esperada '$EXPECTED_DB')!" >&2
  exit 1
fi

# Guard 3: Entrada interactiva oculta de contraseña
if [ -z "${PGPASSWORD:-}" ]; then
  if [ -t 0 ]; then
    printf "Introduce la contraseña de PostgreSQL para %s (typing hidden): " "$TARGET_USER"
    read -rs PGPASSWORD
    echo ""
  else
    echo "FATAL: PGPASSWORD no está definido y no hay terminal interactivo (TTY) para solicitarlo." >&2
    exit 2
  fi
fi

if [ -z "$PGPASSWORD" ]; then
  echo "FATAL: La contraseña no puede estar vacía." >&2
  exit 2
fi

export PGPASSWORD

# Guard 4: Verificación estricta de TLS y certificado CA
if [ "${LAB_ISOLATED_PG17:-}" != "true" ]; then
  CA_CERT="${PGSSLROOTCERT:-/Users/alex/Downloads/prod-ca-2021.crt}"
  CA_EXPECTED_SHA="700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7"

  if [ ! -f "$CA_CERT" ]; then
    echo "FATAL SECURITY_VIOLATION: Certificado CA no encontrado en '$CA_CERT'." >&2
    exit 1
  fi

  OBSERVED_CA_SHA="$(shasum -a 256 "$CA_CERT" 2>/dev/null | awk '{print $1}')"
  if [ "$OBSERVED_CA_SHA" != "$CA_EXPECTED_SHA" ]; then
    echo "FATAL SECURITY_VIOLATION: Checksum SHA-256 del certificado CA inválido ('$OBSERVED_CA_SHA')!" >&2
    exit 1
  fi

  export PGSSLMODE="verify-full"
  export PGSSLROOTCERT="$CA_CERT"
else
  export PGSSLMODE="prefer"
fi

export PGCONNECT_TIMEOUT=15
export PGOPTIONS="-c statement_timeout=60000 -c lock_timeout=5000"

PSQL_BIN="${PSQL_BIN:-$(which psql || true)}"
if [ -z "$PSQL_BIN" ]; then
  if [ -x "/opt/homebrew/bin/psql" ]; then
    PSQL_BIN="/opt/homebrew/bin/psql"
  elif [ -x "/opt/homebrew/opt/libpq/bin/psql" ]; then
    PSQL_BIN="/opt/homebrew/opt/libpq/bin/psql"
  else
    echo "FATAL: psql no encontrado en el sistema." >&2
    exit 1
  fi
fi

run_readonly_sql() {
  local query="$1"
  "$PSQL_BIN" -X -A -t -q \
    -h "$TARGET_HOST" \
    -p "$TARGET_PORT" \
    -U "$TARGET_USER" \
    -d "$TARGET_DB" \
    -v ON_ERROR_STOP=1 \
    -c "BEGIN TRANSACTION READ ONLY; $query; COMMIT;"
}

echo "===================================================================="
echo "YOURMEAL OS — COST INTELLIGENCE 1A: FLOW-04 INVENTORY CONSUMPTION"
echo "Target Project : $EXPECTED_PROJECT"
echo "Target Host    : $TARGET_USER@$TARGET_HOST:$TARGET_PORT/$TARGET_DB"
echo "TLS Mode       : ${PGSSLMODE}"
echo "Migration File : $MIGRATION_FILE_REL"
echo "Migration SHA  : $EXPECTED_MIGRATION_SHA"
echo "Execution Mode : $( [ "$DRY_RUN" = "true" ] && echo "DRY_RUN (100% READ ONLY)" || echo "APPLY (TRANSACTIONAL WRITE)" )"
echo "Timestamp (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "===================================================================="
echo ""

# ------------------------------------------------------------------------------
# FASE 1: PRECHECKS ESTRICTOS (READ-ONLY)
# ------------------------------------------------------------------------------
echo "--- [FASE 1/3] PRECHECKS DE IDENTIDAD, HISTORIAL Y OBJETOS ---"

# 1. Integridad física del archivo de migración
if [ ! -f "$MIGRATION_FILE" ]; then
  echo "FATAL: Archivo de migración no encontrado en '$MIGRATION_FILE'!" >&2
  exit 1
fi

OBSERVED_MIGRATION_SHA="$(shasum -a 256 "$MIGRATION_FILE" 2>/dev/null | awk '{print $1}')"
if [ "$OBSERVED_MIGRATION_SHA" != "$EXPECTED_MIGRATION_SHA" ]; then
  echo "FATAL: Checksum SHA-256 de migración inválido! Esperado: $EXPECTED_MIGRATION_SHA, Observado: $OBSERVED_MIGRATION_SHA" >&2
  exit 1
fi
echo "  ✓ Archivo canónico verificado: SHA-256=$OBSERVED_MIGRATION_SHA"

# 2. Identidad del Tenant
if [ "${LAB_ISOLATED_PG17:-}" = "true" ]; then
  TENANT_ROW="$(run_readonly_sql "SELECT id || '|' || name || '|' || slug FROM public.tenants WHERE slug = 'eatclean' LIMIT 1;")"
  echo "  ✓ Tenant verificado (modo laboratorio): $TENANT_ROW"
else
  TENANT_ROW="$(run_readonly_sql "SELECT id || '|' || name || '|' || slug FROM public.tenants WHERE id = '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid;")"
  if [ "$TENANT_ROW" != "8bba00ba-331b-42c8-9283-4e3836ffb870|EatClean|eatclean" ]; then
    echo "FATAL: Verificación de Tenant EatClean falló: '$TENANT_ROW'!" >&2
    exit 1
  fi
  echo "  ✓ Tenant EatClean verificado: $TENANT_ROW"
fi

# 3. Ledger oficial de migraciones
LEDGER_AUDIT="$(run_readonly_sql "
SELECT
  (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '20261024175900') || '|' ||
  (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '20261024180000') || '|' ||
  (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '$MIGRATION_VERSION');
")"

ID_BRIDGE_COUNT="$(echo "$LEDGER_AUDIT" | cut -d'|' -f1)"
PART1_COMPRAS_COUNT="$(echo "$LEDGER_AUDIT" | cut -d'|' -f2)"
TARGET_FLOW04_COUNT="$(echo "$LEDGER_AUDIT" | cut -d'|' -f3)"

echo "  Ledger: Identidad(20261024175900)=$ID_BRIDGE_COUNT, Compras(20261024180000)=$PART1_COMPRAS_COUNT, Consumo($MIGRATION_VERSION)=$TARGET_FLOW04_COUNT"

if [ "$ID_BRIDGE_COUNT" -ne 1 ]; then
  echo "FATAL: Prerrequisito no cumplido: El puente de identidad (20261024175900) no está registrado en schema_migrations!" >&2
  exit 1
fi

if [ "$PART1_COMPRAS_COUNT" -ne 1 ]; then
  echo "FATAL: Prerrequisito no cumplido: La Parte 1 de Cost Intelligence (20261024180000) no está registrada en schema_migrations!" >&2
  exit 1
fi

if [ "$TARGET_FLOW04_COUNT" -ne 0 ]; then
  echo "FATAL: La migración FLOW-04 ($MIGRATION_VERSION) YA está registrada en schema_migrations!" >&2
  exit 1
fi
echo "  ✓ Historial de migraciones verificado (identidad=1, compras=1, consumo=0)."

# 4. Verificación de ausencia de estructuras parciales de consumo
PARTIAL_STRUCTURES="$(run_readonly_sql "
SELECT
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('inventory_consumptions', 'inventory_consumption_lines')) || '|' ||
  (SELECT count(*) FROM pg_proc WHERE proname IN ('create_inventory_consumption_plan_v1', 'apply_inventory_consumption_v1', 'seal_inventory_consumption_v1'));
")"

PART_TABLES_COUNT="$(echo "$PARTIAL_STRUCTURES" | cut -d'|' -f1)"
PART_FUNCS_COUNT="$(echo "$PARTIAL_STRUCTURES" | cut -d'|' -f2)"

if [ "$PART_TABLES_COUNT" -ne 0 ]; then
  echo "FATAL: BLOCKED: PARTIAL_STRUCTURES_EXIST: Se detectaron $PART_TABLES_COUNT tablas de consumo preexistentes en public!" >&2
  exit 1
fi

if [ "$PART_FUNCS_COUNT" -ne 0 ]; then
  echo "FATAL: BLOCKED: PARTIAL_STRUCTURES_EXIST: Se detectaron $PART_FUNCS_COUNT funciones de consumo preexistentes en pg_proc!" >&2
  exit 1
fi
echo "  ✓ Catálogo limpio: 0 tablas y 0 funciones de consumo preexistentes."

# 5. Verificación de Parte 1 existente (stock_movements y purchase_receipt_executions)
PART1_AUDIT="$(run_readonly_sql "
SELECT
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('stock_movements', 'purchase_receipt_executions')) || '|' ||
  (SELECT count(*) FROM pg_proc WHERE proname = 'receive_purchase_invoice_v1') || '|' ||
  (SELECT count(*) FROM public.stock_movements);
")"

PART1_TABLES="$(echo "$PART1_AUDIT" | cut -d'|' -f1)"
PART1_FUNCS="$(echo "$PART1_AUDIT" | cut -d'|' -f2)"
BASELINE_STOCK_MOVEMENTS="$(echo "$PART1_AUDIT" | cut -d'|' -f3)"

if [ "$PART1_TABLES" -ne 2 ] || [ "$PART1_FUNCS" -ne 1 ]; then
  echo "FATAL: Inconsistencia en Parte 1: Se esperaban 2 tablas y 1 función de compras, pero se encontraron tablas=$PART1_TABLES, funcs=$PART1_FUNCS" >&2
  exit 1
fi
echo "  ✓ Estructuras de Parte 1 activas (stock_movements baseline count: $BASELINE_STOCK_MOVEMENTS)."
echo "  ✓ FASE 1 PASS: Identidad, prerrequisitos de ledger y ausencia de colisiones verificados."
echo ""

# ------------------------------------------------------------------------------
# SALIDA TEMPRANA EN MODO DRY-RUN
# ------------------------------------------------------------------------------
if [ "$DRY_RUN" = "true" ]; then
  echo "===================================================================="
  echo "DRY_RUN_RESULT: PASS (100% READ ONLY - ZERO WRITES EXECUTED)"
  echo "La base de datos de producción cumple todos los prerrequisitos técnicos"
  echo "para aplicar la migración $MIGRATION_VERSION de forma atómica y segura."
  echo "Para aplicar cambios reales, ejecute con --apply y confirme con el token:"
  echo "$CONFIRMATION_TOKEN"
  echo "===================================================================="
  exit 0
fi

# ------------------------------------------------------------------------------
# GUARD DE EJECUCIÓN HUMANA EXPRESA (--apply)
# ------------------------------------------------------------------------------
echo "--- GUARD DE CONFIRMACIÓN HUMANA EXPRESA PARA ESCRITURA PRODUCTIVA ---"
echo "ATENCIÓN: Se dispone a ejecutar cambios DDL permanentes en EatClean Production ($TARGET_HOST)."
echo "Migración objetivo : $MIGRATION_VERSION ($MIGRATION_FILE_REL)"
echo "Token requerido    : $CONFIRMATION_TOKEN"
echo ""

PROVIDED_TOKEN="${CONFIRM_LIVE_EXECUTION:-}"

if [ -z "$PROVIDED_TOKEN" ]; then
  if [ -t 0 ]; then
    printf "Escriba exactamente el token '%s' para autorizar: " "$CONFIRMATION_TOKEN"
    read -r PROVIDED_TOKEN
    echo ""
  else
    echo "FATAL: Modo --apply invocado sin terminal interactivo y sin CONFIRM_LIVE_EXECUTION en entorno." >&2
    exit 2
  fi
fi

if [ "$PROVIDED_TOKEN" != "$CONFIRMATION_TOKEN" ]; then
  echo "FATAL: Token de autorización inválido ('$PROVIDED_TOKEN'). Ejecución abortada." >&2
  exit 1
fi
echo "  ✓ Autorización humana validada."
echo ""

# ------------------------------------------------------------------------------
# FASE 2: APLICACIÓN ATÓMICA DE LA MIGRACIÓN
# ------------------------------------------------------------------------------
echo "--- [FASE 2/3] APLICANDO MIGRACIÓN FLOW-04 DE FORMA ATÓMICA ---"

EXECUTOR_SCRIPT="$ROOT_DIR/scripts/flow04-inventory-consumption-selective-executor.mjs"
if [ ! -f "$EXECUTOR_SCRIPT" ]; then
  echo "FATAL: No se encontró el ejecutor selectivo Node en '$EXECUTOR_SCRIPT'!" >&2
  exit 1
fi

export CONFIRM_LIVE_EXECUTION="$PROVIDED_TOKEN"

node "$EXECUTOR_SCRIPT" \
  "$ROOT_DIR" \
  "$MIGRATION_FILE_REL" \
  "$MIGRATION_VERSION" \
  "$TARGET_HOST" \
  "$TARGET_PORT" \
  "$TARGET_USER" \
  "$TARGET_DB" \
  "$PSQL_BIN"

echo "  ✓ FASE 2 PASS: Transacción atómica enviada y comprometida."
echo ""

# ------------------------------------------------------------------------------
# FASE 3: POSTCHECK ESTRICTO DE ESTADO Y SEGURIDAD (READ-ONLY)
# ------------------------------------------------------------------------------
echo "--- [FASE 3/3] POSTCHECK DE HISTORIAL, ESTRUCTURAS, RLS Y PERMISOS ---"

POST_AUDIT="$(run_readonly_sql "
SELECT
  (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '$MIGRATION_VERSION') || '|' ||
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('inventory_consumptions', 'inventory_consumption_lines')) || '|' ||
  (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname IN ('inventory_consumptions', 'inventory_consumption_lines') AND c.relrowsecurity = true) || '|' ||
  (SELECT count(*) FROM pg_proc WHERE proname IN ('create_inventory_consumption_plan_v1', 'apply_inventory_consumption_v1', 'seal_inventory_consumption_v1')) || '|' ||
  (SELECT count(*) FROM pg_proc WHERE proname IN ('create_inventory_consumption_plan_v1', 'apply_inventory_consumption_v1', 'seal_inventory_consumption_v1') AND pg_get_userbyid(proowner) = 'postgres' AND prosecdef = true) || '|' ||
  (SELECT count(*) FROM public.stock_movements);
")"

POST_MIG_COUNT="$(echo "$POST_AUDIT" | cut -d'|' -f1)"
POST_TABLES_COUNT="$(echo "$POST_AUDIT" | cut -d'|' -f2)"
POST_RLS_COUNT="$(echo "$POST_AUDIT" | cut -d'|' -f3)"
POST_FUNCS_COUNT="$(echo "$POST_AUDIT" | cut -d'|' -f4)"
POST_FUNCS_SECDEF="$(echo "$POST_AUDIT" | cut -d'|' -f5)"
POST_STOCK_MOVEMENTS="$(echo "$POST_AUDIT" | cut -d'|' -f6)"

echo "  Postcheck: Migración=$POST_MIG_COUNT, Tablas=$POST_TABLES_COUNT (RLS=$POST_RLS_COUNT), Funciones=$POST_FUNCS_COUNT (SECDEF=$POST_FUNCS_SECDEF), StockMovements=$POST_STOCK_MOVEMENTS"

if [ "$POST_MIG_COUNT" -ne 1 ]; then
  echo "FATAL POSTCHECK: La migración $MIGRATION_VERSION no consta registrada en schema_migrations!" >&2
  exit 1
fi

if [ "$POST_TABLES_COUNT" -ne 2 ] || [ "$POST_RLS_COUNT" -ne 2 ]; then
  echo "FATAL POSTCHECK: Fallo en tablas de consumo o falta RLS (encontradas $POST_TABLES_COUNT, RLS activo $POST_RLS_COUNT, esperado 2/2)!" >&2
  exit 1
fi

if [ "$POST_FUNCS_COUNT" -ne 3 ] || [ "$POST_FUNCS_SECDEF" -ne 3 ]; then
  echo "FATAL POSTCHECK: Las 3 funciones de consumo deben existir, pertenecer a postgres y tener SECURITY DEFINER!" >&2
  exit 1
fi

# Verificar permisos de funciones RPC
PERM_VIOLATIONS="$(run_readonly_sql "
SELECT count(*) FROM pg_proc
WHERE proname IN ('create_inventory_consumption_plan_v1', 'apply_inventory_consumption_v1', 'seal_inventory_consumption_v1')
  AND (has_function_privilege('public', oid, 'EXECUTE') OR has_function_privilege('anon', oid, 'EXECUTE'));
")"

if [ "$PERM_VIOLATIONS" -ne 0 ]; then
  echo "FATAL POSTCHECK: Permisos indebidos en funciones de consumo: PUBLIC o anon tienen EXECUTE!" >&2
  exit 1
fi

if [ "$POST_STOCK_MOVEMENTS" != "$BASELINE_STOCK_MOVEMENTS" ]; then
  echo "FATAL POSTCHECK: Se crearon movimientos de stock durante la migración DDL (baseline=$BASELINE_STOCK_MOVEMENTS, actual=$POST_STOCK_MOVEMENTS)!" >&2
  exit 1
fi

echo "  ✓ Verificación post-migración completada con éxito."
echo ""
echo "===================================================================="
echo "APPLY_RESULT: PASS (MIGRATION $MIGRATION_VERSION FULLY INSTALLED)"
echo "Cost Intelligence 1A FLOW-04 ha sido instalada y registrada de forma"
echo "completamente atómica, conforme y consistente en EatClean Production."
echo "===================================================================="
exit 0
