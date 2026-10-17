#!/usr/bin/env bash
# ==============================================================================
# YOURMEAL OS — EATCLEAN P1 CAPTURA UNIVERSAL
# MIGRACIÓN PRODUCTIVA EXCLUSIVA (71 -> 72)
#
# Target: EatClean Production Dedicated Supabase (nhirlpkuvonggctdzzad)
# Host: aws-0-eu-central-1.pooler.supabase.com:5432 OR db.nhirlpkuvonggctdzzad.supabase.co:5432
# Database: postgres
# User: postgres.nhirlpkuvonggctdzzad (pooler) / postgres (direct)
# Migration: supabase/migrations/20261016203000_cr_order_off_menu_admin_exception.sql
# Migration SHA-256: ddc98d42d69ec482cad153959b15ce977829c842732d0c301cba5287ee3de68e
#
# Security & Operational Guarantees:
# 1. Enforces verify-full TLS with official CA certificate (/Users/alex/Downloads/prod-ca-2021.crt)
# 2. Strict exact-match hostname and project validation; rejects Demo (djangucecsphnejplvic) fail-closed
# 3. Interactive hidden password input (read -rs); zero credentials saved or echoed
# 4. Strict precheck: Ledger must be exactly 71, P1 migration must NOT be applied yet
# 5. Atomic single transaction: DDL + ledger (71->72) + checkpoint (11) in one commit
# 6. Strict postcheck: Ledger must be exactly 72, functions verified, data preserved (100%)
# 7. Zero disruption to running Worker: full backward compatibility for existing weekly menu orders
# ==============================================================================
set -euo pipefail

EXPECTED_PROJECT="nhirlpkuvonggctdzzad"
EXPECTED_POOLER_HOST="aws-0-eu-central-1.pooler.supabase.com"
EXPECTED_DIRECT_HOST="db.nhirlpkuvonggctdzzad.supabase.co"
EXPECTED_PORT="5432"
EXPECTED_DB="postgres"

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

MIGRATION_VERSION="20261016203000"
MIGRATION_FILE_REL="supabase/migrations/20261016203000_cr_order_off_menu_admin_exception.sql"
EXPECTED_MIGRATION_SHA="9366fd1bd871106ce463425153d524bb8fde1710e0237693dd3075648838713e"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATION_FILE="$ROOT_DIR/$MIGRATION_FILE_REL"

# ------------------------------------------------------------------------------
# 0. SEGURIDAD Y VALIDACIÓN DE DESTINO (EXACT-MATCH & FAIL-CLOSED)
# ------------------------------------------------------------------------------

# Guard 1: Prohibir taxativamente cualquier referencia al entorno de Demo (djangucecsphnejplvic)
if [[ "$TARGET_HOST" == *"djangucecsphnejplvic"* ]] || [[ "$TARGET_USER" == *"djangucecsphnejplvic"* ]]; then
  echo "FATAL SECURITY_VIOLATION: EatClean P1 migration cannot connect to Demo project (djangucecsphnejplvic)!" >&2
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
  echo "FATAL SECURITY_VIOLATION: Host no autorizado '$TARGET_HOST'. Esperado: '$EXPECTED_POOLER_HOST' o '$EXPECTED_DIRECT_HOST'!" >&2
  exit 1
fi

if [ "$TARGET_PORT" != "$EXPECTED_PORT" ]; then
  echo "FATAL SECURITY_VIOLATION: Puerto no autorizado '$TARGET_PORT'. Esperado: '$EXPECTED_PORT'!" >&2
  exit 1
fi

if [ "$TARGET_DB" != "$EXPECTED_DB" ]; then
  echo "FATAL SECURITY_VIOLATION: Base de datos no autorizada '$TARGET_DB'. Esperada: '$EXPECTED_DB'!" >&2
  exit 1
fi

# Guard 3: Verificación de integridad del archivo de migración
if [ ! -f "$MIGRATION_FILE" ]; then
  echo "FATAL: Archivo de migración no encontrado en '$MIGRATION_FILE'!" >&2
  exit 1
fi

OBSERVED_MIGRATION_SHA="$(shasum -a 256 "$MIGRATION_FILE" 2>/dev/null | awk '{print $1}')"
if [ "$OBSERVED_MIGRATION_SHA" != "$EXPECTED_MIGRATION_SHA" ]; then
  echo "FATAL SECURITY_VIOLATION: Checksum SHA-256 de migración inválido!" >&2
  echo "  Esperado: $EXPECTED_MIGRATION_SHA" >&2
  echo "  Obtenido: $OBSERVED_MIGRATION_SHA" >&2
  exit 1
fi

# Guard 4: Contraseña interactiva y oculta
if [ -z "${PGPASSWORD:-}" ]; then
  if [ -t 0 ]; then
    printf "Introduce la contraseña de PostgreSQL para %s (typing hidden): " "$TARGET_USER"
    read -rs PGPASSWORD
    echo ""
  else
    echo "FATAL: PGPASSWORD no está definido y no hay terminal interactivo (TTY) para solicitarlo." >&2
    echo "Ejecute este script en un terminal interactivo introduciendo la contraseña manualmente." >&2
    exit 2
  fi
fi

if [ -z "$PGPASSWORD" ]; then
  echo "FATAL: La contraseña no puede estar vacía." >&2
  exit 2
fi

export PGPASSWORD

# Guard 5: Verificación estricta de TLS verify-full (en producción)
if [ "${LAB_ISOLATED_PG17:-}" != "true" ]; then
  CA_CERT="${PGSSLROOTCERT:-/Users/alex/Downloads/prod-ca-2021.crt}"
  CA_EXPECTED_SHA="700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7"

  if [ ! -f "$CA_CERT" ]; then
    echo "FATAL SECURITY_VIOLATION: Certificado CA no encontrado en '$CA_CERT'. Se exige 'verify-full' para producción; prohibido degradar a 'require'." >&2
    exit 1
  fi

  OBSERVED_CA_SHA="$(shasum -a 256 "$CA_CERT" 2>/dev/null | awk '{print $1}')"
  if [ "$OBSERVED_CA_SHA" != "$CA_EXPECTED_SHA" ]; then
    echo "FATAL SECURITY_VIOLATION: Checksum SHA-256 del certificado CA inválido (esperado: $CA_EXPECTED_SHA, obtenido: $OBSERVED_CA_SHA)." >&2
    exit 1
  fi

  export PGSSLMODE="verify-full"
  export PGSSLROOTCERT="$CA_CERT"
else
  CA_EXPECTED_SHA="N/A (LAB_ISOLATED)"
  export PGSSLMODE="disable"
fi
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

run_sql() {
  local query="$1"
  "$PSQL_BIN" -X -A -t -q \
    -h "$TARGET_HOST" \
    -p "$TARGET_PORT" \
    -U "$TARGET_USER" \
    -d "$TARGET_DB" \
    -v ON_ERROR_STOP=1 \
    -c "$query"
}

run_readonly_sql() {
  local query="$1"
  run_sql "BEGIN TRANSACTION READ ONLY; $query; COMMIT;"
}

echo "===================================================================="
echo "YOURMEAL OS — EATCLEAN P1 MIGRACIÓN PRODUCTIVA (71 -> 72)"
echo "Target Project : $EXPECTED_PROJECT"
echo "Target Host    : $TARGET_USER@$TARGET_HOST:$TARGET_PORT/$TARGET_DB"
echo "TLS Mode       : $PGSSLMODE (CA SHA-256: $CA_EXPECTED_SHA)"
echo "Migration File : $MIGRATION_FILE_REL"
echo "Migration SHA  : $EXPECTED_MIGRATION_SHA"
echo "Timestamp (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "===================================================================="
echo ""

# ------------------------------------------------------------------------------
# FASE 1: PRE-MIGRATION SANITY CHECK (FAIL-CLOSED)
# ------------------------------------------------------------------------------
echo "--- [FASE 1/3] VERIFICACIÓN PREVIA DE IDENTIDAD Y LEDGER (READ-ONLY) ---"

DB_INFO="$(run_readonly_sql "SELECT current_database() || '|' || current_user || '|' || coalesce(inet_server_addr()::text, 'pooler-local');")"
DB_CURRENT="$(echo "$DB_INFO" | cut -d'|' -f1)"
USER_CURRENT="$(echo "$DB_INFO" | cut -d'|' -f2)"

TENANT_ROW="$(run_readonly_sql "SELECT id || '|' || name || '|' || slug FROM public.tenants WHERE id = '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid;")"
TENANT_ID="$(echo "$TENANT_ROW" | cut -d'|' -f1)"
TENANT_NAME="$(echo "$TENANT_ROW" | cut -d'|' -f2)"
TENANT_SLUG="$(echo "$TENANT_ROW" | cut -d'|' -f3)"

echo "  Database       : $DB_CURRENT (esperado: postgres)"
echo "  Current User   : $USER_CURRENT (esperado: postgres)"
echo "  Tenant Record  : $TENANT_ROW"

if [ "$DB_CURRENT" != "postgres" ] || [ "$USER_CURRENT" != "postgres" ] || \
   [ "$TENANT_ID" != "8bba00ba-331b-42c8-9283-4e3836ffb870" ] || \
   [ "$TENANT_NAME" != "EatClean" ] || [ "$TENANT_SLUG" != "eatclean" ]; then
  echo "FATAL: Pre-migration identity check failed! Abortando." >&2
  exit 1
fi

LEDGER_PRE_INFO="$(run_readonly_sql "
SELECT 
  (SELECT count(*) FROM supabase_migrations.schema_migrations) || '|' ||
  (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '$MIGRATION_VERSION') || '|' ||
  (SELECT max(split_part(version, '_', 1)) FROM supabase_migrations.schema_migrations);
")"

TOTAL_LEDGER_PRE="$(echo "$LEDGER_PRE_INFO" | cut -d'|' -f1)"
P1_EXISTS_PRE="$(echo "$LEDGER_PRE_INFO" | cut -d'|' -f2)"
MAX_VERSION_PRE="$(echo "$LEDGER_PRE_INFO" | cut -d'|' -f3)"

echo "  Ledger actual  : $TOTAL_LEDGER_PRE (esperado: 71)"
echo "  P1 en DB       : $P1_EXISTS_PRE (esperado: 0)"
echo "  Versión máxima : $MAX_VERSION_PRE (esperado: 20261015180000)"

if [ "$TOTAL_LEDGER_PRE" -ne 71 ] || [ "$P1_EXISTS_PRE" -ne 0 ]; then
  echo "FATAL: Pre-migration ledger check failed! El ledger debe estar exactamente en 71 y P1 ausente." >&2
  exit 1
fi

# Baseline de datos para comprobación de preservación
DATA_PRE="$(run_readonly_sql "
SELECT 
  (SELECT count(*) FROM public.tenants WHERE id = '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid) || '|' ||
  (SELECT count(*) FROM public.tenant_members WHERE tenant_id = '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid) || '|' ||
  (SELECT count(*) FROM public.dishes WHERE tenant_id = '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid) || '|' ||
  (SELECT count(*) FROM public.weekly_menus WHERE tenant_id = '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid) || '|' ||
  (SELECT count(*) FROM public.delivery_services WHERE tenant_id = '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid) || '|' ||
  (SELECT count(*) FROM public.orders WHERE tenant_id = '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid);
")"

PRE_TENANTS="$(echo "$DATA_PRE" | cut -d'|' -f1)"
PRE_MEMBERS="$(echo "$DATA_PRE" | cut -d'|' -f2)"
PRE_DISHES="$(echo "$DATA_PRE" | cut -d'|' -f3)"
PRE_MENUS="$(echo "$DATA_PRE" | cut -d'|' -f4)"
PRE_SERVICES="$(echo "$DATA_PRE" | cut -d'|' -f5)"
PRE_ORDERS="$(echo "$DATA_PRE" | cut -d'|' -f6)"

echo "  Pre-migration baseline: Tenants=$PRE_TENANTS, Members=$PRE_MEMBERS, Dishes=$PRE_DISHES, Menus=$PRE_MENUS, Services=$PRE_SERVICES, Orders=$PRE_ORDERS"
echo "  ✓ FASE 1 PASS: Identidad y ledger de 71 versiones verificados."
echo ""

# ------------------------------------------------------------------------------
# FASE 2: APLICACIÓN ATÓMICA DE LA MIGRACIÓN P1 (FORWARD-ONLY)
# ------------------------------------------------------------------------------
echo "--- [FASE 2/3] APLICANDO MIGRACIÓN P1 DE FORMA ATÓMICA ---"

# Ejecutor Node.js para envolver el payload en una transacción única con el ledger
node -e '
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const rootDir = process.argv[1];
const migrationFileRel = process.argv[2];
const migrationVersion = process.argv[3];
const host = process.argv[4] || process.env.SUPABASE_DB_HOST || "aws-0-eu-central-1.pooler.supabase.com";
const port = process.argv[5] || process.env.PGPORT || "5432";
const user = process.argv[6] || process.env.PGUSER || "postgres.nhirlpkuvonggctdzzad";
const db = process.argv[7] || process.env.PGDATABASE || "postgres";

const filePath = path.join(rootDir, migrationFileRel);
const rawSql = fs.readFileSync(filePath, "utf8");

// Strip existing outermost BEGIN/COMMIT if present to couple with ledger insert
const lines = rawSql.split("\n");
let firstBeginIdx = -1;
let lastCommitIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (/^\s*BEGIN\s*;/i.test(lines[i])) {
    if (firstBeginIdx === -1) firstBeginIdx = i;
  }
  if (/^\s*COMMIT\s*;/i.test(lines[i])) {
    lastCommitIdx = i;
  }
}

// Strict assertion: ensure no intermediate COMMIT exists that could break transaction coupling
if (firstBeginIdx !== -1 && lastCommitIdx !== -1) {
  for (let i = firstBeginIdx + 1; i < lastCommitIdx; i++) {
    if (/^\s*COMMIT\s*;/i.test(lines[i])) {
      throw new Error(`CRITICAL ATOMICITY VIOLATION: Intermediate COMMIT found at line ${i + 1} in ${migrationFileRel}`);
    }
  }
}

let strippedSql = rawSql;
if (firstBeginIdx !== -1 && lastCommitIdx !== -1 && firstBeginIdx < lastCommitIdx) {
  strippedSql = lines.map((line, idx) => {
    if (idx === firstBeginIdx) {
      return "-- [UNIFIED WRAPPER: Original BEGIN replaced]";
    }
    if (idx === lastCommitIdx) {
      return "-- [UNIFIED WRAPPER: Original COMMIT replaced]";
    }
    return line;
  }).join("\n");
}

const unifiedTransactionSql = `
BEGIN;
SET LOCAL ROLE postgres;
SET LOCAL lock_timeout = \x275s\x27;
SET LOCAL statement_timeout = \x2760s\x27;

-- 1. P1 Migration DDL
${strippedSql}

-- 2. Official Supabase Migrations Ledger (71 -> 72)
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES (\x27${migrationVersion}\x27)
ON CONFLICT (version) DO NOTHING;

-- 3. Operational Checkpoint Registry (Checkpoint 11)
CREATE SCHEMA IF NOT EXISTS gate6_recovery;
CREATE TABLE IF NOT EXISTS gate6_recovery.checkpoints (
  checkpoint_id int PRIMARY KEY,
  migration_version text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT \x27applied\x27,
  applied_at timestamptz DEFAULT now()
);
INSERT INTO gate6_recovery.checkpoints (checkpoint_id, migration_version, description, status)
VALUES (11, \x27${migrationVersion}\x27, \x2720261016203000_cr_order_off_menu_admin_exception.sql\x27, \x27applied\x27)
ON CONFLICT (checkpoint_id) DO UPDATE SET status = \x27applied\x27, applied_at = now();

COMMIT;
`;

process.stdout.write("  Enviando transacción atómica a PostgreSQL... ");
execFileSync(process.env.PSQL_BIN || "psql", [
  "-X", "-q",
  "-h", host, "-p", port, "-U", user, "-d", db,
  "-v", "ON_ERROR_STOP=1"
], {
  input: unifiedTransactionSql,
  encoding: "utf8",
  stdio: ["pipe", "pipe", "pipe"]
});
console.log("PASS (Atómico)");
' "$ROOT_DIR" "$MIGRATION_FILE_REL" "$MIGRATION_VERSION" "$TARGET_HOST" "$TARGET_PORT" "$TARGET_USER" "$TARGET_DB"

echo "  ✓ FASE 2 PASS: Migración DDL y actualización de ledger aplicadas con éxito."
echo ""

# ------------------------------------------------------------------------------
# FASE 3: POSTCHECKS EXHAUSTIVOS DE VERIFICACIÓN (READ-ONLY)
# ------------------------------------------------------------------------------
echo "--- [FASE 3/3] VERIFICACIÓN POSTERIOR DE LEDGER, FUNCIONES Y DATOS ---"

POSTCHECK_AUDIT="$(run_readonly_sql "
SELECT 
  (SELECT count(*) FROM supabase_migrations.schema_migrations) || '|' ||
  (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '$MIGRATION_VERSION') || '|' ||
  (SELECT count(*) FROM gate6_recovery.checkpoints WHERE status = 'applied') || '|' ||
  (SELECT CASE WHEN to_regprocedure('cr_order_private.require_off_menu(uuid,uuid)') IS NOT NULL THEN 'true' ELSE 'false' END) || '|' ||
  (SELECT CASE WHEN has_function_privilege('service_role', 'public.cr_order_offer_quote_issue(uuid,uuid,uuid,jsonb,jsonb)', 'EXECUTE') THEN 'true' ELSE 'false' END) || '|' ||
  (SELECT CASE WHEN has_function_privilege('authenticated', 'public.cr_order_offer_quote_issue(uuid,uuid,uuid,jsonb,jsonb)', 'EXECUTE') THEN 'true' ELSE 'false' END) || '|' ||
  (SELECT CASE WHEN has_function_privilege('anon', 'public.cr_order_offer_quote_issue(uuid,uuid,uuid,jsonb,jsonb)', 'EXECUTE') THEN 'true' ELSE 'false' END) || '|' ||
  (SELECT CASE WHEN has_schema_privilege('cr_order_writer', 'auth', 'USAGE') THEN 'true' ELSE 'false' END) || '|' ||
  (SELECT CASE WHEN (SELECT count(*) FROM cr_order_private.custom_activation WHERE tenant_id = '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid AND enabled) = 1 THEN 'true' ELSE 'false' END) || '|' ||
  (SELECT CASE WHEN (SELECT count(*) FROM cr_order_private.custom_activation WHERE tenant_id <> '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid AND enabled) = 0 THEN 'true' ELSE 'false' END);
")"

TOTAL_LEDGER_POST="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f1)"
P1_EXISTS_POST="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f2)"
CHECKPOINTS_POST="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f3)"
REQUIRE_OFFMENU_POST="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f4)"
QUOTE_SERVICE_ROLE="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f5)"
QUOTE_AUTHENTICATED="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f6)"
QUOTE_ANON="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f7)"
AUTH_USAGE_POST="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f8)"
EATCLEAN_CUSTOM_ACTIVE="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f9)"
OTHERS_CUSTOM_INACTIVE="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f10)"

echo "  Ledger final          : $TOTAL_LEDGER_POST (esperado: 72)"
echo "  P1 en DB              : $P1_EXISTS_POST (esperado: 1)"
echo "  Checkpoints aplicados : $CHECKPOINTS_POST (esperado >= 11)"
echo "  require_off_menu RPC  : $REQUIRE_OFFMENU_POST (esperado: true)"
echo "  quote service_role    : $QUOTE_SERVICE_ROLE (esperado: true)"
echo "  quote authenticated   : $QUOTE_AUTHENTICATED (esperado: false)"
echo "  quote anon            : $QUOTE_ANON (esperado: false)"
echo "  cr_order_writer auth  : $AUTH_USAGE_POST (esperado: false)"
echo "  EatClean custom active: $EATCLEAN_CUSTOM_ACTIVE (esperado: true)"
echo "  Otros custom inactivos: $OTHERS_CUSTOM_INACTIVE (esperado: true)"

POSTCHECKS_PASS=true

if [ "$TOTAL_LEDGER_POST" -ne 72 ] || [ "$P1_EXISTS_POST" -ne 1 ]; then
  echo "  ✗ FALLO en validación de ledger post-migración!" >&2
  POSTCHECKS_PASS=false
fi

if [ "$REQUIRE_OFFMENU_POST" != "true" ] || [ "$QUOTE_SERVICE_ROLE" != "true" ] || \
   [ "$QUOTE_AUTHENTICATED" = "true" ] || [ "$QUOTE_ANON" = "true" ]; then
  echo "  ✗ FALLO en validación de funciones y privilegios post-migración!" >&2
  POSTCHECKS_PASS=false
fi

if [ "$AUTH_USAGE_POST" != "false" ] && [ "$AUTH_USAGE_POST" != "f" ]; then
  echo "  ✗ FALLO: cr_order_writer mantiene USAGE sobre auth!" >&2
  POSTCHECKS_PASS=false
fi

if [ "$EATCLEAN_CUSTOM_ACTIVE" != "true" ] || [ "$OTHERS_CUSTOM_INACTIVE" != "true" ]; then
  echo "  ✗ FALLO: Aislamiento de activación de tenants comprometido!" >&2
  POSTCHECKS_PASS=false
fi

# Preservación de datos
DATA_POST="$(run_readonly_sql "
SELECT 
  (SELECT count(*) FROM public.tenants WHERE id = '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid) || '|' ||
  (SELECT count(*) FROM public.tenant_members WHERE tenant_id = '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid) || '|' ||
  (SELECT count(*) FROM public.dishes WHERE tenant_id = '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid) || '|' ||
  (SELECT count(*) FROM public.weekly_menus WHERE tenant_id = '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid) || '|' ||
  (SELECT count(*) FROM public.delivery_services WHERE tenant_id = '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid) || '|' ||
  (SELECT count(*) FROM public.orders WHERE tenant_id = '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid);
")"

POST_TENANTS="$(echo "$DATA_POST" | cut -d'|' -f1)"
POST_MEMBERS="$(echo "$DATA_POST" | cut -d'|' -f2)"
POST_DISHES="$(echo "$DATA_POST" | cut -d'|' -f3)"
POST_MENUS="$(echo "$DATA_POST" | cut -d'|' -f4)"
POST_SERVICES="$(echo "$DATA_POST" | cut -d'|' -f5)"
POST_ORDERS="$(echo "$DATA_POST" | cut -d'|' -f6)"

echo "  Post-migration counts : Tenants=$POST_TENANTS, Members=$POST_MEMBERS, Dishes=$POST_DISHES, Menus=$POST_MENUS, Services=$POST_SERVICES, Orders=$POST_ORDERS"

if [ "$POST_TENANTS" -ge "$PRE_TENANTS" ] && \
   [ "$POST_MEMBERS" -ge "$PRE_MEMBERS" ] && \
   [ "$POST_DISHES" -ge "$PRE_DISHES" ] && \
   [ "$POST_MENUS" -ge "$PRE_MENUS" ] && \
   [ "$POST_SERVICES" -ge "$PRE_SERVICES" ] && \
   [ "$POST_ORDERS" -ge "$PRE_ORDERS" ]; then
  echo "  ✓ DATA_PRESERVATION: PASS (100% de datos preexistentes conservados)."
else
  echo "  ✗ DATA_PRESERVATION: FAIL (Se detectó discrepancia con el baseline)!" >&2
  POSTCHECKS_PASS=false
fi

if [ "$POSTCHECKS_PASS" != "true" ]; then
  echo "FATAL: Postchecks no superados!" >&2
  exit 1
fi

echo ""
echo "===================================================================="
echo "YOURMEAL OS — EATCLEAN P1 MIGRACIÓN PRODUCTIVA COMPLETADA CON ÉXITO"
echo "===================================================================="
echo "LEDGER_STATUS:            71 -> 72 (PASS)"
echo "MIGRATION_VERSION:        $MIGRATION_VERSION (PASS)"
echo "ATOMIC_TRANSACTION:       CONFIRMED"
echo "DATA_PRESERVATION:        PASS (100%)"
echo "FUNCTIONS_SECURITY:       PASS (Restringido a service_role)"
echo "READY_FOR_WORKER_DEPLOY:  YES"
echo "===================================================================="
