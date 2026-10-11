"""Synthetic PG17.6 only; exact owned tmpfs container, no network or host DSN."""
import subprocess,time,pathlib,json,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[3]
NAME='yourmeal-p0-orders-synthetic-20261011'
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
T='11000000-0000-4000-8000-000000000001';T2='11000000-0000-4000-8000-000000000002';U='22000000-0000-4000-8000-000000000001';U2='22000000-0000-4000-8000-000000000002';C='33000000-0000-4000-8000-000000000001';D='44000000-0000-4000-8000-000000000001';F='44000000-0000-4000-8000-000000000002'
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
 skip=('20261007020208_','20261007020245_','20261007020849_','20261008112217_','20261008160753_','20261010155728_','20261010155729_')
 for p in sorted((ROOT/'supabase/migrations').glob('*.sql')):
  if p.name.startswith(skip):continue
  sql('SET ROLE postgres;\n'+p.read_text())
 check('POSTGRESQL_17_6',scalar('SHOW server_version').startswith('17.6'))
 check('PRE_P34_NO_CUSTOMER_REVISION',scalar("SELECT NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers' AND column_name='revision')")=='t')
 check('REAL_TRIGGER_OWNERSHIP',scalar("SELECT p.proowner='cr_order_writer'::regrole AND p.prosecdef FROM pg_proc p WHERE oid='cr_order_private.guard_legacy_offer()'::regprocedure")=='t')
 check('WRITER_AUTH_USAGE_ABSENT',scalar("SELECT NOT has_schema_privilege('cr_order_writer','auth','USAGE')")=='t')
 sql(f"INSERT INTO tenants(id,slug,name) VALUES('{T}','p0-synthetic','Synthetic'),('{T2}','p0-other','Other'); INSERT INTO auth.users(id) VALUES('{U}'),('{U2}'); INSERT INTO tenant_members(tenant_id,user_id,status,membership_type) VALUES('{T}','{U}','approved','customer'),('{T}','{U2}','approved','customer'); INSERT INTO user_roles(user_id,tenant_id,role) VALUES('{U}','{T}','company_admin'),('{U2}','{T}','customer'); INSERT INTO customers(id,tenant_id,user_id,kind,display_name) VALUES('{C}','{T}','{U2}','individual','Synthetic'); INSERT INTO dishes(id,tenant_id,name,status,price) VALUES('{D}','{T}','Paid','active',8.5),('{F}','{T2}','Foreign','active',99); INSERT INTO weekly_menus(id,tenant_id,week_start,status) VALUES('55000000-0000-4000-8000-000000000001','{T}','2026-10-12','published'); INSERT INTO weekly_menu_slots(weekly_menu_id,tenant_id,day_date,dish_id,unit_price) VALUES('55000000-0000-4000-8000-000000000001','{T}','2026-10-12','{D}',NULL);")
 # Reproduce actual separate header/line calls with schema snapshot already supplied by frontend.
 head=session()+f"INSERT INTO orders(id,tenant_id,customer_id,week_start,status,total,demand_channel) VALUES('66000000-0000-4000-8000-000000000001','{T}','{C}','2026-10-12','draft',17,'individual');"
 line=session()+f"INSERT INTO order_items(tenant_id,order_id,dish_id,day_date,qty,unit_price,price_snapshot_status) VALUES('{T}','66000000-0000-4000-8000-000000000001','{D}','2026-10-12',2,8.5,'captured');"
 r=sql(head,False);check('AUTH_USAGE_42501_REPRODUCED_HEADER',r.returncode!=0 and '42501' in r.stderr and 'schema auth' in r.stderr)
 check('FAILED_HEADER_NOT_PERSISTED',scalar("SELECT count(*) FROM orders WHERE id='66000000-0000-4000-8000-000000000001'")=='0')
 grant=ROOT/'supabase/migrations/20261010155728_release_cr_order_writer_auth_usage.sql'
 sql(grant.read_text())
 check('USAGE_EFFECTIVE',scalar("SELECT has_schema_privilege('cr_order_writer','auth','USAGE')")=='t')
 check('NO_AUTH_ROWS_GRANTED',scalar("SELECT NOT has_table_privilege('cr_order_writer','auth.users','SELECT')")=='t')
 check('WRITER_NO_LOGIN_SUPER_BYPASS',scalar("SELECT NOT(rolcanlogin OR rolsuper OR rolbypassrls) FROM pg_roles WHERE rolname='cr_order_writer'")=='t')
 sql(head);sql(line);check('STAFF_EXISTING_LINES_RECOVERED',scalar("SELECT qty=2 AND unit_price=8.5 FROM order_items WHERE order_id='66000000-0000-4000-8000-000000000001'")=='t')
 r=sql(session()+"UPDATE orders SET status='confirmed' WHERE id='66000000-0000-4000-8000-000000000001';",False)
 check('STAFF_CONFIRMATION',r.returncode==0)
 orphan='66000000-0000-4000-8000-000000000002'
 sql(head.replace('66000000-0000-4000-8000-000000000001',orphan))
 r=sql(line.replace('66000000-0000-4000-8000-000000000001',orphan).replace(D,F),False)
 check('STAFF_SEPARATE_CALL_ORPHAN_RISK_DEMONSTRATED',r.returncode!=0 and scalar(f"SELECT count(*) FROM orders WHERE id='{orphan}'")=='1')
 sql(f"DELETE FROM orders WHERE id='{orphan}';")
 # Qualify the already versioned price fix to preserve the original atomic draft boundary.
 sql('SET ROLE postgres;\n'+(ROOT/'supabase/migrations/20261010155729_release_program_draft_order_price_snapshot.sql').read_text())
 before=scalar('SELECT count(*) FROM orders');sql(draft());check('ATOMIC_STAFF_RPC_PRICE_QUANTITY',scalar(f"SELECT count(*) FROM order_items WHERE dish_id='{D}' AND qty=2 AND unit_price=8.5")=='2')
 check('FOREIGN_TENANT_REJECTED',sql(draft(tenant=T2),False).returncode!=0)
 check('FOREIGN_DISH_REJECTED',sql(draft(dish=F),False).returncode!=0)
 check('NO_ORPHANS_AFTER_RPC_FAILURE',scalar('SELECT count(*) FROM orders')==str(int(before)+1))
 sql(draft(actor=U2));check('B2C_OWN_ORDER_SQL',True)
 check('ANONYMOUS_DENIED',sql(draft(actor=''),False).returncode!=0)
 check('RLS_ENABLED',scalar("SELECT bool_and(relrowsecurity) FROM pg_class WHERE oid IN ('public.orders'::regclass,'public.order_items'::regclass)")=='t')
 check('OTHER_TENANT_READ_HIDDEN',sql(session(U2)+f"SELECT id FROM orders WHERE tenant_id='{T2}';").stdout.strip().splitlines()==[U2])
 print(json.dumps({'status':'P0_ORDERS_SYNTHETIC_SQL_PASS','checks':checks,'authenticatedAppE2E':'NOT_TESTED','productionConnection':False}))
except Exception as e:
 print(json.dumps({'status':'P0_ORDERS_SYNTHETIC_BLOCKED','error':str(e),'checks':checks,'productionConnection':False}));raise SystemExit(1)
finally:
 if owned:
  label=docker('inspect',NAME,'--format','{{index .Config.Labels "yourmeal.p0"}}').stdout.strip()
  if label=='synthetic-20261011':
   r=docker('rm','-f',NAME); absent=not docker('ps','-a','--filter','name=^/'+NAME+'$','--format','{{.Names}}').stdout.strip();print('CLEANUP PASS' if r.returncode==0 and absent else 'CLEANUP FAIL')
  else:print('CLEANUP STOP OWNERSHIP_MISMATCH')
