#!/usr/bin/env node
/**
 * YOURMEAL OS — EATCLEAN IDENTITY BRIDGE HARDENING SELECTIVE EXECUTOR (FASE 2)
 *
 * Encapsula la preparación y el envío atómico de la transacción SQL unificada
 * a PostgreSQL para evitar problemas de escape de comillas en shells Bash.
 *
 * SEGURIDAD Y GUARDAS DE EJECUCIÓN DIRECTA:
 * - Requiere confirmación humana explícita (CONFIRM_LIVE_EXECUTION).
 * - Verificación independiente de destino, versión de migración, archivo y SHA-256.
 * - En modo producción, exige estrictamente condiciones TLS (verify-full y CA oficial).
 * - En modo laboratorio (LAB_ISOLATED_PG17=true), restringe a PostgreSQL local 127.0.0.1.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const REQUIRED_CONFIRMATION_TOKEN = "APPLY_20261024175900_TO_EATCLEAN_PROD";
export const EXPECTED_MIGRATION_VERSION = "20261024175900";
export const EXPECTED_MIGRATION_FILE_REL = "supabase/migrations/20261024175900_cr_order_writer_identity_bridge_hardening.sql";
export const EXPECTED_MIGRATION_SHA = "fb773e233a2ca6f89c16bccfc1aa7eb10da90d2d7cfe3b7498bd3d93bf2c8e30";

export const EXPECTED_PROJECT = "nhirlpkuvonggctdzzad";
export const EXPECTED_POOLER_HOST = "aws-0-eu-central-1.pooler.supabase.com";
export const EXPECTED_DIRECT_HOST = "db.nhirlpkuvonggctdzzad.supabase.co";
export const EXPECTED_PORT = "5432";
export const EXPECTED_DB = "postgres";
export const EXPECTED_CA_SHA = "700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7";

export function validateExecutorSafetyGuard({
  rootDir,
  migrationFileRel,
  migrationVersion,
  host,
  port,
  user,
  db,
  confirmationToken,
  env = process.env,
}) {
  // 1. Guarda de confirmación humana explícita
  if (confirmationToken !== REQUIRED_CONFIRMATION_TOKEN) {
    throw new Error(
      `BLOCKED: DIRECT_EXECUTOR_UNAUTHORIZED: Token de confirmación humano ausente o inválido ('${confirmationToken || "EMPTY"}'). Se requiere autorización explícita '${REQUIRED_CONFIRMATION_TOKEN}'.`
    );
  }

  // 2. Validación de versión y ruta relativa
  if (migrationVersion !== EXPECTED_MIGRATION_VERSION) {
    throw new Error(
      `BLOCKED: VERSION_MISMATCH: Versión de migración esperada '${EXPECTED_MIGRATION_VERSION}', recibida '${migrationVersion}'`
    );
  }

  if (migrationFileRel !== EXPECTED_MIGRATION_FILE_REL) {
    throw new Error(
      `BLOCKED: PATH_MISMATCH: Ruta relativa de migración esperada '${EXPECTED_MIGRATION_FILE_REL}', recibida '${migrationFileRel}'`
    );
  }

  // 3. Verificación de existencia del archivo y checksum SHA-256 exacto
  const filePath = path.join(rootDir, migrationFileRel);
  if (!fs.existsSync(filePath)) {
    throw new Error(`BLOCKED: FILE_NOT_FOUND: Archivo de migración no encontrado en '${filePath}'`);
  }

  const fileBytes = fs.readFileSync(filePath);
  const observedSha = crypto.createHash("sha256").update(fileBytes).digest("hex");
  if (observedSha !== EXPECTED_MIGRATION_SHA) {
    throw new Error(
      `BLOCKED: SHA_MISMATCH: Checksum SHA-256 esperado '${EXPECTED_MIGRATION_SHA}', observado '${observedSha}'`
    );
  }

  // 4. Verificación de destino y parámetros de seguridad
  const isLab = env.LAB_ISOLATED_PG17 === "true";

  if (isLab) {
    // Modo Laboratorio Local Aislado
    if (host !== "127.0.0.1") {
      throw new Error(`BLOCKED: LAB_DESTINATION_MISMATCH: En modo laboratorio host debe ser '127.0.0.1', recibido '${host}'`);
    }
    if (user !== "postgres") {
      throw new Error(`BLOCKED: LAB_USER_MISMATCH: En modo laboratorio usuario debe ser 'postgres', recibido '${user}'`);
    }
    if (db !== "postgres") {
      throw new Error(`BLOCKED: LAB_DB_MISMATCH: En modo laboratorio base de datos debe ser 'postgres', recibido '${db}'`);
    }
    const labExpectedPort = env.PGPORT || "54322";
    if (String(port) !== String(labExpectedPort)) {
      throw new Error(`BLOCKED: LAB_PORT_MISMATCH: En modo laboratorio puerto debe ser '${labExpectedPort}', recibido '${port}'`);
    }
  } else {
    // Modo Producción EatClean
    if (host.includes("djangucecsphnejplvic") || user.includes("djangucecsphnejplvic")) {
      throw new Error(
        `FATAL SECURITY_VIOLATION: EatClean identity bridge hardening cannot connect to Demo project (djangucecsphnejplvic)!`
      );
    }

    if (host === EXPECTED_POOLER_HOST) {
      if (user !== `postgres.${EXPECTED_PROJECT}`) {
        throw new Error(
          `FATAL SECURITY_VIOLATION: Conexión al pooler '${host}' requiere usuario exacto 'postgres.${EXPECTED_PROJECT}', pero se recibió '${user}'!`
        );
      }
    } else if (host === EXPECTED_DIRECT_HOST) {
      if (user !== "postgres" && user !== `postgres.${EXPECTED_PROJECT}`) {
        throw new Error(
          `FATAL SECURITY_VIOLATION: Conexión directa a '${host}' requiere usuario 'postgres', pero se recibió '${user}'!`
        );
      }
    } else {
      throw new Error(`FATAL SECURITY_VIOLATION: Host no autorizado '${host}'!`);
    }

    if (String(port) !== EXPECTED_PORT) {
      throw new Error(`FATAL SECURITY_VIOLATION: Puerto no autorizado '${port}' (esperado '${EXPECTED_PORT}')!`);
    }

    if (db !== EXPECTED_DB) {
      throw new Error(`FATAL SECURITY_VIOLATION: Base de datos no autorizada '${db}' (esperada '${EXPECTED_DB}')!`);
    }

    if (env.PGSSLMODE !== "verify-full") {
      throw new Error(
        `FATAL SECURITY_VIOLATION: En producción se exige PGSSLMODE='verify-full', observado '${env.PGSSLMODE || "unset"}'!`
      );
    }

    const caCertPath = env.PGSSLROOTCERT;
    if (!caCertPath || !fs.existsSync(caCertPath)) {
      throw new Error(`FATAL SECURITY_VIOLATION: Certificado CA no encontrado en '${caCertPath || "unset"}'!`);
    }

    const caBytes = fs.readFileSync(caCertPath);
    const caSha = crypto.createHash("sha256").update(caBytes).digest("hex");
    if (caSha !== EXPECTED_CA_SHA) {
      throw new Error(
        `FATAL SECURITY_VIOLATION: Checksum SHA-256 del certificado CA inválido ('${caSha}')!`
      );
    }
  }

  return { filePath, isLab };
}

export function buildUnifiedTransactionSql(migrationFilePath, migrationVersion) {
  const rawSql = fs.readFileSync(migrationFilePath, "utf8");
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

  if (firstBeginIdx === -1 || lastCommitIdx === -1 || firstBeginIdx >= lastCommitIdx) {
    throw new Error("No se pudo delimitar el bloque transaccional externo.");
  }

  for (let i = firstBeginIdx + 1; i < lastCommitIdx; i++) {
    if (/^\s*COMMIT\s*;/i.test(lines[i])) {
      throw new Error(`VIOLACIÓN CRÍTICA DE ATOMICIDAD: COMMIT intermedio en línea ${i + 1}`);
    }
  }

  const strippedSql = lines.map((line, idx) => {
    if (idx === firstBeginIdx) return "-- [UNIFIED WRAPPER: Original BEGIN replaced]";
    if (idx === lastCommitIdx) return "-- [UNIFIED WRAPPER: Original COMMIT replaced]";
    return line;
  }).join("\n");

  return `
BEGIN;
SET LOCAL ROLE postgres;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- 0. Revalidación transaccional estricta de precondiciones y baselines (fail-closed)
DO $$
DECLARE
  v_hist28 integer;
  v_mig_done integer;
  v_mig_1a integer;
  v_guard_owner text;
  v_guard_secdef boolean;
  v_write_owner text;
  v_write_secdef boolean;
  v_offer_owner text;
  v_offer_secdef boolean;
  v_prosrc text;
BEGIN
  -- Revalidar ausencia de 20261010155728
  SELECT count(*) INTO v_hist28 FROM supabase_migrations.schema_migrations WHERE version = '20261010155728';
  IF v_hist28 > 0 THEN
    RAISE EXCEPTION 'BLOCKED: UNEXPECTED_MIGRATION_HISTORY: 20261010155728 detected in ledger';
  END IF;

  -- Revalidar estado pendiente de 20261024175900
  SELECT count(*) INTO v_mig_done FROM supabase_migrations.schema_migrations WHERE version = '${migrationVersion}';
  IF v_mig_done > 0 THEN
    RAISE EXCEPTION 'BLOCKED: ALREADY_APPLIED: ${migrationVersion} already recorded in schema_migrations';
  END IF;

  -- Revalidar ausencia de 1A
  SELECT count(*) INTO v_mig_1a FROM supabase_migrations.schema_migrations WHERE version IN ('20261024180000', '20261024190000');
  IF v_mig_1a > 0 THEN
    RAISE EXCEPTION 'BLOCKED: GOVERNANCE_VIOLATION: 1A migrations already applied before identity bridge';
  END IF;

  -- Revalidar baseline de guard_legacy_offer
  SELECT pg_get_userbyid(p.proowner), p.prosecdef, p.prosrc
  INTO v_guard_owner, v_guard_secdef, v_prosrc
  FROM pg_proc p WHERE p.oid = to_regprocedure('cr_order_private.guard_legacy_offer()');
  IF v_guard_owner IS DISTINCT FROM 'cr_order_writer' OR v_guard_secdef IS NOT TRUE THEN
    RAISE EXCEPTION 'BLOCKED: FUNCTION_DRIFT: guard_legacy_offer owner or secdef drifted';
  END IF;
  IF v_prosrc NOT LIKE '%write_contract_version%' OR v_prosrc NOT LIKE '%OFFER_PRICING_QUOTE_REQUIRED%' THEN
    RAISE EXCEPTION 'BLOCKED: FUNCTION_DRIFT: guard_legacy_offer source baseline drifted';
  END IF;

  -- Revalidar baseline de write_dish_v2
  SELECT pg_get_userbyid(p.proowner), p.prosecdef, p.prosrc
  INTO v_write_owner, v_write_secdef, v_prosrc
  FROM pg_proc p WHERE p.oid = to_regprocedure('cr_order_private.write_dish_v2(uuid,uuid,jsonb,uuid,jsonb)');
  IF v_write_owner IS DISTINCT FROM 'cr_order_writer' OR v_write_secdef IS NOT TRUE THEN
    RAISE EXCEPTION 'BLOCKED: FUNCTION_DRIFT: write_dish_v2 owner or secdef drifted';
  END IF;
  IF v_prosrc NOT LIKE '%_verified_actor IS NOT NULL%' OR v_prosrc NOT LIKE '%UNTRUSTED_AUTHORITY_FIELD%' THEN
    RAISE EXCEPTION 'BLOCKED: FUNCTION_DRIFT: write_dish_v2 source baseline drifted';
  END IF;

  -- Revalidar esquema cr_order_private
  IF has_schema_privilege('anon', 'cr_order_private', 'USAGE') THEN
    RAISE EXCEPTION 'BLOCKED: SCHEMA_DRIFT: anon has USAGE on cr_order_private';
  END IF;
  IF has_schema_privilege('authenticated', 'cr_order_private', 'CREATE') THEN
    RAISE EXCEPTION 'BLOCKED: SCHEMA_DRIFT: authenticated has CREATE on cr_order_private';
  END IF;
  IF NOT has_schema_privilege('authenticated', 'cr_order_private', 'USAGE') THEN
    RAISE EXCEPTION 'BLOCKED: SCHEMA_DRIFT: authenticated missing USAGE on cr_order_private';
  END IF;

  -- Revalidar baseline de offer_state
  SELECT pg_get_userbyid(p.proowner), p.prosecdef, p.prosrc
  INTO v_offer_owner, v_offer_secdef, v_prosrc
  FROM pg_proc p WHERE p.oid = to_regprocedure('cr_order_private.offer_state(uuid,jsonb,text)');
  IF v_offer_owner IS DISTINCT FROM 'cr_order_writer' OR v_offer_secdef IS NOT FALSE THEN
    RAISE EXCEPTION 'BLOCKED: FUNCTION_DRIFT: offer_state owner or secdef drifted';
  END IF;
  IF (SELECT coalesce(array_to_string(proacl, ','), '') FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.offer_state(uuid,jsonb,text)')) LIKE '%anon=%'
     OR (SELECT coalesce(array_to_string(proacl, ','), '') FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.offer_state(uuid,jsonb,text)')) LIKE '%authenticated=%' THEN
    RAISE EXCEPTION 'BLOCKED: FUNCTION_DRIFT: offer_state has explicit anon/authenticated ACL grants';
  END IF;
  IF v_prosrc NOT LIKE '%require_custom%' OR v_prosrc NOT LIKE '%OFFER_PRICING_COMMERCIAL_UNSUPPORTED%' OR v_prosrc NOT LIKE '%require_off_menu%' THEN
    RAISE EXCEPTION 'BLOCKED: FUNCTION_DRIFT: offer_state source baseline drifted';
  END IF;
END $$;

-- 1. Contenido DDL completo de la migración de identidad
${strippedSql}

-- 2. Registro oficial en el ledger de migraciones
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('${migrationVersion}')
ON CONFLICT (version) DO NOTHING;

COMMIT;
`;
}

export function executeSelectiveMigration({
  rootDir,
  migrationFileRel,
  migrationVersion,
  host,
  port,
  user,
  db,
  psqlBin,
  confirmationToken,
  env = process.env,
}) {
  const { filePath } = validateExecutorSafetyGuard({
    rootDir,
    migrationFileRel,
    migrationVersion,
    host,
    port,
    user,
    db,
    confirmationToken,
    env,
  });

  const unifiedTransactionSql = buildUnifiedTransactionSql(filePath, migrationVersion);

  process.stdout.write("  Enviando transacción atómica a PostgreSQL... ");
  execFileSync(
    psqlBin,
    [
      "-X",
      "-q",
      "-h",
      host,
      "-p",
      port,
      "-U",
      user,
      "-d",
      db,
      "-v",
      "ON_ERROR_STOP=1",
    ],
    {
      input: unifiedTransactionSql,
      stdio: ["pipe", "inherit", "inherit"],
    }
  );
  console.log("CONFIRMADO.");
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentFile)) {
  const [
    rootDir,
    migrationFileRel,
    migrationVersion,
    host,
    port,
    user,
    db,
    psqlBin,
  ] = process.argv.slice(2);

  if (
    !rootDir ||
    !migrationFileRel ||
    !migrationVersion ||
    !host ||
    !port ||
    !user ||
    !db ||
    !psqlBin
  ) {
    console.error("FATAL: Argumentos insuficientes para el ejecutor selectivo.");
    process.exit(1);
  }

  const confirmationToken = process.env.CONFIRM_LIVE_EXECUTION;

  try {
    executeSelectiveMigration({
      rootDir,
      migrationFileRel,
      migrationVersion,
      host,
      port,
      user,
      db,
      psqlBin,
      confirmationToken,
      env: process.env,
    });
  } catch (err) {
    console.error(`\nFATAL: Error durante la ejecución selectiva: ${err.message}`);
    process.exit(1);
  }
}
