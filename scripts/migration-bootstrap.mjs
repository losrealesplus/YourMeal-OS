#!/usr/bin/env node
/**
 * FOPEBA · Migration Bootstrap — full local runner
 *
 * 1) Static policy preflight
 * 2) supabase db start (fresh DB + migrations) when needed
 * 3) supabase db reset --yes (drop + re-apply all migrations)
 *
 * Requires: Docker + supabase CLI on PATH (or npx supabase).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd, args, opts = {}) {
  console.log(`\n→ ${cmd} ${args.join(" ")}\n`);
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    shell: false,
    ...opts,
  });
  if (r.error) {
    console.error(r.error.message);
    process.exit(1);
  }
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function resolveSupabase() {
  const direct = spawnSync("supabase", ["--version"], { encoding: "utf8" });
  if (direct.status === 0) return ["supabase"];
  return ["npx", "--yes", "supabase"];
}

const sb = resolveSupabase();

run(process.execPath, [path.join(root, "scripts/migration-bootstrap-static.mjs")]);

run(sb[0], [...sb.slice(1), "db", "start"]);
run(sb[0], [...sb.slice(1), "db", "reset", "--yes"]);

console.log("\nPASS · Migration Bootstrap Validation (static + empty DB reset)");
