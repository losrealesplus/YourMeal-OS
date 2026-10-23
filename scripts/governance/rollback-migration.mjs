import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { assertContext, assertEnvironment, assertApproval, demand, hash } from './release-contract.mjs';

export const policy = Object.freeze({ repository: 'losrealesplus/YourMeal-OS', environment: 'production-db',
  reviewerId: 292604102, project: 'nhirlpkuvonggctdzzad', version: '20261023065216',
  migration: 'supabase/migrations/20261023065216_cr_order_rollback_v1_atomic.sql',
  caSha256: '700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7' });
export const signature = 'public.rollback_order_status_v1(uuid,uuid,public.order_status,public.order_status,text,integer,date[],boolean,date)';
export const scopeText = `INSTALL_ONLY_${policy.version}_ON_${policy.project}`;
const baselineSql = () => fs.readFileSync('scripts/governance/rollback-v1-baseline.sql','utf8').trim().replace(/;$/,'');
const baseline = () => JSON.parse(fs.readFileSync('scripts/governance/rollback-v1-baseline.json','utf8'));
const literal = value => "'" + String(value).replaceAll("'", "''") + "'";
const api = resource => JSON.parse(execFileSync('gh',['api',`repos/${policy.repository}/${resource}`],{encoding:'utf8'}));
export function validateContext(env) {
  const ctx={repository:env.GITHUB_REPOSITORY,ref:env.GITHUB_REF,sha:env.GITHUB_SHA,
    runId:env.GITHUB_RUN_ID,attempt:env.GITHUB_RUN_ATTEMPT,event:env.GITHUB_EVENT_NAME};
  assertContext(ctx,policy);
  demand(env.GITHUB_ACTIONS==='true' && ctx.event==='workflow_dispatch','Remote manual workflow only');
  demand(ctx.sha===env.EXPECTED_SOURCE_SHA,'Dispatched SHA mismatch');
  demand(['preflight','install'].includes(env.MIGRATION_OPERATION),'Unknown operation');
  if(env.MIGRATION_OPERATION==='install') demand(env.AUTHORIZATION_SCOPE===scopeText,'Explicit installation scope required');
  return ctx;
}
export function validateAuthority(ctx, environment, run, main, reviews) {
  assertEnvironment(environment,policy);
  demand(environment.deployment_branch_policy?.protected_branches===true &&
    environment.deployment_branch_policy?.custom_branch_policies===false,'Protected branches required');
  demand(run.head_sha===ctx.sha && run.event==='workflow_dispatch' && run.run_attempt===1 && main===ctx.sha,'Stale or mismatched run/main');
  demand(run.path==='.github/workflows/migrate-production.yml','Unexpected workflow');
  if(reviews!==undefined) {
    assertApproval(reviews,policy);
    const rule=environment.protection_rules.find(x=>x.type==='required_reviewers');
    if(rule.prevent_self_review) demand(run.actor?.id!==policy.reviewerId && run.triggering_actor?.id!==policy.reviewerId,'Self approval forbidden');
  }
}
export function validateBaseline(observed, expected) {
  demand(observed.tenantVerified===true && observed.rpcAbsent===true,'Wrong tenant or RPC already installed');
  demand(observed.schemaSha256===expected.schemaSha256,'Schema drift');
  demand(JSON.stringify(observed.ledgerVersions)===JSON.stringify(expected.ledgerVersions),'Migration ledger drift');
  demand(JSON.stringify(observed.ledgerColumns)===JSON.stringify(expected.ledgerColumns),'Ledger schema drift');
}
export function installationSql(sql, expected, schemaQuery=baselineSql()) {
  demand(!/\$(?:rollback_ddl|rollback_guard)\$/.test(sql),'SQL delimiter collision');
  const body=sql.match(/AS \$\$([\s\S]*?)\$\$/)?.[1];
  demand(body,'RPC body missing');
  const versions=[...expected.ledgerVersions,policy.version].sort();
  return `BEGIN;
SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='30s';
SELECT pg_advisory_xact_lock(hashtextextended('eatclean-rollback-v1-install',0));
LOCK TABLE supabase_migrations.schema_migrations IN EXCLUSIVE MODE;
DO $rollback_guard$ DECLARE b jsonb; BEGIN
 SELECT * INTO b FROM (${schemaQuery}) q;
 IF b->>'schemaSha256' IS DISTINCT FROM ${literal(expected.schemaSha256)}
 OR b->'ledgerVersions' IS DISTINCT FROM ${literal(JSON.stringify(expected.ledgerVersions))}::jsonb
 OR b->'ledgerColumns' IS DISTINCT FROM ${literal(JSON.stringify(expected.ledgerColumns))}::jsonb
 OR b->>'tenantVerified'<>'true' OR b->>'rpcAbsent'<>'true'
 THEN RAISE EXCEPTION 'Baseline changed: installation rejected'; END IF;
END $rollback_guard$;
${sql}
INSERT INTO supabase_migrations.schema_migrations(version,name,statements)
 VALUES('${policy.version}','cr_order_rollback_v1_atomic',ARRAY[$rollback_ddl$${sql}$rollback_ddl$]);
DO $rollback_guard$ DECLARE v_installed pg_proc; b jsonb; BEGIN
 SELECT * INTO v_installed FROM pg_proc WHERE oid=to_regprocedure('${signature}');
 IF v_installed.oid IS NULL OR NOT v_installed.prosecdef OR v_installed.proconfig IS DISTINCT FROM ARRAY['search_path=""']
 OR encode(sha256(convert_to(v_installed.prosrc,'UTF8')),'hex')<>${literal(hash(Buffer.from(body)))}
 OR has_function_privilege('anon',v_installed.oid,'EXECUTE')
 OR NOT has_function_privilege('authenticated',v_installed.oid,'EXECUTE')
 OR EXISTS(SELECT FROM aclexplode(coalesce(v_installed.proacl,acldefault('f',v_installed.proowner))) WHERE grantee=0 AND privilege_type='EXECUTE')
 THEN RAISE EXCEPTION 'RPC postcheck failed'; END IF;
 SELECT * INTO b FROM (${schemaQuery}) q;
 IF b->>'schemaSha256' IS DISTINCT FROM ${literal(expected.schemaSha256)}
 OR b->'ledgerVersions' IS DISTINCT FROM ${literal(JSON.stringify(versions))}::jsonb
 THEN RAISE EXCEPTION 'Post-install baseline drift'; END IF;
END $rollback_guard$;
COMMIT;`;
}
export function databaseEnv(env) {
  demand(env.SUPABASE_DB_URL_PROD,'Protected production database URL missing');
  let target;
  try {target=new URL(env.SUPABASE_DB_URL_PROD);} catch {throw new Error('Invalid protected database URL');}
  const user=decodeURIComponent(target.username);
  const password=decodeURIComponent(target.password);
  const direct=target.hostname===`db.${policy.project}.supabase.co` && user==='postgres';
  const pooler=target.hostname==='aws-0-eu-central-1.pooler.supabase.com' && user===`postgres.${policy.project}`;
  demand(['postgres:','postgresql:'].includes(target.protocol) && (direct || pooler) &&
    (target.port==='' || target.port==='5432') && target.pathname==='/postgres' && password,'Wrong database target');
  const ca=path.resolve('config/eatclean-postgres-ca.crt');
  demand(hash(fs.readFileSync(ca))===policy.caSha256,'Pinned CA mismatch');
  const clean=Object.fromEntries(Object.entries(env).filter(([key])=>!key.startsWith('PG') && !['SUPABASE_DB_URL_PROD','GH_TOKEN'].includes(key)));
  return {...clean, PGPASSWORD:password,PGHOST:target.hostname,
    PGPORT:'5432',PGUSER:user,PGDATABASE:'postgres',
    PGSSLMODE:'verify-full',PGSSLROOTCERT:ca,PGCONNECT_TIMEOUT:'10',
    PGOPTIONS:'-c statement_timeout=30000 -c lock_timeout=5000'};
}

export function main(mode,env=process.env,request=api) {
  const api=request;
  const ctx=validateContext(env);
  const sql=fs.readFileSync(policy.migration,'utf8');
  const manifest=JSON.parse(fs.readFileSync('scripts/governance/rollback-v1-install.json','utf8'));
  demand(manifest.migrationSha256===hash(Buffer.from(sql)) && env.EXPECTED_MIGRATION_SHA256===manifest.migrationSha256,'Migration digest mismatch');
  demand(manifest.project===policy.project && manifest.version===policy.version,'Manifest target mismatch');
  fs.mkdirSync('artifacts',{recursive:true});
  const report={sourceSha:ctx.sha,runId:ctx.runId,project:policy.project,migrationSha256:manifest.migrationSha256,
    baselineSchema:baseline().schemaSha256,state:'NOT_INSTALLED',operation:env.MIGRATION_OPERATION};
  const save=()=>fs.writeFileSync('artifacts/rollback-migration-report.json',JSON.stringify(report,null,2));
  save();
  try {
    const environment=api(`environments/${policy.environment}`),run=api(`actions/runs/${ctx.runId}`);
    validateAuthority(ctx,environment,run,api('git/ref/heads/main').object.sha,
      mode==='execute'?api(`actions/runs/${ctx.runId}/approvals`):undefined);
  } catch {
    report.state='BLOCKED_AUTHORITY';
    report.reason='Environment protections, review history or source authority could not be verified';save();
    throw new Error(report.reason);
  }
  if(mode==='validate') return;
  demand(mode==='execute','Unknown command');
  let pgEnv;
  try {pgEnv=databaseEnv(env);} catch {
    report.state='BLOCKED_CONNECTION_CONFIG';save();throw new Error('Protected database credentials or pinned connection config unavailable');
  }
  const query=input=>execFileSync('psql',['-X','-qAt','-v','ON_ERROR_STOP=1'],{input,env:pgEnv,encoding:'utf8',timeout:60000});
  let observed;
  try {
    observed=JSON.parse(query(`BEGIN READ ONLY; ${baselineSql()}; COMMIT;`).trim());
    validateBaseline(observed,baseline());
  } catch {
    report.state='BLOCKED_BASELINE';
    report.observedSchema=observed?.schemaSha256 ?? null;
    report.observedLedgerCount=observed?.ledgerVersions?.length ?? null;save();
    throw new Error('Database baseline could not be verified; no installation attempted');
  }
  if(env.MIGRATION_OPERATION==='preflight') {report.state='READ_ONLY_PREFLIGHT_PASS';save();return;}
  // Revalidate approval and main immediately before opening the only write transaction.
  validateAuthority(ctx,api(`environments/${policy.environment}`),api(`actions/runs/${ctx.runId}`),
    api('git/ref/heads/main').object.sha,api(`actions/runs/${ctx.runId}/approvals`));
  report.state='INSTALLATION_UNKNOWN';save();
  try { query(installationSql(sql,baseline())); report.state='INSTALLED_AND_VERIFIED';save(); }
  catch {save();throw new Error('Installation failed or outcome unknown; perform read-only reconciliation, never retry blindly');}
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  try {main(process.argv[2]);} catch(error) {console.error(error.message);process.exitCode=1;}
}
