import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { context, policy } from "./release-plan.mjs";
import { assertContext, assertConfig, hash, assertManifest, demand } from "./release-contract.mjs";
const ctx = context();
assertContext(ctx, policy);
const configPath = "instances/yourmeal-eatclean/wrangler.prod.json";
const configBytes = fs.readFileSync(configPath);
assertConfig(JSON.parse(configBytes), policy);
const configSha256 = hash(configBytes);
if (process.argv[2] === "package") {
  execFileSync("tar", ["-czf", "artifacts/worker-dist.tar.gz", ".output/"], {
    env: { ...process.env, COPYFILE_DISABLE: "1" },
  });
  const tarSha256 = hash(fs.readFileSync("artifacts/worker-dist.tar.gz"));
  const plan = JSON.parse(fs.readFileSync("artifacts/release-plan.json"));
  demand(
    plan.sourceSha === ctx.sha &&
      plan.runId === ctx.runId &&
      plan.attempt === ctx.attempt &&
      plan.repository === ctx.repository &&
      plan.decision === "DEPLOYABLE",
    "Unexpected release plan",
  );
  const manifest = {
    schema: 1,
    ...ctx,
    sourceSha: ctx.sha,
    configSha256,
    tarSha256,
    plan,
    wrangler: "4.86.0",
    node: "20",
  };
  fs.writeFileSync("artifacts/release-manifest.json", JSON.stringify(manifest, null, 2));
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `digest=${tarSha256}\nconfig_digest=${configSha256}\n`,
  );
} else if (process.argv[2] === "verify") {
  const manifest = JSON.parse(fs.readFileSync("artifacts/release-manifest.json"));
  assertManifest(manifest, ctx, process.env.EXPECTED_DIGEST, process.env.EXPECTED_CONFIG_DIGEST);
  demand(
    hash(fs.readFileSync("artifacts/worker-dist.tar.gz")) === manifest.tarSha256 &&
      configSha256 === manifest.configSha256,
    "Artifact/config bytes changed after approval",
  );
  execFileSync("python3", [
    "scripts/governance/verify-release-tar.py",
    "artifacts/worker-dist.tar.gz",
    ".",
  ]);
} else throw new Error("Invalid release artifact command");
