import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import {
  assertContext,
  assertEnvironment,
  classifyPaths,
  classifyPath,
  preparationEligible,
  hash,
  demand,
  SHA,
  UUID,
  DIGEST,
} from "./release-contract.mjs";
import { activationMode, activationPayload, authorizeActivation } from "./release-activation.mjs";
import {
  EXACT_INTERVAL,
  readExactEvidence,
  verifyExactEvidence,
  authorizeExactInterval,
  exactIntervalPayload,
  exactScopeId,
  canonical,
} from "./release-exact-interval.mjs";
import {
  verifyReconciliation,
  TRACK_B_RECONCILIATION,
  verifyA4bReconciliation,
  A4B_CLOSED_RECONCILIATION,
} from "./release-reconciliation.mjs";
import { parseReleaseJson, jsonObject, githubResponseShape } from "./release-json.mjs";

export const policy = parseReleaseJson(
  fs.readFileSync(new URL("./release-policy.json", import.meta.url)),
  "RELEASE_POLICY_INVALID",
  "release_policy",
  "json-object",
  jsonObject,
);
export function context() {
  return {
    repository: process.env.GITHUB_REPOSITORY,
    ref: process.env.GITHUB_REF,
    sha: process.env.GITHUB_SHA,
    runId: process.env.GITHUB_RUN_ID,
    attempt: process.env.GITHUB_RUN_ATTEMPT,
    event: process.env.GITHUB_EVENT_NAME,
  };
}
export function api(endpoint) {
  const shape = githubResponseShape(endpoint);
  return parseReleaseJson(
    execFileSync("gh", ["api", `repos/${policy.repository}/${endpoint}`], {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    }),
    "GITHUB_API_RESPONSE_INVALID",
    shape.source,
    shape.array ? "json-array" : "json-object",
    shape.array ? Array.isArray : jsonObject,
  );
}
export function pages(endpoint) {
  const rows = [];
  for (let page = 1; page <= 1000; page++) {
    const result = api(`${endpoint}${endpoint.includes("?") ? "&" : "?"}per_page=100&page=${page}`);
    demand(Array.isArray(result), "Invalid paginated response");
    rows.push(...result);
    if (result.length < 100) return rows;
  }
  throw new Error("Pagination limit: cannot classify a truncated history");
}
const git = (...args) =>
  execFileSync("git", args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
export function changedPaths(base, target) {
  demand(SHA.test(base) && SHA.test(target), "Invalid source/baseline");
  git("merge-base", "--is-ancestor", base, target);
  const commits = git("rev-list", "--first-parent", "--reverse", `${base}..${target}`)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  // Includes both sides of renames and special changes added then reverted.
  const paths = new Set(
    git("diff", "--name-only", "--no-renames", "-z", base, target).split("\0").filter(Boolean),
  );
  for (const commit of commits)
    for (const p of git("diff", "--name-only", "--no-renames", "-z", `${commit}^1`, commit)
      .split("\0")
      .filter(Boolean))
      paths.add(p);
  return { commits, paths: [...paths].sort() };
}
export function assertMergedCommit(prs, sha) {
  const matches = prs.filter(
    (p) =>
      p.merged_at &&
      p.base?.ref === "main" &&
      p.base.repo?.full_name === policy.repository &&
      p.merge_commit_sha === sha,
  );
  demand(
    matches.length === 1,
    "Commit must have exactly one merged main PR; direct/ambiguous push blocked",
  );
  return matches[0].number;
}
function readReport(run) {
  const name = `gate7-release-report-${run.id}-1`;
  const artifacts = api(`actions/runs/${run.id}/artifacts?per_page=100`);
  demand(artifacts.total_count <= 100, "Artifact listing truncated");
  const candidates = artifacts.artifacts.filter((a) => a.name === name);
  demand(
    candidates.length === 1 && !candidates[0].expired,
    "Publication ledger missing, expired or ambiguous: reconciliation required",
  );
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gate7-ledger-"));
  try {
    execFileSync(
      "gh",
      [
        "run",
        "download",
        String(run.id),
        "--repo",
        policy.repository,
        "--name",
        name,
        "--dir",
        dir,
      ],
      { stdio: "pipe" },
    );
    const r = parseReleaseJson(
      fs.readFileSync(path.join(dir, "release-report.json"), "utf8"),
      "RELEASE_REPORT_INVALID",
      "release_report",
      "json-object",
      jsonObject,
    );
    return r;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
export function baselineFromReport(r, run, deploymentId) {
  demand(
    r.schema === 1 &&
      r.repository === policy.repository &&
      r.sourceSha === run.head_sha &&
      r.runId === String(run.id) &&
      r.attempt === "1",
    "Ledger identity invalid",
  );
  demand(typeof r.mutationStarted === "boolean", "Unknown publication side effects");
  if (!r.mutationStarted) {
    demand(
      ["NOT_DEPLOYED", "SUPERSEDED", "NON_DEPLOYABLE"].includes(r.state) &&
        !r.versionId &&
        !r.deploymentId,
      "Contradictory no-mutation ledger",
    );
    return null;
  }
  demand(
    r.state === "DEPLOYED" &&
      UUID.test(r.versionId ?? "") &&
      UUID.test(r.deploymentId ?? "") &&
      DIGEST.test(r.tarSha256 ?? "") &&
      DIGEST.test(r.configSha256 ?? "") &&
      /^[1-9][0-9]*$/.test(r.artifactId ?? ""),
    "Partial/unknown publication: reconcile before preparing another release",
  );
  return { sha: r.sourceSha, versionId: r.versionId, deploymentId };
}
export function baseline(ctx, publishing = false) {
  for (const deployment of pages(`deployments?environment=${policy.environment}`)) {
    const statuses = pages(`deployments/${deployment.id}/statuses`);
    const latest = statuses.find((s) => s.state !== "inactive");
    if (!latest || ["queued", "waiting", "pending"].includes(latest.state)) continue;
    if (latest.state === "in_progress" && !publishing) continue;
    const prefix = `https://github.com/${policy.repository}/actions/runs/`;
    demand(latest.log_url?.startsWith(prefix), "Unattributed production deployment");
    const id = latest.log_url.slice(prefix.length).split("/")[0];
    demand(/^\d+$/.test(id), "Invalid deployment run");
    if (id === ctx.runId) continue; // Current protected job has not published yet.
    const run = api(`actions/runs/${id}`);
    demand(
      run.path?.split("@")[0] === policy.workflow &&
        run.head_sha === deployment.sha &&
        run.head_branch === "main",
      "Untrusted deployment provenance",
    );
    const workflow = git("show", `${run.head_sha}:${policy.workflow}`);
    if (workflow.includes("gate7-release-report-")) {
      const published = baselineFromReport(readReport(run), run, deployment.id);
      if (!published) continue; // Superseded/duplicate approved job is not a deployment.
      return published;
    }
    // One-time compatibility: legacy Gate 7 must have completed successfully.
    demand(
      latest.state === "success" && run.conclusion === "success",
      "Legacy partial deployment requires reconciliation",
    );
    return { sha: deployment.sha, versionId: null, deploymentId: deployment.id };
  }
  throw new Error("No authoritative publication baseline; separate human reconciliation required");
}
function workflowInputs() {
  return process.env.GITHUB_EVENT_PATH
    ? (parseReleaseJson(
        fs.readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"),
        "EVENT_PAYLOAD_INVALID",
        "github_event",
        "json-object-with-optional-inputs-object",
        (value) => jsonObject(value) && (value.inputs === undefined || jsonObject(value.inputs)),
      ).inputs ?? {})
    : {};
}
export function exactIntervalSnapshot(ctx, base, diff, prs) {
  const evidenceBytes = readExactEvidence();
  const evidence = verifyExactEvidence(evidenceBytes);
  const candidate = EXACT_INTERVAL.candidateSha;
  const sealed = changedPaths(base.sha, candidate);
  const governance = changedPaths(candidate, ctx.sha);
  const file = (revision, p) => {
    const entry = git("ls-tree", revision, "--", p);
    if (!entry) return null;
    const blob = /^100(?:644|755) blob ([a-f0-9]{40})\t/.exec(entry);
    demand(blob, "Exact interval files must be regular Git blobs");
    const bytes = execFileSync("git", ["cat-file", "blob", blob[1]], {
      maxBuffer: 16 * 1024 * 1024,
    });
    return { sha256: hash(bytes), bytes: bytes.length };
  };
  return {
    ...evidenceBytes,
    repository: ctx.repository,
    baseline: base,
    candidateSha: candidate,
    finalSourceSha: ctx.sha,
    currentMainSha: api("git/ref/heads/main").object.sha,
    sealedCommits: sealed.commits,
    sealedPrs: sealed.commits.map((sha) => assertMergedCommit(pages(`commits/${sha}/pulls`), sha)),
    sealedPaths: sealed.paths,
    sealedFiles: evidence.paths.map((p) => ({
      path: p,
      classification: classifyPath(p),
      before: file(base.sha, p),
      after: file(candidate, p),
    })),
    governanceParent: git("rev-parse", `${ctx.sha}^1`).trim(),
    governanceHead: git("rev-parse", `${ctx.sha}^2`).trim(),
    governanceCommits: governance.commits,
    governancePaths: governance.paths,
    governanceFiles: governance.paths.map((p) => ({
      path: p,
      before: file(candidate, p)?.sha256 ?? null,
      after: file(ctx.sha, p)?.sha256 ?? null,
    })),
    fullCommits: diff.commits,
    fullPaths: diff.paths,
    fullPrs: prs,
    remediation: api(`pulls/${prs.at(-1)}`),
  };
}
function activationSnapshot(ctx, base, diff, prs, currentMainSha) {
  const commits = diff.commits.map((sha, i) => {
    const paths = git("diff", "--name-only", "--no-renames", "-z", `${sha}^1`, sha)
      .split("\0")
      .filter(Boolean)
      .sort();
    const specialFiles = paths
      .filter((p) => classifyPath(p) === "SPECIAL")
      .map((p) => {
        const fileHash = (revision) => {
          const entry = git("ls-tree", revision, "--", p);
          if (!entry) return null;
          const blob = /^100(?:644|755) blob ([a-f0-9]{40})\t/.exec(entry);
          demand(blob, "Activation files must be regular Git blobs");
          return hash(
            execFileSync("git", ["cat-file", "blob", blob[1]], { maxBuffer: 16 * 1024 * 1024 }),
          );
        };
        return { path: p, before: fileHash(`${sha}^1`), after: fileHash(sha) };
      });
    return { sha, pr: prs[i], paths, specialFiles };
  });
  return {
    repository: ctx.repository,
    targetSha: ctx.sha,
    currentMainSha,
    baseline: base,
    commits,
    remediation: api(`pulls/${prs.at(-1)}`),
  };
}
export function prepare(ctx, publishing = false) {
  assertContext(ctx, policy);
  assertEnvironment(api(`environments/${policy.environment}`), policy);
  const inputs = workflowInputs();
  const initial = activationMode(inputs);
  const exact = inputs.mode === "exact_interval";
  demand(!initial || ctx.event === "workflow_dispatch", "Push cannot request initial activation");
  demand(
    !exact || ctx.event === "workflow_dispatch",
    "Push cannot request exact interval authority",
  );
  const currentMain = api("git/ref/heads/main").object.sha;
  demand(!initial || currentMain === ctx.sha, "Initial activation target is stale");
  if (currentMain !== ctx.sha) return { decision: "SUPERSEDED", sourceSha: ctx.sha };
  const base = baseline(ctx, publishing);
  const diff = changedPaths(base.sha, ctx.sha);
  const classification = classifyPaths(diff.paths);
  // Each outstanding first-parent commit must come from an attributable main PR.
  const prs = diff.commits.map((sha) => assertMergedCommit(pages(`commits/${sha}/pulls`), sha));
  const activation = initial
    ? authorizeActivation(
        activationSnapshot(ctx, base, diff, prs, api("git/ref/heads/main").object.sha),
        inputs,
        ctx,
        api(`actions/runs/${ctx.runId}`),
        policy,
      )
    : undefined;
  let reconciliation;
  if (exact) {
    demand(
      classification.decision === "REQUIRES_SEPARATE_AUTHORIZATION",
      "Exact interval cannot authorize a different classification",
    );
    reconciliation = authorizeExactInterval(
      exactIntervalSnapshot(ctx, base, diff, prs),
      inputs,
      ctx,
      api(`actions/runs/${ctx.runId}`),
      policy,
    );
  }
  if (!initial && !exact && classification.decision === "REQUIRES_SEPARATE_AUTHORIZATION") {
    if (base.sha === TRACK_B_RECONCILIATION.baselineSha) {
      try {
        reconciliation = verifyReconciliation(
          {
            repository: ctx.repository,
            baseline: base,
            diff,
            prs,
            currentMainSha: currentMain,
            targetSha: ctx.sha,
          },
          policy,
          TRACK_B_RECONCILIATION,
        );
      } catch {
        // Reconciliation check failed; remains REQUIRES_SEPARATE_AUTHORIZATION
      }
    }
  }
  if (
    !initial &&
    !exact &&
    classification.decision === "REQUIRES_SEPARATE_AUTHORIZATION" &&
    base.sha === A4B_CLOSED_RECONCILIATION.baselineSha
  ) {
    try {
      const snapshot = activationSnapshot(ctx, base, diff, prs, currentMain);
      reconciliation = verifyA4bReconciliation(
        {
          ...snapshot,
          commits: snapshot.commits.map((commit) => ({
            ...commit,
            parent: git("rev-parse", `${commit.sha}^1`).trim(),
          })),
          diff,
          productPr: api(`pulls/${A4B_CLOSED_RECONCILIATION.productPr}`),
          originalDecision: classification.decision,
          constraints: A4B_CLOSED_RECONCILIATION.constraints,
        },
        policy,
      );
    } catch {
      // No fallback: exact A4b evidence absent/mismatched remains SPECIAL.
    }
  }
  return {
    schema: 1,
    ...classification,
    ...(activation
      ? {
          decision: "AUTHORIZED_INITIAL_ACTIVATION",
          originalDecision: classification.decision,
          activation,
        }
      : reconciliation
        ? {
            decision: "AUTHORIZED_RECONCILED_RELEASE",
            originalDecision: classification.decision,
            reconciliation,
          }
        : {}),
    repository: ctx.repository,
    sourceSha: ctx.sha,
    runId: ctx.runId,
    attempt: ctx.attempt,
    baseline: base,
    prs: [...new Set(prs)],
    paths: diff.paths,
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv[2] === "--exact-interval-payload") {
      const sha = api("git/ref/heads/main").object.sha;
      const ctx = { repository: policy.repository, sha, runId: "" };
      const base = baseline(ctx);
      const diff = changedPaths(base.sha, sha);
      const prs = diff.commits.map((commit) =>
        assertMergedCommit(pages(`commits/${commit}/pulls`), commit),
      );
      const payload = exactIntervalPayload(exactIntervalSnapshot(ctx, base, diff, prs), policy);
      fs.writeSync(
        1,
        `${JSON.stringify(
          {
            payload,
            exactIntervalScope: JSON.stringify(canonical(payload)),
            authorizationId: exactScopeId(payload),
          },
          null,
          2,
        )}\n`,
      );
      process.exit(0); // Read-only proposal: no artifact, ledger, dispatch or authority.
    }
    if (process.argv[2] === "--initial-activation-payload") {
      const sha = api("git/ref/heads/main").object.sha;
      const ctx = { repository: policy.repository, sha, runId: "" };
      const base = baseline(ctx);
      const diff = changedPaths(base.sha, sha);
      const prs = diff.commits.map((commit) =>
        assertMergedCommit(pages(`commits/${commit}/pulls`), commit),
      );
      const payload = activationPayload(
        activationSnapshot(ctx, base, diff, prs, api("git/ref/heads/main").object.sha),
        policy,
      );
      fs.writeSync(
        1,
        `${JSON.stringify({ payload, authorizationId: hash(JSON.stringify(payload)) }, null, 2)}\n`,
      );
      process.exit(0); // Read-only reconciliation, never artifact/ledger or authorization.
    }
    const plan = prepare(context());
    fs.mkdirSync("artifacts", { recursive: true });
    fs.writeFileSync("artifacts/release-plan.json", JSON.stringify(plan, null, 2));
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `eligible=${preparationEligible(plan.decision)}\n`,
    );
    fs.appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## Gate 7 preparation\nState: ${plan.decision}\nSource: \`${plan.sourceSha}\`\n\n${preparationEligible(plan.decision) ? "Preparation is not production authorization." : "No protected publication is requested."}\n`,
    );
    demand(
      plan.decision !== "REQUIRES_SEPARATE_AUTHORIZATION",
      "Privileged/unknown delta requires a separate authorization path",
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
