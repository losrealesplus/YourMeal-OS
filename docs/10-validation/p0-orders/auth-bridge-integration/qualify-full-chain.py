"""Synthetic PG17.6 only; exact owned tmpfs container, no network or host DSN."""
import subprocess,time,pathlib,json,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[4]
NAME='yourmeal-p0-authbridge-bootstrap-20261011'
IMAGE='public.ecr.aws/supabase/postgres@sha256:3866d94d8426927e8db3f1c5d790752292bfbe27b5f1f46e199ae1b7d3c1710b'
checks=[]
def docker(*args,input=None):
 return subprocess.run(['docker','--context','orbstack',*args],input=input,text=True,capture_output=True,timeout=120)
def sql(s,ok=True):
 r=docker('exec','-i',NAME,'psql','-X','-q','-t','-A','-U','supabase_admin','-d','postgres','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose',input=s)
 if ok and r.returncode: raise RuntimeError('SYNTHETIC_SQL: '+r.stderr[:1200])
 return r
def scalar(s):return sql(s).stdout.strip().splitlines()[-1]
def check(name,value):
 checks.append({'name':name,'result':'PASS' if value else 'FAIL'})
 if not value:raise RuntimeError(name)
T='8bba00ba-331b-42c8-9283-4e3836ffb870';T2='11000000-0000-4000-8000-000000000002';U='22000000-0000-4000-8000-000000000001';U2='22000000-0000-4000-8000-000000000002';C='33000000-0000-4000-8000-000000000001';D='44000000-0000-4000-8000-000000000001';F='44000000-0000-4000-8000-000000000002'
def session(actor=U):return f"SET SESSION AUTHORIZATION authenticated; SELECT set_config('request.jwt.claim.sub','{actor}',false);"
def draft(dish=D,actor=U,tenant=T):return session(actor)+f"SELECT public.program_draft_order('{tenant}','{C}','2026-10-12',17,NULL,'[{{\"dish_id\":\"{dish}\",\"day_date\":\"2026-10-12\",\"qty\":2,\"unit_price\":999}}]'::jsonb,'individual',NULL,NULL,NULL,NULL);"
owned=False
try:
 if docker('ps','-a','--filter','name=^/'+NAME+'$','--format','{{.Names}}').stdout.strip():raise RuntimeError('OWNED_NAME_ALREADY_EXISTS')
 r=docker('run','-d','--pull','never','--name',NAME,'--label','yourmeal.p0=synthetic-20261011','--network','none','--memory','1536m','--tmpfs','/var/lib/postgresql/data:rw,size=1073741824','-e','POSTGRES_PASSWORD=p0-synthetic-only-not-production',IMAGE)
 if r.returncode:raise RuntimeError('SYNTHETIC_START_FAILED')
 owned=True
 for _ in range(100):
  if docker('exec',NAME,'pg_isready','-h','127.0.0.1','-U','supabase_admin').returncode==0:break
  time.sleep(.25)
 else:raise RuntimeError('PG_TIMEOUT')
 sql('CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text,owner uuid); ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; GRANT ALL ON storage.buckets,storage.objects TO postgres; GRANT USAGE,CREATE ON SCHEMA storage TO postgres;')
 sql("SET ROLE postgres; CREATE ROLE cr_order_writer NOLOGIN NOINHERIT NOBYPASSRLS; RESET ROLE; GRANT USAGE ON SCHEMA auth TO cr_order_writer;")
 skip=()
 for p in sorted((ROOT/'supabase/migrations').glob('*.sql')):
  if p.name.startswith(skip):continue
  sql('SET ROLE postgres;\n'+p.read_text())
 check('FULL_MIGRATION_CHAIN',True)
 print(json.dumps({'status':'FULL_CHAIN_PASS','migrations':len(list((ROOT/'supabase/migrations').glob('*.sql'))),'checks':checks,'productionConnection':False}))
except Exception as e:
 print(json.dumps({'status':'P0_ORDERS_ATOMIC_BLOCKED','error':str(e),'checks':checks,'productionConnection':False}));raise SystemExit(1)
finally:
 if owned:
  label=docker('inspect',NAME,'--format','{{index .Config.Labels "yourmeal.p0"}}').stdout.strip()
  if label=='synthetic-20261011':
   r=docker('rm','-f',NAME); absent=not docker('ps','-a','--filter','name=^/'+NAME+'$','--format','{{.Names}}').stdout.strip();print('CLEANUP PASS' if r.returncode==0 and absent else 'CLEANUP FAIL')
  else:print('CLEANUP STOP OWNERSHIP_MISMATCH')
