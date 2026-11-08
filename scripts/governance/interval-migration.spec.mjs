import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  manifest,
  manifestSha256,
  policy,
  validateContext,
  validateAuthority,
  validateGovernanceCommit,
  validateManifestFiles,
  validatePreconditions,
  preflightSql,
  installationSql,
  backfillSql,
  privilegedSchemaPostchecksSql,
  fetchAndVerifyArtifact,
  databaseEnv,
  main,
} from './interval-migration.mjs';

const sha = 'ddc473f6451b82b3d36d0366eb8c90814f31547a';
const validPreflightDigest = 'a'.repeat(64);
const validInstallDigest = 'b'.repeat(64);

const baseContextEnv = {
  GITHUB_ACTIONS: 'true',
  GITHUB_REPOSITORY: policy.repository,
  GITHUB_REF: 'refs/heads/main',
  GITHUB_SHA: sha,
  GITHUB_RUN_ID: '777123',
  GITHUB_RUN_ATTEMPT: '1',
  GITHUB_EVENT_NAME: 'workflow_dispatch',
  EXPECTED_SOURCE_SHA: sha,
  EXPECTED_MANIFEST_SHA256: manifestSha256,
  MIGRATION_OPERATION: 'preflight',
};

const environment = {
  name: 'production-db',
  can_admins_bypass: false,
  deployment_branch_policy: { protected_branches: true, custom_branch_policies: false },
  protection_rules: [
    { type: 'required_reviewers', prevent_self_review: true, reviewers: [{ type: 'User', reviewer: { id: policy.reviewerId } }] },
  ],
};

const run = {
  head_branch: 'main',
  head_sha: sha,
  event: 'workflow_dispatch',
  run_attempt: 1,
  path: '.github/workflows/migrate-interval-production.yml',
  status: 'completed',
  conclusion: 'success',
  actor: { id: 7 },
  triggering_actor: { id: 7 },
};

const reviews = [{ state: 'approved', user: { id: policy.reviewerId }, environments: [{ name: 'production-db' }] }];

test('Manifest: structure, hashes, sequence and immutable constraints', () => {
  assert.equal(manifest.name, 'gate6-interval-567');
  assert.equal(manifest.repository, 'losrealesplus/YourMeal-OS');
  assert.equal(manifest.environment, 'production-db');
  assert.equal(manifest.project, 'nhirlpkuvonggctdzzad');
  assert.equal(manifest.published_base_sha, 'fcc7801548fe60c3994f08fa18dc5f11431c6138');
  assert.equal(manifest.base_candidate_sha, sha);
  assert.equal(manifest.governance_branch, 'feat/gate6-interval-567-executor');
  assert.equal(manifest.required_predecessor, '20261023065216');
  assert.equal(manifest.constraints.no_worker_publication, true);
  assert.equal(manifest.constraints.separate_backfill, true);
  assert.equal(manifest.migrations.length, 6);
  assert.deepEqual(manifest.allowed_governance_files, [
    '.github/workflows/migrate-interval-production.yml',
    'docs/05-architecture/GATE_6_B1_SPATIAL_567_EXECUTION_RUNBOOK.md',
    'scripts/governance/interval-migration.mjs',
    'scripts/governance/interval-migration.spec.mjs',
    'scripts/governance/release-interval-567-manifest.json',
  ]);

  // Validate exact sequence and file integrity
  assert.ok(validateManifestFiles());
});

test('Context: exact manual remote dispatch, manifest checksum, and operation requirements', () => {
  // Preflight valid
  assert.equal(validateContext(baseContextEnv).sha, sha);

  // Blocker 2: Expected manifest SHA256 validation (must match raw manifest hash exactly)
  assert.throws(
    () => validateContext({ ...baseContextEnv, EXPECTED_MANIFEST_SHA256: undefined }),
    /Expected manifest SHA-256 digest input is required/
  );
  assert.throws(
    () => validateContext({ ...baseContextEnv, EXPECTED_MANIFEST_SHA256: 'short' }),
    /Expected manifest SHA-256 digest input is required/
  );
  assert.throws(
    () => validateContext({ ...baseContextEnv, EXPECTED_MANIFEST_SHA256: '0'.repeat(64) }),
    /Manifest SHA-256 digest mismatch/
  );

  // Rejections for invalid context
  for (const overrides of [
    { GITHUB_ACTIONS: 'false' },
    { GITHUB_REF: 'refs/heads/feature' },
    { GITHUB_RUN_ATTEMPT: '2' },
    { GITHUB_EVENT_NAME: 'push' },
    { EXPECTED_SOURCE_SHA: 'a'.repeat(40) },
    { GITHUB_SHA: 'b'.repeat(40) },
    { MIGRATION_OPERATION: 'arbitrary' },
  ]) {
    assert.throws(() => validateContext({ ...baseContextEnv, ...overrides }));
  }

  // Install operation requires exact token, preflight report digest and valid run ID
  assert.throws(() => validateContext({ ...baseContextEnv, MIGRATION_OPERATION: 'install' }));
  assert.throws(() =>
    validateContext({
      ...baseContextEnv,
      MIGRATION_OPERATION: 'install',
      CONFIRMATION_TOKEN: 'WRONG_TOKEN',
      PREFLIGHT_REPORT_SHA256: validPreflightDigest,
      PREFLIGHT_RUN_ID: '12345',
    })
  );
  assert.throws(() =>
    validateContext({
      ...baseContextEnv,
      MIGRATION_OPERATION: 'install',
      CONFIRMATION_TOKEN: policy.installToken,
      PREFLIGHT_REPORT_SHA256: 'short',
      PREFLIGHT_RUN_ID: '12345',
    })
  );
  assert.throws(() =>
    validateContext({
      ...baseContextEnv,
      MIGRATION_OPERATION: 'install',
      CONFIRMATION_TOKEN: policy.installToken,
      PREFLIGHT_REPORT_SHA256: validPreflightDigest,
      PREFLIGHT_RUN_ID: undefined,
    })
  );
  const installCtx = validateContext({
    ...baseContextEnv,
    MIGRATION_OPERATION: 'install',
    CONFIRMATION_TOKEN: policy.installToken,
    PREFLIGHT_REPORT_SHA256: validPreflightDigest,
    PREFLIGHT_RUN_ID: '12345',
  });
  assert.equal(installCtx.sha, sha);

  // Backfill operation requires exact token, approved window, install report digest and valid run ID
  assert.throws(() => validateContext({ ...baseContextEnv, MIGRATION_OPERATION: 'backfill' }));
  assert.throws(() =>
    validateContext({
      ...baseContextEnv,
      MIGRATION_OPERATION: 'backfill',
      CONFIRMATION_TOKEN: policy.backfillToken,
      APPROVED_WINDOW: '',
      INSTALL_REPORT_SHA256: validInstallDigest,
      INSTALL_RUN_ID: '12346',
    })
  );
  assert.throws(() =>
    validateContext({
      ...baseContextEnv,
      MIGRATION_OPERATION: 'backfill',
      CONFIRMATION_TOKEN: policy.backfillToken,
      APPROVED_WINDOW: 'WINDOW_20261108_OPERATIONAL_QUIET',
      INSTALL_REPORT_SHA256: validInstallDigest,
      INSTALL_RUN_ID: undefined,
    })
  );
  const backfillCtx = validateContext({
    ...baseContextEnv,
    MIGRATION_OPERATION: 'backfill',
    CONFIRMATION_TOKEN: policy.backfillToken,
    APPROVED_WINDOW: 'WINDOW_20261108_OPERATIONAL_QUIET',
    INSTALL_REPORT_SHA256: validInstallDigest,
    INSTALL_RUN_ID: '12346',
  });
  assert.equal(backfillCtx.sha, sha);
});

test('Blocker 1: Dynamic governance commit reconciliation and multi-hop lineage validation', () => {
  // 1. Direct candidate commit validation
  const candidateResult = validateGovernanceCommit(policy.baseCandidateSha, policy.baseCandidateSha);
  assert.equal(candidateResult.candidate, true);
  assert.equal(candidateResult.governanceCommit, policy.baseCandidateSha);

  // 2. Single-hop child commit on main after first PR merge
  const mergedSha1 = 'e'.repeat(40);
  const validDiffFiles = [
    '.github/workflows/migrate-interval-production.yml',
    'scripts/governance/interval-migration.mjs',
  ];
  const singleHopResult = validateGovernanceCommit(
    mergedSha1,
    mergedSha1,
    () => validDiffFiles,
    () => true,
    () => [mergedSha1],
    () => validDiffFiles
  );
  assert.equal(singleHopResult.candidate, false);
  assert.equal(singleHopResult.governanceCommit, mergedSha1);
  assert.deepEqual(singleHopResult.commits, [mergedSha1]);
  assert.deepEqual(singleHopResult.changedFiles, validDiffFiles);

  // 3. Multi-hop governance lineage (subsequent governance PR merges on top of previous ones)
  const mergedSha2 = 'f'.repeat(40);
  const commit2Diff = ['scripts/governance/interval-migration.spec.mjs'];
  const cumulativeDiff = [...validDiffFiles, ...commit2Diff];
  const multiHopResult = validateGovernanceCommit(
    mergedSha2,
    mergedSha2,
    () => cumulativeDiff,
    () => true,
    () => [mergedSha1, mergedSha2],
    (c) => (c === mergedSha1 ? validDiffFiles : commit2Diff)
  );
  assert.equal(multiHopResult.candidate, false);
  assert.equal(multiHopResult.governanceCommit, mergedSha2);
  assert.deepEqual(multiHopResult.commits, [mergedSha1, mergedSha2]);
  assert.deepEqual(multiHopResult.changedFiles, cumulativeDiff);

  // 4. Rejection: Target SHA does not match current main HEAD
  assert.throws(
    () => validateGovernanceCommit(mergedSha1, '0'.repeat(40), () => validDiffFiles, () => true, () => [mergedSha1], () => validDiffFiles),
    /Target SHA does not match current main branch HEAD/
  );

  // 5. Rejection: Lineage violation (baseCandidateSha is not an ancestor)
  assert.throws(
    () =>
      validateGovernanceCommit(
        mergedSha1,
        mergedSha1,
        () => validDiffFiles,
        () => false,
        () => [mergedSha1],
        () => validDiffFiles
      ),
    /Governance commit lineage violation.*not an ancestor/
  );

  // 6. Rejection: Disallowed file in an intermediate governance commit
  assert.throws(
    () =>
      validateGovernanceCommit(
        mergedSha2,
        mergedSha2,
        () => cumulativeDiff,
        () => true,
        () => [mergedSha1, mergedSha2],
        (c) => (c === mergedSha1 ? validDiffFiles : [...commit2Diff, 'src/unauthorized.ts'])
      ),
    /Disallowed file in governance commit .*: src\/unauthorized\.ts/
  );

  // 7. Rejection: Disallowed file in cumulative diff
  assert.throws(
    () =>
      validateGovernanceCommit(
        mergedSha1,
        mergedSha1,
        () => [...validDiffFiles, 'config/database.json'],
        () => true,
        () => [mergedSha1],
        () => validDiffFiles
      ),
    /Disallowed file in Gate 6 cumulative governance diff: config\/database\.json/
  );

  // 8. Rejection: Empty commit list
  assert.throws(
    () =>
      validateGovernanceCommit(
        mergedSha1,
        mergedSha1,
        () => validDiffFiles,
        () => true,
        () => [],
        () => validDiffFiles
      ),
    /No governance commits found between candidate base/
  );

  // 9. Rejection: Empty cumulative diff
  assert.throws(
    () =>
      validateGovernanceCommit(
        mergedSha1,
        mergedSha1,
        () => [],
        () => true,
        () => [mergedSha1],
        () => validDiffFiles
      ),
    /Governance commit cumulative diff is empty/
  );
});

test('Authority: environment, review rules and main alignment fail-closed', () => {
  const ctx = validateContext(baseContextEnv);
  validateAuthority(ctx, environment, run, sha, reviews);

  // Rejections
  assert.throws(() => validateAuthority(ctx, { ...environment, can_admins_bypass: true }, run, sha, reviews));
  assert.throws(() => validateAuthority(ctx, environment, { ...run, actor: { id: policy.reviewerId } }, sha, reviews));
  assert.throws(() => validateAuthority(ctx, environment, run, 'a'.repeat(40), reviews));
  assert.throws(() => validateAuthority(ctx, environment, { ...run, path: '.github/workflows/deploy-production.yml' }, sha, reviews));
  assert.throws(() => validateAuthority(ctx, environment, run, sha, [{ ...reviews[0], state: 'rejected' }]));
  assert.throws(() => validateAuthority(ctx, environment, run, sha, [{ ...reviews[0], user: { id: 999 } }]));
  assert.throws(() => validateAuthority(ctx, environment, run, sha, [{ ...reviews[0], environments: [{ name: 'production-worker' }] }]));
});

test('Blocker 3: fetchAndVerifyArtifact enforces cross-run artifact chain and digests', () => {
  const mockRun = {
    path: '.github/workflows/migrate-interval-production.yml',
    head_branch: 'main',
    head_sha: sha,
    status: 'completed',
    conclusion: 'success',
    event: 'workflow_dispatch',
  };

  const sampleReport = {
    state: 'READ_ONLY_PREFLIGHT_PASS',
    sourceSha: sha,
    project: policy.project,
    manifestSha256,
    observedLedgerHead: policy.requiredPredecessor,
    ledgerVersions: ['20261020000000', '20261023065216'],
  };
  const reportBytes = Buffer.from(JSON.stringify(sampleReport, null, 2));
  const expectedSha256 = crypto.createHash('sha256').update(reportBytes).digest('hex');

  const mockArtifacts = {
    total_count: 1,
    artifacts: [
      {
        id: 998877,
        name: 'interval-preflight-report-777123-1',
        expired: false,
      },
    ],
  };

  const mockRequest = (resource) => {
    if (resource === 'actions/runs/777123') return mockRun;
    if (resource === 'actions/runs/777123/artifacts?per_page=100') return mockArtifacts;
    throw new Error(`Unexpected mock resource: ${resource}`);
  };

  const mockDownload = (runId, artifactName, targetDir) => {
    fs.writeFileSync(path.join(targetDir, 'interval-migration-preflight-report.json'), reportBytes);
  };

  const ctx = { sha };

  // 1. Success case
  const verified = fetchAndVerifyArtifact({
    expectedRunId: '777123',
    expectedArtifactId: '998877',
    expectedArtifactName: 'interval-preflight-report-777123-1',
    expectedReportFileName: 'interval-migration-preflight-report.json',
    expectedReportSha256: expectedSha256,
    expectedState: 'READ_ONLY_PREFLIGHT_PASS',
    manifestDigest: manifestSha256,
    ctx,
    request: mockRequest,
    execDownload: mockDownload,
  });
  assert.equal(verified.report.state, 'READ_ONLY_PREFLIGHT_PASS');
  assert.equal(verified.reportSha256, expectedSha256);

  // 2. Rejection: wrong workflow path
  assert.throws(
    () =>
      fetchAndVerifyArtifact({
        expectedRunId: '777123',
        expectedReportSha256: expectedSha256,
        expectedState: 'READ_ONLY_PREFLIGHT_PASS',
        manifestDigest: manifestSha256,
        ctx,
        request: (r) => (r === 'actions/runs/777123' ? { ...mockRun, path: '.github/workflows/other.yml' } : mockArtifacts),
        execDownload: mockDownload,
      }),
    /Untrusted artifact source workflow path/
  );

  // 3. Rejection: not main branch
  assert.throws(
    () =>
      fetchAndVerifyArtifact({
        expectedRunId: '777123',
        expectedReportSha256: expectedSha256,
        expectedState: 'READ_ONLY_PREFLIGHT_PASS',
        manifestDigest: manifestSha256,
        ctx,
        request: (r) => (r === 'actions/runs/777123' ? { ...mockRun, head_branch: 'feature' } : mockArtifacts),
        execDownload: mockDownload,
      }),
    /Artifact source run must be on main branch/
  );

  // 4. Rejection: run head SHA mismatch
  assert.throws(
    () =>
      fetchAndVerifyArtifact({
        expectedRunId: '777123',
        expectedReportSha256: expectedSha256,
        expectedState: 'READ_ONLY_PREFLIGHT_PASS',
        manifestDigest: manifestSha256,
        ctx,
        request: (r) => (r === 'actions/runs/777123' ? { ...mockRun, head_sha: '0'.repeat(40) } : mockArtifacts),
        execDownload: mockDownload,
      }),
    /Artifact source head SHA mismatch/
  );

  // 5. Rejection: run failed or incomplete
  assert.throws(
    () =>
      fetchAndVerifyArtifact({
        expectedRunId: '777123',
        expectedReportSha256: expectedSha256,
        expectedState: 'READ_ONLY_PREFLIGHT_PASS',
        manifestDigest: manifestSha256,
        ctx,
        request: (r) => (r === 'actions/runs/777123' ? { ...mockRun, conclusion: 'failure' } : mockArtifacts),
        execDownload: mockDownload,
      }),
    /Source run not completed successfully/
  );

  // 6. Rejection: artifact missing or expired
  assert.throws(
    () =>
      fetchAndVerifyArtifact({
        expectedRunId: '777123',
        expectedReportFileName: 'interval-migration-preflight-report.json',
        expectedReportSha256: expectedSha256,
        expectedState: 'READ_ONLY_PREFLIGHT_PASS',
        manifestDigest: manifestSha256,
        ctx,
        request: (r) =>
          r === 'actions/runs/777123' ? mockRun : { total_count: 1, artifacts: [{ ...mockArtifacts.artifacts[0], expired: true }] },
        execDownload: mockDownload,
      }),
    /Target artifact missing or expired in remote run/
  );

  // 7. Rejection: downloaded report digest mismatch
  assert.throws(
    () =>
      fetchAndVerifyArtifact({
        expectedRunId: '777123',
        expectedArtifactId: '998877',
        expectedArtifactName: 'interval-preflight-report-777123-1',
        expectedReportFileName: 'interval-migration-preflight-report.json',
        expectedReportSha256: 'f'.repeat(64),
        expectedState: 'READ_ONLY_PREFLIGHT_PASS',
        manifestDigest: manifestSha256,
        ctx,
        request: mockRequest,
        execDownload: mockDownload,
      }),
    /Artifact report digest mismatch/
  );

  // 8. Rejection: report manifest digest mismatch
  assert.throws(
    () =>
      fetchAndVerifyArtifact({
        expectedRunId: '777123',
        expectedArtifactId: '998877',
        expectedArtifactName: 'interval-preflight-report-777123-1',
        expectedReportFileName: 'interval-migration-preflight-report.json',
        expectedReportSha256: expectedSha256,
        expectedState: 'READ_ONLY_PREFLIGHT_PASS',
        manifestDigest: 'e'.repeat(64),
        ctx,
        request: mockRequest,
        execDownload: mockDownload,
      }),
    /Report manifest digest/
  );
});

test('Preconditions: ledger lineage, absence set, table existence and lock checks', () => {
  const validObserved = {
    projectVerified: true,
    tenantVerified: true,
    ledgerVersions: ['20261020000000', '20261023065216'],
    terminalPredecessor: '20261023065216',
    tablesPresent: { ingredients: true, orders: true, purchase_invoices: true },
    activeLocksCount: 0,
  };

  assert.ok(validatePreconditions(validObserved));

  // Rejection: target migration already present
  assert.throws(() =>
    validatePreconditions({
      ...validObserved,
      ledgerVersions: ['20261020000000', '20261023065216', '20261024175900'],
    })
  );

  // Rejection: wrong terminal predecessor
  assert.throws(() =>
    validatePreconditions({
      ...validObserved,
      ledgerVersions: ['20261020000000', '20261022000000'],
    })
  );

  // Rejection: missing core table
  assert.throws(() =>
    validatePreconditions({
      ...validObserved,
      tablesPresent: { ingredients: false, orders: true, purchase_invoices: true },
    })
  );

  // Rejection: active exclusive locks present
  assert.throws(() =>
    validatePreconditions({
      ...validObserved,
      activeLocksCount: 2,
    })
  );

  // Rejection: wrong project or tenant
  assert.throws(() => validatePreconditions({ ...validObserved, projectVerified: false }));
  assert.throws(() => validatePreconditions({ ...validObserved, tenantVerified: false }));
});

test('Database Env: verify-full TLS, pinned CA and protection against demo/external leakage', () => {
  const validUrl = 'postgresql://postgres.nhirlpkuvonggctdzzad:secret@aws-0-eu-central-1.pooler.supabase.com:5432/postgres';
  const env = databaseEnv({ SUPABASE_DB_URL_PROD: validUrl, PGHOST: 'evil.com', PGUSER: 'evil' });

  assert.equal(env.PGHOST, 'aws-0-eu-central-1.pooler.supabase.com');
  assert.equal(env.PGUSER, 'postgres.nhirlpkuvonggctdzzad');
  assert.equal(env.PGPORT, '5432');
  assert.equal(env.PGSSLMODE, 'verify-full');
  assert.ok(fs.existsSync(env.PGSSLROOTCERT));

  // Rejections
  assert.throws(() => databaseEnv({}));
  assert.throws(() => databaseEnv({ SUPABASE_DB_URL_PROD: validUrl.replace('nhirlpkuvonggctdzzad', 'djangucecsphnejplvic') }));
  assert.throws(() => databaseEnv({ SUPABASE_DB_URL_PROD: validUrl.replace(':5432', ':5433') }));
  assert.throws(() => databaseEnv({ SUPABASE_DB_URL_PROD: validUrl.replace('/postgres', '/otherdb') }));
});

test('Blocker 4: installationSql enforces full ledger drift comparison under lock', () => {
  const mockPfReport = {
    observedLedgerHead: '20261023065216',
    ledgerVersions: ['20261020000000', '20261023065216'],
  };
  const inst = installationSql(mockPfReport);
  assert.ok(inst.startsWith('BEGIN;'));
  assert.ok(inst.includes("lock_timeout = '5000ms'"));
  assert.ok(inst.includes("statement_timeout = '30000ms'"));
  assert.ok(inst.includes("pg_advisory_xact_lock(hashtextextended('eatclean-interval-567-install', 0))"));
  assert.ok(inst.includes('LOCK TABLE supabase_migrations.schema_migrations IN EXCLUSIVE MODE;'));

  // Blocker 4: Full array comparison using IS DISTINCT FROM
  assert.ok(inst.includes("IF v_observed IS DISTINCT FROM '[\"20261020000000\",\"20261023065216\"]'::jsonb THEN"));
  assert.ok(inst.includes("RAISE EXCEPTION 'Ledger state drift detected: live ledger does not match approved preflight ledger versions';"));

  // Check that all 6 migrations are embedded exactly once in DDL and once in ledger insert
  for (const m of policy.migrations) {
    assert.ok(inst.includes(`MIGRATION ${m.version}: ${m.name}`));
    assert.ok(inst.includes(`VALUES('${m.version}', '${m.name}'`));
  }
  assert.ok(inst.includes('resolve_inventory_location_v1'));
  assert.ok(inst.includes('receive_purchase_invoice_v1'));
  assert.ok(inst.includes('v_ingredient_stocks'));
  assert.ok(inst.trim().endsWith('COMMIT;'));

  // Rejection when ledgerVersions is invalid
  assert.throws(() => installationSql({ observedLedgerHead: '20261023065216' }), /Preflight report missing ledgerVersions array/);
  assert.throws(() => installationSql({ ledgerVersions: [] }), /Preflight report predecessor mismatch/);
});

test('Blocker 5: backfillSql invokes execute_gate_b1_backfill_v1 exactly once via temp table', () => {
  const bf = backfillSql();
  assert.ok(bf.startsWith('BEGIN;'));
  assert.ok(bf.includes("pg_advisory_xact_lock(hashtextextended('gate_b1_backfill_lock', 0))"));

  // Verify single invocation via CREATE TEMPORARY TABLE ON COMMIT DROP
  assert.ok(
    bf.includes(
      'CREATE TEMPORARY TABLE _gate_b1_backfill_run ON COMMIT DROP AS\n  SELECT public.execute_gate_b1_backfill_v1() AS result;'
    )
  );

  // Exact invocation count assertion: MUST be called exactly once in the entire SQL text
  const occurrences = (bf.match(/execute_gate_b1_backfill_v1/g) || []).length;
  assert.equal(occurrences, 1, `execute_gate_b1_backfill_v1 must occur exactly 1 time in backfillSql, observed ${occurrences}`);

  // Guard reads from temp table
  assert.ok(bf.includes('SELECT result INTO v_res FROM _gate_b1_backfill_run;'));
  assert.ok(bf.includes("'backfillResult', (SELECT result FROM _gate_b1_backfill_run)"));
  assert.ok(bf.includes('Stock sum drift post-backfill'));
  assert.ok(bf.trim().endsWith('COMMIT;'));
});

test('Blocker 6: privilegedSchemaPostchecksSql precision and disclaimers', () => {
  const postchecks = privilegedSchemaPostchecksSql();
  assert.ok(postchecks.startsWith('BEGIN TRANSACTION READ ONLY;'));
  assert.ok(postchecks.includes('schemaPostcheck1_ingredientsCatalogReadable'));
  assert.ok(postchecks.includes('schemaPostcheck2_purchaseInvoicesColumnsExist'));
  assert.ok(postchecks.includes('schemaPostcheck3_identityBridgeFunctionCallablePrivileged'));
  assert.ok(postchecks.includes('schemaPostcheck4_kitchenProductionBatchesAccessible'));
  assert.ok(postchecks.trim().endsWith('COMMIT;'));

  // Ensure no claims of RLS/JWT testing exist in the queries
  assert.ok(!postchecks.includes('auth.uid()'));
  assert.ok(!postchecks.includes('request.jwt.claim'));
});

test('Full offline simulation: validate -> preflight -> install -> backfill (no live credentials)', () => {
  const fakeApi = (resource) => {
    if (resource.startsWith('environments/')) return environment;
    if (resource.startsWith('actions/runs/')) {
      if (resource.endsWith('/approvals')) return reviews;
      if (resource.includes('/artifacts')) {
        return {
          total_count: 2,
          artifacts: [
            {
              id: 112233,
              name: 'interval-preflight-report-777123-1',
              expired: false,
            },
            {
              id: 445566,
              name: 'interval-install-report-777124-1',
              expired: false,
            },
          ],
        };
      }
      return run;
    }
    if (resource === 'git/ref/heads/main') return { object: { sha } };
    throw new Error(`Unexpected mock resource: ${resource}`);
  };

  const validPreflightDbResponse = JSON.stringify({
    projectVerified: true,
    tenantVerified: true,
    ledgerVersions: ['20261020000000', '20261023065216'],
    terminalPredecessor: '20261023065216',
    tablesPresent: { ingredients: true, orders: true, purchase_invoices: true },
    identityBridgePreexisting: true,
    dynamicStats: { ingredientsCount: 150, purchaseInvoicesCount: 42 },
    activeLocksCount: 0,
  });

  const validPostchecksDbResponse = JSON.stringify({
    schemaPostcheck1_ingredientsCatalogReadable: [{ id: 'ing-1', name: 'Arroz', stock: 10.5 }],
    schemaPostcheck2_purchaseInvoicesColumnsExist: [{ id: 'inv-1', status: 'received' }],
    schemaPostcheck3_identityBridgeFunctionCallablePrivileged: true,
    schemaPostcheck4_kitchenProductionBatchesAccessible: [{ id: 'batch-1', status: 'completed' }],
  });

  const validBackfillDbResponse = JSON.stringify({
    backfillResult: { success: true, total_balances_migrated: 150 },
    totalBalancesCount: 150,
    discrepanciesCount: 0,
    legacyPositiveStockSum: 550.25,
    spatialStockSum: 550.25,
  });

  const mockRunner = (sql) => {
    if (sql.includes('BEGIN TRANSACTION READ ONLY;') && sql.includes('terminalPredecessor')) {
      return validPreflightDbResponse;
    }
    if (sql.includes('BEGIN TRANSACTION READ ONLY;') && sql.includes('schemaPostcheck1_ingredientsCatalogReadable')) {
      return validPostchecksDbResponse;
    }
    if (sql.includes('eatclean-interval-567-install')) {
      return 'INSERT 0 1';
    }
    if (sql.includes('gate_b1_backfill_lock')) {
      return validBackfillDbResponse;
    }
    throw new Error(`Unexpected SQL input to mock runner: ${sql}`);
  };

  const fakePgEnv = {
    SUPABASE_DB_URL_PROD: 'postgresql://postgres.nhirlpkuvonggctdzzad:secret@aws-0-eu-central-1.pooler.supabase.com:5432/postgres',
  };

  // 1. Validate Mode
  const valResult = main('validate', { ...baseContextEnv, MIGRATION_OPERATION: 'validate' }, fakeApi, mockRunner);
  assert.equal(valResult.state, 'VALIDATED_OFFLINE');

  // 2. Preflight Mode
  const pfResult = main('execute', { ...baseContextEnv, ...fakePgEnv, MIGRATION_OPERATION: 'preflight' }, fakeApi, mockRunner);
  assert.equal(pfResult.state, 'READ_ONLY_PREFLIGHT_PASS');
  assert.equal(pfResult.observedLedgerHead, '20261023065216');
  assert.ok(typeof pfResult.preflightReportSha256 === 'string' && pfResult.preflightReportSha256.length === 64);
  assert.equal(pfResult.manifestSha256, manifestSha256);

  // Setup mock downloader for cross-run artifact chain using the actual artifact written to disk
  let downloadedReportBytes = fs.readFileSync('artifacts/interval-migration-preflight-report.json');
  const mockDownloader = (runId, artifactName, targetDir) => {
    const filename = artifactName.includes('preflight')
      ? 'interval-migration-preflight-report.json'
      : 'interval-migration-install-report.json';
    fs.writeFileSync(path.join(targetDir, filename), downloadedReportBytes);
  };

  // 3. Install Mode
  const installEnv = {
    ...baseContextEnv,
    ...fakePgEnv,
    MIGRATION_OPERATION: 'install',
    CONFIRMATION_TOKEN: policy.installToken,
    PREFLIGHT_REPORT_SHA256: pfResult.preflightReportSha256,
    PREFLIGHT_RUN_ID: '777123',
  };
  const instResult = main('execute', installEnv, fakeApi, mockRunner, mockDownloader);
  assert.equal(instResult.state, 'INSTALLED_AND_VERIFIED');
  assert.equal(instResult.installedMigrationsCount, 6);
  assert.equal(instResult.privilegedSchemaPostchecks.schemaPostcheck3_identityBridgeFunctionCallablePrivileged, true);
  assert.ok(instResult.privilegedPostchecksDisclaimer.includes('DOES NOT test RLS'));
  assert.ok(typeof instResult.installReportSha256 === 'string' && instResult.installReportSha256.length === 64);
  assert.equal(instResult.manifestSha256, manifestSha256);

  // Update mock downloader for backfill artifact using actual install artifact from disk
  downloadedReportBytes = fs.readFileSync('artifacts/interval-migration-install-report.json');

  // 4. Backfill Mode
  const backfillEnv = {
    ...baseContextEnv,
    ...fakePgEnv,
    MIGRATION_OPERATION: 'backfill',
    CONFIRMATION_TOKEN: policy.backfillToken,
    APPROVED_WINDOW: 'APPROVED_WINDOW_20261108_2200_UTC',
    INSTALL_REPORT_SHA256: instResult.installReportSha256,
    INSTALL_RUN_ID: '777124',
  };
  const bfResult = main('execute', backfillEnv, fakeApi, mockRunner, mockDownloader);
  assert.equal(bfResult.state, 'BACKFILL_VERIFIED');
  assert.equal(bfResult.approvedWindow, 'APPROVED_WINDOW_20261108_2200_UTC');
  assert.equal(bfResult.backfillOutput.legacyPositiveStockSum, 550.25);
  assert.equal(bfResult.backfillOutput.spatialStockSum, 550.25);
  assert.equal(bfResult.manifestSha256, manifestSha256);
});

test('Workflow security: isolated, no push trigger, requires production-db environment and proper inputs', () => {
  const workflowPath = '.github/workflows/migrate-interval-production.yml';
  assert.ok(fs.existsSync(workflowPath));
  const content = fs.readFileSync(workflowPath, 'utf8');

  assert.ok(content.includes('workflow_dispatch:'));
  assert.ok(!content.includes('\n  push:'));
  assert.ok(content.includes('environment:\n      name: production-db'));
  assert.ok(content.includes('cancel-in-progress: false'));
  assert.ok(!content.includes('deploy-production'));
  assert.ok(!content.includes('production-worker'));
  assert.ok(!content.includes('production-preflight'));
  assert.ok(!content.includes('supabase db push'));
  assert.ok(content.includes('expected_manifest_sha256'));
  assert.ok(content.includes('preflight_run_id'));
  assert.ok(content.includes('install_run_id'));
});
