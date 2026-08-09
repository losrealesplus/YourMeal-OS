#!/usr/bin/env node
/**
 * MVP-01.6 — static regression for company_employees RLS recursion fix.
 *
 * Simulates CREATE/DROP POLICY across supabase/migrations (filename order)
 * and asserts the final live policy set:
 *   - recursive leftovers gone (cemp_read, cemp_write, companies_read, companies_write)
 *   - safe staff policies preserved (cemp_all, companies_*_staff)
 *   - new migration does not introduce forbidden RLS bypass patterns
 *
 * Exit: 0 PASS · 1 FAIL
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIGRATIONS_DIR = path.join(ROOT, "supabase/migrations");
const FIX_MIGRATION = "20260809172400_drop_recursive_company_employees_rls.sql";

const DROP_RE =
  /DROP\s+POLICY\s+(?:IF\s+EXISTS\s+)?(?:"([^"]+)"|([a-zA-Z_][\w$]*))\s+ON\s+(?:public\.)?(?:"([^"]+)"|([a-zA-Z_][\w$]*))/gi;
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

/** @returns {Set<string>} */
export function simulateLivePolicies(migrationsDir = MIGRATIONS_DIR) {
  const live = new Set();
  for (const file of listMigrations(migrationsDir)) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
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
      if (ev.kind === "drop") live.delete(key);
      else live.add(key);
    }
  }
  return live;
}

export function assertNoRecursiveCompanyPolicies(live) {
  const forbidden = [
    "company_employees::cemp_read",
    "company_employees::cemp_write",
    "companies::companies_read",
    "companies::companies_write",
  ];
  const present = forbidden.filter((k) => live.has(k));
  if (present.length) {
    throw new Error(`Recursive policies still live after migrations: ${present.join(", ")}`);
  }
}

export function assertSafePoliciesPreserved(live) {
  const required = [
    "company_employees::cemp_all",
    "companies::companies_select_staff",
    "companies::companies_write_staff",
    "companies::companies_insert_staff",
  ];
  const missing = required.filter((k) => !live.has(k));
  if (missing.length) {
    throw new Error(`Safe staff policies missing after migrations: ${missing.join(", ")}`);
  }
}

export function assertFixMigrationHygiene(migrationsDir = MIGRATIONS_DIR) {
  const file = path.join(migrationsDir, FIX_MIGRATION);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing fix migration: ${FIX_MIGRATION}`);
  }
  const sql = fs.readFileSync(file, "utf8");
  const forbidden = [
    /DISABLE\s+ROW\s+LEVEL\s+SECURITY/i,
    /USING\s*\(\s*true\s*\)/i,
    /WITH\s+CHECK\s*\(\s*true\s*\)/i,
    /SECURITY\s+DEFINER/i,
    /BYPASSRLS/i,
    /CREATE\s+POLICY/i,
  ];
  for (const re of forbidden) {
    if (re.test(sql)) {
      throw new Error(`Fix migration contains forbidden pattern: ${re}`);
    }
  }
  for (const name of ["cemp_read", "cemp_write", "companies_read", "companies_write"]) {
    if (!new RegExp(`DROP\\s+POLICY\\s+IF\\s+EXISTS\\s+${name}\\s+ON`, "i").test(sql)) {
      throw new Error(`Fix migration missing DROP for ${name}`);
    }
  }
}

export function runChecks() {
  assertFixMigrationHygiene();
  const live = simulateLivePolicies();
  assertNoRecursiveCompanyPolicies(live);
  assertSafePoliciesPreserved(live);
  return { ok: true, liveCount: live.size, fixMigration: FIX_MIGRATION };
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  try {
    const result = runChecks();
    console.log(
      `PASS · MVP-01.6 RLS static · livePolicies=${result.liveCount} · ${result.fixMigration}`,
    );
    process.exit(0);
  } catch (e) {
    console.error(`FAIL · ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }
}
