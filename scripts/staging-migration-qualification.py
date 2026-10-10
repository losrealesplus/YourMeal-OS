"""Isolated Docker PostgreSQL qualification. Never reads host DSNs/PG credentials."""
import json, os, subprocess, pathlib, hashlib, sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
NAME='yourmeal-staging-qualification-'+str(os.getpid())
IMAGE='public.ecr.aws/supabase/postgres@sha256:3866d94d8426927e8db3f1c5d790752292bfbe27b5f1f46e199ae1b7d3c1710b'
passed=[]
def docker(*args, input=None, check=True):
 r=subprocess.run(['docker','--context','orbstack',*args],input=input,capture_output=True,text=True,timeout=90)
 if check and r.returncode:raise RuntimeError(r.stderr)
 return r

def sql(statement, check=True):
 return docker('exec','-i',NAME,'psql','-X','-q','-t','-A','-U','supabase_admin','-d','postgres','-v','ON_ERROR_STOP=1',input=statement,check=check)
T='10000000-0000-4000-8000-000000000001';U=lambda n:f'20000000-0000-4000-8000-{n:012d}'
R=lambda n:f'70000000-0000-4000-8000-{n:012d}'
def stmt(cmd,n,r,tenant=T):
 payload=json.dumps(cmd).replace("'","''")
 return f"SET SESSION AUTHORIZATION authenticated; BEGIN; SELECT set_config('request.jwt.claim.sub','{U(n)}',true); SELECT public.p34_customer_command('{tenant}','{R(r)}','{payload}'::jsonb); COMMIT;"
def command(cmd,n=1,r=1,tenant=T):
 out=sql(stmt(cmd,n,r,tenant)).stdout.strip().splitlines();return json.loads(next(x for x in reversed(out) if x.startswith('{')))
def failure(cmd,code,n=1,r=900,tenant=T):
 out=sql(stmt(cmd,n,r,tenant),check=False);assert out.returncode and code in out.stderr,(code,out.stdout,out.stderr);passed.append(code)
def assertion(value):
 assert value
def test(name,fn):fn();passed.append(name);print('PASS',name)
expected={'20261008112217_p34_identity_crm_profile.sql':'4ee85c359dd1d098ae4dd7581e6bca1d1288971da474e25cdb381ac23ff872f4','20261008160753_p34_identity_conflict_recovery.sql':'81acb6ac9c87c3a38e60ff5f810ff9f6a0a201a015465b01e5b48eb57a0726b4'}
for f,h in expected.items():
 assert hashlib.sha256((ROOT/'supabase/migrations'/f).read_bytes()).hexdigest()==h
cfg=json.loads((ROOT/'instances/yourmeal-eatclean/staging.local.synthetic.json').read_text())
assert cfg['network']=='none' and cfg['productionBindings']==[] and cfg['cloudDeployAllowed'] is False
try:
 docker('run','--detach','--name',NAME,'--network','none','--tmpfs','/var/lib/postgresql/data:rw,size=1073741824','--env','POSTGRES_PASSWORD=p34-synthetic-local-only',IMAGE)
 import time
 for _ in range(120):
  if docker('exec',NAME,'pg_isready','-h','127.0.0.1','-U','supabase_admin','-d','postgres',check=False).returncode==0:break
  time.sleep(.25)
 else:
  raise RuntimeError('Synthetic PG readiness failed: '+docker('logs',NAME,check=False).stderr)
 # Supabase image contains Auth; isolated synthetic Storage is sufficient for SQL history policies.
 sql('CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text,owner uuid); ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; GRANT ALL ON storage.buckets,storage.objects TO postgres; GRANT USAGE,CREATE ON SCHEMA storage TO postgres;')
 manifest=[]
 writer_query="SELECT coalesce(string_agg(md5(pg_get_functiondef(p.oid)),',' ORDER BY p.oid),'') FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND (p.proname LIKE 'cr_order_%' OR p.proname LIKE 'offer_quote%')"
 writer_before=None
 order_acl_before=None
 for p in sorted((ROOT/'supabase/migrations').glob('*.sql')):
  if p.name.startswith(('20261007020208_','20261007020245_','20261007020849_')): continue
  if p.name.endswith('_p34_identity_crm_profile.sql'):
   sql('ALTER TABLE public.audit_log ALTER COLUMN entity_id TYPE uuid USING entity_id::uuid;')
   sql(f"INSERT INTO public.tenants(id,slug,name) VALUES('{T}','qualification','Synthetic'); INSERT INTO auth.users(id) VALUES('{U(11)}'),('{U(12)}'),('{U(13)}'); INSERT INTO public.tenant_members(tenant_id,user_id,status,membership_type) VALUES('{T}','{U(11)}','approved','customer'),('{T}','{U(12)}','approved','customer'),('{T}','{U(13)}','approved','customer'); INSERT INTO public.user_roles(user_id,tenant_id,role) VALUES('{U(13)}','{T}','operations_manager');")
   legacy=sql(f"SET SESSION AUTHORIZATION authenticated; BEGIN; SELECT set_config('request.jwt.claim.sub','{U(11)}',true); SELECT public.ensure_individual_customer('{T}','{U(11)}','Existing synthetic','existing@example.test'); COMMIT;").stdout.strip().splitlines()[-1]
   assert legacy;passed.append('old ensure creates customer before P34')
   before=sql(f"SET SESSION AUTHORIZATION authenticated; BEGIN; SELECT set_config('request.jwt.claim.sub','{U(13)}',true); UPDATE public.customers SET display_name='Old staff write' WHERE id='{legacy}'; COMMIT;",check=False)
   assert before.returncode==0,before.stderr;passed.append('old staff direct write works before P34')
   absent=sql(f"SELECT public.p34_customer_command('{T}','{R(900)}','{{}}');",check=False)
   assert absent.returncode and 'does not exist' in absent.stderr;passed.append('app-first RPC unavailable on old schema')
   writer_before=sql(writer_query).stdout.strip()
   order_acl_before=sql("SELECT has_schema_privilege('cr_order_writer','auth','USAGE')").stdout.strip()
  sql('SET ROLE postgres;\n'+p.read_text());manifest.append({'file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
 print('PASS','migration history',len(manifest))
 # New cutover checks only; earlier 50 SQL checks remain preserved supporting evidence.
 def actor_sql(q,n=11):
  return f"SET SESSION AUTHORIZATION authenticated; BEGIN; SELECT set_config('request.jwt.claim.sub','{U(n)}',true); {q}; COMMIT;"
 retained=sql(actor_sql(f"SELECT public.ensure_individual_customer('{T}','{U(11)}')")).stdout.strip().splitlines()[-1]
 assert retained==legacy;passed.append('existing legacy association preserved after P34')
 missing=sql(actor_sql(f"SELECT public.ensure_individual_customer('{T}','{U(12)}')",12),check=False)
 assert missing.returncode and 'EXPLICIT_ONBOARDING_REQUIRED' in missing.stderr;passed.append('old implicit onboarding blocked after P34')
 for q in [f"UPDATE public.customers SET deleted_at=now() WHERE id='{legacy}'",f"INSERT INTO public.customers(tenant_id,display_name,kind) VALUES('{T}','Legacy','individual')",f"UPDATE public.customer_addresses SET city='Legacy' WHERE customer_id='{legacy}'",f"UPDATE public.customer_phones SET phone='Legacy' WHERE customer_id='{legacy}'"]:
  denied=sql(actor_sql(q,13),check=False)
  assert denied.returncode and 'permission denied' in denied.stderr,denied.stderr
  passed.append('old direct CRM operation denied: '+q.split()[0]+' '+q.split()[1])
 onboard=command({'operation':'onboard','declaration':'new','displayName':'New synthetic'},n=12,r=901)
 assert onboard['customerId'];passed.append('new explicit onboarding succeeds')
 profile=command({'operation':'profile','customerId':legacy,'expectedRevision':1,'patch':{'displayName':'New RPC'}},n=11,r=902)
 assert profile['revision']==2;passed.append('new profile RPC succeeds on existing customer')
 address=command({'operation':'address_create','customerId':legacy,'expectedRevision':2,'patch':{'street':'Synthetic road','label':'Home'}},n=11,r=903)
 assert address['addresses'][0]['isDefault'];passed.append('new address RPC succeeds')
 from concurrent.futures import ThreadPoolExecutor
 edit={'operation':'profile','customerId':legacy,'expectedRevision':3,'patch':{'phone':'123'}}
 with ThreadPoolExecutor(2) as pool:
  outcomes=list(pool.map(lambda args:sql(stmt(edit,*args),check=False),[(11,904),(13,905)]))
 assert sum(x.returncode==0 for x in outcomes)==1 and any('STALE_REVISION' in x.stderr for x in outcomes);passed.append('old association new staff/customer concurrency one winner')
 assert writer_before==sql(writer_query).stdout.strip();passed.append('order/quote functions unchanged by both migrations')
 assert order_acl_before==sql("SELECT has_schema_privilege('cr_order_writer','auth','USAGE')").stdout.strip();passed.append('order auth ACL unchanged')
 assert sql("SELECT rolcanlogin OR rolsuper OR rolbypassrls FROM pg_roles WHERE rolname='p34_writer'").stdout.strip()=='f';passed.append('P34 writer least privilege retained')
 original=sql(f"SELECT count(*) FROM public.customers WHERE id='{legacy}' AND user_id='{U(11)}' AND tenant_id='{T}' AND deleted_at IS NULL").stdout.strip()
 assert original=='1';passed.append('legacy identity and tenant survive migration')
 # Proposed broad business-write barrier; applied only to disposable synthetic DB.
 sql((ROOT/'scripts/staging-write-barrier.synthetic.sql').read_text())
 tables=sql("SELECT count(*) FROM pg_trigger WHERE tgname='qualification_write_pause' AND NOT tgisinternal").stdout.strip()
 assert int(tables)>0;passed.append('barrier attached to business tables')
 blocked=sql(stmt({'operation':'profile','customerId':legacy,'expectedRevision':4,'patch':{'phone':'456'}},11,906),check=False)
 assert blocked.returncode and 'QUALIFICATION_WRITE_PAUSED' in blocked.stderr;passed.append('barrier blocks canonical security-definer RPC')
 privileged=sql("SET SESSION AUTHORIZATION service_role; UPDATE public.customers SET display_name='Bypass';",check=False)
 assert privileged.returncode and 'QUALIFICATION_WRITE_PAUSED' in privileged.stderr;passed.append('barrier blocks service_role BYPASSRLS writer')
 read=sql(actor_sql(f"SELECT id FROM public.customers WHERE id='{legacy}'"))
 assert legacy in read.stdout;passed.append('barrier permits authenticated reads')
 sql("BEGIN; DO $$ DECLARE r record; BEGIN FOR r IN SELECT n.nspname,c.relname FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE t.tgname='qualification_write_pause' LOOP EXECUTE format('DROP TRIGGER qualification_write_pause ON %I.%I',r.nspname,r.relname); END LOOP; END $$; DROP SCHEMA qualification_pause CASCADE; COMMIT;")
 resumed=command({'operation':'profile','customerId':legacy,'expectedRevision':4,'patch':{'phone':'456'}},n=11,r=906)
 assert resumed['revision']==5;passed.append('barrier removal resumes same uncommitted request safely')
 report={'source':'b9d9ff56c50570f60f6b1cb1db0e41909b477d2d','syntheticOnly':True,'network':'none','tests':passed,'migrations':manifest,'a5Excluded':True,'productionAccess':False,'fullBrowserAuthVerified':False}
 (ROOT/'../../reports/eatclean-sprint-02/STAGING_MIGRATION_SYNTHETIC_RESULTS.json').resolve().write_text(json.dumps(report,indent=2))
 print('TOTAL',len(passed))
finally:
 removed=docker('rm','--force',NAME,check=False)
 absent=docker('ps','-a','--filter','name=^/'+NAME+'$','--format','{{.Names}}')
 assert not absent.stdout.strip(),'Synthetic container cleanup failed'
 print('CLEANUP PASS')
