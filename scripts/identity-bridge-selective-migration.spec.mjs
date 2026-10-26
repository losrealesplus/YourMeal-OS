import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { buildUnifiedTransactionSql, validateExecutorSafetyGuard, REQUIRED_CONFIRMATION_TOKEN } from "./identity-bridge-selective-executor.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

test("Identity Bridge Selective Executor: Static Verification & Safety Audit", async (t) => {
  const scriptPath = path.join(ROOT_DIR, "scripts/identity-bridge-selective-migration-live.sh");
  const executorPath = path.join(ROOT_DIR, "scripts/identity-bridge-selective-executor.mjs");
  const migrationPath = path.join(
    ROOT_DIR,
    "supabase/migrations/20261024175900_cr_order_writer_identity_bridge_hardening.sql"
  );

  await t.test("script exists and has executable permissions", () => {
    assert.ok(fs.existsSync(scriptPath), "Script must exist at scripts/identity-bridge-selective-migration-live.sh");
    const stat = fs.statSync(scriptPath);
    // Check executable bits
    const isExecutable = !!(stat.mode & 0o111);
    assert.ok(isExecutable, "Script must have executable permissions");

    assert.ok(fs.existsSync(executorPath), "Executor must exist at scripts/identity-bridge-selective-executor.mjs");
    const execStat = fs.statSync(executorPath);
    const isExecExecutable = !!(execStat.mode & 0o111);
    assert.ok(isExecExecutable, "Executor must have executable permissions");
  });

  await t.test("migration file exists and checksum matches exact SHA-256", () => {
    assert.ok(fs.existsSync(migrationPath), "Migration 20261024175900 must exist");
    const content = fs.readFileSync(migrationPath);
    const hash = crypto.createHash("sha256").update(content).digest("hex");
    assert.equal(
      hash,
      "fb773e233a2ca6f89c16bccfc1aa7eb10da90d2d7cfe3b7498bd3d93bf2c8e30",
      "Migration SHA-256 must match exactly"
    );

    const scriptContent = fs.readFileSync(scriptPath, "utf8");
    assert.ok(
      scriptContent.includes('EXPECTED_MIGRATION_SHA="fb773e233a2ca6f89c16bccfc1aa7eb10da90d2d7cfe3b7498bd3d93bf2c8e30"'),
      "Script must pin exact migration SHA-256"
    );
  });

  await t.test("strict production target and tenant guards are present", () => {
    const scriptContent = fs.readFileSync(scriptPath, "utf8");
    assert.ok(scriptContent.includes('EXPECTED_PROJECT="nhirlpkuvonggctdzzad"'), "Must target nhirlpkuvonggctdzzad");
    assert.ok(
      scriptContent.includes('EXPECTED_POOLER_HOST="aws-0-eu-central-1.pooler.supabase.com"'),
      "Must target official pooler host"
    );
    assert.ok(
      scriptContent.includes("8bba00ba-331b-42c8-9283-4e3836ffb870|EatClean|eatclean"),
      "Must enforce EatClean production tenant UUID, Name, and Slug"
    );
    assert.ok(
      scriptContent.includes('CA_EXPECTED_SHA="700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7"'),
      "Must verify official CA certificate checksum"
    );
    assert.ok(scriptContent.includes('export PGSSLMODE="verify-full"'), "Must enforce verify-full TLS mode");
  });

  await t.test("dry-run path is guaranteed 100% read-only and exits 0 before any DDL", () => {
    const scriptContent = fs.readFileSync(scriptPath, "utf8");
    assert.ok(scriptContent.includes('if [ "$DRY_RUN" = "true" ]; then'), "Must branch on DRY_RUN");
    assert.ok(
      scriptContent.includes("BEGIN TRANSACTION READ ONLY;"),
      "run_readonly_sql must use BEGIN TRANSACTION READ ONLY;"
    );
    // Ensure exit 0 occurs before Phase 2 DDL execution
    const dryRunExitIdx = scriptContent.indexOf('exit 0\nfi\n\n# ---');
    const phase2Idx = scriptContent.indexOf('FASE 2: APLICACIÓN ATÓMICA');
    assert.ok(dryRunExitIdx !== -1, "Dry-run must exit cleanly");
    assert.ok(phase2Idx !== -1, "Phase 2 must exist");
    assert.ok(dryRunExitIdx < phase2Idx, "Dry-run exit must precede Phase 2 DDL application");
  });

  await t.test("accidental execution prevention and human authorization token are enforced", () => {
    const scriptContent = fs.readFileSync(scriptPath, "utf8");
    assert.ok(
      scriptContent.includes('CONFIRMATION_TOKEN="APPLY_20261024175900_TO_EATCLEAN_PROD"'),
      "Must define explicit confirmation token"
    );
    assert.ok(
      scriptContent.includes('if [ "$APPLY_FLAG" != "true" ]; then'),
      "Must require --apply flag for any write path"
    );
    assert.ok(
      scriptContent.includes('if [ "$APPLY_FLAG" = "false" ] && [ "$DRY_RUN" = "false" ]; then'),
      "Default mode without flags must fallback safely to --dry-run"
    );
  });

  await t.test("drift detection is fail-closed and rejects unknown definitions, owners or ACL drift with BLOCKED: FUNCTION_DRIFT", () => {
    const scriptContent = fs.readFileSync(scriptPath, "utf8");
    assert.ok(
      scriptContent.includes('BLOCKED: FUNCTION_DRIFT'),
      "Script must explicitly abort with BLOCKED: FUNCTION_DRIFT"
    );
    assert.ok(
      scriptContent.includes('guard_legacy_offer owner invalid') &&
      scriptContent.includes('write_dish_v2 owner invalid') &&
      scriptContent.includes('offer_state owner invalid'),
      "Must validate exact function owners"
    );
    assert.ok(
      scriptContent.includes('guard_legacy_offer must be SECURITY DEFINER') &&
      scriptContent.includes('write_dish_v2 must be SECURITY DEFINER') &&
      scriptContent.includes('offer_state must be SECURITY INVOKER'),
      "Must validate exact prosecdef security flags"
    );
    assert.ok(
      scriptContent.includes('guard_legacy_offer source baseline drift') &&
      scriptContent.includes('write_dish_v2 source baseline drift') &&
      scriptContent.includes('offer_state source baseline drift'),
      "Must validate canonical baseline source anchors"
    );
    assert.ok(
      scriptContent.includes('offer_state has explicit anon/authenticated ACL grants'),
      "Must prohibit explicit grants to anon/authenticated on offer_state"
    );
    assert.ok(
      scriptContent.includes('authenticated missing USAGE on cr_order_private') &&
      scriptContent.includes('anon has USAGE on cr_order_private') &&
      scriptContent.includes('authenticated has CREATE on cr_order_private'),
      "Must enforce schema policy: authenticated USAGE preserved, anon USAGE forbidden, CREATE forbidden"
    );
    assert.ok(
      scriptContent.includes('lifecycle_v2 missing authenticated EXECUTE') &&
      scriptContent.includes('lifecycle_context missing authenticated EXECUTE') &&
      scriptContent.includes('custom_batch_transition missing authenticated EXECUTE'),
      "Must ensure lifecycle and kitchen functions retain authenticated EXECUTE"
    );
  });

  await t.test("unexpected historical migration 20261010155728 produces BLOCKED: UNEXPECTED_MIGRATION_HISTORY and aborts with code 1", () => {
    const scriptContent = fs.readFileSync(scriptPath, "utf8");
    assert.ok(
      scriptContent.includes('BLOCKED: UNEXPECTED_MIGRATION_HISTORY'),
      "Script must emit BLOCKED: UNEXPECTED_MIGRATION_HISTORY"
    );
    assert.ok(
      scriptContent.includes('if [ "$HISTORICAL_28" -ne 0 ]; then') &&
      scriptContent.includes('exit 1'),
      "Script must abort with exit 1 if 20261010155728 is present in ledger"
    );
  });

  await t.test("transactional revalidation guarantees fail-closed precheck inside Phase 2 transaction before any DDL", () => {
    const scriptContent = fs.readFileSync(scriptPath, "utf8");
    assert.ok(
      scriptContent.includes('scripts/identity-bridge-selective-executor.mjs'),
      "Bash script must delegate Phase 2 to identity-bridge-selective-executor.mjs"
    );

    const executorContent = fs.readFileSync(executorPath, "utf8");
    assert.ok(
      executorContent.includes('Revalidación transaccional estricta de precondiciones y baselines (fail-closed)'),
      "Phase 2 executor must include transactional precheck DO block"
    );
    assert.ok(
      executorContent.includes("RAISE EXCEPTION 'BLOCKED: UNEXPECTED_MIGRATION_HISTORY: 20261010155728 detected in ledger';"),
      "Phase 2 executor must revalidate absence of 20261010155728 inside transaction"
    );
    assert.ok(
      executorContent.includes("RAISE EXCEPTION 'BLOCKED: FUNCTION_DRIFT: guard_legacy_offer owner or secdef drifted';") &&
      executorContent.includes("RAISE EXCEPTION 'BLOCKED: FUNCTION_DRIFT: write_dish_v2 owner or secdef drifted';") &&
      executorContent.includes("RAISE EXCEPTION 'BLOCKED: FUNCTION_DRIFT: offer_state owner or secdef drifted';",
      "Phase 2 executor must revalidate canonical function baselines inside transaction"
    ));
    assert.ok(
      executorContent.includes("BLOCKED: SCHEMA_DRIFT: anon has USAGE on cr_order_private") &&
      executorContent.includes("BLOCKED: SCHEMA_DRIFT: authenticated has CREATE on cr_order_private") &&
      executorContent.includes("BLOCKED: SCHEMA_DRIFT: authenticated missing USAGE on cr_order_private") &&
      executorContent.includes("BLOCKED: FUNCTION_DRIFT: offer_state has explicit anon/authenticated ACL grants"),
      "Phase 2 executor must revalidate schema USAGE/CREATE policy and lack of explicit ACL grants inside transaction"
    );
  });

  await t.test("postcheck revalidates offer_state, schema permissions, and lifecycle functions", () => {
    const scriptContent = fs.readFileSync(scriptPath, "utf8");
    assert.ok(
      scriptContent.includes('POST_OFFER_ANON') &&
      scriptContent.includes('POST_OFFER_AUTH') &&
      scriptContent.includes('POST_OFFER_SERVICE'),
      "Phase 3 must extract offer_state post-migration execution privileges"
    );
    assert.ok(
      scriptContent.includes('permisos de offer_state no fueron endurecidos'),
      "Phase 3 must abort if offer_state permissions were not hardened"
    );
    assert.ok(
      scriptContent.includes('POST_SCHEMA_ANON_USAGE') &&
      scriptContent.includes('POST_SCHEMA_AUTH_USAGE') &&
      scriptContent.includes('POST_SCHEMA_AUTH_CREATE'),
      "Phase 3 must verify schema permissions after migration"
    );
    assert.ok(
      scriptContent.includes('POST_LIFECYCLE_V2_AUTH') &&
      scriptContent.includes('POST_LIFECYCLE_CTX_AUTH') &&
      scriptContent.includes('POST_CUSTOM_BATCH_AUTH'),
      "Phase 3 must verify lifecycle/kitchen authenticated execution after migration"
    );
  });

  await t.test("buildUnifiedTransactionSql produces atomic transaction and detects atomicity violations", () => {
    const sql = buildUnifiedTransactionSql(migrationPath, "20261024175900");
    assert.ok(sql.startsWith("\nBEGIN;\n"), "Must start with BEGIN;");
    assert.ok(sql.trim().endsWith("COMMIT;"), "Must end with COMMIT;");
    assert.ok(sql.includes("INSERT INTO supabase_migrations.schema_migrations (version)"), "Must record migration in ledger");
    assert.ok(sql.includes("VALUES ('20261024175900')"), "Must insert version 20261024175900");
    assert.ok(sql.includes("-- [UNIFIED WRAPPER: Original BEGIN replaced]"), "Original BEGIN must be replaced");
    assert.ok(sql.includes("-- [UNIFIED WRAPPER: Original COMMIT replaced]"), "Original COMMIT must be replaced");
  });

  await t.test("validateExecutorSafetyGuard enforces direct entry authorization and destination checks", () => {
    // 1. Missing token
    assert.throws(
      () =>
        validateExecutorSafetyGuard({
          rootDir: ROOT_DIR,
          migrationFileRel: "supabase/migrations/20261024175900_cr_order_writer_identity_bridge_hardening.sql",
          migrationVersion: "20261024175900",
          host: "127.0.0.1",
          port: "54322",
          user: "postgres",
          db: "postgres",
          confirmationToken: "",
          env: { LAB_ISOLATED_PG17: "true" },
        }),
      /BLOCKED: DIRECT_EXECUTOR_UNAUTHORIZED/
    );

    // 2. Demo project rejection
    assert.throws(
      () =>
        validateExecutorSafetyGuard({
          rootDir: ROOT_DIR,
          migrationFileRel: "supabase/migrations/20261024175900_cr_order_writer_identity_bridge_hardening.sql",
          migrationVersion: "20261024175900",
          host: "db.djangucecsphnejplvic.supabase.co",
          port: "5432",
          user: "postgres",
          db: "postgres",
          confirmationToken: REQUIRED_CONFIRMATION_TOKEN,
          env: { LAB_ISOLATED_PG17: "false" },
        }),
      /FATAL SECURITY_VIOLATION: EatClean identity bridge hardening cannot connect to Demo project/
    );

    // 3. Production TLS requirement
    assert.throws(
      () =>
        validateExecutorSafetyGuard({
          rootDir: ROOT_DIR,
          migrationFileRel: "supabase/migrations/20261024175900_cr_order_writer_identity_bridge_hardening.sql",
          migrationVersion: "20261024175900",
          host: "aws-0-eu-central-1.pooler.supabase.com",
          port: "5432",
          user: "postgres.nhirlpkuvonggctdzzad",
          db: "postgres",
          confirmationToken: REQUIRED_CONFIRMATION_TOKEN,
          env: { LAB_ISOLATED_PG17: "false", PGSSLMODE: "disable" },
        }),
      /FATAL SECURITY_VIOLATION: En producción se exige PGSSLMODE='verify-full'/
    );

    // 4. Lab mode valid invocation succeeds
    const res = validateExecutorSafetyGuard({
      rootDir: ROOT_DIR,
      migrationFileRel: "supabase/migrations/20261024175900_cr_order_writer_identity_bridge_hardening.sql",
      migrationVersion: "20261024175900",
      host: "127.0.0.1",
      port: "54322",
      user: "postgres",
      db: "postgres",
      confirmationToken: REQUIRED_CONFIRMATION_TOKEN,
      env: { LAB_ISOLATED_PG17: "true", PGPORT: "54322" },
    });
    assert.equal(res.isLab, true);
    assert.ok(res.filePath.endsWith("20261024175900_cr_order_writer_identity_bridge_hardening.sql"));
  });
});
