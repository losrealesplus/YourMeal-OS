import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { prepareOwnerGrant, verifyGrant, runBootstrap } from "./migration-bootstrap-ci.mjs";
test("refuses invocation outside explicit CI", () =>
  assert.throws(() => runBootstrap({}), /CI_ONLY_EXECUTOR/));
test("refuses an arbitrary project/run identifier", () =>
  assert.throws(
    () => runBootstrap({ GITHUB_ACTIONS: "true", GITHUB_RUN_ID: "project-token" }),
    /CI_ONLY_EXECUTOR/,
  ));
test("owner authority grants only exact schema USAGE", () => {
  assert.match(prepareOwnerGrant, /GRANT USAGE ON SCHEMA auth TO cr_order_writer/);
  assert.doesNotMatch(
    prepareOwnerGrant,
    /WITH GRANT OPTION|ALTER SCHEMA|SUPERUSER;|GRANT .* TO postgres/,
  );
  assert.match(prepareOwnerGrant, /current_user <> 'supabase_admin'/);
  assert.match(prepareOwnerGrant, /CI_ORDER_WRITER_UNSAFE/);
});
test("preserves effective grant and absence of Auth row privileges", () => {
  assert.match(prepareOwnerGrant, /RELEASE_AUTH_SCHEMA_GRANT_NOT_EFFECTIVE/);
  assert.match(verifyGrant, /has_table_privilege\('cr_order_writer','auth.users','SELECT'\)/);
  assert.match(verifyGrant, /USAGE WITH GRANT OPTION/);
});
test("execution uses only exact local commands, no prod URLs or links", () => {
  const source = readFileSync(new URL("./migration-bootstrap-ci.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /--linked|--db-url|service_role.*KEY|DATABASE_URL/);
  assert.match(source, /\["migration", "up", "--local"/);
  assert.match(source, /\["stop", "--project-id", project, "--no-backup"/);
});
