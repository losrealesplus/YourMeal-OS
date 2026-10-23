import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { policy,scopeText,validateContext,validateAuthority,validateBaseline,installationSql,databaseEnv,main } from './rollback-migration.mjs';
const sha='a'.repeat(40);
const contextEnv={GITHUB_ACTIONS:'true',GITHUB_REPOSITORY:policy.repository,GITHUB_REF:'refs/heads/main',GITHUB_SHA:sha,
 GITHUB_RUN_ID:'123',GITHUB_RUN_ATTEMPT:'1',GITHUB_EVENT_NAME:'workflow_dispatch',EXPECTED_SOURCE_SHA:sha,
 MIGRATION_OPERATION:'install',AUTHORIZATION_SCOPE:scopeText};
const environment={name:'production-db',can_admins_bypass:false,
 deployment_branch_policy:{protected_branches:true,custom_branch_policies:false},
 protection_rules:[{type:'required_reviewers',prevent_self_review:true,reviewers:[{type:'User',reviewer:{id:policy.reviewerId}}]}]};
const run={head_sha:sha,event:'workflow_dispatch',run_attempt:1,path:'.github/workflows/migrate-production.yml',actor:{id:7},triggering_actor:{id:7}};
const reviews=[{state:'approved',user:{id:policy.reviewerId},environments:[{name:'production-db'}]}];
test('exact remote manual source and scope are required',()=>{
 assert.equal(validateContext(contextEnv).sha,sha);
 for(const overrides of [{GITHUB_ACTIONS:'false'},{GITHUB_REF:'refs/heads/other'},{GITHUB_RUN_ATTEMPT:'2'},
  {GITHUB_EVENT_NAME:'push'},{EXPECTED_SOURCE_SHA:'b'.repeat(40)},{AUTHORIZATION_SCOPE:'yes'},{MIGRATION_OPERATION:'all'}])
  assert.throws(()=>validateContext({...contextEnv,...overrides}));
});
test('reviewer/environment/main checks reject bypass and self approval',()=>{
 const ctx=validateContext(contextEnv);
 validateAuthority(ctx,environment,run,sha,reviews);
 assert.throws(()=>validateAuthority(ctx,{...environment,can_admins_bypass:true},run,sha,reviews));
 assert.throws(()=>validateAuthority(ctx,environment,{...run,actor:{id:policy.reviewerId}},sha,reviews));
 assert.throws(()=>validateAuthority(ctx,environment,run,'b'.repeat(40),reviews));
 for(const invalid of [[],null,[{...reviews[0],state:'rejected'}],[{...reviews[0],user:{id:7}}]])
  assert.throws(()=>validateAuthority(ctx,environment,run,sha,invalid));
});
test('solo owner can dispatch and approve preflight and install only with explicit protected approval',()=>{
 const soloEnvironment={...environment,protection_rules:[{...environment.protection_rules[0],prevent_self_review:false}]};
 const ownerRun={...run,actor:{id:policy.reviewerId},triggering_actor:{id:policy.reviewerId}};
 for(const operation of ['preflight','install']) {
  const ctx=validateContext({...contextEnv,MIGRATION_OPERATION:operation,AUTHORIZATION_SCOPE:operation==='install'?scopeText:''});
  validateAuthority(ctx,soloEnvironment,ownerRun,sha,reviews);
  for(const invalid of [[],null,[{...reviews[0],state:'rejected'}],
   [{...reviews[0],user:{id:7}}],[{...reviews[0],environments:[{name:'production-worker'}]}]])
   assert.throws(()=>validateAuthority(ctx,soloEnvironment,ownerRun,sha,invalid));
  assert.throws(()=>validateAuthority(ctx,{...soloEnvironment,can_admins_bypass:true},ownerRun,sha,reviews));
  assert.throws(()=>validateAuthority(ctx,{...soloEnvironment,protection_rules:[]},ownerRun,sha,reviews));
  // If the owner enables self-review prevention again, respect that protection.
  assert.throws(()=>validateAuthority(ctx,environment,ownerRun,sha,reviews));
  assert.throws(()=>validateAuthority(ctx,environment,{...run,triggering_actor:{id:policy.reviewerId}},sha,reviews));
 }
});
test('baseline rejects schema/ledger/identity/overload drift',()=>{
 const b={schemaSha256:'b'.repeat(64),ledgerVersions:['123'],ledgerColumns:['version'],tenantVerified:true,rpcAbsent:true};
 validateBaseline(b,b);
 for(const drift of [{schemaSha256:'c'.repeat(64)},{ledgerVersions:['123','124']},{ledgerColumns:['changed']},
  {tenantVerified:false},{rpcAbsent:false}]) assert.throws(()=>validateBaseline({...b,...drift},b));
});
test('connection is fixed to EatClean, verify-full and pinned CA, overriding inherited PG configuration',()=>{
 const env=databaseEnv({SUPABASE_DB_URL_PROD:'postgresql://postgres.nhirlpkuvonggctdzzad:synthetic@aws-0-eu-central-1.pooler.supabase.com:5432/postgres',PGHOST:'db.djangucecsphnejplvic.supabase.co',PGSERVICE:'demo',PGHOSTADDR:'127.0.0.1',PGSSLMODE:'disable'});
 assert.equal(env.PGHOST,'aws-0-eu-central-1.pooler.supabase.com');
 assert.equal(env.PGUSER,'postgres.nhirlpkuvonggctdzzad'); assert.equal(env.PGSSLMODE,'verify-full');
 assert.equal(env.PGSERVICE,undefined); assert.equal(env.PGHOSTADDR,undefined);
 assert.throws(()=>databaseEnv({}));
});
test('only one sealed SQL file and its ledger row are installed in one transaction with postchecks',()=>{
 const sql=fs.readFileSync(policy.migration,'utf8');
 const b=JSON.parse(fs.readFileSync('scripts/governance/rollback-v1-baseline.json','utf8'));
 const tx=installationSql(sql,b);
 assert.ok(tx.startsWith('BEGIN;'));assert.ok(tx.trim().endsWith('COMMIT;'));
 assert.equal(tx.split(sql).length,3); // exact DDL once, same bytes in the ledger once
 assert.ok(tx.includes('IN EXCLUSIVE MODE'));assert.ok(tx.includes('RPC postcheck failed'));
 assert.ok(tx.includes("has_function_privilege('anon'"));assert.ok(tx.includes("schema_migrations(version,name,statements)"));
 assert.ok(!tx.includes('db push')); assert.ok(!tx.includes('order_status_v2'));
});
test('workflow requires production-db approval and never runs on push or shell-interpolates inputs',()=>{
 const y=fs.readFileSync('.github/workflows/migrate-production.yml','utf8');
 assert.ok(y.includes('workflow_dispatch:'));assert.ok(!y.includes('\n  push:'));
 assert.ok(y.includes('name: production-db'));assert.ok(y.includes('cancel-in-progress: false'));
 assert.ok(!y.includes('supabase db push'));assert.ok(!y.includes('run: ${{'));
 assert.ok(!y.includes('deploy-production'));assert.ok(!y.includes('VITE_OPERATIONAL_ROLLBACK_ENABLED'));
});

test('a rejected environment writes an auditable no-install report without touching a database',()=>{
 const manifest=JSON.parse(fs.readFileSync('scripts/governance/rollback-v1-install.json','utf8'));
 const fake=resource=>resource.startsWith('environments/')?{...environment,can_admins_bypass:true}
  :resource==='git/ref/heads/main'?{object:{sha}}:run;
 assert.throws(()=>main('validate',{...contextEnv,EXPECTED_MIGRATION_SHA256:manifest.migrationSha256},fake));
 const report=JSON.parse(fs.readFileSync('artifacts/rollback-migration-report.json','utf8'));
 assert.equal(report.state,'BLOCKED_AUTHORITY');assert.equal(report.project,policy.project);
 assert.ok(!JSON.stringify(report).includes('PGPASSWORD'));
});

test('protected URL cannot target Demo, another database, user or port',()=>{
 const url='postgresql://postgres.nhirlpkuvonggctdzzad:synthetic@aws-0-eu-central-1.pooler.supabase.com:5432/postgres';
 for(const bad of [url.replace('nhirlpkuvonggctdzzad','djangucecsphnejplvic'),url.replace(':5432',':6543'),
  url.replace('/postgres','/another'),url.replace('aws-0-eu-central-1.pooler.supabase.com','evil.example')])
  assert.throws(()=>databaseEnv({SUPABASE_DB_URL_PROD:bad}));
});
