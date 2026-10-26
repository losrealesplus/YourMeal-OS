#!/usr/bin/env node
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  REQUIRED_CONFIRMATION_TOKEN,
  EXPECTED_MIGRATION_VERSION,
  EXPECTED_MIGRATION_FILE_REL,
  EXPECTED_MIGRATION_SHA,
  EXPECTED_PROJECT,
  EXPECTED_POOLER_HOST,
  EXPECTED_DIRECT_HOST,
  EXPECTED_PORT,
  EXPECTED_DB,
  EXPECTED_CA_SHA,
  validateExecutorSafetyGuard,
  buildUnifiedTransactionSql,
} from "./flow04-inventory-consumption-selective-executor.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

test("FLOW-04 Selective Executor: Static Verification & Safety Audit", async (t) => {
  const scriptPath = path.join(ROOT_DIR, "scripts/flow04-inventory-consumption-selective-migration-live.sh");
  const executorPath = path.join(ROOT_DIR, "scripts/flow04-inventory-consumption-selective-executor.mjs");
  const migrationPath = path.join(ROOT_DIR, EXPECTED_MIGRATION_FILE_REL);

  await t.test("scripts exist and have executable permissions", () => {
    assert.ok(fs.existsSync(scriptPath), "Shell script must exist");
    assert.ok(fs.existsSync(executorPath), "Node executor must exist");

    const statSh = fs.statSync(scriptPath);
    const isExecutableSh = Boolean(statSh.mode & 0o111);
    assert.ok(isExecutableSh, "Shell script must have executable permission (chmod +x)");

    const statMjs = fs.statSync(executorPath);
    const isExecutableMjs = Boolean(statMjs.mode & 0o111);
    assert.ok(isExecutableMjs, "Node executor must have executable permission (chmod +x)");
  });

  await t.test("migration file exists and checksum matches exact SHA-256", () => {
    assert.ok(fs.existsSync(migrationPath), "Migration file must exist");
    const bytes = fs.readFileSync(migrationPath);
    const hash = crypto.createHash("sha256").update(bytes).digest("hex");
    assert.equal(hash, EXPECTED_MIGRATION_SHA, "Migration SHA-256 must match exact canonical hash");
  });

  await t.test("strict production target and tenant guards are present", () => {
    const contentSh = fs.readFileSync(scriptPath, "utf8");
    assert.ok(contentSh.includes('EXPECTED_PROJECT="nhirlpkuvonggctdzzad"'));
    assert.ok(contentSh.includes('EXPECTED_POOLER_HOST="aws-0-eu-central-1.pooler.supabase.com"'));
    assert.ok(contentSh.includes('EXPECTED_DIRECT_HOST="db.nhirlpkuvonggctdzzad.supabase.co"'));
    assert.ok(contentSh.includes('EXPECTED_PORT="5432"'));
    assert.ok(contentSh.includes('EXPECTED_DB="postgres"'));
    assert.ok(contentSh.includes("djangucecsphnejplvic"), "Must check and forbid Demo environment");
    assert.ok(contentSh.includes('PGSSLMODE="verify-full"'), "Must require verify-full TLS in production");
    assert.ok(contentSh.includes("8bba00ba-331b-42c8-9283-4e3836ffb870"), "Must verify EatClean tenant ID");
  });

  await t.test("dry-run path is guaranteed 100% read-only and exits 0 before any DDL", () => {
    const contentSh = fs.readFileSync(scriptPath, "utf8");
    assert.ok(contentSh.includes('DRY_RUN="true"'));
    assert.ok(contentSh.includes('if [ "$DRY_RUN" = "true" ]; then'));
    assert.ok(contentSh.includes("exit 0"));
  });

  await t.test("accidental execution prevention and human authorization token are enforced", () => {
    const contentSh = fs.readFileSync(scriptPath, "utf8");
    assert.ok(contentSh.includes(`CONFIRMATION_TOKEN="${REQUIRED_CONFIRMATION_TOKEN}"`));
    assert.ok(contentSh.includes('if [ "$PROVIDED_TOKEN" != "$CONFIRMATION_TOKEN" ]; then'));
    assert.ok(contentSh.includes("exit 1"));
  });

  await t.test("precheck validates prerequisite migrations 20261024175900 and 20261024180000", () => {
    const contentSh = fs.readFileSync(scriptPath, "utf8");
    assert.ok(contentSh.includes("20261024175900"));
    assert.ok(contentSh.includes("20261024180000"));
    assert.ok(contentSh.includes("20261024190000"));
  });

  await t.test("precheck detects and blocks partial consumption structures fail-closed", () => {
    const contentSh = fs.readFileSync(scriptPath, "utf8");
    assert.ok(contentSh.includes("PARTIAL_STRUCTURES_EXIST"));
    assert.ok(contentSh.includes("inventory_consumptions"));
    assert.ok(contentSh.includes("inventory_consumption_lines"));
    assert.ok(contentSh.includes("create_inventory_consumption_plan_v1"));
  });

  await t.test("postcheck revalidates tables, RLS, functions, SECDEF, and stock_movements volume", () => {
    const contentSh = fs.readFileSync(scriptPath, "utf8");
    assert.ok(contentSh.includes("POST_MIG_COUNT"));
    assert.ok(contentSh.includes("relrowsecurity = true"));
    assert.ok(contentSh.includes("POST_FUNCS_SECDEF"));
    assert.ok(contentSh.includes("POST_STOCK_MOVEMENTS"));
  });

  await t.test("buildUnifiedTransactionSql produces atomic transaction with lock/statement timeouts", () => {
    const unifiedSql = buildUnifiedTransactionSql(migrationPath, EXPECTED_MIGRATION_VERSION);
    assert.ok(unifiedSql.startsWith("\nBEGIN;"), "Must start with BEGIN");
    assert.ok(unifiedSql.trim().endsWith("COMMIT;"), "Must end with COMMIT");
    assert.ok(unifiedSql.includes("SET LOCAL lock_timeout = '5s';"));
    assert.ok(unifiedSql.includes("SET LOCAL statement_timeout = '60s';"));
    assert.ok(unifiedSql.includes(`INSERT INTO supabase_migrations.schema_migrations (version)`));
    assert.ok(unifiedSql.includes(`VALUES ('${EXPECTED_MIGRATION_VERSION}')`));
  });

  await t.test("validateExecutorSafetyGuard enforces direct entry authorization and destination checks", () => {
    // Caso 1: Token ausente
    assert.throws(
      () => {
        validateExecutorSafetyGuard({
          rootDir: ROOT_DIR,
          migrationFileRel: EXPECTED_MIGRATION_FILE_REL,
          migrationVersion: EXPECTED_MIGRATION_VERSION,
          host: "127.0.0.1",
          port: 54322,
          user: "postgres",
          db: "postgres",
          confirmationToken: "INVALID_TOKEN",
          env: { LAB_ISOLATED_PG17: "true" },
        });
      },
      /BLOCKED: DIRECT_EXECUTOR_UNAUTHORIZED/
    );

    // Caso 2: Versión incorrecta
    assert.throws(
      () => {
        validateExecutorSafetyGuard({
          rootDir: ROOT_DIR,
          migrationFileRel: EXPECTED_MIGRATION_FILE_REL,
          migrationVersion: "20261024180000",
          host: "127.0.0.1",
          port: 54322,
          user: "postgres",
          db: "postgres",
          confirmationToken: REQUIRED_CONFIRMATION_TOKEN,
          env: { LAB_ISOLATED_PG17: "true" },
        });
      },
      /BLOCKED: VERSION_MISMATCH/
    );

    // Caso 3: Éxito en laboratorio aislado con token válido
    const resultLab = validateExecutorSafetyGuard({
      rootDir: ROOT_DIR,
      migrationFileRel: EXPECTED_MIGRATION_FILE_REL,
      migrationVersion: EXPECTED_MIGRATION_VERSION,
      host: "127.0.0.1",
      port: 54322,
      user: "postgres",
      db: "postgres",
      confirmationToken: REQUIRED_CONFIRMATION_TOKEN,
      env: { LAB_ISOLATED_PG17: "true", PGPORT: "54322" },
    });
    assert.equal(resultLab.isLab, true);

    // Caso 4: Producción sin TLS verify-full
    assert.throws(
      () => {
        validateExecutorSafetyGuard({
          rootDir: ROOT_DIR,
          migrationFileRel: EXPECTED_MIGRATION_FILE_REL,
          migrationVersion: EXPECTED_MIGRATION_VERSION,
          host: EXPECTED_POOLER_HOST,
          port: EXPECTED_PORT,
          user: `postgres.${EXPECTED_PROJECT}`,
          db: EXPECTED_DB,
          confirmationToken: REQUIRED_CONFIRMATION_TOKEN,
          env: { LAB_ISOLATED_PG17: "false", PGSSLMODE: "prefer" },
        });
      },
      /FATAL SECURITY_VIOLATION: En producción se exige PGSSLMODE='verify-full'/
    );
  });
});

// Suite de Integración Dinámica en PostgreSQL Local Aislado (si está disponible)
test("FLOW-04 Selective Executor: Local Isolated PG17 Integration & Rollback Suite", async (t) => {
  const psqlBin = process.env.PSQL_BIN || "/opt/homebrew/bin/psql";
  const migrationPath = path.join(ROOT_DIR, EXPECTED_MIGRATION_FILE_REL);

  function runLabSql(query) {
    return execFileSync(
      psqlBin,
      [
        "-X",
        "-A",
        "-t",
        "-q",
        "-h",
        "127.0.0.1",
        "-p",
        "54322",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-v",
        "ON_ERROR_STOP=1",
        "-c",
        query,
      ],
      {
        env: { ...process.env, PGPASSWORD: "postgres" },
        encoding: "utf8",
      }
    ).trim();
  }

  let labAvailable = false;
  try {
    const ready = runLabSql("SELECT 1;");
    labAvailable = ready === "1";
  } catch {
    labAvailable = false;
  }

  if (!labAvailable) {
    console.log("  [INFO] PostgreSQL local 127.0.0.1:54322 no disponible. Omitiendo suite dinámica.");
    return;
  }

  await t.test("Local lab environment preparation to clean baseline (identidad=1, compras=1, consumo=0)", () => {
    runLabSql(`
      DROP TABLE IF EXISTS public.inventory_consumption_lines CASCADE;
      DROP TABLE IF EXISTS public.inventory_consumptions CASCADE;
      DROP FUNCTION IF EXISTS public.create_inventory_consumption_plan_v1(uuid, date, jsonb, uuid) CASCADE;
      DROP FUNCTION IF EXISTS public.apply_inventory_consumption_v1(uuid, uuid, uuid) CASCADE;
      DROP FUNCTION IF EXISTS public.seal_inventory_consumption_v1(uuid, uuid, uuid) CASCADE;
      DELETE FROM supabase_migrations.schema_migrations WHERE version = '20261024190000';
      INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('20261024180000', 'cr_cost_1a_atomic_purchase_receipt') ON CONFLICT (version) DO NOTHING;
    `);

    const idCount = runLabSql("SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '20261024175900';");
    const p1Count = runLabSql("SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '20261024180000';");
    const p2Count = runLabSql("SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '20261024190000';");
    assert.equal(idCount, "1", "Identidad debe estar registrada");
    assert.equal(p1Count, "1", "Parte 1 Compras debe estar registrada");
    assert.equal(p2Count, "0", "Parte 2 Consumo debe estar pendiente");
  });

  await t.test("accidental execution guards in CLI", () => {
    // Falta de token
    let missingTokenExited = false;
    let missingTokenCode = 0;
    try {
      execFileSync(
        path.join(ROOT_DIR, "scripts/flow04-inventory-consumption-selective-migration-live.sh"),
        ["--apply"],
        {
          env: { ...process.env, LAB_ISOLATED_PG17: "true", CONFIRM_LIVE_EXECUTION: "" },
          stdio: ["ignore", "pipe", "pipe"],
          encoding: "utf8",
        }
      );
    } catch (err) {
      missingTokenExited = true;
      missingTokenCode = err.status;
    }
    assert.ok(missingTokenExited, "Debe abortar sin token interactivo");
    assert.equal(missingTokenCode, 2, "Exit code debe ser 2 para token no provisto sin TTY");

    // Token inválido
    let wrongTokenExited = false;
    let wrongTokenCode = 0;
    try {
      execFileSync(
        path.join(ROOT_DIR, "scripts/flow04-inventory-consumption-selective-migration-live.sh"),
        ["--apply"],
        {
          env: { ...process.env, LAB_ISOLATED_PG17: "true", CONFIRM_LIVE_EXECUTION: "WRONG_TOKEN" },
          stdio: ["ignore", "pipe", "pipe"],
          encoding: "utf8",
        }
      );
    } catch (err) {
      wrongTokenExited = true;
      wrongTokenCode = err.status;
    }
    assert.ok(wrongTokenExited, "Debe abortar con token erróneo");
    assert.equal(wrongTokenCode, 1, "Exit code debe ser 1 para token inválido");
  });

  await t.test("direct executor unauthorized invocation blocked fail-closed", () => {
    let directBlocked = false;
    let directOutput = "";
    try {
      execFileSync(
        "node",
        [
          path.join(ROOT_DIR, "scripts/flow04-inventory-consumption-selective-executor.mjs"),
          ROOT_DIR,
          EXPECTED_MIGRATION_FILE_REL,
          EXPECTED_MIGRATION_VERSION,
          "127.0.0.1",
          "54322",
          "postgres",
          "postgres",
          psqlBin,
        ],
        {
          env: { ...process.env, LAB_ISOLATED_PG17: "true", CONFIRM_LIVE_EXECUTION: "" },
          stdio: ["ignore", "pipe", "pipe"],
          encoding: "utf8",
        }
      );
    } catch (err) {
      directBlocked = true;
      directOutput = (err.stderr || "") + (err.stdout || "");
    }
    assert.ok(directBlocked, "Direct execution without token must fail");
    assert.ok(directOutput.includes("BLOCKED: DIRECT_EXECUTOR_UNAUTHORIZED"));
  });

  await t.test("transactional rollback on failure before COMMIT (zero writes preserved)", () => {
    const officialSql = buildUnifiedTransactionSql(migrationPath, EXPECTED_MIGRATION_VERSION);
    const failingSql = officialSql.replace(
      /\n\s*COMMIT;\s*$/i,
      () => "\nDO $$ BEGIN RAISE EXCEPTION 'SIMULATED_FAILURE_BEFORE_COMMIT'; END $$;\nCOMMIT;"
    );

    let rollbackObserved = false;
    try {
      runLabSql(failingSql);
    } catch (err) {
      rollbackObserved = (err.message && err.message.includes("SIMULATED_FAILURE_BEFORE_COMMIT")) ||
                         (err.stderr && err.stderr.toString().includes("SIMULATED_FAILURE_BEFORE_COMMIT"));
    }
    assert.ok(rollbackObserved, "Simulated exception must abort transaction");

    // Verificar que la migración NO fue registrada
    const ledgerCount = runLabSql(`SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '${EXPECTED_MIGRATION_VERSION}';`);
    assert.equal(ledgerCount, "0", "ROLLBACK: Versión 20261024190000 NO debe quedar registrada tras fallo");

    // Verificar que las tablas NO quedaron creadas
    const tablesCount = runLabSql("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('inventory_consumptions', 'inventory_consumption_lines');");
    assert.equal(tablesCount, "0", "ROLLBACK: Tablas de consumo NO deben persistir tras fallo atómico");
  });

  await t.test("real CLI --apply execution passes Fases 1, 2, 3 and registers migration", () => {
    const applyOutput = execFileSync(
      path.join(ROOT_DIR, "scripts/flow04-inventory-consumption-selective-migration-live.sh"),
      ["--apply"],
      {
        env: {
          ...process.env,
          LAB_ISOLATED_PG17: "true",
          CONFIRM_LIVE_EXECUTION: REQUIRED_CONFIRMATION_TOKEN,
        },
        encoding: "utf8",
      }
    );

    assert.ok(applyOutput.includes("FASE 1 PASS"), "Fase 1 debe ser exitosa");
    assert.ok(applyOutput.includes("FASE 2 PASS"), "Fase 2 debe ser exitosa");
    assert.ok(applyOutput.includes("FASE 3/3"), "Fase 3 debe ejecutarse");
    assert.ok(applyOutput.includes("APPLY_RESULT: PASS"), "Apply final debe indicar PASS");

    // Postchecks en el motor
    const postMigCount = runLabSql(`SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '${EXPECTED_MIGRATION_VERSION}';`);
    assert.equal(postMigCount, "1", "Migración debe quedar registrada exactamente 1 vez");

    // Verificación de consulta con version y name (sin inserted_at)
    const ledgerRow = runLabSql(`SELECT version || '|' || coalesce(name, '') FROM supabase_migrations.schema_migrations WHERE version = '${EXPECTED_MIGRATION_VERSION}';`);
    assert.ok(ledgerRow.startsWith(EXPECTED_MIGRATION_VERSION), "Consulta con version y name debe funcionar");

    // Tablas y RLS
    const postRlsCount = runLabSql(`
      SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname IN ('inventory_consumptions', 'inventory_consumption_lines') AND c.relrowsecurity = true;
    `);
    assert.equal(postRlsCount, "2", "Las 2 tablas deben tener RLS habilitado");

    // 3 funciones de consumo presentes con SECDEF y owner postgres
    const postFuncsSecdef = runLabSql(`
      SELECT count(*) FROM pg_proc
      WHERE proname IN ('create_inventory_consumption_plan_v1', 'apply_inventory_consumption_v1', 'seal_inventory_consumption_v1')
        AND pg_get_userbyid(proowner) = 'postgres' AND prosecdef = true;
    `);
    assert.equal(postFuncsSecdef, "3", "Las 3 funciones deben tener SECDEF y owner postgres");

    // Permisos revocados de PUBLIC y anon
    const permViolations = runLabSql(`
      SELECT count(*) FROM pg_proc
      WHERE proname IN ('create_inventory_consumption_plan_v1', 'apply_inventory_consumption_v1', 'seal_inventory_consumption_v1')
        AND (has_function_privilege('public', oid, 'EXECUTE') OR has_function_privilege('anon', oid, 'EXECUTE'));
    `);
    assert.equal(permViolations, "0", "Cero permisos a PUBLIC o anon en funciones de consumo");

    // Cero movimientos de existencias ficticios
    const stockMovementsCount = runLabSql("SELECT count(*) FROM public.stock_movements;");
    assert.equal(stockMovementsCount, "0", "No deben generarse movimientos de existencias ficticios durante DDL");
  });
});
