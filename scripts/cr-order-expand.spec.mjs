import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";

// Always creates an isolated local Docker DB; no URL, credentials or provider env inputs.
test("CR-ORDER expand: actual PostgreSQL migration, ACL/RLS, tenant FKs and atomic failure", async () => {
  const container = `cr-order-fixture-${randomUUID().slice(0, 8)}`;
  const migrationNames = readdirSync("supabase/migrations").filter((n) =>
    n.endsWith("_cr_order_expand_readers_foundation.sql"),
  );
  assert.equal(migrationNames.length, 1);
  const migration = readFileSync(`supabase/migrations/${migrationNames[0]}`, "utf8");
  const fixture = readFileSync("supabase/tests/cr-order/expand-fixture.sql", "utf8");
  const assertions = readFileSync("supabase/tests/cr-order/expand-assertions.sql", "utf8");
  const docker = (args, options = {}) =>
    execFileSync("docker", args, { encoding: "utf8", timeout: 60000, ...options });
  const sql = (db, input) =>
    docker(
      [
        "exec",
        "-i",
        container,
        "psql",
        "-X",
        "-U",
        "supabase_admin",
        "-d",
        db,
        "-v",
        "ON_ERROR_STOP=1",
        "-v",
        "VERBOSITY=verbose",
        "-q",
      ],
      { input },
    );
  try {
    docker([
      "run",
      "--detach",
      "--name",
      container,
      "--network",
      "none",
      "--env",
      "POSTGRES_PASSWORD=local_fixture_only",
      "public.ecr.aws/supabase/postgres:17.6.1.155",
    ]);
    let ready = false;
    for (let i = 0; i < 40; i++) {
      try {
        docker(["exec", container, "pg_isready", "-h", "127.0.0.1", "-U", "postgres"], {
          stdio: "ignore",
        });
        ready = true;
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 250));
      }
    }
    assert.ok(ready, "local PostgreSQL ready");
    sql("postgres", "CREATE DATABASE cr_order_valid; CREATE DATABASE cr_order_invalid;");
    sql("cr_order_valid", fixture);
    sql("cr_order_valid", migration);
    sql("cr_order_valid", assertions);
    sql("cr_order_invalid", fixture);
    sql(
      "cr_order_invalid",
      "UPDATE public.order_items SET dish_id='40000000-0000-4000-8000-000000000002' WHERE id='50000000-0000-4000-8000-000000000001';",
    );
    assert.throws(
      () => sql("cr_order_invalid", migration),
      (error) => /23503/.test(String(error.stderr)),
      "existing cross-tenant data fails closed with FK violation",
    );
    const rollback = sql(
      "cr_order_invalid",
      "SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='revision'; SELECT to_regclass('public.order_write_requests') IS NULL;",
    );
    assert.match(rollback, /\b0\b/);
    assert.match(rollback, /\bt\b/);
    const originalFk = sql(
      "cr_order_invalid",
      "SELECT cardinality(conkey) FROM pg_constraint WHERE conrelid='public.order_items'::regclass AND conname='order_items_dish_id_fkey';",
    );
    assert.match(originalFk, /\b1\b/, "failed expansion retains legacy FK");
  } finally {
    docker(["rm", "--force", "--volumes", container], { stdio: "ignore" });
  }
});
