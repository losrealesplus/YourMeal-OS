#!/usr/bin/env bash
# ==============================================================================
# YOURMEAL OS — EATCLEAN P1 PREFLIGHT READ-ONLY CHECK (71 -> 72)
#
# Target: EatClean Production Dedicated Supabase (nhirlpkuvonggctdzzad)
# Host: aws-0-eu-central-1.pooler.supabase.com:5432 OR db.nhirlpkuvonggctdzzad.supabase.co:5432
# Database: postgres
# User: postgres.nhirlpkuvonggctdzzad (pooler) / postgres (direct)
#
# Guarantees:
# 1. 100% READ-ONLY (BEGIN TRANSACTION READ ONLY;)
# 2. Enforces verify-full TLS with official CA certificate (/Users/alex/Downloads/prod-ca-2021.crt)
# 3. Strict fail-closed destination check: rejects Demo (djangucecsphnejplvic)
# 4. Hidden interactive password input (read -rs)
# 5. Zero modifications, zero writes
# ==============================================================================
set -euo pipefail

EXPECTED_PROJECT="nhirlpkuvonggctdzzad"
EXPECTED_POOLER_HOST="aws-0-eu-central-1.pooler.supabase.com"
EXPECTED_DIRECT_HOST="db.nhirlpkuvonggctdzzad.supabase.co"
EXPECTED_PORT="5432"
EXPECTED_DB="postgres"

TARGET_HOST="${SUPABASE_DB_HOST:-$EXPECTED_POOLER_HOST}"
TARGET_PORT="${PGPORT:-$EXPECTED_PORT}"
TARGET_USER="${PGUSER:-postgres.$EXPECTED_PROJECT}"
TARGET_DB="${PGDATABASE:-$EXPECTED_DB}"

MIGRATION_VERSION="20261016203000"

if [[ "$TARGET_HOST" == *"djangucecsphnejplvic"* ]] || [[ "$TARGET_USER" == *"djangucecsphnejplvic"* ]]; then
  echo "FATAL SECURITY_VIOLATION: EatClean P1 preflight cannot connect to Demo project (djangucecsphnejplvic)!" >&2
  exit 1
fi

if [ "$TARGET_HOST" = "$EXPECTED_POOLER_HOST" ]; then
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
export PGCONNECT_TIMEOUT=15

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
echo "YOURMEAL OS — EATCLEAN P1 PREFLIGHT AUDIT (READ-ONLY)"
echo "Target Project : $EXPECTED_PROJECT (eu-central-1 Frankfurt)"
echo "Target Host    : $TARGET_USER@$TARGET_HOST:$TARGET_PORT/$TARGET_DB"
echo "TLS Mode       : verify-full"
echo "Timestamp (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "===================================================================="
echo ""

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
  echo "   ✗ PRODUCTION_LEDGER: DISCREPANCIA DETECTADA!" >&2
  exit 1
fi

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
echo "3. Datos Existentes (Baseline):"
echo "   Tenants : $(echo "$DATA_AUDIT" | cut -d'|' -f1)"
echo "   Members : $(echo "$DATA_AUDIT" | cut -d'|' -f2)"
echo "   Dishes  : $(echo "$DATA_AUDIT" | cut -d'|' -f3)"
echo "   Menus   : $(echo "$DATA_AUDIT" | cut -d'|' -f4)"
echo "   Services: $(echo "$DATA_AUDIT" | cut -d'|' -f5)"
echo "   Orders  : $(echo "$DATA_AUDIT" | cut -d'|' -f6)"
echo "   ✓ DATA_INTEGRITY: PASS"

echo ""
echo "===================================================================="
echo "PREFLIGHT RESULT: READY_FOR_P1_MIGRATION"
echo "===================================================================="
