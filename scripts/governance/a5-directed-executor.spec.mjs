import test from 'node:test';
import assert from 'node:assert/strict';
import {validateRequest, execute, PRODUCTION_ERROR, productionExecution} from './a5-directed-executor.mjs';
const valid = {mode:'isolated-qualification',binary:'/tmp/executor',binarySha256:'a'.repeat(64),manifest:'/tmp/manifest',repo:'/tmp/repo',executeLocal:false};
test('local qualification request validates without granting authority',()=>assert.equal(validateRequest(valid),true));
test('production hard disabled regardless of advisory approval',()=>{
  assert.equal(productionExecution,'HARD_DISABLED');
  process.env.APPROVED='true';process.env.PGHOST='nhirlpkuvonggctdzzad.supabase.co';
  let calls=0;
  const overrides=[{mode:'production'},{mode:'staging'},{projectRef:'nhirlpkuvonggctdzzad'},{sourceSha:'c37c00c1d5d34babf0c8d5c38ad0f578017b717f'},{gate:'GATE6'},{environment:'production-db'},{approved:true},{approvedBy:'Alexander'},{human:true},{provenance:'USER_EXPLICIT'},{nonce:'valid'},{validatorResult:{valid:true}},{mode:'production',approved:true,nonce:'valid'}];
  for(const extra of overrides) assert.throws(()=>execute({...valid,...extra},()=>{calls++;}),{message:PRODUCTION_ERROR});
  assert.equal(calls,0);delete process.env.APPROVED;delete process.env.PGHOST;
});
test('no replay or approval inputs, even with local mode',()=>{
 for(const field of ['request_id','consumedNonces','ttl','artifact_digest','approved']) assert.throws(()=>validateRequest({...valid,[field]:'claimed'}),{message:PRODUCTION_ERROR});
});
test('rejects arbitrary SQL/host/migration path and unknown fields',()=>{
 for(const field of ['sql','query','dsn','host','migration','directory']) assert.throws(()=>validateRequest({...valid,[field]:'secret-sentinel'}),{message:PRODUCTION_ERROR});
});
test('local execution strictly bounded to three steps',()=>{
 for(const step of [0,4,'1',undefined]) assert.throws(()=>validateRequest({...valid,executeLocal:true,isolation:'/tmp/local',step}),{message:'LOCAL_INPUT_INVALID'});
});

test('transport loss performs one read-only reconciliation and never retries mutation', async()=>{
 const {mkdtempSync,writeFileSync,rmSync}=await import('node:fs');
 const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {createHash}=await import('node:crypto');
 const temp=mkdtempSync(join(tmpdir(),'a5-wrapper-'));try{
  const binary=join(temp,'binary');const bytes=Buffer.from('test-only synthetic binary');writeFileSync(binary,bytes);
  let calls=0;
  const req={...valid,binary,binarySha256:createHash('sha256').update(bytes).digest('hex'),executeLocal:true,step:1,isolation:'/tmp/a5-executor-test'};
  process.env.PGPASSWORD='secret-sentinel';process.env.APPROVED='true';
  assert.throws(()=>execute(req,(_binary,args,options)=>{
    calls++;assert.equal(options.env.PGPASSWORD,undefined);assert.equal(options.env.APPROVED,undefined);
    if(calls===1){assert.ok(args.includes('--execute-local'));return {error:new Error('secret-sentinel'),stdout:''};}
    assert.ok(args.includes('--reconcile-local'));assert.ok(!args.includes('--execute-local'));
    return {status:0,stdout:JSON.stringify({state:'READ_ONLY_RECONCILIATION',reconciled:'DDL_COMMITTED_LEDGER_MISSING'})};
  }),e=>e.message==='OUTCOME_UNCERTAIN'&&e.result.reconciled==='DDL_COMMITTED_LEDGER_MISSING');
  assert.equal(calls,2);
 } finally{delete process.env.PGPASSWORD;delete process.env.APPROVED;rmSync(temp,{recursive:true,force:true});}
});
