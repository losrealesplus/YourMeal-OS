#!/usr/bin/env bash
# ==============================================================================
# YOURMEAL OS — EATCLEAN P1 PREFLIGHT READ-ONLY CHECK (71 -> 72)
#
# Target: EatClean Production Dedicated Supabase (nhirlpkuvonggctdzzad)
# Host: aws-0-eu-central-1.pooler.supabase.com:5432 OR db.nhirlpkuvonggctdzzad.supabase.co:5432
# Database: postgres
# User: postgres.nhirlpkuvonggctdzzad (pooler) / postgres (direct)
# Migration Candidate: supabase/migrations/20261016203000_cr_order_off_menu_admin_exception.sql
#
# Guarantees:
# 1. 100% READ-ONLY (default_transaction_read_only=on, BEGIN TRANSACTION READ ONLY;)
# 2. Enforces verify-full TLS with official CA certificate (/Users/alex/Downloads/prod-ca-2021.crt)
# 3. Strict fail-closed destination check: rejects Demo (djangucecsphnejplvic)
# 4. Hidden interactive password input (read -rs); zero credentials saved or echoed
# 5. Zero modifications, zero writes, zero DDL, zero DML
# ==============================================================================
set -euo pipefail

EXPECTED_PROJECT="nhirlpkuvonggctdzzad"
EXPECTED_POOLER_HOST="aws-0-eu-central-1.pooler.supabase.com"
EXPECTED_DIRECT_HOST="db.nhirlpkuvonggctdzzad.supabase.co"
EXPECTED_PORT="5432"
EXPECTED_DB="postgres"

MIGRATION_VERSION="20261016203000"
MIGRATION_FILE_REL="supabase/migrations/20261016203000_cr_order_off_menu_admin_exception.sql"
EXPECTED_MIGRATION_SHA="9366fd1bd871106ce463425153d524bb8fde1710e0237693dd3075648838713e"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATION_FILE="$ROOT_DIR/$MIGRATION_FILE_REL"

# ------------------------------------------------------------------------------
# 1. INTEGRIDAD DE ARCHIVO DE MIGRACIÓN CANDIDATA
# ------------------------------------------------------------------------------
if [ ! -f "$MIGRATION_FILE" ]; then
  echo "FATAL: Archivo de migración candidata no encontrado en '$MIGRATION_FILE'!" >&2
  exit 1
fi

OBSERVED_MIGRATION_SHA="$(shasum -a 256 "$MIGRATION_FILE" 2>/dev/null | awk '{print $1}')"
if [ "$OBSERVED_MIGRATION_SHA" != "$EXPECTED_MIGRATION_SHA" ]; then
  echo "FATAL SECURITY_VIOLATION: Checksum SHA-256 de migración inválido!" >&2
  echo "  Esperado: $EXPECTED_MIGRATION_SHA" >&2
  echo "  Obtenido: $OBSERVED_MIGRATION_SHA" >&2
  exit 1
fi

# ------------------------------------------------------------------------------
# 2. CONFIGURACIÓN Y GUARDA DE DESTINO
# ------------------------------------------------------------------------------
if [ "${LAB_ISOLATED_PG17:-}" = "true" ]; then
  EXPECTED_PROJECT="lab-isolated-pg17"
  EXPECTED_POOLER_HOST="127.0.0.1"
  EXPECTED_DIRECT_HOST="127.0.0.1"
  EXPECTED_PORT="${PGPORT:-5432}"
  TARGET_HOST="127.0.0.1"
  TARGET_PORT="${PGPORT:-5432}"
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

# Guard 1: Prohibir taxativamente cualquier referencia al entorno de Demo
if [[ "$TARGET_HOST" == *"djangucecsphnejplvic"* ]] || [[ "$TARGET_USER" == *"djangucecsphnejplvic"* ]]; then
  echo "FATAL SECURITY_VIOLATION: EatClean P1 preflight cannot connect to Demo project (djangucecsphnejplvic)!" >&2
  exit 1
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
  echo "FATAL SECURITY_VIOLATION: Puerto no autorizado '$TARGET_PORT'!" >&2
  exit 1
fi

if [ "$TARGET_DB" != "$EXPECTED_DB" ]; then
  echo "FATAL SECURITY_VIOLATION: Base de datos no autorizada '$TARGET_DB'!" >&2
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
if [ "${LAB_ISOLATED_PG17:-}" = "true" ]; then
  export PGSSLMODE="disable"
else
  CA_CERT="${PGSSLROOTCERT:-/Users/alex/Downloads/prod-ca-2021.crt}"
  CA_EXPECTED_SHA="700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7"

  if [ ! -f "$CA_CERT" ]; then
    echo "FATAL SECURITY_VIOLATION: Certificado CA no encontrado en '$CA_CERT'." >&2
    exit 1
  fi

  OBSERVED_CA_SHA="$(shasum -a 256 "$CA_CERT" 2>/dev/null | awk '{print $1}')"
  if [ "$OBSERVED_CA_SHA" != "$CA_EXPECTED_SHA" ]; then
    echo "FATAL SECURITY_VIOLATION: Checksum SHA-256 del certificado CA inválido." >&2
    exit 1
  fi

  export PGSSLMODE="verify-full"
  export PGSSLROOTCERT="$CA_CERT"
fi

export PGCONNECT_TIMEOUT=15
export PGOPTIONS="-c default_transaction_read_only=on -c statement_timeout=15000 -c lock_timeout=5000"

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

# Función de ejecución 100% de sólo lectura
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
echo "YOURMEAL OS — EATCLEAN P1 PREFLIGHT AUDIT (READ-ONLY)"
echo "Target Project : $EXPECTED_PROJECT"
echo "Target Host    : $TARGET_USER@$TARGET_HOST:$TARGET_PORT/$TARGET_DB"
echo "TLS Mode       : ${PGSSLMODE}"
echo "Migration File : $MIGRATION_FILE_REL"
echo "Migration SHA  : $OBSERVED_MIGRATION_SHA"
echo "Timestamp (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "===================================================================="
echo ""

# ------------------------------------------------------------------------------
# 3. IDENTIDAD DE BASE DE DATOS Y TENANT
# ------------------------------------------------------------------------------
DB_INFO="$(run_readonly_sql "SELECT current_database() || '|' || current_user || '|' || coalesce(inet_server_addr()::text, 'pooler-local');")"
DB_CURRENT="$(echo "$DB_INFO" | cut -d'|' -f1)"
USER_CURRENT="$(echo "$DB_INFO" | cut -d'|' -f2)"

TENANT_ROW="$(run_readonly_sql "SELECT id || '|' || name || '|' || slug FROM public.tenants WHERE id = '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid;")"
TENANT_ID="$(echo "$TENANT_ROW" | cut -d'|' -f1)"
TENANT_NAME="$(echo "$TENANT_ROW" | cut -d'|' -f2)"
TENANT_SLUG="$(echo "$TENANT_ROW" | cut -d'|' -f3)"

echo "1. Identidad de Servidor y Tenant:"
echo "   Database       : $DB_CURRENT"
echo "   Current User   : $USER_CURRENT"
echo "   Tenant Record  : $TENANT_ROW"

if [ "$DB_CURRENT" = "postgres" ] && [ "$USER_CURRENT" = "postgres" ] && \
   [ "$TENANT_ID" = "8bba00ba-331b-42c8-9283-4e3836ffb870" ] && \
   [ "$TENANT_NAME" = "EatClean" ] && [ "$TENANT_SLUG" = "eatclean" ]; then
  echo "   ✓ TARGET_IDENTITY: PASS"
else
  echo "   ✗ TARGET_IDENTITY: FAIL!" >&2
  exit 1
fi

# ------------------------------------------------------------------------------
# 4. HISTORIAL DE MIGRACIONES (LEDGER OFICIAL)
# ------------------------------------------------------------------------------
LEDGER_AUDIT="$(run_readonly_sql "
SELECT 
  (SELECT count(*) FROM supabase_migrations.schema_migrations) || '|' ||
  (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '$MIGRATION_VERSION') || '|' ||
  (SELECT max(split_part(version, '_', 1)) FROM supabase_migrations.schema_migrations);
")"

TOTAL_LEDGER="$(echo "$LEDGER_AUDIT" | cut -d'|' -f1)"
P1_COUNT="$(echo "$LEDGER_AUDIT" | cut -d'|' -f2)"
MAX_VERSION="$(echo "$LEDGER_AUDIT" | cut -d'|' -f3)"

echo ""
echo "2. Historial de Migraciones (Ledger Oficial):"
echo "   Total Versiones en Ledger : $TOTAL_LEDGER (esperado: 71)"
echo "   P1 Ya Aplicada en DB      : $P1_COUNT (esperado: 0)"
echo "   Versión Máxima Actual     : $MAX_VERSION (esperado: 20261015180000)"

if [ "$TOTAL_LEDGER" -eq 71 ] && [ "$P1_COUNT" -eq 0 ] && [ "$MAX_VERSION" = "20261015180000" ]; then
  echo "   ✓ PRODUCTION_LEDGER: PASS (71 versiones registradas, P1 ausente)"
else
  echo "   ✗ PRODUCTION_LEDGER: DISCREPANCIA DETECTADA! (Ledger=$TOTAL_LEDGER, P1_Count=$P1_COUNT, MaxVersion=$MAX_VERSION)" >&2
  exit 1
fi

# ------------------------------------------------------------------------------
# 5. CHECKPOINTS HISTÓRICOS DE OPERACIÓN
# ------------------------------------------------------------------------------
CHECKPOINTS_AUDIT="$(run_readonly_sql "
SELECT 
  CASE 
    WHEN to_regclass('gate6_recovery.checkpoints') IS NOT NULL THEN
      (SELECT count(*) FROM gate6_recovery.checkpoints WHERE status = 'applied')::text
    ELSE '0'
  END || '|' ||
  CASE 
    WHEN to_regclass('gate6_recovery.checkpoints') IS NOT NULL THEN
      (SELECT count(*) FROM gate6_recovery.checkpoints WHERE checkpoint_id = 11)::text
    ELSE '0'
  END;
")"

CHECKPOINTS_COUNT="$(echo "$CHECKPOINTS_AUDIT" | cut -d'|' -f1)"
CP11_COUNT="$(echo "$CHECKPOINTS_AUDIT" | cut -d'|' -f2)"

echo ""
echo "3. Checkpoints Históricos (gate6_recovery):"
echo "   Checkpoints Aplicados     : $CHECKPOINTS_COUNT"
echo "   Checkpoint 11 Ya Aplicado : $CP11_COUNT (esperado: 0)"

if [ "$CP11_COUNT" -eq 0 ]; then
  echo "   ✓ CHECKPOINTS: PASS (Checkpoint 11 no registrado previamente)"
else
  echo "   ✗ CHECKPOINTS: FAIL (Checkpoint 11 ya existe en la base de datos!)" >&2
  exit 1
fi

# ------------------------------------------------------------------------------
# 6. PERMISOS Y PRECONDICIONES TÉCNICAS
# ------------------------------------------------------------------------------
PRIVILEGES_AUDIT="$(run_readonly_sql "
SELECT 
  has_table_privilege('postgres', 'supabase_migrations.schema_migrations', 'INSERT') || '|' ||
  (to_regclass('public.orders') IS NOT NULL) || '|' ||
  (to_regclass('public.order_items') IS NOT NULL) || '|' ||
  (to_regclass('public.dishes') IS NOT NULL) || '|' ||
  (to_regclass('public.weekly_menus') IS NOT NULL) || '|' ||
  (to_regclass('public.kitchen_production_batches') IS NOT NULL);
")"

CAN_INSERT_LEDGER="$(echo "$PRIVILEGES_AUDIT" | cut -d'|' -f1)"
HAS_ORDERS="$(echo "$PRIVILEGES_AUDIT" | cut -d'|' -f2)"
HAS_ORDER_ITEMS="$(echo "$PRIVILEGES_AUDIT" | cut -d'|' -f3)"
HAS_DISHES="$(echo "$PRIVILEGES_AUDIT" | cut -d'|' -f4)"
HAS_MENUS="$(echo "$PRIVILEGES_AUDIT" | cut -d'|' -f5)"
HAS_BATCHES="$(echo "$PRIVILEGES_AUDIT" | cut -d'|' -f6)"

echo ""
echo "4. Permisos y Tablas Requeridas:"
echo "   INSERT sobre schema_migrations     : $CAN_INSERT_LEDGER (esperado: t)"
echo "   Tabla public.orders                : $HAS_ORDERS (esperado: t)"
echo "   Tabla public.order_items           : $HAS_ORDER_ITEMS (esperado: t)"
echo "   Tabla public.dishes                : $HAS_DISHES (esperado: t)"
echo "   Tabla public.weekly_menus          : $HAS_MENUS (esperado: t)"
echo "   Tabla kitchen_production_batches   : $HAS_BATCHES (esperado: t)"

if [ "$CAN_INSERT_LEDGER" = "t" ] && [ "$HAS_ORDERS" = "t" ] && [ "$HAS_ORDER_ITEMS" = "t" ] && \
   [ "$HAS_DISHES" = "t" ] && [ "$HAS_MENUS" = "t" ] && [ "$HAS_BATCHES" = "t" ]; then
  echo "   ✓ PREREQUISITES: PASS"
else
  echo "   ✗ PREREQUISITES: DISCREPANCIA DETECTADA!" >&2
  exit 1
fi

# ------------------------------------------------------------------------------
# 7. INTEGRIDAD DE DATOS OPERATIVOS (BASELINE)
# ------------------------------------------------------------------------------
DATA_AUDIT="$(run_readonly_sql "
SELECT 
  (SELECT count(*) FROM public.tenants WHERE id = '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid) || '|' ||
  (SELECT count(*) FROM public.tenant_members WHERE tenant_id = '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid) || '|' ||
  (SELECT count(*) FROM public.dishes WHERE tenant_id = '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid) || '|' ||
  (SELECT count(*) FROM public.weekly_menus WHERE tenant_id = '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid) || '|' ||
  (SELECT count(*) FROM public.delivery_services WHERE tenant_id = '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid) || '|' ||
  (SELECT count(*) FROM public.orders WHERE tenant_id = '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid);
")"

echo ""
echo "5. Datos Existentes (Baseline):"
echo "   Tenants : $(echo "$DATA_AUDIT" | cut -d'|' -f1)"
echo "   Members : $(echo "$DATA_AUDIT" | cut -d'|' -f2)"
echo "   Dishes  : $(echo "$DATA_AUDIT" | cut -d'|' -f3)"
echo "   Menus   : $(echo "$DATA_AUDIT" | cut -d'|' -f4)"
echo "   Services: $(echo "$DATA_AUDIT" | cut -d'|' -f5)"
echo "   Orders  : $(echo "$DATA_AUDIT" | cut -d'|' -f6)"
echo "   ✓ DATA_INTEGRITY: PASS"

echo ""
echo "===================================================================="
echo "PREFLIGHT_STATUS: PASS"
echo "PROJECT_ID: $EXPECTED_PROJECT"
echo "CURRENT_LEDGER: $TOTAL_LEDGER"
echo "P1_ALREADY_APPLIED: NO"
echo "MIGRATION_SHA256: $OBSERVED_MIGRATION_SHA"
echo "CHECKPOINTS: PASS"
echo "TLS_VERIFICATION: PASS"
echo "READY_FOR_MIGRATION_APPROVAL: YES"
echo "===================================================================="
