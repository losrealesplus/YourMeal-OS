/** Local development only. Does not deploy or launch a cloud service. */
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { createHmac } from "node:crypto";
const root = process.cwd();
const allowed = new Set([
  "YOURMEAL_RUNTIME_ENV",
  "TENANT_SLUG",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "P34_LOCAL_JWT_SECRET",
]);
const entries = {};
for (const line of (
  await readFile(
    resolve(root, "instances/yourmeal-eatclean/staging.local.runtime.env.example"),
    "utf8",
  )
).split("\n")) {
  if (!line.trim() || line.startsWith("#")) continue;
  const at = line.indexOf("=");
  const key = line.slice(0, at),
    value = line.slice(at + 1);
  if (at < 1 || !allowed.has(key) || key in entries)
    throw new Error("Invalid synthetic configuration");
  entries[key] = value;
}
const secret = "p34-local-synthetic-signing-secret-not-for-production-2026";
const jwt = (role) => {
  const enc = (x) => Buffer.from(JSON.stringify(x)).toString("base64url");
  const msg = enc({ alg: "HS256", typ: "JWT" }) + "." + enc({ iss: "p34-local-synthetic", role });
  return msg + "." + createHmac("sha256", secret).update(msg).digest("base64url");
};
if (
  entries.YOURMEAL_RUNTIME_ENV !== "staging_local" ||
  entries.TENANT_SLUG !== "eatclean-staging" ||
  entries.SUPABASE_URL !== "http://127.0.0.1:54331" ||
  entries.SUPABASE_PUBLISHABLE_KEY !== jwt("anon") ||
  entries.SUPABASE_SERVICE_ROLE_KEY !== jwt("service_role") ||
  entries.P34_LOCAL_JWT_SECRET !== secret
)
  throw new Error("Mixed staging configuration rejected");
const env = { PATH: process.env.PATH, HOME: process.env.HOME, ...entries, NODE_ENV: "development" };
if (process.argv.length !== 3 || !["--plan", "--serve"].includes(process.argv[2]))
  throw new Error("Use --plan or --serve");
if (process.argv[2] === "--plan") {
  console.log(
    JSON.stringify({
      status: "LOCAL_STAGING_PLAN_PASS",
      application: "http://127.0.0.1:8080",
      backend: entries.SUPABASE_URL,
      credentialKind: "synthetic-fixed",
      envFilesAllowed: false,
      cloudDeployment: false,
      authApiRequired: "local GoTrue/PostgREST-compatible gateway; not provisioned by this command",
    }),
  );
} else {
  const child = spawn(resolve(root, "node_modules/.bin/vite"), ["--mode", "staging-local"], {
    cwd: root,
    env,
    stdio: "inherit",
  });
  process.once("SIGINT", () => child.kill("SIGINT"));
  process.once("SIGTERM", () => child.kill("SIGTERM"));
  child.on("exit", (code) => {
    process.exitCode = code ?? 1;
  });
}
