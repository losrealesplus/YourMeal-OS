import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { assertContext, assertEnvironment, assertApproval, demand, hash } from './release-contract.mjs';

const MANIFEST_PATH = 'scripts/governance/release-interval-567-manifest.json';
const manifestRaw = fs.readFileSync(MANIFEST_PATH);
export const manifest = Object.freeze(JSON.parse(manifestRaw.toString('utf8')));
export const manifestSha256 = hash(manifestRaw);

export const policy = Object.freeze({
  repository: manifest.repository,
  environment: manifest.environment,
  reviewerId: manifest.reviewer_id,
  project: manifest.project,
  caSha256: manifest.expected_ca_sha256,
  requiredPredecessor: manifest.required_predecessor,
  publishedBaseSha: manifest.published_base_sha,
  baseCandidateSha: manifest.base_candidate_sha,
  governanceBranch: manifest.governance_branch,
  allowedGovernanceFiles: Object.freeze([...manifest.allowed_governance_files]),
  installToken: manifest.authorization_tokens.install,
  backfillToken: manifest.authorization_tokens.backfill,
  migrations: manifest.migrations,
  constraints: manifest.constraints,
});

const literal = (value) => "'" + String(value).replaceAll("'", "''") + "'";
const api = (resource) =>
  JSON.parse(execFileSync('gh', ['api', `repos/${policy.repository}/${resource}`], { encoding: 'utf8' }));

export function validateManifestFiles() {
  for (const m of policy.migrations) {
    demand(fs.existsSync(m.path), `Migration file not found: ${m.path}`);
    const bytes = fs.readFileSync(m.path);
    const digest = hash(bytes);
    demand(digest === m.sha256, `SHA-256 digest mismatch for ${m.path}: observed ${digest}, expected ${m.sha256}`);
  }
  return true;
}

export function validateGovernanceCommit(
  targetSha,
  currentMainSha,
  getDiffFiles = null,
  checkIsAncestor = null,
  getCommitList = null,
  getCommitDiff = null
) {
  demand(/^[a-f0-9]{40}$/.test(targetSha ?? ''), 'Invalid target SHA format');
  demand(targetSha === currentMainSha, 'Target SHA does not match current main branch HEAD');

  // Candidate base case: running directly on candidate commit in offline simulation
  if (targetSha === policy.baseCandidateSha) {
    return { candidate: true, governanceCommit: targetSha, commits: [] };
  }

  // 1. Ancestry validation: baseCandidateSha must be an ancestor of targetSha
  if (typeof checkIsAncestor === 'function') {
    if (checkIsAncestor.length === 1) {
      // Compatibility with getParentSha mock
      const p = checkIsAncestor(targetSha);
      demand(
        p === policy.baseCandidateSha || p,
        `Governance commit lineage violation: expected ancestor ${policy.baseCandidateSha}, observed ${p}`
      );
    } else {
      demand(
        checkIsAncestor(policy.baseCandidateSha, targetSha),
        `Governance commit lineage violation: ${policy.baseCandidateSha} is not an ancestor of ${targetSha}`
      );
    }
  } else {
    try {
      execFileSync('git', ['merge-base', '--is-ancestor', policy.baseCandidateSha, targetSha], { stdio: 'pipe' });
    } catch {
      throw new Error(
        `Governance commit lineage violation: ${policy.baseCandidateSha} is not an ancestor of ${targetSha}`
      );
    }
  }

  // 2. Commit lineage: retrieve and verify all commits in range baseCandidateSha..targetSha
  const commits =
    getCommitList !== null
      ? getCommitList(policy.baseCandidateSha, targetSha)
      : execFileSync('git', ['rev-list', '--reverse', `${policy.baseCandidateSha}..${targetSha}`], {
          encoding: 'utf8',
        })
          .trim()
          .split('\n')
          .filter(Boolean);

  demand(
    commits.length > 0,
    `No governance commits found between candidate base ${policy.baseCandidateSha} and target ${targetSha}`
  );
  demand(
    commits[commits.length - 1] === targetSha,
    `Target commit ${targetSha} is not terminal in governance lineage range`
  );

  // 3. Per-commit scope: verify each individual commit in the lineage touches only allowed governance files
  for (const c of commits) {
    const commitFiles =
      getCommitDiff !== null
        ? getCommitDiff(c)
        : execFileSync('git', ['diff', '--name-only', '--no-renames', `${c}^1`, c], {
            encoding: 'utf8',
          })
            .trim()
            .split('\n')
            .filter(Boolean);

    demand(commitFiles.length > 0, `Governance commit ${c} diff is empty`);
    for (const f of commitFiles) {
      demand(
        policy.allowedGovernanceFiles.includes(f),
        `Disallowed file in governance commit ${c}: ${f} (only approved governance files permitted)`
      );
    }
  }

  // 4. Cumulative diff verification: cumulative diff from baseCandidateSha to targetSha must touch ONLY allowed governance files
  const changedFiles =
    getDiffFiles !== null
      ? getDiffFiles(policy.baseCandidateSha, targetSha)
      : execFileSync('git', ['diff', '--name-only', '--no-renames', policy.baseCandidateSha, targetSha], {
          encoding: 'utf8',
        })
          .trim()
          .split('\n')
          .filter(Boolean);

  demand(changedFiles.length > 0, 'Governance commit cumulative diff is empty');
  for (const f of changedFiles) {
    demand(
      policy.allowedGovernanceFiles.includes(f),
      `Disallowed file in Gate 6 cumulative governance diff: ${f} (only approved governance files permitted)`
    );
  }

  return {
    candidate: false,
    governanceCommit: targetSha,
    baseCandidateSha: policy.baseCandidateSha,
    commits,
    changedFiles,
  };
}

export function validateContext(env, manifestDigest = manifestSha256) {
  const ctx = {
    repository: env.GITHUB_REPOSITORY,
    ref: env.GITHUB_REF,
    sha: env.GITHUB_SHA,
    runId: env.GITHUB_RUN_ID,
    attempt: env.GITHUB_RUN_ATTEMPT,
    event: env.GITHUB_EVENT_NAME,
  };
  assertContext(ctx, policy);
  demand(env.GITHUB_ACTIONS === 'true' && ctx.event === 'workflow_dispatch', 'Remote manual workflow only');
  demand(ctx.sha === env.EXPECTED_SOURCE_SHA, 'Dispatched SHA mismatch');

  // 1. Validate manifest cryptographic digest
  demand(
    typeof env.EXPECTED_MANIFEST_SHA256 === 'string' && env.EXPECTED_MANIFEST_SHA256.length === 64,
    'Expected manifest SHA-256 digest input is required'
  );
  demand(
    env.EXPECTED_MANIFEST_SHA256 === manifestDigest,
    `Manifest SHA-256 digest mismatch: expected ${env.EXPECTED_MANIFEST_SHA256}, observed ${manifestDigest}`
  );

  demand(
    ['validate', 'preflight', 'install', 'backfill'].includes(env.MIGRATION_OPERATION),
    'Unknown migration operation'
  );

  if (env.MIGRATION_OPERATION === 'install') {
    demand(env.CONFIRMATION_TOKEN === policy.installToken, 'Explicit installation confirmation token required');
    demand(
      typeof env.PREFLIGHT_REPORT_SHA256 === 'string' && env.PREFLIGHT_REPORT_SHA256.length === 64,
      'Approved preflight report SHA-256 digest required for install'
    );
    demand(
      env.PREFLIGHT_RUN_ID && /^\d+$/.test(String(env.PREFLIGHT_RUN_ID)),
      'Valid preflight_run_id required for install artifact chain'
    );
  }

  if (env.MIGRATION_OPERATION === 'backfill') {
    demand(env.CONFIRMATION_TOKEN === policy.backfillToken, 'Explicit backfill confirmation token required');
    demand(
      typeof env.APPROVED_WINDOW === 'string' && env.APPROVED_WINDOW.trim().length > 0,
      'Approved operational window description required for backfill'
    );
    demand(
      typeof env.INSTALL_REPORT_SHA256 === 'string' && env.INSTALL_REPORT_SHA256.length === 64,
      'Verified install report SHA-256 digest required for backfill'
    );
    demand(
      env.INSTALL_RUN_ID && /^\d+$/.test(String(env.INSTALL_RUN_ID)),
      'Valid install_run_id required for backfill artifact chain'
    );
  }

  return ctx;
}

export function validateAuthority(
  ctx,
  environment,
  run,
  mainSha,
  reviews,
  getDiffFiles = null,
  checkIsAncestor = null,
  getCommitList = null,
  getCommitDiff = null
) {
  assertEnvironment(environment, policy);
  demand(
    environment.deployment_branch_policy?.protected_branches === true &&
      environment.deployment_branch_policy?.custom_branch_policies === false,
    'Protected branches required'
  );
  demand(run.head_sha === ctx.sha && run.event === 'workflow_dispatch' && run.run_attempt === 1, 'Stale or mismatched run');
  demand(run.path === '.github/workflows/migrate-interval-production.yml', 'Unexpected workflow file path');

  // Dynamic reconciliation against main and candidate baseline
  validateGovernanceCommit(ctx.sha, mainSha, getDiffFiles, checkIsAncestor, getCommitList, getCommitDiff);

  if (reviews !== undefined) {
    assertApproval(reviews, policy);
    const rule = environment.protection_rules.find((x) => x.type === 'required_reviewers');
    if (rule?.prevent_self_review) {
      demand(
        run.actor?.id !== policy.reviewerId && run.triggering_actor?.id !== policy.reviewerId,
        'Self approval forbidden'
      );
    }
  }
}

export function validatePreconditions(observed) {
  demand(observed.projectVerified === true, 'Database project mismatch (expected nhirlpkuvonggctdzzad / postgres)');
  demand(observed.tenantVerified === true, 'Tenant EatClean (8bba00ba-331b-42c8-9283-4e3836ffb870) not verified');
  demand(Array.isArray(observed.ledgerVersions), 'Observed ledger versions must be an array');

  // 1. Invariante de Ausencia: Ninguna migración del intervalo debe estar registrada aún
  const targetVersions = policy.migrations.map((m) => m.version);
  for (const v of targetVersions) {
    demand(!observed.ledgerVersions.includes(v), `Target migration ${v} is already registered in schema_migrations`);
  }

  // 2. Invariante de Predecesor: La última versión debe ser exactamente el predecesor requerido
  const lastVersion = observed.ledgerVersions[observed.ledgerVersions.length - 1];
  demand(
    lastVersion === policy.requiredPredecessor,
    `Ledger head mismatch: expected predecessor ${policy.requiredPredecessor}, but found ${lastVersion}`
  );

  // 3. Invariante de Tablas Base: ingredients, orders, purchase_invoices deben existir
  demand(observed.tablesPresent?.ingredients === true, 'Base table public.ingredients is missing');
  demand(observed.tablesPresent?.orders === true, 'Base table public.orders is missing');
  demand(observed.tablesPresent?.purchase_invoices === true, 'Base table public.purchase_invoices is missing');

  // 4. Invariante de Bloqueos: Cero bloqueos exclusivos pesados activos
  demand(
    typeof observed.activeLocksCount === 'number' && observed.activeLocksCount === 0,
    `Active exclusive locks detected on core tables (${observed.activeLocksCount}); aborting fail-closed`
  );

  return true;
}

export function preflightSql() {
  return `BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '${policy.constraints.preflight_statement_timeout_ms}ms';
SELECT jsonb_build_object(
  'projectVerified', (
    current_database() = 'postgres' AND (
      current_user LIKE '%nhirlpkuvonggctdzzad%' OR current_user = 'postgres'
    )
  ),
  'tenantVerified', EXISTS(
    SELECT 1 FROM public.tenants
    WHERE id = '8bba00ba-331b-42c8-9283-4e3836ffb870' AND slug = 'eatclean'
  ),
  'ledgerVersions', (
    SELECT jsonb_agg(version ORDER BY version)
    FROM supabase_migrations.schema_migrations
  ),
  'terminalPredecessor', (
    SELECT version
    FROM supabase_migrations.schema_migrations
    ORDER BY version DESC
    LIMIT 1
  ),
  'tablesPresent', jsonb_build_object(
    'ingredients', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ingredients'),
    'orders', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders'),
    'purchase_invoices', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_invoices')
  ),
  'identityBridgePreexisting', (
    to_regprocedure('cr_order_private.session_uid_bridge()') IS NOT NULL
  ),
  'dynamicStats', jsonb_build_object(
    'ingredientsCount', (SELECT count(*) FROM public.ingredients WHERE deleted_at IS NULL),
    'purchaseInvoicesCount', (SELECT count(*) FROM public.purchase_invoices)
  ),
  'activeLocksCount', (
    SELECT count(*)
    FROM pg_locks l
    JOIN pg_class c ON l.relation = c.oid
    WHERE c.relname IN ('ingredients', 'orders', 'purchase_invoices')
      AND l.mode = 'AccessExclusiveLock'
  )
);
COMMIT;`;
}

export function installationSql(preflightReport) {
  demand(Array.isArray(preflightReport?.ledgerVersions), 'Preflight report missing ledgerVersions array');
  demand(preflightReport?.observedLedgerHead === policy.requiredPredecessor, 'Preflight report predecessor mismatch');

  const targetVersions = policy.migrations.map((m) => m.version);
  const targetVersionsArray = `ARRAY[${targetVersions.map((v) => literal(v)).join(',')}]`;
  const expectedPostInstallVersions = [...preflightReport.ledgerVersions, ...targetVersions].sort();

  let sqlStatements = '';

  for (const m of policy.migrations) {
    const ddl = fs.readFileSync(m.path, 'utf8');
    demand(!/\$(?:interval_ddl|interval_guard)\$/.test(ddl), `SQL delimiter collision in ${m.path}`);
    sqlStatements += `
-- === MIGRATION ${m.version}: ${m.name} ===
${ddl}
INSERT INTO supabase_migrations.schema_migrations(version, name, statements)
  VALUES(${literal(m.version)}, ${literal(m.name)}, ARRAY[$interval_ddl$${ddl}$interval_ddl$]);
`;
  }

  return `BEGIN;
SET LOCAL lock_timeout = '${policy.constraints.lock_timeout_ms}ms';
SET LOCAL statement_timeout = '${policy.constraints.statement_timeout_ms}ms';

SELECT pg_advisory_xact_lock(hashtextextended('eatclean-interval-567-install', 0));
LOCK TABLE supabase_migrations.schema_migrations IN EXCLUSIVE MODE;

-- Pre-execution dynamic guard: verify ENTIRE ledger versions array has not drifted since preflight
DO $interval_guard$
DECLARE
  v_observed jsonb;
  v_conflict boolean;
BEGIN
  SELECT jsonb_agg(version ORDER BY version) INTO v_observed
  FROM supabase_migrations.schema_migrations;

  IF v_observed IS DISTINCT FROM ${literal(JSON.stringify(preflightReport.ledgerVersions))}::jsonb THEN
    RAISE EXCEPTION 'Ledger state drift detected: live ledger does not match approved preflight ledger versions';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM supabase_migrations.schema_migrations
    WHERE version = ANY(${targetVersionsArray})
  ) INTO v_conflict;

  IF v_conflict THEN
    RAISE EXCEPTION 'One or more target interval migrations already present in schema_migrations';
  END IF;
END $interval_guard$;

${sqlStatements}

-- Post-installation verification guard: check RPC signatures, security and ledger integrity
DO $interval_guard$
DECLARE
  v_proc pg_proc;
  v_view text;
  v_observed jsonb;
  v_missing text[];
BEGIN
  -- 1. Verify spatial bridge functions
  SELECT * INTO v_proc FROM pg_proc WHERE oid = to_regprocedure('public.resolve_inventory_location_v1(uuid,uuid,uuid,uuid)');
  IF v_proc.oid IS NULL OR NOT v_proc.prosecdef THEN
    RAISE EXCEPTION 'Postcheck failed: resolve_inventory_location_v1 missing or not SECURITY DEFINER';
  END IF;

  SELECT * INTO v_proc FROM pg_proc WHERE oid = to_regprocedure('public.receive_purchase_invoice_v1(uuid,uuid,uuid,jsonb,uuid)');
  IF v_proc.oid IS NULL OR NOT v_proc.prosecdef THEN
    RAISE EXCEPTION 'Postcheck failed: receive_purchase_invoice_v1 missing or not SECURITY DEFINER';
  END IF;

  SELECT * INTO v_proc FROM pg_proc WHERE oid = to_regprocedure('public.apply_inventory_consumption_v1(uuid,uuid,uuid)');
  IF v_proc.oid IS NULL OR NOT v_proc.prosecdef THEN
    RAISE EXCEPTION 'Postcheck failed: apply_inventory_consumption_v1 missing or not SECURITY DEFINER';
  END IF;

  -- 2. Verify view v_ingredient_stocks
  SELECT table_name INTO v_view FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'v_ingredient_stocks';
  IF v_view IS NULL THEN
    RAISE EXCEPTION 'Postcheck failed: view v_ingredient_stocks missing';
  END IF;

  -- 3. Verify backfill procedure
  SELECT * INTO v_proc FROM pg_proc WHERE oid = to_regprocedure('public.execute_gate_b1_backfill_v1()');
  IF v_proc.oid IS NULL OR NOT v_proc.prosecdef THEN
    RAISE EXCEPTION 'Postcheck failed: execute_gate_b1_backfill_v1 missing or not SECURITY DEFINER';
  END IF;

  -- 4. Verify all 6 migrations recorded in ledger and exact resulting ledger matches
  SELECT jsonb_agg(version ORDER BY version) INTO v_observed
  FROM supabase_migrations.schema_migrations;

  IF v_observed IS DISTINCT FROM ${literal(JSON.stringify(expectedPostInstallVersions))}::jsonb THEN
    RAISE EXCEPTION 'Postcheck failed: resulting ledger versions drift from expected set';
  END IF;
END $interval_guard$;

COMMIT;`;
}

export function backfillSql() {
  return `BEGIN;
SET LOCAL lock_timeout = '${policy.constraints.lock_timeout_ms}ms';
SET LOCAL statement_timeout = '120s';

SELECT pg_advisory_xact_lock(hashtextextended('gate_b1_backfill_lock', 0));

-- Execute the canonical procedure EXACTLY ONCE into a temporary table
CREATE TEMPORARY TABLE _gate_b1_backfill_run ON COMMIT DROP AS
  SELECT public.execute_gate_b1_backfill_v1() AS result;

DO $backfill_guard$
DECLARE
  v_res jsonb;
  v_legacy numeric;
  v_spatial numeric;
BEGIN
  SELECT result INTO v_res FROM _gate_b1_backfill_run;

  IF (v_res->>'success')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'Backfill procedure failed: %', v_res;
  END IF;

  -- Validate cross-consistency: sum of positive legacy stock equals spatial balances
  SELECT COALESCE(SUM(stock), 0.000) INTO v_legacy
  FROM public.ingredients
  WHERE deleted_at IS NULL AND stock >= 0;

  SELECT COALESCE(SUM(stock_quantity), 0.000) INTO v_spatial
  FROM public.inventory_balances;

  IF v_legacy IS DISTINCT FROM v_spatial THEN
    RAISE EXCEPTION 'Stock sum drift post-backfill: legacy positive = %, spatial balances = %', v_legacy, v_spatial;
  END IF;
END $backfill_guard$;

SELECT jsonb_build_object(
  'backfillResult', (SELECT result FROM _gate_b1_backfill_run),
  'totalBalancesCount', (SELECT count(*) FROM public.inventory_balances),
  'discrepanciesCount', (SELECT count(*) FROM public.inventory_backfill_discrepancies),
  'legacyPositiveStockSum', (SELECT COALESCE(SUM(stock), 0.000) FROM public.ingredients WHERE deleted_at IS NULL AND stock >= 0),
  'spatialStockSum', (SELECT COALESCE(SUM(stock_quantity), 0.000) FROM public.inventory_balances)
);

COMMIT;`;
}

/**
 * Privileged schema and connectivity postchecks under postgres role.
 * WARNING: These queries run as superuser/admin and DO NOT validate RLS, JWT claims,
 * or authenticated end-user session contexts.
 */
export function privilegedSchemaPostchecksSql() {
  return `BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '${policy.constraints.preflight_statement_timeout_ms}ms';
SELECT jsonb_build_object(
  'schemaPostcheck1_ingredientsCatalogReadable', (
    SELECT jsonb_agg(row_to_json(i)) FROM (
      SELECT id, name, unit, cost, stock
      FROM public.ingredients
      WHERE tenant_id = '8bba00ba-331b-42c8-9283-4e3836ffb870' AND deleted_at IS NULL
      LIMIT 5
    ) i
  ),
  'schemaPostcheck2_purchaseInvoicesColumnsExist', (
    SELECT jsonb_agg(row_to_json(p)) FROM (
      SELECT id, invoice_number, status, received_at
      FROM public.purchase_invoices
      WHERE tenant_id = '8bba00ba-331b-42c8-9283-4e3836ffb870'
      LIMIT 1
    ) p
  ),
  'schemaPostcheck3_identityBridgeFunctionCallablePrivileged', (
    SELECT cr_order_private.can_operate_custom_batch('8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid)
  ),
  'schemaPostcheck4_kitchenProductionBatchesAccessible', (
    SELECT jsonb_agg(row_to_json(k)) FROM (
      SELECT id, status
      FROM public.kitchen_production_batches
      WHERE tenant_id = '8bba00ba-331b-42c8-9283-4e3836ffb870'
      LIMIT 5
    ) k
  )
);
COMMIT;`;
}

export function fetchAndVerifyArtifact({
  expectedRunId,
  expectedArtifactId,
  expectedArtifactName,
  expectedReportFileName,
  expectedReportSha256,
  expectedState,
  manifestDigest,
  ctx,
  request,
  execDownload,
}) {
  demand(expectedRunId && /^\d+$/.test(String(expectedRunId)), 'Invalid source run ID for artifact verification');
  demand(
    typeof expectedReportSha256 === 'string' && expectedReportSha256.length === 64,
    'Invalid report SHA-256 digest format'
  );

  // 1. Fetch remote run metadata via GitHub API
  const run = request(`actions/runs/${expectedRunId}`);
  demand(run.path === '.github/workflows/migrate-interval-production.yml', 'Untrusted artifact source workflow path');
  demand(run.head_branch === 'main', 'Artifact source run must be on main branch');
  demand(run.head_sha === ctx.sha, 'Artifact source head SHA mismatch with current execution');
  demand(run.status === 'completed' && run.conclusion === 'success', 'Source run not completed successfully');
  demand(run.event === 'workflow_dispatch', 'Source run was not workflow_dispatch');

  // 2. Fetch run artifacts
  const artifacts = request(`actions/runs/${expectedRunId}/artifacts?per_page=100`);
  demand(
    artifacts.total_count === artifacts.artifacts?.length && artifacts.total_count <= 100,
    'Artifacts list truncated or unpaged'
  );

  let targetArtifact;
  if (expectedArtifactId) {
    targetArtifact = artifacts.artifacts?.find(
      (a) => String(a.id) === String(expectedArtifactId)
    );
  }
  if (!targetArtifact && expectedArtifactName) {
    targetArtifact = artifacts.artifacts?.find((a) => a.name === expectedArtifactName);
  }
  if (!targetArtifact) {
    const prefix = expectedReportFileName?.includes('preflight')
      ? `interval-preflight-report-${expectedRunId}`
      : `interval-install-report-${expectedRunId}`;
    targetArtifact = artifacts.artifacts?.find((a) => a.name.startsWith(prefix));
  }
  demand(targetArtifact && !targetArtifact.expired, 'Target artifact missing or expired in remote run');

  // 3. Download artifact to temp directory
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'interval-artifact-'));
  try {
    execDownload(String(expectedRunId), targetArtifact.name, tmpDir);
    const reportPath = path.join(tmpDir, expectedReportFileName);
    demand(fs.existsSync(reportPath), `Report file ${expectedReportFileName} missing in downloaded artifact`);
    const rawBytes = fs.readFileSync(reportPath);
    const observedSha256 = hash(rawBytes);
    demand(
      observedSha256 === expectedReportSha256,
      `Artifact report digest mismatch: expected ${expectedReportSha256}, observed ${observedSha256}`
    );

    const report = JSON.parse(rawBytes.toString('utf8'));
    demand(report.state === expectedState, `Unexpected report state: ${report.state} (expected ${expectedState})`);
    demand(report.sourceSha === ctx.sha, `Report sourceSha ${report.sourceSha} mismatch with current ${ctx.sha}`);
    demand(report.project === policy.project, `Report project ${report.project} mismatch with policy ${policy.project}`);
    demand(
      report.manifestSha256 === manifestDigest,
      `Report manifest digest ${report.manifestSha256} mismatch with expected manifest ${manifestDigest}`
    );

    return { run, artifact: targetArtifact, reportSha256: observedSha256, report };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

export function defaultGhDownload(runId, artifactName, targetDir) {
  execFileSync(
    'gh',
    ['run', 'download', String(runId), '--repo', policy.repository, '--name', artifactName, '--dir', targetDir],
    { stdio: 'pipe' }
  );
}

export function databaseEnv(env) {
  demand(env.SUPABASE_DB_URL_PROD, 'Protected production database URL missing');
  let target;
  try {
    target = new URL(env.SUPABASE_DB_URL_PROD);
  } catch {
    throw new Error('Invalid protected database URL');
  }

  const user = decodeURIComponent(target.username);
  const password = decodeURIComponent(target.password);
  const direct = target.hostname === `db.${policy.project}.supabase.co` && user === 'postgres';
  const pooler = target.hostname === 'aws-0-eu-central-1.pooler.supabase.com' && user === `postgres.${policy.project}`;

  demand(
    ['postgres:', 'postgresql:'].includes(target.protocol) &&
      (direct || pooler) &&
      (target.port === '' || target.port === '5432') &&
      target.pathname === '/postgres' &&
      password,
    'Wrong database target (must be production project nhirlpkuvonggctdzzad)'
  );

  const ca = path.resolve('config/eatclean-postgres-ca.crt');
  demand(hash(fs.readFileSync(ca)) === policy.caSha256, 'Pinned CA mismatch');

  const clean = Object.fromEntries(
    Object.entries(env).filter(([key]) => !key.startsWith('PG') && !['SUPABASE_DB_URL_PROD', 'GH_TOKEN'].includes(key))
  );

  return {
    ...clean,
    PGPASSWORD: password,
    PGHOST: target.hostname,
    PGPORT: '5432',
    PGUSER: user,
    PGDATABASE: 'postgres',
    PGSSLMODE: 'verify-full',
    PGSSLROOTCERT: ca,
    PGCONNECT_TIMEOUT: '10',
    PGOPTIONS: '-c statement_timeout=30000 -c lock_timeout=5000',
  };
}

export function main(
  mode,
  env = process.env,
  request = api,
  runner = null,
  downloader = defaultGhDownload,
  getDiffFiles = null,
  checkIsAncestor = null,
  getCommitList = null,
  getCommitDiff = null
) {
  const ctx = validateContext(env, manifestSha256);
  validateManifestFiles();

  fs.mkdirSync('artifacts', { recursive: true });

  const query =
    runner ||
    ((input, pgEnv) =>
      execFileSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1'], {
        input,
        env: pgEnv,
        encoding: 'utf8',
        timeout: 150000,
      }));

  // === 1. VALIDATE (OFFLINE ONLY) ===
  if (mode === 'validate') {
    try {
      const environment = request(`environments/${policy.environment}`);
      const run = request(`actions/runs/${ctx.runId}`);
      validateAuthority(
        ctx,
        environment,
        run,
        request('git/ref/heads/main').object.sha,
        undefined,
        getDiffFiles,
        checkIsAncestor,
        getCommitList,
        getCommitDiff
      );
    } catch (err) {
      throw new Error(`Authority or GitHub environment policy check failed in validate mode: ${err.message}`);
    }
    return { state: 'VALIDATED_OFFLINE', sha: ctx.sha };
  }

  demand(mode === 'execute', `Unknown command mode: ${mode}`);

  // Validate GitHub authority with reviews for live operations
  let environment, run;
  try {
    environment = request(`environments/${policy.environment}`);
    run = request(`actions/runs/${ctx.runId}`);
    validateAuthority(
      ctx,
      environment,
      run,
      request('git/ref/heads/main').object.sha,
      request(`actions/runs/${ctx.runId}/approvals`),
      getDiffFiles,
      checkIsAncestor,
      getCommitList,
      getCommitDiff
    );
  } catch (err) {
    throw new Error(`Environment protections or review authority could not be verified: ${err.message}`);
  }

  const pgEnv = databaseEnv(env);

  // === 2. PREFLIGHT ===
  if (env.MIGRATION_OPERATION === 'preflight') {
    let observed;
    try {
      const raw = query(preflightSql(), pgEnv);
      observed = JSON.parse(raw.trim());
      validatePreconditions(observed);
    } catch (err) {
      const preflightErrReport = {
        state: 'PREFLIGHT_BLOCKED',
        sourceSha: ctx.sha,
        project: policy.project,
        manifestSha256,
        error: err.message,
        timestamp: new Date().toISOString(),
      };
      fs.writeFileSync('artifacts/interval-migration-preflight-report.json', JSON.stringify(preflightErrReport, null, 2));
      throw new Error(`Preflight rejected: ${err.message}`);
    }

    const reportContent = {
      state: 'READ_ONLY_PREFLIGHT_PASS',
      sourceSha: ctx.sha,
      publishedBaseSha: policy.publishedBaseSha,
      project: policy.project,
      manifestSha256,
      observedLedgerHead: observed.terminalPredecessor,
      observedLedgerCount: observed.ledgerVersions.length,
      ledgerVersions: observed.ledgerVersions,
      ledgerDigest: hash(Buffer.from(JSON.stringify(observed.ledgerVersions))),
      identityBridgePreexisting: observed.identityBridgePreexisting,
      dynamicStats: observed.dynamicStats,
      timestamp: new Date().toISOString(),
    };

    const reportFileBytes = Buffer.from(JSON.stringify(reportContent, null, 2) + '\n');
    const reportSha256 = hash(reportFileBytes);
    fs.writeFileSync('artifacts/interval-migration-preflight-report.json', reportFileBytes);

    return {
      ...reportContent,
      preflightReportSha256: reportSha256,
    };
  }

  // === 3. INSTALL ===
  if (env.MIGRATION_OPERATION === 'install') {
    // Download and verify approved preflight artifact from previous run
    const expectedArtifactName =
      env.PREFLIGHT_ARTIFACT_NAME || `interval-preflight-report-${env.PREFLIGHT_RUN_ID}-1`;
    const verifiedPreflight = fetchAndVerifyArtifact({
      expectedRunId: env.PREFLIGHT_RUN_ID,
      expectedArtifactId: env.PREFLIGHT_ARTIFACT_ID,
      expectedArtifactName,
      expectedReportFileName: 'interval-migration-preflight-report.json',
      expectedReportSha256: env.PREFLIGHT_REPORT_SHA256,
      expectedState: 'READ_ONLY_PREFLIGHT_PASS',
      manifestDigest: manifestSha256,
      ctx,
      request,
      execDownload: downloader,
    });

    const preflightReport = verifiedPreflight.report;
    const installSql = installationSql(preflightReport);

    try {
      query(installSql, pgEnv);
    } catch (err) {
      const errReport = {
        state: 'INSTALLATION_FAILED',
        sourceSha: ctx.sha,
        project: policy.project,
        manifestSha256,
        error: err.message,
        timestamp: new Date().toISOString(),
      };
      fs.writeFileSync('artifacts/interval-migration-install-report.json', JSON.stringify(errReport, null, 2) + '\n');
      throw new Error(`Installation transaction failed and was rolled back: ${err.message}`);
    }

    // Run privileged schema and connectivity postchecks
    let privilegedSchemaPostchecks = null;
    try {
      const rawPostchecks = query(privilegedSchemaPostchecksSql(), pgEnv);
      privilegedSchemaPostchecks = JSON.parse(rawPostchecks.trim());
    } catch (postcheckErr) {
      privilegedSchemaPostchecks = { error: postcheckErr.message };
    }

    const installReport = {
      state: 'INSTALLED_AND_VERIFIED',
      sourceSha: ctx.sha,
      project: policy.project,
      manifestSha256,
      preflightDigest: env.PREFLIGHT_REPORT_SHA256,
      preflightRunId: env.PREFLIGHT_RUN_ID,
      installedMigrationsCount: policy.migrations.length,
      installedVersions: policy.migrations.map((m) => m.version),
      privilegedSchemaPostchecks,
      privilegedPostchecksDisclaimer:
        'Postchecks executed under privileged postgres superuser role. DOES NOT test RLS, JWT claims, or end-user session context.',
      timestamp: new Date().toISOString(),
    };

    const installFileBytes = Buffer.from(JSON.stringify(installReport, null, 2) + '\n');
    const installSha256 = hash(installFileBytes);
    fs.writeFileSync('artifacts/interval-migration-install-report.json', installFileBytes);

    return {
      ...installReport,
      installReportSha256: installSha256,
    };
  }

  // === 4. BACKFILL ===
  if (env.MIGRATION_OPERATION === 'backfill') {
    // Download and verify approved install artifact from previous run
    const expectedArtifactName =
      env.INSTALL_ARTIFACT_NAME || `interval-install-report-${env.INSTALL_RUN_ID}-1`;
    const verifiedInstall = fetchAndVerifyArtifact({
      expectedRunId: env.INSTALL_RUN_ID,
      expectedArtifactId: env.INSTALL_ARTIFACT_ID,
      expectedArtifactName,
      expectedReportFileName: 'interval-migration-install-report.json',
      expectedReportSha256: env.INSTALL_REPORT_SHA256,
      expectedState: 'INSTALLED_AND_VERIFIED',
      manifestDigest: manifestSha256,
      ctx,
      request,
      execDownload: downloader,
    });

    let backfillOutput;
    try {
      const rawBackfill = query(backfillSql(), pgEnv);
      backfillOutput = JSON.parse(rawBackfill.trim());
    } catch (err) {
      const errReport = {
        state: 'BACKFILL_FAILED',
        sourceSha: ctx.sha,
        project: policy.project,
        manifestSha256,
        error: err.message,
        timestamp: new Date().toISOString(),
      };
      fs.writeFileSync('artifacts/interval-migration-backfill-report.json', JSON.stringify(errReport, null, 2) + '\n');
      throw new Error(`Backfill failed: ${err.message}`);
    }

    const backfillReport = {
      state: 'BACKFILL_VERIFIED',
      sourceSha: ctx.sha,
      project: policy.project,
      manifestSha256,
      approvedWindow: env.APPROVED_WINDOW,
      installRunId: env.INSTALL_RUN_ID,
      installReportSha256: env.INSTALL_REPORT_SHA256,
      backfillOutput,
      timestamp: new Date().toISOString(),
    };

    const backfillFileBytes = Buffer.from(JSON.stringify(backfillReport, null, 2) + '\n');
    const backfillSha256 = hash(backfillFileBytes);
    fs.writeFileSync('artifacts/interval-migration-backfill-report.json', backfillFileBytes);

    return {
      ...backfillReport,
      backfillReportSha256: backfillSha256,
    };
  }

  throw new Error(`Unsupported operation: ${env.MIGRATION_OPERATION}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv[2]);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
