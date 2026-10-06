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

// A4b tests use synthetic GitHub evidence; no API/provider/workflow mutations.
const { A4B_CLOSED_RECONCILIATION: a4b, verifyA4bReconciliation } =
  await import("./release-reconciliation.mjs");
const finalA4b = "a".repeat(40);
const a4bPr = (number, sha, branch = "codex/cr-order-a4b-custom-capture") => ({
  number,
  merged_at: "2026-10-06T00:00:00Z",
  merge_commit_sha: sha,
  base: { ref: "main", repo: { full_name: mockPolicy.repository } },
  head: { ref: branch, repo: { full_name: mockPolicy.repository } },
  merged_by: { id: 292604102, login: "losrealesplus" },
});
function a4bSnapshot() {
  return {
    repository: mockPolicy.repository,
    baseline: {
      sha: a4b.baselineSha,
      deploymentId: a4b.baselineDeploymentId,
      versionId: a4b.baselineVersionId,
    },
    targetSha: finalA4b,
    currentMainSha: finalA4b,
    originalDecision: a4b.originalDecision,
    constraints: structuredClone(a4b.constraints),
    productPr: a4bPr(504, a4b.sealedProductTargetSha),
    remediation: a4bPr(505, finalA4b, a4b.governanceBranch),
    commits: [
      {
        sha: a4b.sealedProductTargetSha,
        parent: a4b.baselineSha,
        pr: 504,
        paths: [...a4b.allProductPaths],
        specialFiles: structuredClone(a4b.specialFiles),
      },
      {
        sha: finalA4b,
        parent: a4b.sealedProductTargetSha,
        pr: 505,
        paths: [...a4b.governanceFiles],
        specialFiles: a4b.governanceFiles.map((path) => ({
          path,
          before: null,
          after: "b".repeat(64),
        })),
      },
    ],
    diff: {
      commits: [a4b.sealedProductTargetSha, finalA4b],
      paths: [...new Set([...a4b.allProductPaths, ...a4b.governanceFiles])].sort(),
    },
  };
}
test("A4b sealed interval PASS and immutable record", () => {
  const result = verifyA4bReconciliation(a4bSnapshot(), mockPolicy);
  assert.equal(result.payload.finalSourceSha, finalA4b);
  assert.equal(result.payload.liveClosure, "UNVERIFIED_REQUIRES_SEPARATE_READ_ONLY_CERTIFICATION");
  assert.equal(preparationEligible("AUTHORIZED_RECONCILED_RELEASE"), true);
  assert.ok(Object.isFrozen(a4b.specialFiles));
  assert.ok(Object.isFrozen(a4b.constraints));
});
const a4bInvalid = [
  [
    "wrong production baseline",
    (s) => {
      s.baseline.sha = "b".repeat(40);
    },
  ],
  [
    "wrong deployment",
    (s) => {
      s.baseline.deploymentId++;
    },
  ],
  [
    "wrong baseline version",
    (s) => {
      s.baseline.versionId = "wrong";
    },
  ],
  [
    "wrong product target",
    (s) => {
      s.commits[0].sha = "c".repeat(40);
    },
  ],
  [
    "wrong PR",
    (s) => {
      s.commits[0].pr = 503;
    },
  ],
  [
    "extra product commit",
    (s) => {
      s.commits.splice(1, 0, structuredClone(s.commits[0]));
    },
  ],
  [
    "extra runtime path",
    (s) => {
      s.commits[1].paths.push("src/app.ts");
    },
  ],
  [
    "missing path",
    (s) => {
      s.commits[0].paths.pop();
    },
  ],
  [
    "modified SPECIAL hash",
    (s) => {
      s.commits[0].specialFiles[0].after = "c".repeat(64);
    },
  ],
  [
    "wrong human identity",
    (s) => {
      s.remediation.merged_by.id = 1;
    },
  ],
  [
    "missing authority evidence",
    (s) => {
      delete s.productPr.merged_by;
    },
  ],
  [
    "missing governance merge evidence",
    (s) => {
      s.remediation.merged_at = null;
    },
  ],
  [
    "wrong canonical repo",
    (s) => {
      s.remediation.head.repo.full_name = "attacker/fork";
    },
  ],
  [
    "wrong branch",
    (s) => {
      s.remediation.head.ref = "main";
    },
  ],
  [
    "wrong product parent",
    (s) => {
      s.commits[0].parent = "c".repeat(40);
    },
  ],
  [
    "wrong governance parent",
    (s) => {
      s.commits[1].parent = "c".repeat(40);
    },
  ],
  [
    "different finalSource replay",
    (s) => {
      s.targetSha = "c".repeat(40);
      s.currentMainSha = s.targetSha;
    },
  ],
  [
    "stale main",
    (s) => {
      s.currentMainSha = "c".repeat(40);
    },
  ],
  [
    "no governance target",
    (s) => {
      s.targetSha = a4b.sealedProductTargetSha;
      s.currentMainSha = s.targetSha;
    },
  ],
  [
    "changed classification",
    (s) => {
      s.originalDecision = "DEPLOYABLE";
    },
  ],
  [
    "unknown outstanding history",
    (s) => {
      s.diff.commits.push("c".repeat(40));
    },
  ],
  [
    "unknown outstanding path",
    (s) => {
      s.diff.paths.push("surprise");
    },
  ],
  [
    "missing governance hash",
    (s) => {
      s.commits[1].specialFiles.pop();
    },
  ],
  [
    "invalid governance hash",
    (s) => {
      s.commits[1].specialFiles[0].after = "invalid";
    },
  ],
];
for (const [name, mutate] of a4bInvalid)
  test(`A4b FAIL: ${name}`, () => {
    const s = a4bSnapshot();
    mutate(s);
    assert.throws(() => verifyA4bReconciliation(s, mockPolicy));
  });
for (const path of [
  "supabase/migrations/extra.sql",
  "schema.sql",
  "src/modules/orders/infrastructure/canonical-order-write-repository.ts",
  "src/tenant/custom_activation.ts",
  "src/tenant/commercial-config.ts",
  "OP08.json",
  "src/extras.ts",
  "src/modules/weekly-menu/offer.ts",
  "src/catalogue.ts",
  ".github/workflows/deploy-production.yml",
]) {
  test(`A4b forbidden delta FAIL: ${path}`, () => {
    const s = a4bSnapshot();
    s.commits[1].paths.push(path);
    s.diff.paths.push(path);
    assert.throws(() => verifyA4bReconciliation(s, mockPolicy));
  });
}
for (const key of [
  "orders_custom_capture",
  "custom_activation",
  "M3",
  "OP08",
  "Extras",
  "migrations",
  "writerChanges",
  "productActivation",
]) {
  test(`A4b constraint FAIL: ${key}`, () => {
    const s = a4bSnapshot();
    s.constraints[key] = "OPEN";
    assert.throws(() => verifyA4bReconciliation(s, mockPolicy));
  });
}
test("Track B cannot authorize A4b and A4b cannot authorize Track B", () => {
  assert.throws(() => verifyReconciliation(a4bSnapshot(), mockPolicy));
  assert.throws(() => verifyA4bReconciliation(validSnapshot, mockPolicy));
  assert.throws(() => verifyReconciliation(validSnapshot, mockPolicy, a4b));
});
test("A4b manifest hash, final source and reconciliation divergence FAIL", () => {
  const verified = verifyA4bReconciliation(a4bSnapshot(), mockPolicy);
  const fresh = {
    decision: "AUTHORIZED_RECONCILED_RELEASE",
    reconciliation: verified,
    sourceSha: finalA4b,
  };
  const manifest = {
    plan: structuredClone(fresh),
    reconciliation: structuredClone(verified),
    sourceSha: finalA4b,
  };
  assert.doesNotThrow(() => assertReconciliationManifest(manifest, fresh));
  manifest.reconciliation.payload.finalSourceSha = "c".repeat(40);
  manifest.reconciliation.reconciliationId = "c".repeat(64);
  assert.throws(() => assertReconciliationManifest(manifest, fresh));
  const s = a4bSnapshot();
  s.targetSha = "c".repeat(40);
  s.currentMainSha = s.targetSha;
  s.commits[1].sha = s.targetSha;
  s.diff.commits[1] = s.targetSha;
  s.remediation.merge_commit_sha = s.targetSha;
  const other = verifyA4bReconciliation(s, mockPolicy);
  assert.notEqual(other.reconciliationId, verified.reconciliationId);
  assert.throws(() =>
    assertReconciliationManifest(
      { plan: fresh, reconciliation: verified },
      { ...fresh, reconciliation: other },
    ),
  );
});

test("A4b payload modification with unchanged ID and wrong manifest source FAIL", () => {
  const reconciliation = verifyA4bReconciliation(a4bSnapshot(), mockPolicy);
  const fresh = { decision: "AUTHORIZED_RECONCILED_RELEASE", reconciliation, sourceSha: finalA4b };
  for (const field of ["topPayload", "planPayload", "topSource", "planSource"]) {
    const manifest = {
      plan: structuredClone(fresh),
      reconciliation: structuredClone(reconciliation),
      sourceSha: finalA4b,
    };
    if (field === "topPayload") manifest.reconciliation.payload.constraints.M3 = "OPEN";
    if (field === "planPayload")
      manifest.plan.reconciliation.payload.finalSourceSha = "c".repeat(40);
    if (field === "topSource") manifest.sourceSha = "c".repeat(40);
    if (field === "planSource") manifest.plan.sourceSha = "c".repeat(40);
    assert.throws(() => assertReconciliationManifest(manifest, fresh));
  }
});
