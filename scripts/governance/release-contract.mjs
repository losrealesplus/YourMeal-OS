import { createHash } from "node:crypto";
export const SHA = /^[a-f0-9]{40}$/;
export const DIGEST = /^[a-f0-9]{64}$/;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
export function demand(condition, message) {
  if (!condition) throw new Error(message);
}

// Precedence is deliberate: sensitive/unknown paths beat runtime and docs/tests.
export function classifyPath(path) {
  if (typeof path !== "string" || !path || path.startsWith("/") || path.split("/").includes(".."))
    return "SPECIAL";
  if (
    /^(AGENTS\.md|FOUNDATION\.md|\.github\/|supabase\/|scripts\/governance\/|instances\/|infrastructure\/|migrations\/|\.env|package(?:-lock)?\.json|vite\.config|nitro\.config|tsconfig|wrangler)/.test(
      path,
    ) ||
    /\.(sql|tf|tfvars)$/.test(path)
  )
    return "SPECIAL";
  const implementationEvidence =
    /^docs\/05-architecture\/(?:evidence\/[^/]+\.(?:png|jpe?g|webp)|CR_(?!GOV_)[A-Z0-9_]+_SCOPE_AND_REVIEW\.md)$/.test(
      path,
    );
  if (
    !implementationEvidence &&
    /^docs\/(adr\/|05-architecture\/|00-status\/(?:CHANGE_AUTHORITY|PR_REVIEW|FLOW_GOVERNANCE))/.test(
      path,
    )
  )
    return "SPECIAL";
  if (
    /(?:^|\/)[^/]*(?:auth|tenant|permission|membership|identity|secret)[^/]*(?:\/|\.)/i.test(
      path.replace(/^src\/routes\/_authenticated\//, "src/routes/"),
    ) ||
    /^src\/(auth\/|tenant\/|permissions\/|integrations\/|services\/|modules\/(?:tenant-association|company-account)\/)/.test(
      path,
    )
  )
    return "SPECIAL";
  if (
    /^docs\//.test(path) &&
    /(?:governance|authority|protocol|foundation|contract|lock|rules)/i.test(path)
  )
    return "SPECIAL";
  if (/^docs\//.test(path) || /(?:^|\/)[^/]+\.(?:spec|test)\.[cm]?[jt]sx?$/.test(path))
    return "NON_DEPLOYABLE";
  if (/^(src\/|public\/)/.test(path)) return "DEPLOYABLE";
  // Unknown tooling/configuration is not automatically harmless.
  return "SPECIAL";
}
export function classifyPaths(paths) {
  demand(
    Array.isArray(paths) && paths.every((p) => typeof p === "string"),
    "Invalid changed paths",
  );
  const special = paths.filter((p) => classifyPath(p) === "SPECIAL");
  return {
    decision: special.length
      ? "REQUIRES_SEPARATE_AUTHORIZATION"
      : paths.some((p) => classifyPath(p) === "DEPLOYABLE")
        ? "DEPLOYABLE"
        : "NON_DEPLOYABLE",
    special,
  };
}
export function assertContext(context, policy) {
  demand(
    context.repository === policy.repository && context.ref === "refs/heads/main",
    "Only canonical main can prepare production",
  );
  demand(
    SHA.test(context.sha) && /^[1-9][0-9]*$/.test(context.runId ?? "") && context.attempt === "1",
    "Invalid SHA or rerun: new run and new approval required",
  );
  demand(["push", "workflow_dispatch"].includes(context.event), "Unsupported event");
}
export function assertEnvironment(env, policy) {
  const rule = env.protection_rules?.find((r) => r.type === "required_reviewers");
  demand(
    env.name === policy.environment &&
      env.can_admins_bypass === false &&
      rule?.reviewers?.length === 1 &&
      rule.reviewers[0].type === "User" &&
      rule.reviewers[0].reviewer.id === policy.reviewerId,
    "Production environment authority changed or cannot be proved",
  );
}
export function assertApproval(reviews, policy) {
  demand(Array.isArray(reviews), "Missing production review history");
  const relevant = reviews.filter((r) =>
    r.environments?.some((e) => e.name === policy.environment),
  );
  demand(
    relevant.length === 1 &&
      relevant[0].state === "approved" &&
      relevant[0].user?.id === policy.reviewerId,
    "Explicit sovereign production approval required",
  );
}
export function assertConfig(config, policy) {
  demand(
    config.name === policy.worker &&
      config.main === "../../.output/server/index.mjs" &&
      config.find_additional_modules === true,
    "Unexpected Worker artifact configuration",
  );
  for (const key of [
    "logpush",
    "tail_consumers",
    "streaming_tail_consumers",
    "observability",
    "env",
    "build",
    "site",
    "legacy_env",
  ])
    demand(!(key in config), `Non-versioned/inherited setting forbidden: ${key}`);
}
export function uploadRecord(text, worker) {
  const records = text
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
  const matches = records.filter((r) => r.type === "version-upload");
  demand(
    matches.length === 1 &&
      matches[0].version === 1 &&
      matches[0].worker_name === worker &&
      UUID.test(matches[0].version_id ?? ""),
    "Missing/ambiguous/invalid version upload",
  );
  return matches[0];
}
export function deployRecord(text, worker) {
  const records = text
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
  const matches = records.filter((r) => r.type === "version-deploy");
  demand(
    matches.length === 1 &&
      matches[0].version === 1 &&
      matches[0].worker_name === worker &&
      UUID.test(matches[0].deployment_id ?? ""),
    "Missing/ambiguous/invalid deployment result",
  );
  // Wrangler 4.86 serializes its Map as {}. Do NOT treat that as traffic evidence.
  return matches[0];
}
export function assertTraffic(deployment, id, version) {
  demand(
    deployment?.id === id &&
      deployment.versions?.length === 1 &&
      deployment.versions[0].version_id === version &&
      deployment.versions[0].percentage === 100,
    "Cloudflare read-back did not prove exact version at 100%",
  );
}
export function assertManifest(manifest, context, expectedDigest, expectedConfigHash) {
  demand(
    manifest.schema === 1 &&
      manifest.sourceSha === context.sha &&
      manifest.runId === context.runId &&
      manifest.attempt === context.attempt &&
      manifest.repository === context.repository,
    "Release identity mismatch",
  );
  demand(
    DIGEST.test(expectedDigest) &&
      DIGEST.test(expectedConfigHash) &&
      manifest.tarSha256 === expectedDigest &&
      manifest.configSha256 === expectedConfigHash,
    "Release digest/config mismatch",
  );
}
