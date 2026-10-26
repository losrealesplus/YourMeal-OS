#!/usr/bin/env node
/**
 * YOURMEAL OS — FLOW-04 INVENTORY CONSUMPTION SELECTIVE EXECUTOR (FASE 2)
 *
 * Encapsula la preparación y el envío atómico de la transacción SQL unificada
 * de la migración 20261024190000 a PostgreSQL para garantizar atomicidad e integridad.
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

export const REQUIRED_CONFIRMATION_TOKEN = "APPLY_20261024190000_TO_EATCLEAN_PROD";
export const EXPECTED_MIGRATION_VERSION = "20261024190000";
export const EXPECTED_MIGRATION_FILE_REL = "supabase/migrations/20261024190000_flow04_inventory_consumption_persistence.sql";
export const EXPECTED_MIGRATION_SHA = "72bebe319e282d7de135cca14194a796a945b94fa569cdb76a58cd03f383c849";

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
        `FATAL SECURITY_VIOLATION: EatClean FLOW-04 migration cannot connect to Demo project (djangucecsphnejplvic)!`
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

  // Verificar que no existan sentencias COMMIT no deseadas a nivel raíz
  const lines = rawSql.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*COMMIT\s*;/i.test(lines[i])) {
      throw new Error(`VIOLACIÓN CRÍTICA DE ATOMICIDAD: COMMIT inesperado en línea ${i + 1}`);
    }
  }

  return `
BEGIN;
SET LOCAL ROLE postgres;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- 0. Revalidación transaccional estricta de precondiciones y baselines (fail-closed)
DO $$
DECLARE
  v_mig_id integer;
  v_mig_1a_p1 integer;
  v_mig_done integer;
  v_part_tables integer;
  v_part_funcs integer;
BEGIN
  -- Revalidar prerrequisito de puente de identidad (20261024175900)
  SELECT count(*) INTO v_mig_id FROM supabase_migrations.schema_migrations WHERE version = '20261024175900';
  IF v_mig_id <> 1 THEN
    RAISE EXCEPTION 'BLOCKED: IDENTITY_BRIDGE_MISSING: 20261024175900 not registered';
  END IF;

  -- Revalidar prerrequisito de recepción de compras 1A (20261024180000)
  SELECT count(*) INTO v_mig_1a_p1 FROM supabase_migrations.schema_migrations WHERE version = '20261024180000';
  IF v_mig_1a_p1 <> 1 THEN
    RAISE EXCEPTION 'BLOCKED: PART1_COMPRAS_MISSING: 20261024180000 not registered';
  END IF;

  -- Revalidar estado pendiente de 20261024190000
  SELECT count(*) INTO v_mig_done FROM supabase_migrations.schema_migrations WHERE version = '${migrationVersion}';
  IF v_mig_done > 0 THEN
    RAISE EXCEPTION 'BLOCKED: ALREADY_APPLIED: ${migrationVersion} already recorded in schema_migrations';
  END IF;

  -- Revalidar ausencia de tablas de consumo parciales
  SELECT count(*) INTO v_part_tables FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name IN ('inventory_consumptions', 'inventory_consumption_lines');
  IF v_part_tables > 0 THEN
    RAISE EXCEPTION 'BLOCKED: PARTIAL_STRUCTURES_EXIST: consumption tables already exist in public schema';
  END IF;

  -- Revalidar ausencia de funciones de consumo parciales
  SELECT count(*) INTO v_part_funcs FROM pg_proc
  WHERE proname IN ('create_inventory_consumption_plan_v1', 'apply_inventory_consumption_v1', 'seal_inventory_consumption_v1');
  IF v_part_funcs > 0 THEN
    RAISE EXCEPTION 'BLOCKED: PARTIAL_STRUCTURES_EXIST: consumption functions already exist in catalog';
  END IF;
END $$;

-- 1. Contenido DDL completo de la migración de consumo de inventario FLOW-04
${rawSql}

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
      "-c",
      unifiedTransactionSql,
    ],
    {
      env,
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
    }
  );
  console.log("OK");
  return { success: true };
}

// Invocación CLI directa
const isDirectCli = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectCli) {
  const [
    rootDirArg,
    migrationFileRelArg,
    migrationVersionArg,
    hostArg,
    portArg,
    userArg,
    dbArg,
    psqlBinArg,
  ] = process.argv.slice(2);

  if (!rootDirArg || !migrationFileRelArg || !migrationVersionArg || !hostArg || !portArg || !userArg || !dbArg) {
    console.error("FATAL: Argumentos insuficientes para flow04-inventory-consumption-selective-executor.mjs");
    process.exit(1);
  }

  const confirmationToken = process.env.CONFIRM_LIVE_EXECUTION || "";

  try {
    executeSelectiveMigration({
      rootDir: rootDirArg,
      migrationFileRel: migrationFileRelArg,
      migrationVersion: migrationVersionArg,
      host: hostArg,
      port: portArg,
      user: userArg,
      db: dbArg,
      psqlBin: psqlBinArg || "psql",
      confirmationToken,
      env: process.env,
    });
  } catch (err) {
    console.error(`\nFATAL FASE 2: ${err.message}`);
    process.exit(1);
  }
}
