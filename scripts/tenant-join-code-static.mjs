#!/usr/bin/env node
/**
 * Phase 2.1 — static contract for tenant_join_code (association credential).
 *
 * Asserts the migration:
 *   - adds tenants.join_code (not companies.company_code)
 *   - exposes generate_tenant_join_code + resolve_tenant_join_code
 *   - SECURITY DEFINER + search_path = public
 *   - revokes anon execute
 *   - does NOT insert tenant_members / user_roles / customers
 *   - does NOT alter companies.company_code semantics
 *   - does NOT open companies SELECT to customers
 *
 * Exit: 0 PASS · 1 FAIL
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIGRATIONS_DIR = path.join(ROOT, "supabase/migrations");
const MIGRATION = "20260809181400_tenant_join_code.sql";
const COMPANY_MODEL = "20260723183000_b2b_b2c_customer_model.sql";

function read(file) {
  return fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

export function assertTenantJoinCodeMigrationContract() {
  const sql = read(MIGRATION);
  const stripped = sql
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/--[^\n]*/g, "");

  assert(
    /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+join_code\s+text/i.test(stripped),
    "migration must add tenants.join_code",
  );
  assert(
    /CREATE\s+UNIQUE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+tenants_join_code_uidx/i.test(
      stripped,
    ),
    "migration must create global unique index tenants_join_code_uidx",
  );
  assert(
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.generate_tenant_join_code/i.test(
      stripped,
    ),
    "missing generate_tenant_join_code",
  );
  assert(
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.resolve_tenant_join_code/i.test(
      stripped,
    ),
    "missing resolve_tenant_join_code",
  );
  assert(
    /SECURITY\s+DEFINER/i.test(stripped) &&
      /SET\s+search_path\s*=\s*public/i.test(stripped),
    "RPCs must be SECURITY DEFINER with search_path = public",
  );
  assert(
    /REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.resolve_tenant_join_code\(text\)\s+FROM\s+anon/i.test(
      stripped,
    ),
    "resolve must revoke anon",
  );
  assert(
    /REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.generate_tenant_join_code\(uuid\)\s+FROM\s+anon/i.test(
      stripped,
    ),
    "generate must revoke anon",
  );
  assert(
    /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.resolve_tenant_join_code\(text\)\s+TO\s+authenticated/i.test(
      stripped,
    ),
    "resolve must grant authenticated",
  );

  // No membership / role / customer creation in Phase 2.1
  assert(
    !/INSERT\s+INTO\s+public\.tenant_members/i.test(stripped),
    "Phase 2.1 must not insert tenant_members",
  );
  assert(
    !/INSERT\s+INTO\s+public\.user_roles/i.test(stripped),
    "Phase 2.1 must not insert user_roles",
  );
  assert(
    !/INSERT\s+INTO\s+public\.customers/i.test(stripped),
    "Phase 2.1 must not insert customers",
  );
  assert(
    !/ensure_individual_customer/i.test(stripped),
    "Phase 2.1 must not touch ensure_individual_customer",
  );

  // Must not widen companies SELECT / mutate company_code
  assert(
    !/CREATE\s+POLICY[\s\S]*companies/i.test(stripped),
    "must not create companies policies",
  );
  assert(
    !/ALTER\s+TABLE\s+public\.companies/i.test(stripped),
    "must not alter companies table",
  );
  assert(
    !/company_code/i.test(stripped) ||
      /NOT\s+companies\.company_code|DISTINCT from companies\.company_code|NOT companies\.company_code/i.test(
        sql,
      ),
    "company_code may only appear as negative semantic boundary comments",
  );

  // Prefix TJ- present; EC- rejected in resolver
  assert(/'TJ-'/.test(stripped), "generator must use TJ- prefix");
  assert(
    /LIKE\s+'EC-%'|EC-%/i.test(stripped),
    "resolver must explicitly reject EC- company-code shapes",
  );

  // Existing company code infrastructure still present and untouched by this file
  const companySql = read(COMPANY_MODEL);
  assert(
    /company_code/i.test(companySql) &&
      /generate_company_code/i.test(companySql),
    "baseline company_code infrastructure must remain in historical migrations",
  );
}

function main() {
  assertTenantJoinCodeMigrationContract();
  console.log(`PASS · Phase 2.1 tenant_join_code static · ${MIGRATION}`);
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  try {
    main();
  } catch (err) {
    console.error(`FAIL · ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
