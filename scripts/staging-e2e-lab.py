"""Disposable synthetic E2E backend. Exact owned resources; never uses host DSNs."""
import subprocess, sys, time, pathlib, hashlib, json
ROOT=pathlib.Path(__file__).resolve().parents[1]
NET='yourmeal-e2e-isolated'; DB='yourmeal-e2e-db'; AUTH='yourmeal-e2e-auth'; REST='yourmeal-e2e-rest'
PG='public.ecr.aws/supabase/postgres@sha256:3866d94d8426927e8db3f1c5d790752292bfbe27b5f1f46e199ae1b7d3c1710b'
GT='public.ecr.aws/supabase/gotrue@sha256:c0c25187a6b835e65a6f6e6c6b39d090e832d40e6de5186f2c038e0411944232'
PR='public.ecr.aws/supabase/postgrest@sha256:b574528fe109c8343c1247155734d03df8c34b462f342dca0ccc20244fc36ef9'
SECRET='p34-local-synthetic-signing-secret-not-for-production-2026'; PASSWORD='p34-e2e-synthetic-db-only'
def d(*args,input=None,check=True):
 r=subprocess.run(['docker','--context','orbstack',*args],input=input,capture_output=True,text=True,timeout=120)
 if check and r.returncode: raise RuntimeError(r.stderr)
 return r

def sql(s): return d('exec','-i',DB,'psql','-X','-q','-t','-A','-U','supabase_admin','-d','postgres','-v','ON_ERROR_STOP=1',input=s).stdout

def cleanup():
 for n in ['yourmeal-e2e-transport',REST,AUTH,DB]:
  found=d('ps','-a','--filter','name=^/'+n+'$','--format','{{.Names}}').stdout.strip()
  if found:
   label=d('inspect',n,'--format','{{index .Config.Labels "yourmeal.e2e"}}').stdout.strip()
   if label!='synthetic-38eb0b5d': raise RuntimeError('Refuse to remove unowned resource')
   d('rm','-f',n)
 found=d('network','ls','--filter','name=^'+NET+'$','--format','{{.Name}}').stdout.strip()
 if found:
  label=d('network','inspect',NET,'--format','{{index .Labels "yourmeal.e2e"}}').stdout.strip()
  if label!='synthetic-38eb0b5d':raise RuntimeError('Refuse to remove unowned network')
  d('network','rm',NET)
 print('CLEANUP PASS')

def start():
 for n in [DB,AUTH,REST,'yourmeal-e2e-transport']:
  if d('ps','-a','--filter','name=^/'+n+'$','--format','{{.Names}}').stdout.strip():raise RuntimeError('Owned name already exists; stop before start')
 mem=int(d('info','--format','{{.MemTotal}}').stdout.strip())
 if mem<3*1024**3:raise RuntimeError('Insufficient Docker RAM')
 d('network','create','--internal','--label','yourmeal.e2e=synthetic-38eb0b5d',NET)
 try:
  d('run','-d','--pull','never','--name',DB,'--label','yourmeal.e2e=synthetic-38eb0b5d','--network',NET,'--memory','1536m','--tmpfs','/var/lib/postgresql/data:rw,size=1073741824','-e','POSTGRES_PASSWORD='+PASSWORD,PG)
  for _ in range(120):
   if d('exec',DB,'pg_isready','-h','127.0.0.1','-U','supabase_admin',check=False).returncode==0:break
   time.sleep(.25)
  else:raise RuntimeError('PG_NOT_READY')
  sql("ALTER ROLE supabase_auth_admin PASSWORD '"+PASSWORD+"'; ALTER ROLE authenticator PASSWORD '"+PASSWORD+"'; CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text,owner uuid); ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; GRANT ALL ON storage.buckets,storage.objects TO postgres; GRANT USAGE,CREATE ON SCHEMA storage TO postgres;")
  expected={'20261008112217_p34_identity_crm_profile.sql':'4ee85c359dd1d098ae4dd7581e6bca1d1288971da474e25cdb381ac23ff872f4','20261008160753_p34_identity_conflict_recovery.sql':'81acb6ac9c87c3a38e60ff5f810ff9f6a0a201a015465b01e5b48eb57a0726b4'}
  for f,h in expected.items():assert hashlib.sha256((ROOT/'supabase/migrations'/f).read_bytes()).hexdigest()==h
  for p in sorted((ROOT/'supabase/migrations').glob('*.sql')):
   if p.name.startswith(('20261007020208_','20261007020245_','20261007020849_')):continue
   if p.name.endswith('_p34_identity_crm_profile.sql'):sql('ALTER TABLE public.audit_log ALTER COLUMN entity_id TYPE uuid USING entity_id::uuid;')
   sql(('' if p.name.endswith('_release_cr_order_writer_auth_usage.sql') else 'SET ROLE postgres;\n')+p.read_text())
  env={'GOTRUE_API_HOST':'0.0.0.0','GOTRUE_API_PORT':'9999','API_EXTERNAL_URL':'http://127.0.0.1:54331/auth/v1','GOTRUE_DB_DRIVER':'postgres','GOTRUE_DB_DATABASE_URL':f'postgres://supabase_auth_admin:{PASSWORD}@{DB}:5432/postgres','GOTRUE_SITE_URL':'http://127.0.0.1:8080','GOTRUE_URI_ALLOW_LIST':'http://127.0.0.1:8080/**','GOTRUE_JWT_SECRET':SECRET,'GOTRUE_JWT_AUD':'authenticated','GOTRUE_JWT_DEFAULT_GROUP_NAME':'authenticated','GOTRUE_JWT_ADMIN_ROLES':'service_role','GOTRUE_JWT_EXP':'3600','GOTRUE_EXTERNAL_EMAIL_ENABLED':'true','GOTRUE_MAILER_AUTOCONFIRM':'true','GOTRUE_DISABLE_SIGNUP':'false','GOTRUE_EXTERNAL_PHONE_ENABLED':'false','GOTRUE_EXTERNAL_GOOGLE_ENABLED':'false','GOTRUE_EXTERNAL_APPLE_ENABLED':'false'}
  args=[]
  for k,v in env.items():args+=['-e',k+'='+v]
  d('run','-d','--pull','never','--name',AUTH,'--label','yourmeal.e2e=synthetic-38eb0b5d','--network',NET,*args,GT)
  env={'PGRST_DB_URI':f'postgres://authenticator:{PASSWORD}@{DB}:5432/postgres','PGRST_DB_SCHEMAS':'public','PGRST_DB_ANON_ROLE':'anon','PGRST_JWT_SECRET':SECRET,'PGRST_DB_EXTRA_SEARCH_PATH':'public,extensions','PGRST_SERVER_PORT':'3000'}
  args=[]
  for k,v in env.items():args+=['-e',k+'='+v]
  d('run','-d','--pull','never','--name',REST,'--label','yourmeal.e2e=synthetic-38eb0b5d','--network',NET,*args,PR)
  d('run','-d','--pull','never','--name','yourmeal-e2e-transport','--label','yourmeal.e2e=synthetic-38eb0b5d','--network',NET,'node@sha256:663c09e4fd483fbcb2bb7297b3618061ac23f0a1925b0958db2ab734efad7c94','node','-e','setInterval(()=>{},100000)')
  print('SYNTHETIC_BACKEND_STARTED')
 except:cleanup();raise
if __name__=='__main__':
 if sys.argv[1:]==['start']:start()
 elif sys.argv[1:]==['stop']:cleanup()
 elif sys.argv[1:]==['sql']:print(sql(sys.stdin.read()))
 else:raise SystemExit('Use start/stop/sql')
