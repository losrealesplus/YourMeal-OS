import { demand, hash, classifyPath } from "./release-contract.mjs";

export const RECONCILIATION_GOVERNANCE_PR = 502;
export const TRACK_B_SEALED_MIGRATION_BASELINE = "c02702afea56a5a4512b68b0c99aa377ca237b0a";

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
 * Verifies a snapshot against the reconciliation record.
 * Distinguishes the reconciled database migration interval from the application target.
 * Bounded strictly to PRs #492..#501 plus the optional governance PR #502.
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

  // Verify interval PR composition: strictly #492..#501, or #492..#501 + governance PR #502
  demand(
    Array.isArray(prs) &&
      (prs.length === 9 || (prs.length === 10 && prs[9] === RECONCILIATION_GOVERNANCE_PR)),
    `Invalid release PR composition: expected Track B interval or governance PR #${RECONCILIATION_GOVERNANCE_PR}`,
  );
  for (const pr of reconciliation.intervalPrs) {
    demand(prs.includes(pr), `Reconciled PR #${pr} missing from release PRs`);
  }

  // Audit all SPECIAL paths (migrations + allowed non-migration paths)
  auditSpecialPaths(diff.paths, reconciliation);

  const payload = {
    schema: reconciliation.schema,
    reconciliationType: reconciliation.reconciliationType,
    authority: reconciliation.authority,
    repository: reconciliation.repository,
    baselineSha: reconciliation.baselineSha,
    sealedMigrationSha: TRACK_B_SEALED_MIGRATION_BASELINE,
    targetSha: targetSha ?? currentMainSha,
    intervalPrs: reconciliation.intervalPrs,
    governancePr: prs.includes(RECONCILIATION_GOVERNANCE_PR) ? RECONCILIATION_GOVERNANCE_PR : null,
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
  } else {
    demand(
      !manifest.reconciliation &&
        !manifest.plan?.reconciliation &&
        manifest.plan?.decision !== "AUTHORIZED_RECONCILED_RELEASE",
      "Reconciliation cannot fall back to unverified publication",
    );
  }
}
