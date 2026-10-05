import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join } from "node:path";
import { randomUUID } from "node:crypto";

// Always creates an isolated local database (Docker default or temporary native cluster).
// No database URL, remote host, credentials or provider connection inputs.
test("Offer Pricing M1: isolated PostgreSQL migration, legacy NULL and tenant RLS preservation", async () => {
  // Optional local validation runtime, never a database URL/host/credential input.
  const nativeBin = process.env.OFFER_TEST_POSTGRES_BIN;
  if (nativeBin)
    assert.ok(isAbsolute(nativeBin), "local PostgreSQL executable directory must be absolute");
  const localDir = nativeBin ? mkdtempSync(join(tmpdir(), "offer-pricing-pg-")) : null;
  const dataDir = localDir ? join(localDir, "data") : null;
  let localStarted = false;
  const native = (command, args, options = {}) =>
    execFileSync(join(nativeBin, command), args, { encoding: "utf8", timeout: 60000, ...options });
  const container = `offer-pricing-fixture-${randomUUID().slice(0, 8)}`;
  const migrationNames = readdirSync("supabase/migrations").filter((n) =>
    n.endsWith("_offer_pricing_nullable_foundation.sql"),
  );
  assert.equal(migrationNames.length, 1);
  const migration = readFileSync(`supabase/migrations/${migrationNames[0]}`, "utf8");
  const fixture = readFileSync("supabase/tests/offer-pricing/fixture.sql", "utf8");
  const assertions = readFileSync("supabase/tests/offer-pricing/assertions.sql", "utf8");
  const docker = (args, options = {}) =>
    execFileSync("docker", args, { encoding: "utf8", timeout: 60000, ...options });
  const sql = (db, input) =>
    nativeBin
      ? execFileSync(
          "psql",
          [
            "-X",
            "-h",
            localDir,
            "-p",
            "55479",
            "-U",
            "offer_fixture_admin",
            "-d",
            db,
            "-v",
            "ON_ERROR_STOP=1",
            "-q",
          ],
          { encoding: "utf8", input, timeout: 60000 },
        )
      : docker(
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
    if (nativeBin) {
      native("initdb", ["-D", dataDir, "--auth=trust", "--username=offer_fixture_admin"]);
      native("pg_ctl", [
        "-D",
        dataDir,
        "-l",
        join(localDir, "postgres.log"),
        "-o",
        `-k ${localDir} -p 55479 -c listen_addresses=''`,
        "start",
      ]);
      localStarted = true;
      sql("postgres", "CREATE ROLE authenticated;");
    } else {
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
    }
    sql("postgres", "CREATE DATABASE offer_pricing_fixture;");
    sql("offer_pricing_fixture", fixture);
    sql("offer_pricing_fixture", migration);
    sql("offer_pricing_fixture", assertions);
  } finally {
    if (nativeBin) {
      if (localStarted) native("pg_ctl", ["-D", dataDir, "-m", "fast", "stop"]);
      rmSync(localDir, { recursive: true, force: true });
    } else docker(["rm", "--force", "--volumes", container], { stdio: "ignore" });
  }
});
