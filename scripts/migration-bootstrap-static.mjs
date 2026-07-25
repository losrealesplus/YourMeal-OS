#!/usr/bin/env node
/**
 * FOPEBA · Migration Bootstrap — static preflight
 *
 * Simulates applying migrations in filename order and detects
 * CREATE POLICY collisions that would produce SQLSTATE 42710 on a
 * clean database (empty project / supabase db reset).
 *
 * Does not replace Docker bootstrap (`supabase db start` / `db reset`);
 * it catches the RLS redefine-without-teardown class early and offline.
 *
 * Exit: 0 PASS · 1 FAIL
 *
 * Usage:
 *   node scripts/migration-bootstrap-static.mjs
 *   npm run test:migration-bootstrap:static
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../supabase/migrations",
);

/** @type {RegExp} */
const DROP_RE =
  /DROP\s+POLICY\s+(?:IF\s+EXISTS\s+)?(?:"([^"]+)"|([a-zA-Z_][\w$]*))\s+ON\s+(?:public\.)?(?:"([^"]+)"|([a-zA-Z_][\w$]*))/gi;

/** @type {RegExp} */
const CREATE_RE =
  /CREATE\s+POLICY\s+(?:"([^"]+)"|([a-zA-Z_][\w$]*))\s+ON\s+(?:public\.)?(?:"([^"]+)"|([a-zA-Z_][\w$]*))/gi;

function policyKey(table, name) {
  return `${table.toLowerCase()}::${name}`;
}

function listMigrations(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

function scanFile(filePath, live, failures) {
  const sql = fs.readFileSync(filePath, "utf8");
  const file = path.basename(filePath);

  // Strip block comments so historical notes don't fake statements
  const stripped = sql.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--[^\n]*/g, "");

  /** @type {{ kind: "drop" | "create"; name: string; table: string; index: number }[]} */
  const events = [];

  for (const m of stripped.matchAll(DROP_RE)) {
    events.push({
      kind: "drop",
      name: m[1] ?? m[2],
      table: m[3] ?? m[4],
      index: m.index ?? 0,
    });
  }
  for (const m of stripped.matchAll(CREATE_RE)) {
    events.push({
      kind: "create",
      name: m[1] ?? m[2],
      table: m[3] ?? m[4],
      index: m.index ?? 0,
    });
  }

  events.sort((a, b) => a.index - b.index);

  for (const ev of events) {
    const key = policyKey(ev.table, ev.name);
    if (ev.kind === "drop") {
      live.delete(key);
      continue;
    }
    if (live.has(key)) {
      failures.push({
        file,
        policy: ev.name,
        table: ev.table,
        firstDefinedIn: live.get(key),
      });
    } else {
      live.set(key, file);
    }
  }
}

function main() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`FAIL · migrations dir missing: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  const files = listMigrations(MIGRATIONS_DIR);
  /** @type {Map<string, string>} */
  const live = new Map();
  /** @type {{ file: string; policy: string; table: string; firstDefinedIn: string }[]} */
  const failures = [];

  console.log("FOPEBA · Migration Bootstrap — static policy preflight\n");
  console.log(`Migrations: ${files.length}`);

  for (const f of files) {
    scanFile(path.join(MIGRATIONS_DIR, f), live, failures);
  }

  if (failures.length > 0) {
    console.error("\nFAIL · CREATE POLICY without teardown of an earlier definition:\n");
    for (const fail of failures) {
      console.error(
        `  · ${fail.file}\n` +
          `    CREATE POLICY "${fail.policy}" ON ${fail.table}\n` +
          `    already created in ${fail.firstDefinedIn}\n` +
          `    → add DROP POLICY IF EXISTS "${fail.policy}" ON ${fail.table} before CREATE\n`,
      );
    }
    console.error(
      "Clean bootstrap (empty project / supabase db reset) would hit SQLSTATE 42710.\n" +
        "See docs/10-validation/MIGRATION_BOOTSTRAP_VALIDATION.md",
    );
    process.exit(1);
  }

  console.log(`Live policies after full chain: ${live.size}`);
  console.log("\nPASS · no CREATE POLICY collisions across migrations");
  process.exit(0);
}

main();
