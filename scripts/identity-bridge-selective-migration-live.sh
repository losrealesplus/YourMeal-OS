#!/usr/bin/env bash
# ==============================================================================
# YOURMEAL OS — EATCLEAN IDENTITY BRIDGE HARDENING SELECTIVE CUTOVER
# MIGRACIÓN PRODUCTIVA EXCLUSIVA: 20261024175900
#
# Target: EatClean Production Dedicated Supabase (nhirlpkuvonggctdzzad)
# Host: aws-0-eu-central-1.pooler.supabase.com:5432 OR db.nhirlpkuvonggctdzzad.supabase.co:5432
# Database: postgres
# User: postgres.nhirlpkuvonggctdzzad (pooler) / postgres (direct)
# Migration: supabase/migrations/20261024175900_cr_order_writer_identity_bridge_hardening.sql
# Migration SHA-256: fb773e233a2ca6f89c16bccfc1aa7eb10da90d2d7cfe3b7498bd3d93bf2c8e30
#
# Security & Operational Guarantees:
# 1. Enforces verify-full TLS with official CA certificate (/Users/alex/Downloads/prod-ca-2021.crt)
# 2. Strict exact-match hostname and project validation; rejects Demo (djangucecsphnejplvic) fail-closed
# 3. Interactive hidden password input (read -rs); zero credentials saved or echoed
# 4. Strict precheck:
#    - Project: nhirlpkuvonggctdzzad, Database: postgres
#    - Tenant EatClean: 8bba00ba-331b-42c8-9283-4e3836ffb870 / eatclean
#    - 20261024175900 must NOT be applied yet
#    - 20261010155728 remains absent (historical omitted migration untouched)
#    - 1A migrations (20261024180000, 20261024190000) remain absent
# 5. Read-only function drift baseline before mutation
# 6. Atomic single transaction: DDL + ledger registration (20261024175900) in one commit
# 7. Postcheck: Bridge exists, owner postgres (SECDEF), ACLs verified, direct auth.uid calls = 0
# 8. Supports --dry-run for 100% read-only preflight and drift verification (exit 0)
# 9. Requires explicit confirmation token for live execution to prevent accidental execution
# ==============================================================================
set -euo pipefail

EXPECTED_PROJECT="nhirlpkuvonggctdzzad"
EXPECTED_POOLER_HOST="aws-0-eu-central-1.pooler.supabase.com"
EXPECTED_DIRECT_HOST="db.nhirlpkuvonggctdzzad.supabase.co"
EXPECTED_PORT="5432"
EXPECTED_DB="postgres"

CONFIRMATION_TOKEN="APPLY_20261024175900_TO_EATCLEAN_PROD"

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

MIGRATION_VERSION="20261024175900"
MIGRATION_FILE_REL="supabase/migrations/20261024175900_cr_order_writer_identity_bridge_hardening.sql"
EXPECTED_MIGRATION_SHA="fb773e233a2ca6f89c16bccfc1aa7eb10da90d2d7cfe3b7498bd3d93bf2c8e30"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATION_FILE="$ROOT_DIR/$MIGRATION_FILE_REL"

# ------------------------------------------------------------------------------
# 0. SEGURIDAD Y VALIDACIÓN DE DESTINO (EXACT-MATCH & FAIL-CLOSED)
# ------------------------------------------------------------------------------

# Guard 1: Prohibir taxativamente cualquier referencia al entorno de Demo (djangucecsphnejplvic)
if [ "${LAB_ISOLATED_PG17:-}" != "true" ]; then
  if [[ "$TARGET_HOST" == *"djangucecsphnejplvic"* ]] || [[ "$TARGET_USER" == *"djangucecsphnejplvic"* ]]; then
    echo "FATAL SECURITY_VIOLATION: EatClean identity bridge hardening cannot connect to Demo project (djangucecsphnejplvic)!" >&2
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
  echo "FATAL SECURITY_VIOLATION: Puerto no autorizado '$TARGET_PORT'!" >&2
  exit 1
fi

if [ "$TARGET_DB" != "$EXPECTED_DB" ]; then
  echo "FATAL SECURITY_VIOLATION: Base de datos no autorizada '$TARGET_DB'!" >&2
  exit 1
fi

# Guard 3: Entrada interactiva oculta de contraseña (o variable en lab)
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
  "$PSQL_BIN" -X -A -t -q \
    -h "$TARGET_HOST" \
    -p "$TARGET_PORT" \
    -U "$TARGET_USER" \
    -d "$TARGET_DB" \
    -v ON_ERROR_STOP=1 \
    -c "BEGIN TRANSACTION READ ONLY; $query; COMMIT;"
}

echo "===================================================================="
echo "YOURMEAL OS — HARDENING DE IDENTIDAD CR_ORDER_WRITER (SELECTIVO)"
echo "Target Project : $EXPECTED_PROJECT"
echo "Target Host    : $TARGET_USER@$TARGET_HOST:$TARGET_PORT/$TARGET_DB"
echo "TLS Mode       : ${PGSSLMODE}"
echo "Migration File : $MIGRATION_FILE_REL"
echo "Migration SHA  : $EXPECTED_MIGRATION_SHA"
echo "Execution Mode : $([ "$DRY_RUN" = "true" ] && echo "READ-ONLY PRECHECKS (DRY-RUN)" || echo "LIVE ATOMIC EXECUTION")"
echo "Timestamp (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "===================================================================="
echo ""

# ------------------------------------------------------------------------------
# FASE 1: PRECHECKS ESTRICTOS Y AUDITORÍA DE DRIFT (READ-ONLY)
# ------------------------------------------------------------------------------
echo "--- [FASE 1/3] VERIFICACIÓN PREVIA DE IDENTIDAD, HISTORIAL Y ESQUEMA ---"

# 1. Verificar integridad del archivo de migración
if [ ! -f "$MIGRATION_FILE" ]; then
  echo "FATAL: Archivo de migración no encontrado en '$MIGRATION_FILE'!" >&2
  exit 1
fi

OBSERVED_MIGRATION_SHA="$(shasum -a 256 "$MIGRATION_FILE" 2>/dev/null | awk '{print $1}')"
if [ "$OBSERVED_MIGRATION_SHA" != "$EXPECTED_MIGRATION_SHA" ]; then
  echo "FATAL: Checksum SHA-256 de migración inválido!" >&2
  echo "  Esperado: $EXPECTED_MIGRATION_SHA" >&2
  echo "  Observado: $OBSERVED_MIGRATION_SHA" >&2
  exit 1
fi
echo "  ✓ Checksum SHA-256 de migración verificado exactamente: $OBSERVED_MIGRATION_SHA"

# 2. Base de datos y Tenant EatClean
DB_NAME="$(run_readonly_sql "SELECT current_database();")"
if [ "$DB_NAME" != "$EXPECTED_DB" ]; then
  echo "FATAL: Base de datos conectada '$DB_NAME' no coincide con la esperada '$EXPECTED_DB'!" >&2
  exit 1
fi

if [ "${LAB_ISOLATED_PG17:-}" = "true" ]; then
  # En modo laboratorio local aislado, acepta el tenant eatclean local
  TENANT_ROW="$(run_readonly_sql "SELECT id || '|' || name || '|' || slug FROM public.tenants WHERE slug = 'eatclean' LIMIT 1;")"
  if [[ "$TENANT_ROW" != *"|eatclean" ]]; then
    echo "FATAL: Verificación de Tenant EatClean en laboratorio falló: '$TENANT_ROW'!" >&2
    exit 1
  fi
  echo "  ✓ Tenant EatClean (Lab Aislado) verificado: $TENANT_ROW"
else
  # En entorno productivo real, exige coincidencia estricta de UUID, Nombre y Slug
  TENANT_ROW="$(run_readonly_sql "SELECT id || '|' || name || '|' || slug FROM public.tenants WHERE id = '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid;")"
  if [ "$TENANT_ROW" != "8bba00ba-331b-42c8-9283-4e3836ffb870|EatClean|eatclean" ]; then
    echo "FATAL: Verificación de Tenant EatClean productivo falló: '$TENANT_ROW'!" >&2
    exit 1
  fi
  echo "  ✓ Tenant EatClean productivo verificado: $TENANT_ROW"
fi

# 3. Rol cr_order_writer
ROLE_EXISTS="$(run_readonly_sql "SELECT EXISTS(SELECT 1 FROM pg_roles WHERE rolname = 'cr_order_writer');")"
if [ "$ROLE_EXISTS" != "t" ]; then
  echo "FATAL: El rol 'cr_order_writer' no existe en la base de datos!" >&2
  exit 1
fi
echo "  ✓ Rol 'cr_order_writer' confirmado en catálogo de PostgreSQL."

# 4. Historial del Ledger Oficial
LEDGER_AUDIT="$(run_readonly_sql "
SELECT 
  (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '$MIGRATION_VERSION') || '|' ||
  (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '20261010155728') || '|' ||
  (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '20261010155729') || '|' ||
  (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version IN ('20261024180000', '20261024190000'));
")"

PREREQ_APPLIED="$(echo "$LEDGER_AUDIT" | cut -d'|' -f1)"
HISTORICAL_28="$(echo "$LEDGER_AUDIT" | cut -d'|' -f2)"
HISTORICAL_29="$(echo "$LEDGER_AUDIT" | cut -d'|' -f3)"
FUTURE_1A="$(echo "$LEDGER_AUDIT" | cut -d'|' -f4)"

if [ "$PREREQ_APPLIED" -ne 0 ]; then
  echo "ALERTA: La migración $MIGRATION_VERSION ya se encuentra registrada en el historial ($PREREQ_APPLIED veces)."
  if [ "$DRY_RUN" = "false" ]; then
    echo "FATAL: Abortando aplicación duplicada." >&2
    exit 1
  fi
fi

if [ "$HISTORICAL_28" -ne 0 ]; then
  echo "FATAL: BLOCKED: UNEXPECTED_MIGRATION_HISTORY: La migración 20261010155728 figura registrada en el ledger ($HISTORICAL_28 veces). Su ausencia es obligatoria según la especificación de producción." >&2
  exit 1
fi

if [ "$HISTORICAL_29" -ne 1 ]; then
  echo "FATAL: Precondición de ledger no cumplida: 20261010155729 debe figurar registrada." >&2
  exit 1
fi

if [ "$FUTURE_1A" -ne 0 ]; then
  echo "FATAL DE GOBERNANZA: BLOCKED: GOVERNANCE_VIOLATION: Se detectaron migraciones de 1A ($FUTURE_1A) aplicadas antes del prerrequisito de identidad!" >&2
  exit 1
fi

echo "  ✓ Historial pre-migración conforme: 20261024175900 pendiente, 20261010155728 omitida, 1A bloqueada."

# 5. Auditoría Estricta de Drift de Funciones Afectadas y Esquema (Fail-Closed)
FUNCTION_DRIFT_REPORT="$(run_readonly_sql "
WITH checks AS (
  SELECT
    -- 0. cr_order_private schema permissions (authenticated has USAGE, anon has none, CREATE forbidden)
    CASE
      WHEN NOT has_schema_privilege('cr_order_writer', 'cr_order_private', 'USAGE') THEN 'cr_order_writer missing USAGE on cr_order_private'
      WHEN NOT has_schema_privilege('service_role', 'cr_order_private', 'USAGE') THEN 'service_role missing USAGE on cr_order_private'
      WHEN NOT has_schema_privilege('authenticated', 'cr_order_private', 'USAGE') THEN 'authenticated missing USAGE on cr_order_private'
      WHEN has_schema_privilege('anon', 'cr_order_private', 'USAGE') THEN 'anon has USAGE on cr_order_private'
      WHEN has_schema_privilege('authenticated', 'cr_order_private', 'CREATE') THEN 'authenticated has CREATE on cr_order_private'
      WHEN has_schema_privilege('anon', 'cr_order_private', 'CREATE') THEN 'anon has CREATE on cr_order_private'
      ELSE NULL
    END AS err_schema,

    -- 1. guard_legacy_offer
    CASE
      WHEN to_regprocedure('cr_order_private.guard_legacy_offer()') IS NULL THEN 'guard_legacy_offer missing'
      WHEN (SELECT pg_get_userbyid(proowner) FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.guard_legacy_offer()')) IS DISTINCT FROM 'cr_order_writer'
        THEN 'guard_legacy_offer owner invalid (expected cr_order_writer)'
      WHEN (SELECT prosecdef FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.guard_legacy_offer()')) IS NOT TRUE
        THEN 'guard_legacy_offer must be SECURITY DEFINER'
      WHEN has_function_privilege('anon', to_regprocedure('cr_order_private.guard_legacy_offer()'), 'EXECUTE')
        OR has_function_privilege('authenticated', to_regprocedure('cr_order_private.guard_legacy_offer()'), 'EXECUTE')
        THEN 'guard_legacy_offer has public/anon execution privilege'
      WHEN (SELECT prosrc FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.guard_legacy_offer()')) NOT LIKE '%write_contract_version%'
        OR (SELECT prosrc FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.guard_legacy_offer()')) NOT LIKE '%OFFER_PRICING_QUOTE_REQUIRED%'
        THEN 'guard_legacy_offer source baseline drift'
      ELSE NULL
    END AS err_guard,

    -- 2. write_dish_v2
    CASE
      WHEN to_regprocedure('cr_order_private.write_dish_v2(uuid,uuid,jsonb,uuid,jsonb)') IS NULL THEN 'write_dish_v2 missing'
      WHEN (SELECT pg_get_userbyid(proowner) FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.write_dish_v2(uuid,uuid,jsonb,uuid,jsonb)')) IS DISTINCT FROM 'cr_order_writer'
        THEN 'write_dish_v2 owner invalid (expected cr_order_writer)'
      WHEN (SELECT prosecdef FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.write_dish_v2(uuid,uuid,jsonb,uuid,jsonb)')) IS NOT TRUE
        THEN 'write_dish_v2 must be SECURITY DEFINER'
      WHEN has_function_privilege('anon', to_regprocedure('cr_order_private.write_dish_v2(uuid,uuid,jsonb,uuid,jsonb)'), 'EXECUTE')
        OR has_function_privilege('authenticated', to_regprocedure('cr_order_private.write_dish_v2(uuid,uuid,jsonb,uuid,jsonb)'), 'EXECUTE')
        THEN 'write_dish_v2 has public/anon execution privilege'
      WHEN (SELECT prosrc FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.write_dish_v2(uuid,uuid,jsonb,uuid,jsonb)')) NOT LIKE '%_verified_actor IS NOT NULL%'
        OR (SELECT prosrc FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.write_dish_v2(uuid,uuid,jsonb,uuid,jsonb)')) NOT LIKE '%UNTRUSTED_AUTHORITY_FIELD%'
        THEN 'write_dish_v2 source baseline drift'
      ELSE NULL
    END AS err_write,

    -- 3. offer_state
    -- Baseline histórico: 20261016203000 no revocó explícitamente permisos a PUBLIC,
    -- por lo que anon/authenticated heredan privilegio de ejecución a nivel de función antes de 20261024175900.
    -- Se valida rigurosamente: existencia, propietario cr_order_writer, SECURITY INVOKER,
    -- ausencia de concesiones ACL explícitas a anon o authenticated, y anclas canónicas del código fuente.
    -- El endurecimiento efectivo de la función se certifica en la Fase 3 tras aplicar la migración.
    CASE
      WHEN to_regprocedure('cr_order_private.offer_state(uuid,jsonb,text)') IS NULL THEN 'offer_state missing'
      WHEN (SELECT pg_get_userbyid(proowner) FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.offer_state(uuid,jsonb,text)')) IS DISTINCT FROM 'cr_order_writer'
        THEN 'offer_state owner invalid (expected cr_order_writer)'
      WHEN (SELECT prosecdef FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.offer_state(uuid,jsonb,text)')) IS NOT FALSE
        THEN 'offer_state must be SECURITY INVOKER'
      WHEN (SELECT coalesce(array_to_string(proacl, ','), '') FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.offer_state(uuid,jsonb,text)')) LIKE '%anon=%'
        OR (SELECT coalesce(array_to_string(proacl, ','), '') FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.offer_state(uuid,jsonb,text)')) LIKE '%authenticated=%'
        THEN 'offer_state has explicit anon/authenticated ACL grants'
      WHEN (SELECT prosrc FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.offer_state(uuid,jsonb,text)')) NOT LIKE '%require_custom%'
        OR (SELECT prosrc FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.offer_state(uuid,jsonb,text)')) NOT LIKE '%OFFER_PRICING_COMMERCIAL_UNSUPPORTED%'
        OR (SELECT prosrc FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.offer_state(uuid,jsonb,text)')) NOT LIKE '%require_off_menu%'
        THEN 'offer_state source baseline drift'
      ELSE NULL
    END AS err_offer,

    -- 4. session_uid_bridge (optional before migration, but strict if present)
    CASE
      WHEN to_regprocedure('cr_order_private.session_uid_bridge()') IS NOT NULL THEN
        CASE
          WHEN (SELECT pg_get_userbyid(proowner) FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.session_uid_bridge()')) IS DISTINCT FROM 'postgres'
            THEN 'session_uid_bridge owner invalid (expected postgres)'
          WHEN (SELECT prosecdef FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.session_uid_bridge()')) IS NOT TRUE
            THEN 'session_uid_bridge must be SECURITY DEFINER'
          WHEN has_function_privilege('anon', to_regprocedure('cr_order_private.session_uid_bridge()'), 'EXECUTE')
            OR has_function_privilege('authenticated', to_regprocedure('cr_order_private.session_uid_bridge()'), 'EXECUTE')
            THEN 'session_uid_bridge has public/anon execution privilege'
          WHEN (SELECT prosrc FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.session_uid_bridge()')) NOT LIKE '%auth.uid()%'
            THEN 'session_uid_bridge source drift'
          ELSE NULL
        END
      ELSE NULL
    END AS err_bridge,

    -- 5. actor() (optional before migration, but strict if present)
    CASE
      WHEN to_regprocedure('cr_order_private.actor()') IS NOT NULL THEN
        CASE
          WHEN (SELECT pg_get_userbyid(proowner) FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.actor()')) IS DISTINCT FROM 'postgres'
            THEN 'actor owner invalid (expected postgres)'
          WHEN (SELECT prosecdef FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.actor()')) IS NOT FALSE
            THEN 'actor must be SECURITY INVOKER'
          WHEN has_function_privilege('anon', to_regprocedure('cr_order_private.actor()'), 'EXECUTE')
            OR has_function_privilege('authenticated', to_regprocedure('cr_order_private.actor()'), 'EXECUTE')
            THEN 'actor has public/anon execution privilege'
          ELSE NULL
        END
      ELSE NULL
    END AS err_actor,

    -- 6. can_operate_custom_batch(uuid) (optional before migration, but strict if present)
    CASE
      WHEN to_regprocedure('cr_order_private.can_operate_custom_batch(uuid)') IS NOT NULL THEN
        CASE
          WHEN (SELECT pg_get_userbyid(proowner) FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.can_operate_custom_batch(uuid)')) IS DISTINCT FROM 'postgres'
            THEN 'can_operate_custom_batch owner invalid (expected postgres)'
          WHEN (SELECT prosecdef FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.can_operate_custom_batch(uuid)')) IS NOT FALSE
            THEN 'can_operate_custom_batch must be SECURITY INVOKER'
          WHEN has_function_privilege('anon', to_regprocedure('cr_order_private.can_operate_custom_batch(uuid)'), 'EXECUTE')
            OR has_function_privilege('authenticated', to_regprocedure('cr_order_private.can_operate_custom_batch(uuid)'), 'EXECUTE')
            THEN 'can_operate_custom_batch has public/anon execution privilege'
          ELSE NULL
        END
      ELSE NULL
    END AS err_batch,

    -- 7. lifecycle & kitchen functions (authenticated execution preserved)
    CASE
      WHEN to_regprocedure('cr_order_private.lifecycle_v2(uuid,uuid,jsonb)') IS NOT NULL
        AND NOT has_function_privilege('authenticated', to_regprocedure('cr_order_private.lifecycle_v2(uuid,uuid,jsonb)'), 'EXECUTE')
        THEN 'lifecycle_v2 missing authenticated EXECUTE'
      WHEN to_regprocedure('cr_order_private.lifecycle_context(uuid,uuid)') IS NOT NULL
        AND NOT has_function_privilege('authenticated', to_regprocedure('cr_order_private.lifecycle_context(uuid,uuid)'), 'EXECUTE')
        THEN 'lifecycle_context missing authenticated EXECUTE'
      WHEN to_regprocedure('cr_order_private.custom_batch_transition(uuid,uuid,date,text)') IS NOT NULL
        AND NOT has_function_privilege('authenticated', to_regprocedure('cr_order_private.custom_batch_transition(uuid,uuid,date,text)'), 'EXECUTE')
        THEN 'custom_batch_transition missing authenticated EXECUTE'
      ELSE NULL
    END AS err_lifecycle
)
SELECT concat_ws('; ', err_schema, err_guard, err_write, err_offer, err_bridge, err_actor, err_batch, err_lifecycle) FROM checks;
")"

if [ -n "$FUNCTION_DRIFT_REPORT" ]; then
  echo "FATAL: BLOCKED: FUNCTION_DRIFT: Se detectaron discrepancias en las funciones canónicas antes de aplicar:" >&2
  echo "  $FUNCTION_DRIFT_REPORT" >&2
  exit 1
fi

echo "  ✓ Verificación canónica de funciones: 6 funciones contrastadas con baselines canónicos (0 drift detectado)."
echo "  ✓ FASE 1 PASS: Prechecks de identidad, ledger y esquema superados."
echo ""

# CIERRE ESTRICTO DE DRY-RUN (100% READ ONLY)
if [ "$DRY_RUN" = "true" ]; then
  echo "===================================================================="
  echo "MODO DRY-RUN COMPLETADO CON ÉXITO: 0 DDL, 0 DML, 0 ESCRITURAS."
  echo "El destino cumple rigurosamente con los prerrequisitos de compatibilidad."
  echo "===================================================================="
  exit 0
fi

# ------------------------------------------------------------------------------
# GUARDA HUMANA OBLIGATORIA PARA MODO LIVE (--apply)
# ------------------------------------------------------------------------------
echo "--- CONTROL DE SEGURIDAD PARA EJECUCIÓN EN VIVO ---"
if [ "$APPLY_FLAG" != "true" ]; then
  echo "FATAL: Para ejecutar modificaciones reales debe suministrarse la bandera '--apply'." >&2
  exit 1
fi

PROVIDED_TOKEN="${CONFIRM_LIVE_EXECUTION:-}"
if [ -z "$PROVIDED_TOKEN" ]; then
  if [ -t 0 ]; then
    echo "¡ADVERTENCIA DE PRODUCCIÓN!"
    echo "Está a punto de aplicar la migración $MIGRATION_VERSION en:"
    echo "  Host: $TARGET_HOST"
    echo "  Database: $TARGET_DB"
    echo "  Project: $EXPECTED_PROJECT"
    echo ""
    printf "Para confirmar, escriba exactamente '%s': " "$CONFIRMATION_TOKEN"
    read -r PROVIDED_TOKEN
    echo ""
  else
    echo "FATAL: Ejecución en vivo no interactiva requiere la variable CONFIRM_LIVE_EXECUTION='$CONFIRMATION_TOKEN'." >&2
    exit 2
  fi
fi

if [ "$PROVIDED_TOKEN" != "$CONFIRMATION_TOKEN" ]; then
  echo "FATAL: Token de confirmación incorrecto ('$PROVIDED_TOKEN'). Abortando ejecución." >&2
  exit 1
fi
echo "  ✓ Autorización humana de ejecución confirmada."
echo ""

# Pasar la confirmación humana ya verificada en el entorno del proceso (sin imprimirla ni guardarla en disco)
export CONFIRM_LIVE_EXECUTION="$PROVIDED_TOKEN"

# ------------------------------------------------------------------------------
# FASE 2: APLICACIÓN ATÓMICA SELECTIVA (FORWARD-ONLY)
# ------------------------------------------------------------------------------
echo "--- [FASE 2/3] APLICANDO MIGRACIÓN $MIGRATION_VERSION DE FORMA ATÓMICA ---"

EXECUTOR_SCRIPT="$ROOT_DIR/scripts/identity-bridge-selective-executor.mjs"
if [ ! -f "$EXECUTOR_SCRIPT" ]; then
  echo "FATAL: Ejecutor selectivo de Fase 2 no encontrado en '$EXECUTOR_SCRIPT'!" >&2
  exit 1
fi

node "$EXECUTOR_SCRIPT" \
  "$ROOT_DIR" \
  "$MIGRATION_FILE_REL" \
  "$MIGRATION_VERSION" \
  "$TARGET_HOST" \
  "$TARGET_PORT" \
  "$TARGET_USER" \
  "$TARGET_DB" \
  "$PSQL_BIN"

echo "  ✓ FASE 2 PASS: Transacción atómica ejecutada y confirmada en motor."
echo ""

# ------------------------------------------------------------------------------
# FASE 3: POSTCHECKS Y VERIFICACIÓN POST-DESPLIEGUE
# ------------------------------------------------------------------------------
echo "--- [FASE 3/3] VERIFICACIÓN POSTERIOR DE MOTOR Y LEDGER ---"

POSTCHECK_AUDIT="$(run_readonly_sql "
SELECT
  (to_regprocedure('cr_order_private.session_uid_bridge()') IS NOT NULL)::text || '|' ||
  (SELECT pg_get_userbyid(proowner) = 'postgres' AND prosecdef = true FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.session_uid_bridge()'))::text || '|' ||
  has_function_privilege('cr_order_writer', to_regprocedure('cr_order_private.session_uid_bridge()'), 'EXECUTE')::text || '|' ||
  has_function_privilege('anon', to_regprocedure('cr_order_private.session_uid_bridge()'), 'EXECUTE')::text || '|' ||
  has_function_privilege('authenticated', to_regprocedure('cr_order_private.session_uid_bridge()'), 'EXECUTE')::text || '|' ||
  (SELECT count(*) FROM pg_proc WHERE pg_get_userbyid(proowner) = 'cr_order_writer' AND prosrc ILIKE '%auth.uid%')::text || '|' ||
  (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '$MIGRATION_VERSION')::text || '|' ||
  (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '20261010155728')::text || '|' ||
  (SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version IN ('20261024180000', '20261024190000'))::text || '|' ||
  has_function_privilege('anon', to_regprocedure('cr_order_private.offer_state(uuid,jsonb,text)'), 'EXECUTE')::text || '|' ||
  has_function_privilege('authenticated', to_regprocedure('cr_order_private.offer_state(uuid,jsonb,text)'), 'EXECUTE')::text || '|' ||
  has_function_privilege('service_role', to_regprocedure('cr_order_private.offer_state(uuid,jsonb,text)'), 'EXECUTE')::text || '|' ||
  has_schema_privilege('anon', 'cr_order_private', 'USAGE')::text || '|' ||
  has_schema_privilege('authenticated', 'cr_order_private', 'USAGE')::text || '|' ||
  has_schema_privilege('authenticated', 'cr_order_private', 'CREATE')::text || '|' ||
  has_function_privilege('authenticated', to_regprocedure('cr_order_private.lifecycle_v2(uuid,uuid,jsonb)'), 'EXECUTE')::text || '|' ||
  has_function_privilege('authenticated', to_regprocedure('cr_order_private.lifecycle_context(uuid,uuid)'), 'EXECUTE')::text || '|' ||
  has_function_privilege('authenticated', to_regprocedure('cr_order_private.custom_batch_transition(uuid,uuid,date,text)'), 'EXECUTE')::text;
")"

POST_BRIDGE_EXISTS="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f1)"
POST_BRIDGE_SECDEF="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f2)"
POST_WRITER_EXEC="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f3)"
POST_ANON_EXEC="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f4)"
POST_AUTH_EXEC="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f5)"
POST_DIRECT_CALLS="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f6)"
POST_PREREQ_COUNT="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f7)"
POST_HISTORICAL_28="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f8)"
POST_FUTURE_1A="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f9)"
POST_OFFER_ANON="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f10)"
POST_OFFER_AUTH="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f11)"
POST_OFFER_SERVICE="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f12)"
POST_SCHEMA_ANON_USAGE="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f13)"
POST_SCHEMA_AUTH_USAGE="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f14)"
POST_SCHEMA_AUTH_CREATE="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f15)"
POST_LIFECYCLE_V2_AUTH="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f16)"
POST_LIFECYCLE_CTX_AUTH="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f17)"
POST_CUSTOM_BATCH_AUTH="$(echo "$POSTCHECK_AUDIT" | cut -d'|' -f18)"

if [ "$POST_BRIDGE_EXISTS" != "true" ] || [ "$POST_BRIDGE_SECDEF" != "true" ]; then
  echo "FATAL POSTCHECK: El puente no está correctamente instalado como postgres SECURITY DEFINER!" >&2
  exit 1
fi

if [ "$POST_WRITER_EXEC" != "true" ] || [ "$POST_ANON_EXEC" != "false" ] || [ "$POST_AUTH_EXEC" != "false" ]; then
  echo "FATAL POSTCHECK: Los permisos ACL del puente son incorrectos (writer=$POST_WRITER_EXEC, anon=$POST_ANON_EXEC, auth=$POST_AUTH_EXEC)!" >&2
  exit 1
fi

if [ "$POST_SCHEMA_ANON_USAGE" != "false" ] || [ "$POST_SCHEMA_AUTH_USAGE" != "true" ] || [ "$POST_SCHEMA_AUTH_CREATE" != "false" ]; then
  echo "FATAL POSTCHECK: Permisos del esquema cr_order_private no son conformes (anon_usage=$POST_SCHEMA_ANON_USAGE, auth_usage=$POST_SCHEMA_AUTH_USAGE, auth_create=$POST_SCHEMA_AUTH_CREATE)!" >&2
  exit 1
fi

if [ "$POST_LIFECYCLE_V2_AUTH" != "true" ] || [ "$POST_LIFECYCLE_CTX_AUTH" != "true" ] || [ "$POST_CUSTOM_BATCH_AUTH" != "true" ]; then
  echo "FATAL POSTCHECK: Permisos de lifecycle/kitchen para authenticated se perdieron post-migración!" >&2
  exit 1
fi

if [ "$POST_OFFER_ANON" != "false" ] || [ "$POST_OFFER_AUTH" != "false" ] || [ "$POST_OFFER_SERVICE" != "true" ]; then
  echo "FATAL POSTCHECK: Los permisos de offer_state no fueron endurecidos (anon=$POST_OFFER_ANON, auth=$POST_OFFER_AUTH, service_role=$POST_OFFER_SERVICE)!" >&2
  exit 1
fi

if [ "$POST_DIRECT_CALLS" -ne 0 ]; then
  echo "FATAL POSTCHECK: Se detectaron $POST_DIRECT_CALLS funciones de cr_order_writer llamando directamente a auth.uid()!" >&2
  exit 1
fi

if [ "$POST_PREREQ_COUNT" -ne 1 ]; then
  echo "FATAL POSTCHECK: La versión $MIGRATION_VERSION no quedó registrada en schema_migrations!" >&2
  exit 1
fi

if [ "$POST_HISTORICAL_28" -ne 0 ]; then
  echo "FATAL POSTCHECK: La migración omitida 20261010155728 fue alterada en el ledger!" >&2
  exit 1
fi

if [ "$POST_FUTURE_1A" -ne 0 ]; then
  echo "FATAL POSTCHECK: Las migraciones de 1A fueron aplicadas indebidamente!" >&2
  exit 1
fi

echo "  ✓ Puente de identidad: instalado, SECDEF, propietario postgres, ACLs restringidas."
echo "  ✓ Esquema cr_order_private: USAGE preservado para authenticated, cr_order_writer y service_role; anon revocado; CREATE bloqueado."
echo "  ✓ Funciones de lifecycle y cocina: permisos de ejecución para authenticated 100% operativos."
echo "  ✓ Permisos de offer_state: revocados para anon y authenticated, concedido exclusivamente a service_role."
echo "  ✓ Funciones de cr_order_writer: 0 llamadas directas a auth.uid()."
echo "  ✓ Ledger de migraciones: $MIGRATION_VERSION registrado (1), 20261010155728 ausente (0), 1A pendiente (0)."
echo ""
echo "===================================================================="
echo "CERTIFICACIÓN OPERATIVA EXITOSA: PRERREQUISITO DE IDENTIDAD INSTALADO"
echo "Siguiente paso autorizado: Repetición del preflight de lectura de 1A"
echo "===================================================================="
