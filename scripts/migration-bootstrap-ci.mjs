/** CI-only empty database bootstrap. No remote connection strings or project links. */
import { mkdtempSync, mkdirSync, readdirSync, copyFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

export const prepareOwnerGrant = `
BEGIN;
DO $$ BEGIN
 IF current_user <> 'supabase_admin' OR session_user <> 'supabase_admin'
 OR (SELECT nspowner FROM pg_namespace WHERE nspname='auth') <> 'supabase_admin'::regrole
 THEN RAISE EXCEPTION 'CI_AUTH_SCHEMA_OWNER_UNEXPECTED'; END IF;
END $$;
-- Role creation retains the normal migration creator and its existing semantics.
SET LOCAL ROLE postgres;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='cr_order_writer') THEN
  CREATE ROLE cr_order_writer NOLOGIN NOINHERIT NOBYPASSRLS;
 END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='cr_order_writer' AND (rolcanlogin OR rolinherit OR rolsuper OR rolbypassrls))
 OR pg_has_role('anon','cr_order_writer','MEMBER')
 OR pg_has_role('authenticated','cr_order_writer','MEMBER')
 OR pg_has_role('service_role','cr_order_writer','MEMBER')
 THEN RAISE EXCEPTION 'CI_ORDER_WRITER_UNSAFE'; END IF;
END $$;
RESET ROLE;
GRANT USAGE ON SCHEMA auth TO cr_order_writer;
DO $$ BEGIN
 IF NOT has_schema_privilege('cr_order_writer','auth','USAGE')
 THEN RAISE EXCEPTION 'RELEASE_AUTH_SCHEMA_GRANT_NOT_EFFECTIVE'; END IF;
 IF has_table_privilege('cr_order_writer','auth.users','SELECT')
 THEN RAISE EXCEPTION 'CI_AUTH_ROW_ACCESS_UNEXPECTED'; END IF;
END $$;
SELECT current_user AS grant_executor, session_user,
 (SELECT nspowner::regrole FROM pg_namespace WHERE nspname='auth') AS auth_owner;
COMMIT;
`;
export const verifyGrant = `
DO $$ BEGIN
 IF (SELECT nspowner FROM pg_namespace WHERE nspname='auth') <> 'supabase_admin'::regrole
 OR NOT has_schema_privilege('cr_order_writer','auth','USAGE')
 OR has_schema_privilege('postgres','auth','USAGE WITH GRANT OPTION')
 OR has_table_privilege('cr_order_writer','auth.users','SELECT')
 OR EXISTS(SELECT 1 FROM pg_roles WHERE rolname='cr_order_writer' AND (rolcanlogin OR rolinherit OR rolsuper OR rolbypassrls))
 THEN RAISE EXCEPTION 'CI_AUTH_GRANT_FINAL_STATE_UNSAFE'; END IF;
END $$;
SELECT 'CI_OWNER_PREREQUISITE_AND_MIGRATION_VERIFIED';
`;

export function runBootstrap(env = process.env) {
  if (env.GITHUB_ACTIONS !== "true" || !/^\d+$/.test(env.GITHUB_RUN_ID ?? "")) {
    throw new Error("CI_ONLY_EXECUTOR");
  }
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const project = `yourmeal-migration-ci-${env.GITHUB_RUN_ID}`;
  const container = `supabase_db_${project}`;
  const work = mkdtempSync(path.join(tmpdir(), "yourmeal-migration-ci-"));
  const migrations = path.join(work, "supabase", "migrations");
  mkdirSync(migrations, { recursive: true });
  // Never load the repository's linked project, .env, seed or service credentials.
  writeFileSync(
    path.join(work, "supabase", "config.toml"),
    `project_id = "${project}"\n[db]\nport = 54342\nmajor_version = 17\n[db.seed]\nenabled = false\n`,
  );
  const run = (cmd, args, input) => {
    const r = spawnSync(cmd, args, {
      cwd: root,
      env,
      input,
      encoding: "utf8",
      stdio: input === undefined ? "inherit" : ["pipe", "pipe", "pipe"],
      timeout: 600000,
    });
    if (input !== undefined) {
      if (r.stdout) process.stdout.write(r.stdout);
      if (r.status && r.stderr) process.stderr.write(r.stderr);
    }
    if (r.error || r.status !== 0) throw new Error(`CI_COMMAND_FAILED:${cmd}`);
  };
  const ownerSql = (sql) =>
    run(
      "docker",
      [
        "exec",
        "-i",
        container,
        "psql",
        "-X",
        "-U",
        "supabase_admin",
        "-d",
        "postgres",
        "-v",
        "ON_ERROR_STOP=1",
      ],
      sql,
    );
  let cleanupError;
  try {
    for (const phase of ["start", "reset"]) {
      for (const f of readdirSync(migrations)) rmSync(path.join(migrations, f));
      run(
        "supabase",
        phase === "start"
          ? ["db", "start", "--workdir", work]
          : ["db", "reset", "--local", "--no-seed", "--yes", "--workdir", work],
      );
      // Owner-only operation on an exact disposable local container; no new grants
      // to postgres, no ownership transfer and no privileged application role.
      ownerSql(prepareOwnerGrant);
      for (const f of readdirSync(path.join(root, "supabase", "migrations"))) {
        if (f.endsWith(".sql"))
          copyFileSync(path.join(root, "supabase", "migrations", f), path.join(migrations, f));
      }
      run("supabase", ["migration", "up", "--local", "--workdir", work]);
      ownerSql(verifyGrant);
      run("supabase", ["migration", "list", "--local", "--workdir", work]);
      console.log(`CI_BOOTSTRAP_${phase.toUpperCase()}_PASS`);
    }
  } finally {
    try {
      run("supabase", ["stop", "--project-id", project, "--no-backup", "--workdir", work]);
    } catch (e) {
      cleanupError = e;
    }
    rmSync(work, { recursive: true, force: true });
    if (cleanupError) throw cleanupError;
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  runBootstrap();
