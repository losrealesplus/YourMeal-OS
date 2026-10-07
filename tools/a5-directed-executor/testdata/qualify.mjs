// TEST ONLY. Disposable Unix-socket PostgreSQL; no production data or credentials.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir,userInfo} from 'node:os';
import {join,resolve} from 'node:path';
const exec=promisify(execFile);
const bin=process.env.A5_PG_BIN;
const go=process.env.A5_GO;
if(!bin?.startsWith('/')||!go?.startsWith('/')) throw Error('Local tools required');
const owned=await mkdtemp(join(tmpdir(),'a5-executor-'));
const data=join(owned,'data');
const port='55449';const db='a5_qualification';const executor='a5_migrator';
const repo=resolve(import.meta.dirname,'../../..');
process.chdir(repo);
await exec(join(bin,'initdb'),['-D',data,'-U',userInfo().username,'--auth=trust','--no-locale','--encoding=UTF8']);
await exec(join(bin,'pg_ctl'),['-D',data,'-l',join(owned,'postgres.log'),'-o',`-k '${owned}' -p ${port} -c listen_addresses='' -c cluster_name=a5-isolated-qualification`,'-w','start']);
const base=['-X','-q','-t','-A','-h',owned,'-p',port,'-U',userInfo().username,'-v','ON_ERROR_STOP=1'];
const sql=async(text,database=db)=>(await exec('/opt/homebrew/bin/psql',[...base,'-d',database,'-c',text],{maxBuffer:8e6})).stdout.trim();
try {
    await sql(
      `CREATE ROLE postgres NOLOGIN BYPASSRLS; CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS; CREATE ROLE ${executor} LOGIN NOINHERIT CREATEROLE`,
      "postgres",
    );
    await sql(`CREATE DATABASE ${db} OWNER ${executor}`, "postgres");
    for (const path of [
      "supabase/tests/cr-order-v2/fixture.sql",
      "supabase/migrations/20261005113919_cr_order_expand_readers_foundation.sql",
      "supabase/migrations/20261005174218_cr_order_v2_dish_writer.sql",
    ])
      await sql(`SET ROLE ${executor}; ` + (await readFile(path, "utf8")));
    await sql(
      `SET ROLE ${executor}; ALTER TABLE public.weekly_menus ADD COLUMN deleted_at timestamptz, ADD COLUMN published_at timestamptz; CREATE TYPE public.kitchen_batch_status AS ENUM('pending','preparing','plating','finished'); ALTER TABLE kitchen_production_batches ALTER COLUMN status DROP DEFAULT,ALTER COLUMN status TYPE public.kitchen_batch_status USING status::public.kitchen_batch_status,ALTER COLUMN status SET DEFAULT 'pending',ADD COLUMN started_at timestamptz,ADD COLUMN finished_at timestamptz,ADD COLUMN updated_by uuid; CREATE UNIQUE INDEX weekly_menus_tenant_week_start_ux ON public.weekly_menus(tenant_id,week_start) WHERE deleted_at IS NULL AND week_start IS NOT NULL; GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO service_role; GRANT SELECT ON auth.users TO service_role;`,
    );
    await sql(
      `SET ROLE ${executor}; CREATE TABLE public.company_employees(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid,company_id uuid,customer_id uuid,status text DEFAULT 'active',deleted_at timestamptz); GRANT SELECT ON public.company_employees TO service_role;`,
    );
    for (const path of [
      "supabase/migrations/20261005174256_offer_pricing_canonical_quote_capture.sql",
      "supabase/migrations/20261006072046_cr_order_a4a_custom_writer.sql",
      "supabase/migrations/20261006110000_cr_menu_offer_pricing_m3_individual_line.sql",
    ])
      await sql(`SET ROLE ${executor}; ` + (await readFile(path, "utf8")));
    await sql(
      `SET ROLE ${executor}; ALTER TYPE public.app_role ADD VALUE 'production'; ALTER TYPE public.app_role ADD VALUE 'logistics'; ALTER TYPE public.app_role ADD VALUE 'delivery'; ALTER TYPE public.app_role ADD VALUE 'driver'; ALTER TYPE public.order_status ADD VALUE 'ready_for_delivery'; ALTER TYPE public.order_status ADD VALUE 'out_for_delivery'; ALTER TYPE public.order_status ADD VALUE 'delivery_issue'; CREATE TYPE public.delivery_service_status AS ENUM('pending','in_production','prepared','ready_for_delivery','out_for_delivery','delivered','delivery_issue','cancelled'); ALTER TABLE delivery_services ALTER COLUMN status DROP DEFAULT,ALTER COLUMN status TYPE public.delivery_service_status USING status::public.delivery_service_status,ALTER COLUMN status SET DEFAULT 'pending',ADD COLUMN packed_at timestamptz,ADD COLUMN packed_by uuid,ADD COLUMN dispatched_at timestamptz,ADD COLUMN delivered_at timestamptz,ADD COLUMN delivered_by uuid; ALTER TABLE audit_log ALTER COLUMN entity_id TYPE uuid USING entity_id::uuid;`,
    );

await sql(`GRANT pg_read_all_settings TO ${executor} WITH INHERIT TRUE; ALTER ROLE ${executor} NOCREATEROLE NOCREATEDB`, 'postgres');
const result=await exec(go,['test','-race','-v','-count=1','-run','TestLocalQualification','./...'],{cwd:join(repo,'tools/a5-directed-executor'),env:{PATH:'/usr/bin:/bin:/opt/homebrew/bin',TMPDIR:tmpdir(),GOTOOLCHAIN:'local',GOPATH:'/tmp/a5-go-cache',GOCACHE:'/tmp/a5-go-build',A5_BINARY:'/tmp/a5-directed-executor',A5_LOCAL_ROOT:owned,A5_SUPERUSER:userInfo().username,A5_EVIDENCE:process.env.A5_EVIDENCE??'/tmp/a5-qualification-evidence.json'},maxBuffer:8e6});
console.log(result.stdout);
} catch(e) { console.error(e.stdout??'');console.error(e.stderr??'');throw Error('LOCAL_QUALIFICATION_FAILED'); }
finally {await exec(join(bin,'pg_ctl'),['-D',data,'-m','immediate','-w','stop']);await rm(owned,{recursive:true,force:true});}
