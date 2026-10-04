import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { context, policy, api, prepare } from "./release-plan.mjs";
import {
  assertContext,
  assertApproval,
  assertEnvironment,
  assertConfig,
  assertManifest,
  uploadRecord,
  deployRecord,
  assertTraffic,
  demand,
  hash,
  preparationEligible,
} from "./release-contract.mjs";
import { assertActivationManifest } from "./release-activation.mjs";
const ctx = context();
const report = {
  schema: 1,
  repository: ctx.repository,
  sourceSha: ctx.sha,
  runId: ctx.runId,
  attempt: ctx.attempt,
  state: "NOT_DEPLOYED",
  mutationStarted: false,
  humanUX: "HUMAN PRODUCTION VERIFICATION REQUIRED",
  smoke: "NOT TESTED",
};
const save = () =>
  fs.writeFileSync("artifacts/release-report.json", JSON.stringify(report, null, 2));
fs.mkdirSync("artifacts", { recursive: true });
save();
if (process.argv[2] === "initialize") {
  assertContext(ctx, policy);
  process.exit(0);
}
try {
  assertContext(ctx, policy);
  assertEnvironment(api(`environments/${policy.environment}`), policy);
  assertApproval(api(`actions/runs/${ctx.runId}/approvals`), policy);
  const configBytes = fs.readFileSync("instances/yourmeal-eatclean/wrangler.prod.json");
  const config = JSON.parse(configBytes);
  assertConfig(config, policy);
  const manifest = JSON.parse(fs.readFileSync("artifacts/release-manifest.json"));
  assertManifest(manifest, ctx, process.env.EXPECTED_DIGEST, process.env.EXPECTED_CONFIG_DIGEST);
  demand(hash(configBytes) === manifest.configSha256, "Config digest mismatch");
  demand(
    /^[1-9][0-9]*$/.test(process.env.EXPECTED_ARTIFACT_ID ?? ""),
    "Invalid approved artifact ID",
  );
  const artifact = api(`actions/artifacts/${process.env.EXPECTED_ARTIFACT_ID}`);
  demand(
    !artifact.expired &&
      artifact.name === `production-worker-artifact-${ctx.runId}-${ctx.attempt}` &&
      String(artifact.workflow_run?.id) === ctx.runId &&
      artifact.workflow_run?.head_sha === ctx.sha,
    "Artifact belongs to another source/run or expired",
  );
  const fresh = prepare(ctx, true);
  assertActivationManifest(manifest, fresh);
  if (["SUPERSEDED", "NON_DEPLOYABLE"].includes(fresh.decision)) {
    report.state = fresh.decision;
    save();
    fs.appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## Gate 7\n${fresh.decision}: no upload or deployment performed.\n`,
    );
  } else {
    demand(preparationEligible(fresh.decision), "Publication eligibility changed");
    // No secret values are logged or written to artifacts.
    demand(
      process.env.CLOUDFLARE_API_TOKEN &&
        /^[a-f0-9]{32}$/i.test(process.env.CLOUDFLARE_ACCOUNT_ID ?? ""),
      "Missing production credentials",
    );
    Object.assign(report, {
      tarSha256: manifest.tarSha256,
      configSha256: manifest.configSha256,
      artifactId: process.env.EXPECTED_ARTIFACT_ID,
      baseline: fresh.baseline,
      ...(fresh.activation ? { activation: fresh.activation } : {}),
    });
    report.state = "PUBLICATION_UNKNOWN";
    report.mutationStarted = true;
    save();
    const uploadPath = `${process.env.RUNNER_TEMP}/gate7-upload-${ctx.runId}.ndjson`;
    const deployPath = `${process.env.RUNNER_TEMP}/gate7-deploy-${ctx.runId}.ndjson`;
    // Refuse replay via appended output files; this run/attempt must be unique.
    for (const p of [uploadPath, deployPath])
      demand(!fs.existsSync(p), "Existing version output: replay blocked");
    const invoke = (args, output) =>
      execFileSync(
        "npx",
        [
          "--yes",
          "wrangler@4.86.0",
          "versions",
          ...args,
          "--config",
          "instances/yourmeal-eatclean/wrangler.prod.json",
        ],
        { stdio: "inherit", env: { ...process.env, WRANGLER_OUTPUT_FILE_PATH: output } },
      );
    invoke(["upload", "--no-bundle"], uploadPath);
    report.versionId = uploadRecord(fs.readFileSync(uploadPath, "utf8"), policy.worker).version_id;
    report.state = "VERSION_UPLOADED";
    save();
    if (fresh.activation)
      demand(
        api("git/ref/heads/main").object.sha === ctx.sha,
        "Initial activation main advanced during upload; deployment blocked",
      );
    report.state = "DEPLOYMENT_UNKNOWN";
    save();
    invoke(["deploy", `${report.versionId}@100%`, "--yes"], deployPath);
    report.deploymentId = deployRecord(
      fs.readFileSync(deployPath, "utf8"),
      policy.worker,
    ).deployment_id;
    save();
    const cfBase = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/workers/scripts/${policy.worker}/deployments`;
    const response = await fetch(`${cfBase}/${report.deploymentId}`, {
      headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` },
      redirect: "error",
      signal: AbortSignal.timeout(20000),
    });
    demand(response.ok, "Cloudflare deployment read-back unavailable");
    const body = await response.json();
    demand(body.success === true, "Cloudflare read-back rejected");
    assertTraffic(body.result, report.deploymentId, report.versionId);
    const latestResponse = await fetch(cfBase, {
      headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` },
      redirect: "error",
      signal: AbortSignal.timeout(20000),
    });
    demand(latestResponse.ok, "Current deployment read-back unavailable");
    const latestBody = await latestResponse.json();
    demand(latestBody.success === true, "Current deployment read-back rejected");
    assertTraffic(latestBody.result?.deployments?.[0], report.deploymentId, report.versionId);
    // Persist DEPLOYED before smoke. A smoke failure never erases a publication.
    report.state = "DEPLOYED";
    save();
    // Static hashed asset GET only: no auth/bootstrap JS, cookies, RPC or business writes.
    const assets = fs
      .readdirSync(".output/public/assets")
      .filter((name) => /^[a-zA-Z0-9_-]+\.(?:js|css)$/.test(name))
      .sort();
    demand(assets.length > 0, "No deterministic public asset to verify");
    const asset = assets[0];
    const url = `${policy.origin}/assets/${asset}`;
    const smoke = await fetch(url, {
      method: "GET",
      redirect: "error",
      signal: AbortSignal.timeout(20000),
    });
    const actual = Buffer.from(await smoke.arrayBuffer());
    report.smoke =
      smoke.status === 200 &&
      hash(actual) === hash(fs.readFileSync(`.output/public/assets/${asset}`))
        ? "PASS"
        : "FAIL — INTRODUCED OR PRODUCTION DRIFT";
    report.smokeUrl = url;
    save();
    demand(
      report.smoke === "PASS",
      "Static asset smoke failed after deployment; no automatic rollback",
    );
    report.currentMainAfter = api("git/ref/heads/main").object.sha;
    report.behindMain = report.currentMainAfter !== ctx.sha;
    save();
    fs.appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## DEPLOYED\nSource: \`${ctx.sha}\`\nVersion: \`${report.versionId}\`\nArtifact: ${report.artifactId}\nDigest: \`${report.tarSha256}\`\nSmoke: ${report.smoke}\nBehind main: ${report.behindMain}\nHUMAN PRODUCTION VERIFICATION REQUIRED\n`,
    );
  }
} catch (error) {
  report.failure = error.message;
  save();
  fs.appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `## Gate 7 failure\nState: ${report.state}\nMutation started: ${report.mutationStarted}\n${report.failure}\nNo automatic rollback.\n`,
  );
  console.error(error.message);
  process.exitCode = 1;
}
