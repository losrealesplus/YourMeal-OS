import { execSync } from 'node:child_process';

const DB_URL = process.env.LOCAL_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

function runSql(sql) {
  try {
    const stdout = execSync(`psql "${DB_URL}" -v ON_ERROR_STOP=1 -A -t -c "${sql.replace(/"/g, '\\"')}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { ok: true, stdout: stdout.trim(), stderr: '' };
  } catch (err) {
    return { ok: false, stdout: (err.stdout || '').trim(), stderr: (err.stderr || err.message).trim() };
  }
}

function runSqlFile(filePath) {
  try {
    const stdout = execSync(`psql "${DB_URL}" -v ON_ERROR_STOP=1 -f "${filePath}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { ok: true, stdout: stdout.trim(), stderr: '' };
  } catch (err) {
    return { ok: false, stdout: (err.stdout || '').trim(), stderr: (err.stderr || err.message).trim() };
  }
}

function parseLastResult(stdout) {
  const lines = stdout.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('SET') && !l.startsWith('INSERT') && !l.startsWith('UPDATE') && !l.startsWith('DELETE') && l !== 'BEGIN' && l !== 'COMMIT');
  return lines[lines.length - 1] || '';
}

console.log('========================================================================');
console.log('CR-COST-05 PHASE 3: LOCAL POSTGRESQL RUNTIME VERIFICATION');
console.log('Database target:', DB_URL);
console.log('========================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(description, condition, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] Test ${totalTests}: ${description}`);
    if (details) console.log(`         → ${details}`);
  } else {
    console.error(`  [FAIL] Test ${totalTests}: ${description}`);
    if (details) console.error(`         → Details: ${details}`);
    process.exitCode = 1;
  }
}

// ------------------------------------------------------------------------
// INVARIANT 1: Table & Relational Schema Existence
// ------------------------------------------------------------------------
console.log('--- 1. Schema & Table Structure Invariant ---');
const tablesRes = runSql(`
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('market_sources', 'market_products', 'market_price_observations', 'market_volume_tiers', 'product_mappings')
  ORDER BY table_name;
`);
const foundTables = tablesRes.stdout.split('\n').filter(Boolean);
assert(
  'All 5 CR-COST-05 tables exist in public schema',
  tablesRes.ok && foundTables.length === 5,
  `Found tables: ${foundTables.join(', ')}`
);

// ------------------------------------------------------------------------
// INVARIANT 2: Deterministic Seed Data
// ------------------------------------------------------------------------
console.log('\n--- 2. Deterministic Seed Data Invariant ---');
const seedRes = runSql(`
  SELECT id, name, source_type, default_tax_mode FROM public.market_sources ORDER BY id;
`);
const seedRows = seedRes.stdout.split('\n').map(r => r.split('|'));
const seedIds = seedRows.map(r => r[0]);
assert(
  '4 registered initial market sources present with correct configuration',
  seedRes.ok &&
  seedIds.includes('src-makro') &&
  seedIds.includes('src-gmcash') &&
  seedIds.includes('src-5oceanos') &&
  seedIds.includes('src-mercadona'),
  `Sources: ${seedIds.join(', ')}`
);

// ------------------------------------------------------------------------
// INVARIANT 3: Idempotency & Unique Fingerprint Enforcement
// ------------------------------------------------------------------------
console.log('\n--- 3. Idempotency & Unique Fingerprint Invariant ---');
const prodSetup = runSql(`
  INSERT INTO public.market_products (
    id, source_id, external_sku, raw_name, brand, category, thermal_state, standard_quantity, standard_unit, quality_grade
  ) VALUES (
    '00000000-0000-0000-0000-000000000001', 'src-makro', 'TEST-SKU-001', 'Harina Trigo 1kg', 'Makro Chef', 'flours', 'ambient', 1.0, 'kg', 'standard'
  ) ON CONFLICT (source_id, external_sku) DO NOTHING;
`);
assert('Market product insert succeeds', prodSetup.ok, prodSetup.stderr);

const testFingerprint = 'test-fp-' + Date.now();
const insertObs1 = runSql(`
  INSERT INTO public.market_price_observations (
    id, market_product_id, fingerprint, price_raw, tax_mode, tax_rate, normalized_price_ex_tax, normalized_unit
  ) VALUES (
    gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '${testFingerprint}', 1.20, 'ex_tax', 0.04, 1.20, 'EUR_PER_KG'
  );
`);
assert('First observation insertion succeeds', insertObs1.ok, insertObs1.stderr);

const insertObsDuplicate = runSql(`
  INSERT INTO public.market_price_observations (
    id, market_product_id, fingerprint, price_raw, tax_mode, tax_rate, normalized_price_ex_tax, normalized_unit
  ) VALUES (
    gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '${testFingerprint}', 1.20, 'ex_tax', 0.04, 1.20, 'EUR_PER_KG'
  );
`);
assert(
  'Duplicate fingerprint insertion is blocked by UNIQUE constraint',
  !insertObsDuplicate.ok && insertObsDuplicate.stderr.includes('uq_market_price_obs_fingerprint'),
  insertObsDuplicate.stderr
);

// ------------------------------------------------------------------------
// INVARIANT 4: Append-Only Immutability Guard Trigger
// ------------------------------------------------------------------------
console.log('\n--- 4. Append-Only Immutability Guard Invariant ---');
const deleteAttempt = runSql(`
  DELETE FROM public.market_price_observations WHERE fingerprint = '${testFingerprint}';
`);
assert(
  'Trigger blocks DELETE on market_price_observations (strict append-only)',
  !deleteAttempt.ok && deleteAttempt.stderr.includes('strictly append-only and cannot be deleted'),
  deleteAttempt.stderr
);

const updatePriceAttempt = runSql(`
  UPDATE public.market_price_observations SET price_raw = 99.99 WHERE fingerprint = '${testFingerprint}';
`);
assert(
  'Trigger blocks UPDATE of price facts on market_price_observations',
  !updatePriceAttempt.ok && updatePriceAttempt.stderr.includes('Economic price facts in market_price_observations are immutable'),
  updatePriceAttempt.stderr
);

const updateFpAttempt = runSql(`
  UPDATE public.market_price_observations SET fingerprint = 'tampered-fp' WHERE fingerprint = '${testFingerprint}';
`);
assert(
  'Trigger blocks UPDATE of fingerprint on market_price_observations',
  !updateFpAttempt.ok && updateFpAttempt.stderr.includes('Economic price facts in market_price_observations are immutable'),
  updateFpAttempt.stderr
);

// ------------------------------------------------------------------------
// INVARIANT 5: Volume Tiers Relationship & Constraints
// ------------------------------------------------------------------------
console.log('\n--- 5. Volume Tiers Invariant ---');
const getObsId = runSql(`SELECT id FROM public.market_price_observations WHERE fingerprint = '${testFingerprint}' LIMIT 1;`);
const obsId = getObsId.stdout.trim();

const tierInsert = runSql(`
  INSERT INTO public.market_volume_tiers (observation_id, min_quantity, tier_normalized_price_ex_tax)
  VALUES ('${obsId}', 5.0, 1.10);
`);
assert('Volume tier insert linked to observation succeeds', tierInsert.ok, tierInsert.stderr);

const invalidTierInsert = runSql(`
  INSERT INTO public.market_volume_tiers (observation_id, min_quantity, tier_normalized_price_ex_tax)
  VALUES ('${obsId}', -1.0, 1.10);
`);
assert('Invalid tier quantity (<= 0) is rejected by check constraint', !invalidTierInsert.ok, invalidTierInsert.stderr);

// ------------------------------------------------------------------------
// INVARIANT 6: Product Mappings Multi-Tenant Isolation & Constraints
// ------------------------------------------------------------------------
console.log('\n--- 6. Multi-Tenant Product Mappings Invariant ---');
const tenantSetup = runSql(`
  SET ROLE postgres;
  DELETE FROM public.product_mappings;
  INSERT INTO public.tenants (id, name, slug)
  VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Tenant Alpha', 'tenant-alpha'),
    ('22222222-2222-2222-2222-222222222222', 'Tenant Beta', 'tenant-beta')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.ingredients (id, tenant_id, name, unit, cost, stock, min_stock, allergens)
  VALUES 
    ('aaaa0001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Harina Trigo 1kg', 'kg', 1.00, 10, 2, '{}')
  ON CONFLICT (id) DO NOTHING;
`);
assert('Tenants & test ingredients initialized', tenantSetup.ok, tenantSetup.stderr);

const mapInsert1 = runSql(`
  INSERT INTO public.product_mappings (
    tenant_id, tenant_ingredient_id, market_product_id, match_confidence, match_status, comparability_grade
  ) VALUES (
    '11111111-1111-1111-1111-111111111111', 'aaaa0001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
    0.95, 'confirmed', 'HIGH'
  );
`);
assert('Tenant Alpha product mapping insert succeeds', mapInsert1.ok, mapInsert1.stderr);

const mapDuplicate = runSql(`
  INSERT INTO public.product_mappings (
    tenant_id, tenant_ingredient_id, market_product_id, match_confidence, match_status, comparability_grade
  ) VALUES (
    '11111111-1111-1111-1111-111111111111', 'aaaa0001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
    0.90, 'suggested', 'MEDIUM'
  );
`);
assert(
  'Duplicate mapping for same tenant/ingredient/product is rejected by UNIQUE constraint',
  !mapDuplicate.ok && mapDuplicate.stderr.includes('uq_product_mapping_tenant_ingredient_product'),
  mapDuplicate.stderr
);

// ------------------------------------------------------------------------
// INVARIANT 7: RLS Policy Verification via Database Roles
// ------------------------------------------------------------------------
console.log('\n--- 7. RLS Policy & Role Access Invariant ---');

// Anonymous access on market_sources is denied (anon role has no SELECT grant)
const anonSourcesRead = runSql(`
  SET ROLE anon;
  SELECT count(*) FROM public.market_sources;
`);
assert(
  'Anon role cannot read market_sources without authenticated session (permission denied / 0 rows)',
  !anonSourcesRead.ok && anonSourcesRead.stderr.includes('permission denied for table market_sources'),
  anonSourcesRead.stderr
);

// Authenticated role can read shared market_sources
const authSourcesRead = runSql(`
  SET ROLE authenticated;
  SELECT count(*) FROM public.market_sources;
`);
const authRows = parseLastResult(authSourcesRead.stdout);
assert(
  'Authenticated role can read shared market_sources',
  authSourcesRead.ok && parseInt(authRows || '0', 10) >= 4,
  `Returned count: ${authRows}`
);

// ------------------------------------------------------------------------
// INVARIANT 8: Multi-Tenant RLS Boundary (Tenant A vs Tenant B)
// ------------------------------------------------------------------------
console.log('\n--- 8. Multi-Tenant Cross-Tenant Isolation Invariant ---');
const userAlphaId = '33333333-3333-3333-3333-333333333333';
const userBetaId = '44444444-4444-4444-4444-444444444444';

runSql(`
  SET ROLE postgres;

  INSERT INTO auth.users (id, email) VALUES 
    ('${userAlphaId}', 'alpha@test.com'),
    ('${userBetaId}', 'beta@test.com')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.tenant_members (tenant_id, user_id, membership_type, status)
  VALUES 
    ('11111111-1111-1111-1111-111111111111', '${userAlphaId}', 'employee', 'approved'),
    ('22222222-2222-2222-2222-222222222222', '${userBetaId}', 'employee', 'approved')
  ON CONFLICT (tenant_id, user_id) DO NOTHING;
`);

// When acting as user Alpha in tenant Alpha:
const alphaRead = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '${userAlphaId}';
  SELECT count(*) FROM public.product_mappings;
`);
const alphaCount = parseLastResult(alphaRead.stdout);
assert(
  'Tenant Alpha user can read Tenant Alpha mappings (RLS read PASS)',
  alphaRead.ok && parseInt(alphaCount || '0', 10) === 1,
  `Count: ${alphaCount}`
);

// When acting as user Beta attempting to read product_mappings:
const betaCrossRead = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '${userBetaId}';
  SELECT count(*) FROM public.product_mappings;
`);
const betaCount = parseLastResult(betaCrossRead.stdout);
assert(
  'Tenant Beta user CANNOT read Tenant Alpha mappings (RLS Cross-Tenant Isolation PASS: 0 rows)',
  betaCrossRead.ok && betaCount === '0',
  `Cross-tenant visible rows: ${betaCount}`
);

// ------------------------------------------------------------------------
// INVARIANT 9: Rollback Verification
// ------------------------------------------------------------------------
console.log('\n--- 9. Rollback Artifact Execution Invariant ---');
const rollbackRes = runSqlFile('supabase/migrations/rollback/20260927120000_food_market_intelligence_foundation.rollback.sql');
assert('Rollback SQL executes cleanly without error', rollbackRes.ok, rollbackRes.stderr);

const tablesPostRollback = runSql(`
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('market_sources', 'market_products', 'market_price_observations', 'market_volume_tiers', 'product_mappings');
`);
assert(
  'All 5 CR-COST-05 tables successfully dropped after rollback',
  tablesPostRollback.ok && tablesPostRollback.stdout === '',
  `Remaining tables: ${tablesPostRollback.stdout}`
);

// ------------------------------------------------------------------------
// INVARIANT 10: Re-applying Migration to Clean Restored State
// ------------------------------------------------------------------------
console.log('\n--- 10. Re-applying Migration to Operational State ---');
const reapplyRes = runSqlFile('supabase/migrations/20260927120000_food_market_intelligence_foundation.sql');
assert('Migration re-applies cleanly from scratch', reapplyRes.ok, reapplyRes.stderr);

const seedRecheck = runSql(`SELECT count(*) FROM public.market_sources;`);
assert(
  'Seed data and tables restored to clean operational state',
  seedRecheck.ok && parseInt(seedRecheck.stdout, 10) === 4,
  `Source count: ${seedRecheck.stdout}`
);

console.log('\n========================================================================');
console.log(`VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
console.log('========================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
