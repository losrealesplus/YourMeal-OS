import test from "node:test";
import assert from "node:assert/strict";
import {
  TRACK_B_RECONCILIATION,
  TRACK_B_SEALED_MIGRATION_BASELINE,
  POST_TRACK_B_ALLOWED_PREFIXES,
  auditPostTrackBDelta,
  verifyReconciliation,
  assertReconciliationManifest,
} from "./release-reconciliation.mjs";
import {
  assertApproval,
  assertEnvironment,
  preparationEligible,
} from "./release-contract.mjs";

const mockPolicy = {
  repository: "losrealesplus/YourMeal-OS",
  environment: "production-worker",
  reviewerId: 292604102,
  workflow: ".github/workflows/deploy-production.yml",
};

const validSnapshot = {
  repository: "losrealesplus/YourMeal-OS",
  baseline: {
    sha: "daa1fc4d945255eea0c6c541538c0162666d37d6",
    deploymentId: 6846428166,
    versionId: "fe6dfda8-2bd7-4766-8863-6a5d2f302753",
  },
  diff: {
    commits: [
      "bb742f2da2bbe4d83c12bd16a889840c36057ea2",
      "54614a2ef29aba36977acf433a629d013d9b1305",
      "d06ac1ce873eb12e20577fed6acd98499dbbfe4f",
      "70d5d052fe6fdcc5d956af5c074cb784c483890a",
      "edf8929287a0e5bd4496369a46803fa9d292d6e3",
      "5e336e26af28a394c8ee983f5f5febb132cac673",
      "4790450c0d7a976c7ca31bef3a6d2be9937e7e03",
      "87149a201fa5f2e6df420653535194f311e7504c",
      "c02702afea56a5a4512b68b0c99aa377ca237b0a",
    ],
    paths: [
      ...TRACK_B_RECONCILIATION.migrations.map((m) => m.path),
      ...TRACK_B_RECONCILIATION.allowedSpecialPaths,
      "src/modules/orders/domain/canonical-order-write.ts",
      "src/modules/weekly-menu/application/offer-pricing.ts",
    ],
  },
  prs: [492, 493, 494, 495, 496, 498, 499, 500, 501],
  currentMainSha: "c02702afea56a5a4512b68b0c99aa377ca237b0a",
  targetSha: "c02702afea56a5a4512b68b0c99aa377ca237b0a",
};

test("1. Sealed Track B interval remains exact and immutable", () => {
  const result = verifyReconciliation(validSnapshot, mockPolicy, TRACK_B_RECONCILIATION);
  assert.equal(result.reconciled, true);
  assert.ok(result.reconciliationId);
  assert.equal(result.payload.schema, 1);
  assert.equal(result.payload.reconciliationType, "PROVIDER_MIGRATIONS_TRACK_B");
  assert.equal(result.payload.sealedMigrationSha, TRACK_B_SEALED_MIGRATION_BASELINE);
  assert.deepEqual(result.payload.intervalPrs, [492, 493, 494, 495, 496, 498, 499, 500, 501]);
  assert.deepEqual(result.payload.postTrackBPrs, []);
  assert.equal(result.payload.migrations.length, 6);
  assert.equal(preparationEligible("AUTHORIZED_RECONCILED_RELEASE"), true);
});

test("2. #502 governance-only delta is eligible by scope and content", () => {
  const postMergeSnapshot = {
    ...validSnapshot,
    diff: {
      ...validSnapshot.diff,
      commits: [...validSnapshot.diff.commits, "1111222233334444555566667777888899990000"],
    },
    prs: [...validSnapshot.prs, 502],
    currentMainSha: "1111222233334444555566667777888899990000",
    targetSha: "1111222233334444555566667777888899990000",
    postTrackBPaths: [
      "scripts/governance/release-reconciliation.mjs",
      "scripts/governance/release-reconciliation.spec.mjs",
      "docs/05-architecture/GATE7_POST_MERGE_AUTOMATION.md",
    ],
  };
  const result = verifyReconciliation(postMergeSnapshot, mockPolicy, TRACK_B_RECONCILIATION);
  assert.equal(result.reconciled, true);
  assert.deepEqual(result.payload.postTrackBPrs, [502]);
  assert.equal(result.payload.targetSha, "1111222233334444555566667777888899990000");
  assert.equal(result.payload.sealedMigrationSha, TRACK_B_SEALED_MIGRATION_BASELINE);
});

test("3. #503 governance-only correction is eligible by scope and content", () => {
  const postMergeSnapshot = {
    ...validSnapshot,
    diff: {
      ...validSnapshot.diff,
      commits: [
        ...validSnapshot.diff.commits,
        "1111222233334444555566667777888899990000",
        "2222333344445555666677778888999900001111",
      ],
    },
    prs: [...validSnapshot.prs, 502, 503],
    currentMainSha: "2222333344445555666677778888999900001111",
    targetSha: "2222333344445555666677778888999900001111",
    postTrackBPaths: [
      "scripts/governance/release-reconciliation.mjs",
      "scripts/governance/release-reconciliation.spec.mjs",
    ],
  };
  const result = verifyReconciliation(postMergeSnapshot, mockPolicy, TRACK_B_RECONCILIATION);
  assert.equal(result.reconciled, true);
  assert.deepEqual(result.payload.postTrackBPrs, [502, 503]);
});

test("4. Same changes under different PR numbers behave identically (PR number is provenance, not authority)", () => {
  const arbitraryPrSnapshot = {
    ...validSnapshot,
    diff: {
      ...validSnapshot.diff,
      commits: [
        ...validSnapshot.diff.commits,
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      ],
    },
    prs: [...validSnapshot.prs, 999, 1000], // Arbitrary PR numbers
    currentMainSha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    targetSha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    postTrackBPaths: [
      "scripts/governance/release-reconciliation.mjs",
      "docs/05-architecture/GATE7_POST_MERGE_AUTOMATION.md",
    ],
  };
  const result = verifyReconciliation(arbitraryPrSnapshot, mockPolicy, TRACK_B_RECONCILIATION);
  assert.equal(result.reconciled, true);
  assert.deepEqual(result.payload.postTrackBPrs, [999, 1000]);
});

test("5. Future docs-only allowed governance correction can be evaluated by scope", () => {
  const docsCorrectionSnapshot = {
    ...validSnapshot,
    diff: {
      ...validSnapshot.diff,
      commits: [...validSnapshot.diff.commits, "3333444455556666777788889999000011112222"],
    },
    prs: [...validSnapshot.prs, 504],
    currentMainSha: "3333444455556666777788889999000011112222",
    targetSha: "3333444455556666777788889999000011112222",
    postTrackBPaths: [
      "docs/05-architecture/GATE7_POST_MERGE_AUTOMATION.md",
    ],
  };
  const result = verifyReconciliation(docsCorrectionSnapshot, mockPolicy, TRACK_B_RECONCILIATION);
  assert.equal(result.reconciled, true);
  assert.deepEqual(result.payload.postTrackBPrs, [504]);
});

test("6. Future migration in post-Track-B delta fails closed", () => {
  const migrationAttemptSnapshot = {
    ...validSnapshot,
    diff: {
      ...validSnapshot.diff,
      commits: [...validSnapshot.diff.commits, "4444555566667777888899990000111122223333"],
      paths: [
        ...validSnapshot.diff.paths,
        "supabase/migrations/20261007000000_unauthorized_post_track_b.sql",
      ],
    },
    prs: [...validSnapshot.prs, 504],
    currentMainSha: "4444555566667777888899990000111122223333",
    targetSha: "4444555566667777888899990000111122223333",
    postTrackBPaths: [
      "supabase/migrations/20261007000000_unauthorized_post_track_b.sql",
    ],
  };
  assert.throws(
    () => verifyReconciliation(migrationAttemptSnapshot, mockPolicy, TRACK_B_RECONCILIATION),
    /Migration count mismatch|Post-Track-B delta cannot contain runtime, migration or provider changes/,
  );
});

test("7. Future runtime/product feature in post-Track-B delta fails closed", () => {
  const runtimeFeatureSnapshot = {
    ...validSnapshot,
    diff: {
      ...validSnapshot.diff,
      commits: [...validSnapshot.diff.commits, "5555666677778888999900001111222233334444"],
    },
    prs: [...validSnapshot.prs, 504],
    currentMainSha: "5555666677778888999900001111222233334444",
    targetSha: "5555666677778888999900001111222233334444",
    postTrackBPaths: [
      "src/modules/orders/domain/new-order-feature.ts",
    ],
  };
  assert.throws(
    () => verifyReconciliation(runtimeFeatureSnapshot, mockPolicy, TRACK_B_RECONCILIATION),
    /Post-Track-B delta cannot contain runtime, migration or provider changes/,
  );
});

test("8. Future capability activation in post-Track-B delta fails closed", () => {
  const capabilityActivationSnapshot = {
    ...validSnapshot,
    diff: {
      ...validSnapshot.diff,
      commits: [...validSnapshot.diff.commits, "6666777788889999000011112222333344445555"],
    },
    prs: [...validSnapshot.prs, 504],
    currentMainSha: "6666777788889999000011112222333344445555",
    targetSha: "6666777788889999000011112222333344445555",
    postTrackBPaths: [
      "src/tenant/commercial-config.ts",
    ],
  };
  assert.throws(
    () => verifyReconciliation(capabilityActivationSnapshot, mockPolicy, TRACK_B_RECONCILIATION),
    /Post-Track-B delta cannot contain runtime, migration or provider changes/,
  );
});

test("9. Unknown SPECIAL path in diff fails closed", () => {
  const alteredSnapshot = {
    ...validSnapshot,
    diff: {
      ...validSnapshot.diff,
      paths: [...validSnapshot.diff.paths, "infrastructure/unauthorized-terraform.tf"],
    },
  };
  assert.throws(
    () => verifyReconciliation(alteredSnapshot, mockPolicy, TRACK_B_RECONCILIATION),
    /Unreconciled non-migration SPECIAL path: infrastructure\/unauthorized-terraform.tf/,
  );
});

test("10. Direct / unmerged commit or missing Track B leading sequence fails closed", () => {
  // Altered leading PR sequence (e.g. missing PR #492)
  const missingLeadingPrSnapshot = {
    ...validSnapshot,
    prs: [999, 493, 494, 495, 496, 498, 499, 500, 501],
  };
  assert.throws(
    () => verifyReconciliation(missingLeadingPrSnapshot, mockPolicy, TRACK_B_RECONCILIATION),
    /Track B sealed interval PR mismatch at position 0/,
  );

  // Insufficient PRs (fewer than 9 Track B PRs)
  const truncatedPrSnapshot = {
    ...validSnapshot,
    prs: [492, 493, 494],
  };
  assert.throws(
    () => verifyReconciliation(truncatedPrSnapshot, mockPolicy, TRACK_B_RECONCILIATION),
    /Missing Track B interval PRs: expected at least 9/,
  );
});

test("11. Widening allowedSpecialPaths cannot itself silently authorize arbitrary privileged paths", () => {
  // Direct test of auditPostTrackBDelta rejection on runtime/config files
  assert.throws(
    () => auditPostTrackBDelta(["src/secret.ts"]),
    /Post-Track-B delta cannot contain runtime, migration or provider changes: src\/secret.ts/,
  );
  assert.throws(
    () => auditPostTrackBDelta(["instances/yourmeal-eatclean/wrangler.prod.json"]),
    /Post-Track-B delta cannot contain runtime, migration or provider changes: instances\/yourmeal-eatclean\/wrangler.prod.json/,
  );
  assert.throws(
    () => auditPostTrackBDelta(["package.json"]),
    /Post-Track-B delta cannot contain runtime, migration or provider changes: package.json/,
  );
  assert.throws(
    () => auditPostTrackBDelta(["arbitrary/tooling/script.sh"]),
    /Post-Track-B delta path outside allowed governance scope: arbitrary\/tooling\/script.sh/,
  );

  // Allowed governance paths pass auditPostTrackBDelta
  const validAudit = auditPostTrackBDelta([
    "scripts/governance/release-reconciliation.mjs",
    "scripts/governance/release-reconciliation.spec.mjs",
    ".github/workflows/deploy-production.yml",
    "docs/05-architecture/GATE7_POST_MERGE_AUTOMATION.md",
  ]);
  assert.equal(validAudit.valid, true);
  assert.equal(validAudit.auditedCount, 4);
});

test("12. Track B reconciliation still cannot constitute production approval", () => {
  // 1. Reconciliation grants preparation eligibility, NEVER production approval
  assert.equal(preparationEligible("AUTHORIZED_RECONCILED_RELEASE"), true);
  assert.equal(preparationEligible("PREPARED"), false);

  // 2. Sovereign production approval requires explicit OOB approval on production-worker
  const forgedApprovals = [
    {
      state: "approved",
      environments: [{ name: "production-worker" }],
      user: { id: 999999999, login: "attacker" }, // Not Alexander
    },
  ];
  assert.throws(
    () => assertApproval(forgedApprovals, mockPolicy),
    /Explicit sovereign production approval required/,
  );

  // 3. Environment protection rule integrity prevents admin bypass
  const bypassEnv = {
    name: "production-worker",
    can_admins_bypass: true,
    protection_rules: [
      { type: "required_reviewers", reviewers: [{ type: "User", reviewer: { id: mockPolicy.reviewerId } }] },
    ],
  };
  assert.throws(
    () => assertEnvironment(bypassEnv, mockPolicy),
    /Production environment authority changed or cannot be proved/,
  );

  // 4. Manifest binding between Phase 1 and Phase 2 is mandatory
  const verified = verifyReconciliation(validSnapshot, mockPolicy, TRACK_B_RECONCILIATION);
  const validManifest = {
    plan: { decision: "AUTHORIZED_RECONCILED_RELEASE", reconciliation: verified },
    reconciliation: verified,
  };
  const freshPlan = { decision: "AUTHORIZED_RECONCILED_RELEASE", reconciliation: verified };
  assert.doesNotThrow(() => assertReconciliationManifest(validManifest, freshPlan));

  const alteredFreshPlan = {
    decision: "AUTHORIZED_RECONCILED_RELEASE",
    reconciliation: { ...verified, reconciliationId: "0000000000000000000000000000000000000000000000000000000000000000" },
  };
  assert.throws(
    () => assertReconciliationManifest(validManifest, alteredFreshPlan),
    /Phase 1 \/ Phase 2 reconciliation scope changed/,
  );
});
