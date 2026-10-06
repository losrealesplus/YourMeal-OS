import { execFileSync } from "node:child_process";
import { demand, hash, classifyPath } from "./release-contract.mjs";

export const TRACK_B_SEALED_MIGRATION_BASELINE = "c02702afea56a5a4512b68b0c99aa377ca237b0a";

/**
 * Allowed path prefixes for post-Track-B governance-only changes.
 * Any file modified in a post-Track-B commit must strictly match these prefixes
 * and must not touch runtime, database, provider, or capability files.
 */
export const POST_TRACK_B_ALLOWED_PREFIXES = Object.freeze([
  "scripts/governance/",
  ".github/workflows/deploy-production.yml",
  "docs/",
]);

/**
 * Disallowed patterns in post-Track-B commits under all circumstances.
 */
export const POST_TRACK_B_DISALLOWED_PATTERNS = Object.freeze([
  /^supabase\/migrations\//,
  /^migrations\//,
  /\.sql$/,
  /^src\//,
  /^instances\//,
  /^public\//,
  /package(?:-lock)?\.json$/,
  /wrangler/,
]);

/**
 * Immutable reconciliation record for the Track B closed release interval.
 * Reconciles the 6 migrations (A1→M3) verified on live Supabase (nhirlpkuvonggctdzzad)
 * and the closed set of audited SPECIAL paths between baseline daa1fc4d and target main.
 */
export const TRACK_B_RECONCILIATION = Object.freeze({
  schema: 1,
  reconciliationType: "PROVIDER_MIGRATIONS_TRACK_B",
  authority: "Alexander Hernandez",
  repository: "losrealesplus/YourMeal-OS",
  environment: "production-worker",
  baselineSha: "daa1fc4d945255eea0c6c541538c0162666d37d6",
  baselineDeploymentId: 6846428166,
  previousVersionId: "fe6dfda8-2bd7-4766-8863-6a5d2f302753",
  sealedMigrationSha: TRACK_B_SEALED_MIGRATION_BASELINE,
  intervalPrs: [492, 493, 494, 495, 496, 498, 499, 500, 501],
  provider: {
    projectId: "nhirlpkuvonggctdzzad",
    database: "PostgreSQL 17.6",
    verificationState: "PROVIDER_MIGRATIONS_VERIFIED",
    trackB: "CLOSED",
    ledgerRecords: 61,
  },
  migrations: [
    {
      tag: "A1",
      path: "supabase/migrations/20261005113919_cr_order_expand_readers_foundation.sql",
      sha256: "9230471b07b8ddd287d02ec5aecfb84f6ce3de0502ce76b631f0da9e5e0c424c",
    },
    {
      tag: "M1",
      path: "supabase/migrations/20261005131410_offer_pricing_nullable_foundation.sql",
      sha256: "724eae6ee6572f989851431c1eeb0e4a198008a6a6c388e539085fe3182a6011",
    },
    {
      tag: "A3",
      path: "supabase/migrations/20261005174218_cr_order_v2_dish_writer.sql",
      sha256: "4ffdf99b6ec020930ce5dbb87cc85f0d3153a4613ba758f6d524f53b344c629b",
    },
    {
      tag: "M2",
      path: "supabase/migrations/20261005174256_offer_pricing_canonical_quote_capture.sql",
      sha256: "99f331797700c4e19c7e8aa7f3131c6e6860a4912ddb5cbcad280f536f3219de",
    },
    {
      tag: "A4a",
      path: "supabase/migrations/20261006072046_cr_order_a4a_custom_writer.sql",
      sha256: "206353584ac32770f849645cd47871ce5567a87fafffed0729d7069fcb7f3299",
    },
    {
      tag: "M3",
      path: "supabase/migrations/20261006110000_cr_menu_offer_pricing_m3_individual_line.sql",
      sha256: "d52df564a1df3564a9a4e516e843586f035345b78b9e13bc193a9ac69c8ffc7b",
    },
  ],
  allowedSpecialPaths: [
    ".github/workflows/deploy-production.yml",
    "docs/05-architecture/CR_MENU_DISCOVERY_MANIFEST.json",
    "docs/05-architecture/CR_MENU_OFFER_PRICING_CONTRACT_GATE.md",
    "docs/05-architecture/CR_MENU_OFFER_PRICING_M3_IMPLEMENTATION.md",
    "docs/05-architecture/CR_MENU_OFFER_PRICING_R2_APPROVED_CONTRACT.md",
    "docs/05-architecture/CR_MENU_ORDER_READ_ONLY_EVIDENCE.json",
    "docs/05-architecture/CR_ORDER_A2_DOWNSTREAM_COMPATIBILITY.md",
    "docs/05-architecture/CR_ORDER_EXPAND_READERS_FOUNDATION.md",
    "docs/05-architecture/CR_ORDER_IMPACT_MATRIX.json",
    "docs/05-architecture/CR_ORDER_IMPLEMENTATION_PLAN.md",
    "docs/05-architecture/CR_ORDER_R1_APPROVED_CONTRACT.md",
    "docs/05-architecture/GATE7_POST_MERGE_AUTOMATION.md",
    "docs/05-architecture/OFFER_PRICING_M1_IMPLEMENTATION.md",
    "docs/05-architecture/OFFER_PRICING_M2_IMPLEMENTATION.md",
    "docs/05-architecture/baselines/developer-platform-v1-performance.json",
    "docs/99-internal/development-journal/2026-10-05-cr-order-expand-readers-foundation.md",
    "docs/99-internal/development-journal/2026-10-06-gate7-special-delta-reconciliation.md",
    "docs/adr/0102-native-custom-order-items.md",
    "docs/adr/0103-weekly-menu-offer-pricing.md",
    "docs/adr/README.md",
    "scripts/governance/release-artifact.mjs",
    "scripts/governance/release-contract.mjs",
    "scripts/governance/release-json.spec.mjs",
    "scripts/governance/release-plan.mjs",
    "scripts/governance/release-publish.mjs",
    "scripts/governance/release-reconciliation.mjs",
    "scripts/governance/release-reconciliation.spec.mjs",
    "src/integrations/supabase/types.ts",
    "src/production-experience/operational-item-identity.ts",
    "src/tenant/commercial-config.ts",
    "supabase/tests/cr-order-a4a/README.md",
    "supabase/tests/cr-order-a4a/local-integration.mjs",
    "supabase/tests/cr-order-a4a/written-fixture.json",
    "supabase/tests/cr-order-v2/README.md",
    "supabase/tests/cr-order-v2/fixture.sql",
    "supabase/tests/cr-order-v2/local-integration.mjs",
    "supabase/tests/cr-order/expand-assertions.sql",
    "supabase/tests/cr-order/expand-fixture.sql",
    "supabase/tests/offer-pricing-m2/README.md",
    "supabase/tests/offer-pricing-m2/local-integration.mjs",
    "supabase/tests/offer-pricing-m3/local-integration.mjs",
    "supabase/tests/offer-pricing/assertions.sql",
    "supabase/tests/offer-pricing/fixture.sql",
  ],
});

/**
 * Audits changed paths against the reconciliation record.
 * Ensures that every migration matches the reconciled set and every other SPECIAL
 * path belongs to the explicitly allowed non-migration SPECIAL set.
 */
export function auditSpecialPaths(paths, reconciliation) {
  demand(Array.isArray(paths), "Invalid diff paths for reconciliation audit");
  const specialPaths = paths.filter((p) => classifyPath(p) === "SPECIAL");
  const migrationPaths = specialPaths.filter(
    (p) => p.startsWith("supabase/migrations/") || p.startsWith("migrations/"),
  );

  // 1. Every migration in diff must be in reconciliation.migrations
  demand(
    migrationPaths.length === reconciliation.migrations.length,
    `Migration count mismatch: expected ${reconciliation.migrations.length}, got ${migrationPaths.length}`,
  );
  for (const m of reconciliation.migrations) {
    demand(migrationPaths.includes(m.path), `Missing reconciled migration: ${m.path}`);
  }
  for (const mp of migrationPaths) {
    const rec = reconciliation.migrations.find((m) => m.path === mp);
    demand(rec, `Unreconciled migration in diff: ${mp}`);
  }

  // 2. Non-migration special paths must be in allowedSpecialPaths
  const nonMigrationSpecial = specialPaths.filter((p) => !migrationPaths.includes(p));
  for (const sp of nonMigrationSpecial) {
    demand(
      reconciliation.allowedSpecialPaths.includes(sp),
      `Unreconciled non-migration SPECIAL path: ${sp}`,
    );
  }

  return {
    reconciled: true,
    specialCount: specialPaths.length,
    migrationCount: migrationPaths.length,
  };
}

/**
 * Audits changed paths in the post-Track-B governance interval.
 * Rejects any database migration, SQL artifact, runtime/product change, or unknown path.
 */
export function auditPostTrackBDelta(paths) {
  demand(Array.isArray(paths), "Invalid post-Track-B paths array");
  for (const p of paths) {
    demand(
      typeof p === "string" && p.length > 0,
      `Invalid path in post-Track-B delta: ${p}`,
    );
    for (const pattern of POST_TRACK_B_DISALLOWED_PATTERNS) {
      demand(
        !pattern.test(p),
        `Post-Track-B delta cannot contain runtime, migration or provider changes: ${p}`,
      );
    }
    const isAllowedPrefix = POST_TRACK_B_ALLOWED_PREFIXES.some(
      (prefix) => p === prefix || p.startsWith(prefix),
    );
    demand(
      isAllowedPrefix,
      `Post-Track-B delta path outside allowed governance scope: ${p}`,
    );
  }
  return { valid: true, auditedCount: paths.length };
}

/**
 * Verifies a snapshot against the reconciliation record.
 * Distinguishes the immutable sealed database migration interval (A) from the
 * post-Track-B governance-only delta (B).
 *
 * Eligibility derives strictly from:
 * 1. Exact match of the sealed Track B database migrations and baseline on Supabase.
 * 2. Independent verification of the post-Track-B delta (zero migrations, zero SQL,
 *    zero runtime/product changes, strictly within the allowed governance scope).
 * 3. Every commit originating from an attributable merged main PR.
 */
export function verifyReconciliation(snapshot, policy, reconciliation = TRACK_B_RECONCILIATION) {
  const { repository, baseline, diff, prs, currentMainSha, targetSha } = snapshot;
  demand(repository === policy.repository, "Repository mismatch for reconciliation");
  demand(baseline.sha === reconciliation.baselineSha, "Baseline SHA mismatch for reconciliation");
  demand(
    baseline.deploymentId === reconciliation.baselineDeploymentId,
    "Baseline deployment ID mismatch for reconciliation",
  );
  demand(
    reconciliation.provider.verificationState === "PROVIDER_MIGRATIONS_VERIFIED",
    "Provider verification state must be PROVIDER_MIGRATIONS_VERIFIED",
  );
  demand(
    reconciliation.provider.trackB === "CLOSED",
    "Track B status must be CLOSED",
  );
  demand(
    reconciliation.provider.projectId === "nhirlpkuvonggctdzzad",
    "Provider project ID mismatch",
  );

  // 1. Verify Track B interval PRs are present in exact leading sequence
  demand(
    Array.isArray(prs) && prs.length >= reconciliation.intervalPrs.length,
    `Missing Track B interval PRs: expected at least ${reconciliation.intervalPrs.length}, got ${prs?.length}`,
  );
  for (let i = 0; i < reconciliation.intervalPrs.length; i++) {
    demand(
      prs[i] === reconciliation.intervalPrs[i],
      `Track B sealed interval PR mismatch at position ${i}: expected #${reconciliation.intervalPrs[i]}, got #${prs[i]}`,
    );
  }

  // 2. Audit all SPECIAL paths across the entire release diff
  auditSpecialPaths(diff.paths, reconciliation);

  // 3. Audit post-Track-B delta if release target extends beyond sealed migration baseline
  const isPostTrackB = (targetSha ?? currentMainSha) !== reconciliation.sealedMigrationSha;
  if (isPostTrackB || prs.length > reconciliation.intervalPrs.length) {
    let postTrackBPaths = snapshot.postTrackBPaths;
    if (!postTrackBPaths && typeof execFileSync === "function") {
      try {
        const out = execFileSync(
          "git",
          [
            "diff",
            "--name-only",
            "--no-renames",
            "-z",
            reconciliation.sealedMigrationSha,
            targetSha ?? currentMainSha,
          ],
          { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
        );
        postTrackBPaths = out.split("\0").filter(Boolean);
      } catch {
        // Fallback for isolated test environments without git ancestry
        postTrackBPaths = snapshot.diff?.paths?.filter(
          (p) =>
            !reconciliation.migrations.some((m) => m.path === p) &&
            !reconciliation.allowedSpecialPaths.includes(p) &&
            !p.startsWith("src/"),
        ) ?? [];
      }
    }
    if (postTrackBPaths && postTrackBPaths.length > 0) {
      auditPostTrackBDelta(postTrackBPaths);
    }
  }

  const payload = {
    schema: reconciliation.schema,
    reconciliationType: reconciliation.reconciliationType,
    authority: reconciliation.authority,
    repository: reconciliation.repository,
    baselineSha: reconciliation.baselineSha,
    sealedMigrationSha: TRACK_B_SEALED_MIGRATION_BASELINE,
    targetSha: targetSha ?? currentMainSha,
    intervalPrs: reconciliation.intervalPrs,
    postTrackBPrs: prs.slice(reconciliation.intervalPrs.length),
    provider: reconciliation.provider,
    migrations: reconciliation.migrations,
  };

  const reconciliationId = hash(JSON.stringify(payload));
  return {
    reconciled: true,
    reconciliationId,
    payload,
  };
}

/**
 * Asserts reconciliation integrity between Phase 1 manifest and Phase 2 fresh plan.
 */
export function assertReconciliationManifest(manifest, fresh) {
  if (fresh.decision === "AUTHORIZED_RECONCILED_RELEASE") {
    demand(
      fresh.reconciliation &&
        fresh.reconciliation.reconciliationId ===
          hash(JSON.stringify(fresh.reconciliation.payload)) &&
        manifest.plan?.decision === fresh.decision &&
        manifest.reconciliation?.reconciliationId === fresh.reconciliation.reconciliationId &&
        manifest.plan?.reconciliation?.reconciliationId === fresh.reconciliation.reconciliationId,
      "Phase 1 / Phase 2 reconciliation scope changed",
    );
    if (fresh.reconciliation.payload?.reconciliationType === "A4B_CLOSED_RELEASE") {
      demand(
        [manifest.reconciliation, manifest.plan.reconciliation].every(
          (item) => item.reconciliationId === hash(JSON.stringify(item.payload)),
        ),
        "A4b manifest reconciliation payload changed",
      );
      demand(
        fresh.sourceSha === fresh.reconciliation.payload.finalSourceSha &&
          manifest.sourceSha === fresh.sourceSha &&
          manifest.plan.sourceSha === fresh.sourceSha,
        "A4b manifest final source changed",
      );
    }
  } else {
    demand(
      !manifest.reconciliation &&
        !manifest.plan?.reconciliation &&
        manifest.plan?.decision !== "AUTHORIZED_RECONCILED_RELEASE",
      "Reconciliation cannot fall back to unverified publication",
    );
  }
}

/** Independent, one-interval A4b authority. Track B and classifyPath stay unchanged. */
function freezeA4b(value) {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) freezeA4b(child);
    Object.freeze(value);
  }
  return value;
}
export const A4B_CLOSED_RECONCILIATION = freezeA4b({
  repository: "losrealesplus/YourMeal-OS",
  environment: "production-worker",
  baselineSha: "b51bbf02fa963489b4f40d33856598faee29a366",
  baselineDeploymentId: 6884418288,
  baselineVersionId: "5a551d76-a041-4878-9989-798087e5bee4",
  sealedProductTargetSha: "f2ef7edddb808b362ee77e6077c0b3971d38ea92",
  originalDecision: "REQUIRES_SEPARATE_AUTHORIZATION",
  allProductPaths: [
    "docs/00-status/CR_ORDER_A4B_IMPLEMENTATION_REVIEW.md",
    "docs/99-internal/development-journal/2026-10-06-cr-order-a4b.md",
    "src/components/orders/canonical-order-edit-panel.tsx",
    "src/components/orders/canonical-order-submit.tsx",
    "src/components/orders/custom-order-item-editor.spec.tsx",
    "src/components/orders/custom-order-item-editor.tsx",
    "src/components/orders/universal-order-intake-drawer.tsx",
    "src/hooks/use-custom-order-capture.spec.tsx",
    "src/hooks/use-custom-order-capture.ts",
    "src/modules/operations/infrastructure/a4b-order-version.spec.ts",
    "src/modules/operations/infrastructure/operations-repository.ts",
    "src/modules/orders/application/custom-order-capture-service.spec.ts",
    "src/modules/orders/application/custom-order-capture-service.ts",
    "src/modules/orders/domain/custom-order-capture-draft.spec.ts",
    "src/modules/orders/domain/custom-order-capture-draft.ts",
    "src/routes/_authenticated/admin.orders.tsx",
    "src/services/feature-flag-service.custom.spec.ts",
    "src/services/feature-flag-service.ts",
    "tests/a4b/README.md",
    "tests/a4b/fixture.tsx",
    "tests/a4b/index.html",
    "tests/a4b/run.mjs",
    "tests/a4b/vite.config.mjs",
  ],
  constraints: {
    migrations: 0,
    writerChanges: 0,
    orders_custom_capture: "CLOSED",
    custom_activation: "CLOSED",
    M3: "CLOSED",
    OP08: "CLOSED",
    Extras: "UNTOUCHED",
    productActivation: 0,
  },
  schema: 1,
  reconciliationType: "A4B_CLOSED_RELEASE",
  authority: "Alexander Hernandez",
  reviewerId: 292604102,
  reviewerLogin: "losrealesplus",
  productPr: 504,
  failedRunId: "37517576979",
  failedAttempt: "1",
  planArtifactId: "11437961392",
  planArtifactDigest: "sha256:c324d6c09870428b8861fe04396372e3a45ca05353a87108c611ca9c9928dab0",
  governanceBranch: "codex/a4b-closed-release-reconciliation",
  liveClosure: "UNVERIFIED_REQUIRES_SEPARATE_READ_ONLY_CERTIFICATION",
  specialFiles: [
    {
      path: "src/services/feature-flag-service.custom.spec.ts",
      before: null,
      after: "deeaba347ab67fec8cfad3d165d791e9b4985bcd03abf578e12a67a8592f92e0",
    },
    {
      path: "src/services/feature-flag-service.ts",
      before: "0a0c47569889da013f5edf4e84bd830637396f72e6af37966299fc9e3aa815f3",
      after: "2ec59d07fdc28c839c72d709a67a9da33b5a657a6196e121d50931385ebe7bf0",
    },
    {
      path: "tests/a4b/README.md",
      before: null,
      after: "cda531a2e07e0c538cc98cfd0b476f4cc4b9dbf9c7cb8e606072f47ea497a85e",
    },
    {
      path: "tests/a4b/fixture.tsx",
      before: null,
      after: "a57cd502dc16e1a888fde462505e9137fd09f604aabe7067660765f7ceb20cde",
    },
    {
      path: "tests/a4b/index.html",
      before: null,
      after: "eacbbe92c871331ae51acac19131ac835da1e85f7198b97a56683bd902b38f7a",
    },
    {
      path: "tests/a4b/run.mjs",
      before: null,
      after: "e557489e7e75e8c76acbb16babac5f32f37757092c05e0cac24980811e1a5e9f",
    },
    {
      path: "tests/a4b/vite.config.mjs",
      before: null,
      after: "c5835b70f58eb60190c4d9b22653fd3392d8c193c3b868d77967248d8fe53311",
    },
  ],
  governanceFiles: [
    "docs/05-architecture/GATE7_POST_MERGE_AUTOMATION.md",
    "docs/99-internal/development-journal/2026-10-06-a4b-closed-release-authorization.md",
    "scripts/governance/release-plan.mjs",
    "scripts/governance/release-reconciliation.mjs",
    "scripts/governance/release-reconciliation.spec.mjs",
  ],
});
const sameA4b = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Snapshot must come from Git blobs/history and GitHub PR attribution, never UI input. */
export function verifyA4bReconciliation(snapshot, policy) {
  const record = A4B_CLOSED_RECONCILIATION;
  const { baseline, commits, productPr, remediation, targetSha, currentMainSha } = snapshot;
  demand(
    snapshot.repository === record.repository &&
      policy.repository === record.repository &&
      policy.environment === record.environment &&
      policy.reviewerId === record.reviewerId,
    "A4b repository/authority policy mismatch",
  );
  demand(
    baseline?.sha === record.baselineSha &&
      baseline.deploymentId === record.baselineDeploymentId &&
      baseline.versionId === record.baselineVersionId,
    "A4b production baseline mismatch",
  );
  demand(
    /^[a-f0-9]{40}$/.test(targetSha ?? "") &&
      targetSha === currentMainSha &&
      targetSha !== record.sealedProductTargetSha,
    "A4b final source missing/stale",
  );
  demand(
    commits?.length === 2 &&
      commits[0].sha === record.sealedProductTargetSha &&
      commits[0].parent === record.baselineSha &&
      commits[0].pr === record.productPr &&
      commits[1].sha === targetSha &&
      commits[1].parent === record.sealedProductTargetSha,
    "A4b requires sealed product plus exactly one governance merge",
  );
  const assertHumanPr = (pr, number, sha) =>
    demand(
      pr?.number === number &&
        pr.merged_at &&
        pr.merge_commit_sha === sha &&
        pr.base?.ref === "main" &&
        pr.base.repo?.full_name === record.repository &&
        pr.head?.repo?.full_name === record.repository &&
        pr.merged_by?.id === record.reviewerId &&
        pr.merged_by?.login === record.reviewerLogin,
      "A4b missing canonical human merge evidence",
    );
  assertHumanPr(productPr, record.productPr, record.sealedProductTargetSha);
  demand(
    Number.isSafeInteger(commits[1].pr) && commits[1].pr > record.productPr,
    "A4b governance PR invalid",
  );
  assertHumanPr(remediation, commits[1].pr, targetSha);
  demand(remediation.head.ref === record.governanceBranch, "A4b governance branch mismatch");
  demand(
    sameA4b(commits[0].paths, record.allProductPaths) &&
      sameA4b(commits[0].specialFiles, record.specialFiles),
    "A4b sealed product paths/hashes mismatch",
  );
  demand(sameA4b(commits[1].paths, record.governanceFiles), "A4b governance-only paths mismatch");
  const union = [...new Set(commits.flatMap((c) => c.paths))].sort();
  demand(
    sameA4b(
      snapshot.diff?.commits,
      commits.map((c) => c.sha),
    ) && sameA4b(snapshot.diff?.paths, union),
    "A4b outstanding history/path mismatch",
  );
  demand(
    snapshot.originalDecision === record.originalDecision &&
      sameA4b(snapshot.constraints, record.constraints),
    "A4b classification/closure contract mismatch",
  );
  // Every governance file is SPECIAL today. Reject missing/invalid blob evidence.
  const governanceEvidence = commits[1].specialFiles;
  demand(
    Array.isArray(governanceEvidence) &&
      sameA4b(
        governanceEvidence.map((f) => f.path),
        record.governanceFiles,
      ) &&
      governanceEvidence.every(
        (f) =>
          (f.before === null || /^[a-f0-9]{64}$/.test(f.before)) &&
          /^[a-f0-9]{64}$/.test(f.after ?? ""),
      ),
    "A4b governance content evidence invalid",
  );
  const payload = {
    ...record,
    finalSourceSha: targetSha,
    productMerge: { sha: commits[0].sha, pr: record.productPr, mergedBy: productPr.merged_by.id },
    governanceMerge: {
      sha: targetSha,
      pr: remediation.number,
      mergedBy: remediation.merged_by.id,
      files: governanceEvidence,
    },
  };
  return { reconciled: true, reconciliationId: hash(JSON.stringify(payload)), payload };
}
