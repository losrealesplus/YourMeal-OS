import test from "node:test";
import assert from "node:assert/strict";
import {
  TRACK_B_RECONCILIATION,
  RECONCILIATION_GOVERNANCE_PR,
  TRACK_B_SEALED_MIGRATION_BASELINE,
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

test("1. Current #492→#501 exact interval + exact reconciliation is eligible", () => {
  const result = verifyReconciliation(validSnapshot, mockPolicy, TRACK_B_RECONCILIATION);
  assert.equal(result.reconciled, true);
  assert.ok(result.reconciliationId);
  assert.equal(result.payload.schema, 1);
  assert.equal(result.payload.reconciliationType, "PROVIDER_MIGRATIONS_TRACK_B");
  assert.equal(result.payload.sealedMigrationSha, TRACK_B_SEALED_MIGRATION_BASELINE);
  assert.equal(result.payload.governancePr, null);
  assert.equal(result.payload.migrations.length, 6);
  assert.equal(preparationEligible("AUTHORIZED_RECONCILED_RELEASE"), true);
});

test("2. Post-#502 merge interval [492..501, 502] with advanced main SHA is eligible", () => {
  const postMergeSnapshot = {
    ...validSnapshot,
    diff: {
      ...validSnapshot.diff,
      commits: [...validSnapshot.diff.commits, "1111222233334444555566667777888899990000"],
    },
    prs: [...validSnapshot.prs, RECONCILIATION_GOVERNANCE_PR],
    currentMainSha: "1111222233334444555566667777888899990000",
    targetSha: "1111222233334444555566667777888899990000",
  };
  const result = verifyReconciliation(postMergeSnapshot, mockPolicy, TRACK_B_RECONCILIATION);
  assert.equal(result.reconciled, true);
  assert.equal(result.payload.governancePr, RECONCILIATION_GOVERNANCE_PR);
  assert.equal(result.payload.targetSha, "1111222233334444555566667777888899990000");
  assert.equal(result.payload.sealedMigrationSha, TRACK_B_SEALED_MIGRATION_BASELINE);
});

test("3. Future release with extra PR #503 fails closed", () => {
  const futureSnapshot = {
    ...validSnapshot,
    prs: [...validSnapshot.prs, 502, 503],
  };
  assert.throws(
    () => verifyReconciliation(futureSnapshot, mockPolicy, TRACK_B_RECONCILIATION),
    /Invalid release PR composition/,
  );
});

test("4. Reconciliation fails if baseline SHA differs", () => {
  const alteredSnapshot = {
    ...validSnapshot,
    baseline: {
      ...validSnapshot.baseline,
      sha: "0000000000000000000000000000000000000000",
    },
  };
  assert.throws(
    () => verifyReconciliation(alteredSnapshot, mockPolicy, TRACK_B_RECONCILIATION),
    /Baseline SHA mismatch for reconciliation/,
  );
});

test("5. Reconciliation fails if baseline deployment ID differs", () => {
  const alteredSnapshot = {
    ...validSnapshot,
    baseline: {
      ...validSnapshot.baseline,
      deploymentId: 9999999999,
    },
  };
  assert.throws(
    () => verifyReconciliation(alteredSnapshot, mockPolicy, TRACK_B_RECONCILIATION),
    /Baseline deployment ID mismatch for reconciliation/,
  );
});

test("6. Changed migration in reconciliation fails closed", () => {
  const corruptedReconciliation = {
    ...TRACK_B_RECONCILIATION,
    migrations: TRACK_B_RECONCILIATION.migrations.map((m) =>
      m.tag === "A1" ? { ...m, path: "supabase/migrations/unauthorized.sql" } : m,
    ),
  };
  assert.throws(
    () => verifyReconciliation(validSnapshot, mockPolicy, corruptedReconciliation),
    /Missing reconciled migration/,
  );
});

test("7. Additional unexpected migration in diff fails closed", () => {
  const alteredSnapshot = {
    ...validSnapshot,
    diff: {
      ...validSnapshot.diff,
      paths: [
        ...validSnapshot.diff.paths,
        "supabase/migrations/20261007000000_unauthorized_extra_migration.sql",
      ],
    },
  };
  assert.throws(
    () => verifyReconciliation(alteredSnapshot, mockPolicy, TRACK_B_RECONCILIATION),
    /Migration count mismatch/,
  );
});

test("8. Missing required migration in diff fails closed", () => {
  const alteredSnapshot = {
    ...validSnapshot,
    diff: {
      ...validSnapshot.diff,
      paths: validSnapshot.diff.paths.filter(
        (p) => !p.includes("20261005113919_cr_order_expand_readers_foundation"),
      ),
    },
  };
  assert.throws(
    () => verifyReconciliation(alteredSnapshot, mockPolicy, TRACK_B_RECONCILIATION),
    /Migration count mismatch/,
  );
});

test("9. Different provider identity / unverified state fails closed", () => {
  const unverifiedProvider = {
    ...TRACK_B_RECONCILIATION,
    provider: {
      ...TRACK_B_RECONCILIATION.provider,
      verificationState: "UNVERIFIED",
    },
  };
  assert.throws(
    () => verifyReconciliation(validSnapshot, mockPolicy, unverifiedProvider),
    /Provider verification state must be PROVIDER_MIGRATIONS_VERIFIED/,
  );

  const openTrackB = {
    ...TRACK_B_RECONCILIATION,
    provider: {
      ...TRACK_B_RECONCILIATION.provider,
      trackB: "OPEN",
    },
  };
  assert.throws(
    () => verifyReconciliation(validSnapshot, mockPolicy, openTrackB),
    /Track B status must be CLOSED/,
  );

  const wrongProject = {
    ...TRACK_B_RECONCILIATION,
    provider: {
      ...TRACK_B_RECONCILIATION.provider,
      projectId: "other-project-id",
    },
  };
  assert.throws(
    () => verifyReconciliation(validSnapshot, mockPolicy, wrongProject),
    /Provider project ID mismatch/,
  );
});

test("10. Unrelated unknown SPECIAL path in diff fails closed", () => {
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

test("11. Sovereign approval authority provenance: forged reviewer ID / payload fails closed", () => {
  // Forged reviewerId in approval payload
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

  // Forged non-approved state
  const pendingApprovals = [
    {
      state: "pending",
      environments: [{ name: "production-worker" }],
      user: { id: mockPolicy.reviewerId, login: "losrealesplus" },
    },
  ];
  assert.throws(
    () => assertApproval(pendingApprovals, mockPolicy),
    /Explicit sovereign production approval required/,
  );

  // Environment mismatch (approval for staging instead of production-worker)
  const stagingApprovals = [
    {
      state: "approved",
      environments: [{ name: "staging" }],
      user: { id: mockPolicy.reviewerId, login: "losrealesplus" },
    },
  ];
  assert.throws(
    () => assertApproval(stagingApprovals, mockPolicy),
    /Explicit sovereign production approval required/,
  );
});

test("12. Environment protection rule integrity: bypass or missing reviewer fails closed", () => {
  // Environment where admin can bypass
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

  // Environment with different reviewer
  const wrongReviewerEnv = {
    name: "production-worker",
    can_admins_bypass: false,
    protection_rules: [
      { type: "required_reviewers", reviewers: [{ type: "User", reviewer: { id: 88888888 } }] },
    ],
  };
  assert.throws(
    () => assertEnvironment(wrongReviewerEnv, mockPolicy),
    /Production environment authority changed or cannot be proved/,
  );
});

test("13. Reconciliation does not bypass Phase 1 / Phase 2 manifest assertions", () => {
  const verified = verifyReconciliation(validSnapshot, mockPolicy, TRACK_B_RECONCILIATION);
  const validManifest = {
    plan: {
      decision: "AUTHORIZED_RECONCILED_RELEASE",
      reconciliation: verified,
    },
    reconciliation: verified,
  };
  const freshPlan = {
    decision: "AUTHORIZED_RECONCILED_RELEASE",
    reconciliation: verified,
  };

  // Valid manifest passes
  assert.doesNotThrow(() => assertReconciliationManifest(validManifest, freshPlan));

  // Altered reconciliation in Phase 2 fails closed
  const alteredFreshPlan = {
    decision: "AUTHORIZED_RECONCILED_RELEASE",
    reconciliation: {
      ...verified,
      reconciliationId: "0000000000000000000000000000000000000000000000000000000000000000",
    },
  };
  assert.throws(
    () => assertReconciliationManifest(validManifest, alteredFreshPlan),
    /Phase 1 \/ Phase 2 reconciliation scope changed/,
  );

  // Fallback to normal publication when reconciliation expected fails closed
  const unverifiedPlan = {
    decision: "DEPLOYABLE",
  };
  assert.throws(
    () => assertReconciliationManifest(validManifest, unverifiedPlan),
    /Reconciliation cannot fall back to unverified publication/,
  );
});
