// Exercises generated installation SQL only in a new disposable local Docker database.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {installationSql,policy,signature} from './rollback-migration.mjs';
const container=process.env.ROLLBACK_TEST_CONTAINER??'yourmeal-e2e-db';
const db=`rollback_channel_test_${Date.now()}`;
const docker=(args,input)=>execFileSync('docker',['exec',...(input?['-i']:[]),container,...args],{input,encoding:'utf8',maxBuffer:64*1024*1024});
const sql=input=>docker(['psql','-U','postgres','-v','ON_ERROR_STOP=1','-XqAt',db],input);
const query=fs.readFileSync('scripts/governance/rollback-v1-baseline.sql','utf8');
const file=fs.readFileSync(policy.migration,'utf8');
try{
 const schema=docker(['pg_dump','-U','postgres','--schema-only','--no-owner','--no-privileges','postgres']);
 docker(['createdb','-U','postgres',db]);sql(schema);
 sql(`SET session_replication_role=replica;
 INSERT INTO public.tenants(id,slug,name) VALUES('8bba00ba-331b-42c8-9283-4e3836ffb870','eatclean','Synthetic EatClean');
 SET session_replication_role=origin;
 CREATE SCHEMA IF NOT EXISTS supabase_migrations;
 CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations(version text PRIMARY KEY,statements text[],name text);
 INSERT INTO supabase_migrations.schema_migrations(version) VALUES('20260101000000'),('20260102000000');`);
 const b=JSON.parse(sql(`BEGIN READ ONLY; ${query} COMMIT;`).trim());
 const clean=()=>{
   assert.equal(sql(`SELECT to_regprocedure('${signature}') IS NULL`).trim(),'t');
   assert.equal(sql(`SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version='${policy.version}'`).trim(),'0');
 };
 clean();
 assert.throws(()=>sql(installationSql(file,{...b,schemaSha256:'0'.repeat(64)})));clean();
 sql(`CREATE FUNCTION public.reject_test_ledger() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic ledger failure'; END $$;
 CREATE TRIGGER reject_test_ledger BEFORE INSERT ON supabase_migrations.schema_migrations FOR EACH ROW EXECUTE FUNCTION public.reject_test_ledger();`);
 assert.throws(()=>sql(installationSql(file,b)));clean();
 sql('DROP TRIGGER reject_test_ledger ON supabase_migrations.schema_migrations; DROP FUNCTION public.reject_test_ledger();');
 const tx=installationSql(file,b);
 assert.throws(()=>sql(tx.replace("THEN RAISE EXCEPTION 'RPC postcheck failed'", "OR true THEN RAISE EXCEPTION 'RPC postcheck failed'")));clean();
 sql(tx);
 assert.equal(sql(`SELECT to_regprocedure('${signature}') IS NOT NULL`).trim(),'t');
 assert.equal(sql(`SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version='${policy.version}'`).trim(),'1');
 assert.throws(()=>sql(tx)); // no repeat install or ledger changes
 assert.equal(sql(`SELECT count(*) FROM supabase_migrations.schema_migrations`).trim(),'3');
 console.log('PASS: generated exact migration + ledger commit atomically; schema drift, ledger failure, postcheck failure and repeat installation fail closed.');
}finally{docker(['dropdb','-U','postgres','--if-exists',db]);}
