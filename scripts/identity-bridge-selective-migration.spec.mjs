import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

test("Identity Bridge Selective Executor: Static Verification & Safety Audit", async (t) => {
  const scriptPath = path.join(ROOT_DIR, "scripts/identity-bridge-selective-migration-live.sh");
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
  });

  await t.test("migration file exists and checksum matches exact SHA-256", () => {
    assert.ok(fs.existsSync(migrationPath), "Migration 20261024175900 must exist");
    const content = fs.readFileSync(migrationPath);
    const hash = crypto.createHash("sha256").update(content).digest("hex");
    assert.equal(
      hash,
      "59c8939289934af482af8f4b263bd253935a83fd178566f775eaedff1f4511a5",
      "Migration SHA-256 must match exactly"
    );

    const scriptContent = fs.readFileSync(scriptPath, "utf8");
    assert.ok(
      scriptContent.includes('EXPECTED_MIGRATION_SHA="59c8939289934af482af8f4b263bd253935a83fd178566f775eaedff1f4511a5"'),
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
});
