// Local Docker only. Copies schema, never data, into a new disposable database.
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const container = process.env.ROLLBACK_TEST_CONTAINER ?? 'yourmeal-e2e-db';
const db = `rollback_v1_test_${Date.now()}`;
const run = (args, input) => execFileSync('docker', ['exec', ...(input ? ['-i'] : []), container, ...args], {
  input, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
});
const sql = (input) => run(['psql','-U','postgres','-v','ON_ERROR_STOP=1','-At',db],input);
const migration = 'supabase/migrations/20261023065216_cr_order_rollback_v1_atomic.sql';
const concurrent = (statement) => new Promise(resolve => {
  const child = spawn('docker',['exec','-i',container,'psql','-U','postgres','-v','ON_ERROR_STOP=1','-At',db]);
  let out='',err=''; child.stdout.on('data',x=>out+=x); child.stderr.on('data',x=>err+=x);
  child.on('close',code=>resolve({code,out,err})); child.stdin.end(statement);
});
try {
  const schema=run(['pg_dump','-U','postgres','--schema-only','--no-owner','--no-privileges','postgres']);
  run(['createdb','-U','postgres',db]);
  sql(schema);
  sql(readFileSync(migration,'utf8'));
  sql(readFileSync('supabase/tests/rollback-v1/assertions.sql','utf8'));
  const call = `SELECT public.rollback_order_status_v1('10000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000004','in_production','confirmed','concurrent test',0,ARRAY['2026-10-19'::date],false,NULL);`;
  const actor=`SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000001',false);`;
  // Both requests use the same operator-confirmed status and revision. Exactly one may commit.
  const results=await Promise.all([concurrent(actor+call),concurrent(actor+call)]);
  assert.equal(results.filter(x=>x.code===0).length,1,JSON.stringify(results));
  assert.match(results.find(x=>x.code!==0).err,/Concurrency conflict/);
  assert.equal(sql(`SELECT count(*) FROM public.audit_log WHERE entity_id='40000000-0000-4000-8000-000000000004'`).trim(),'1');
  assert.equal(sql(`SELECT status||':'||revision FROM public.orders WHERE id='40000000-0000-4000-8000-000000000005'`).trim(),'in_production:0');
  console.log('PASS: v1 rollback, v2 rejection, tenant/role/auth guards, reason, multiday consent, dates, revision, audit atomicity, concurrent requests and unselected orders.');
} finally {
  run(['dropdb','-U','postgres','--if-exists',db]);
}
