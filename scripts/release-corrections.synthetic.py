"""Focused SQL correction checks against the exact disposable synthetic lab only."""
import importlib.util,json,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('lab',ROOT/'scripts/staging-e2e-lab.py');lab=importlib.util.module_from_spec(spec);spec.loader.exec_module(lab)
checks=[]
def q(s,ok=True):
 r=lab.d('exec','-i',lab.DB,'psql','-X','-q','-t','-A','-U','supabase_admin','-d','postgres','-v','ON_ERROR_STOP=1',input=s,check=False)
 if ok and r.returncode:raise RuntimeError('SYNTHETIC_SQL_FAILED')
 return r

def test(name,value):
 checks.append({'name':name,'result':'PASS' if value else 'FAIL'})
 if not value:raise RuntimeError(name)
def scalar(s):return q(s).stdout.strip().splitlines()[-1]
T='11000000-0000-4000-8000-000000000001';T2='11000000-0000-4000-8000-000000000002'
U='22000000-0000-4000-8000-000000000001';U2='22000000-0000-4000-8000-000000000002'
C='33000000-0000-4000-8000-000000000001';D='44000000-0000-4000-8000-000000000001';Z='44000000-0000-4000-8000-000000000002';F='44000000-0000-4000-8000-000000000003'
def order(dish,actor=U,customer=C,tenant=T,total=17):
 return f"SET SESSION AUTHORIZATION authenticated; BEGIN; SELECT set_config('request.jwt.claim.sub','{actor}',true); SELECT public.program_draft_order('{tenant}','{customer}','2026-10-12',{total},NULL,'[{{\"dish_id\":\"{dish}\",\"day_date\":\"2026-10-12\",\"qty\":2,\"unit_price\":999}}]'::jsonb,'individual',NULL,NULL,NULL,NULL); COMMIT;"
try:
 test('WRITER_AUTH_SCHEMA_USAGE',scalar("SELECT has_schema_privilege('cr_order_writer','auth','USAGE')")=='t')
 test('WRITER_NO_LOGIN_SUPER_OR_BYPASS',scalar("SELECT NOT(rolcanlogin OR rolsuper OR rolbypassrls) FROM pg_roles WHERE rolname='cr_order_writer'")=='t')
 test('WRITER_NO_AUTH_USERS_SELECT',scalar("SELECT NOT has_table_privilege('cr_order_writer','auth.users','SELECT')")=='t')
 signature="public.program_draft_order(uuid,uuid,date,numeric,text,jsonb,public.demand_channel,uuid,uuid,uuid,uuid)"
 test('RPC_OWNER_SECURITY_SEARCH_PATH',scalar(f"SELECT proowner='postgres'::regrole AND prosecdef AND proconfig=ARRAY['search_path=public'] FROM pg_proc WHERE oid='{signature}'::regprocedure")=='t')
 test('RPC_AUTHENTICATED_EXECUTE_RETAINED',scalar(f"SELECT has_function_privilege('authenticated','{signature}','EXECUTE')")=='t')
 test('ANON_CALL_REJECTED',q("SET SESSION AUTHORIZATION anon; SELECT public.program_draft_order(NULL,NULL,NULL,NULL,NULL,'[]'::jsonb,'individual',NULL,NULL,NULL,NULL);",False).returncode!=0)

 # Compare logical security metadata before/after replacing the exact original RPC.
 metadata=f"SELECT json_build_array(proowner::regrole::text,prosecdef,proconfig,proacl::text)::text FROM pg_proc WHERE oid='{signature}'::regprocedure"
 saved=scalar(metadata)
 original=(ROOT/'supabase/migrations/20260723183000_b2b_b2c_customer_model.sql').read_text()
 original=original[original.index('CREATE OR REPLACE FUNCTION public.program_draft_order('):]
 original=original[:original.index('$$;')+3]
 q('SET ROLE postgres;\n'+original)
 migration=next((ROOT/'supabase/migrations').glob('*_release_program_draft_order_price_snapshot.sql'))
 q('SET ROLE postgres;\n'+migration.read_text())
 test('OWNER_ACL_SECURITY_CONFIG_UNCHANGED',scalar(metadata)==saved)
 acl=next((ROOT/'supabase/migrations').glob('*_release_cr_order_writer_auth_usage.sql'))
 restricted=acl.read_text().replace('BEGIN;','BEGIN; REVOKE USAGE ON SCHEMA auth FROM cr_order_writer; SET ROLE postgres;',1)
 r=q(restricted,False)
 test('INEFFECTIVE_GRANT_FAILS_CLOSED',r.returncode!=0 and 'RELEASE_AUTH_SCHEMA_GRANT_NOT_EFFECTIVE' in r.stderr)
 test('FAILED_GRANT_ROLLS_BACK',scalar("SELECT has_schema_privilege('cr_order_writer','auth','USAGE')")=='t')
 q(f"BEGIN; INSERT INTO tenants(id,slug,name) VALUES('{T}','release-synthetic','Synthetic'),('{T2}','release-other','Other'); INSERT INTO auth.users(id) VALUES('{U}'),('{U2}'); INSERT INTO tenant_members(tenant_id,user_id,status,membership_type) VALUES('{T}','{U}','approved','customer'),('{T}','{U2}','approved','customer'); INSERT INTO customers(id,tenant_id,user_id,kind,display_name) VALUES('{C}','{T}','{U}','individual','Synthetic'); INSERT INTO dishes(id,tenant_id,name,status,price) VALUES('{D}','{T}','Paid','active',8.5),('{Z}','{T}','Zero','active',0),('{F}','{T2}','Foreign','active',99); INSERT INTO user_roles(user_id,tenant_id,role) VALUES('{U}','{T}','customer'),('{U2}','{T}','customer'); INSERT INTO weekly_menus(id,tenant_id,week_start,status) VALUES('55000000-0000-4000-8000-000000000001','{T}','2026-10-12','published'); INSERT INTO weekly_menu_slots(weekly_menu_id,tenant_id,day_date,dish_id,unit_price) VALUES('55000000-0000-4000-8000-000000000001','{T}','2026-10-12','{D}',NULL),('55000000-0000-4000-8000-000000000001','{T}','2026-10-12','{Z}',NULL); COMMIT;")
 test('PAID_ORDER_CREATED',q(order(D)).returncode==0)
 test('CATALOGUE_PRICE_IGNORES_INPUT',scalar(f"SELECT unit_price=8.5 AND qty=2 AND price_snapshot_status='captured' FROM order_items WHERE dish_id='{D}'")=='t')
 test('ZERO_ORDER_CREATED',q(order(Z,total=0)).returncode==0)
 test('EXPLICIT_ZERO_SNAPSHOT',scalar(f"SELECT unit_price=0 AND price_snapshot_status='explicit_zero' FROM order_items WHERE dish_id='{Z}'")=='t')
 before=scalar('SELECT count(*) FROM orders')
 for name,s in [('FOREIGN_CUSTOMER_DENIED',order(D,actor=U2)),('FOREIGN_TENANT_DENIED',order(D,tenant=T2)),('FOREIGN_DISH_REJECTED',order(F)),('MISSING_DISH_REJECTED',order('44000000-0000-4000-8000-000000000099')),('NO_IDENTITY_DENIED',order(D,actor=''))]:
  test(name,q(s,False).returncode!=0)
 test('FAILED_CALLS_ATOMIC_NO_PARTIAL_ORDER',scalar('SELECT count(*) FROM orders')==before)
 migration=next((ROOT/'supabase/migrations').glob('*_release_program_draft_order_price_snapshot.sql'))
 r=q('SET ROLE postgres;\n'+migration.read_text(),False)
 test('UNKNOWN_OR_ALREADY_CHANGED_FUNCTION_FAILS_CLOSED',r.returncode!=0 and 'RELEASE_ORDER_WRITER_DEFINITION_DRIFT' in r.stderr)
 acl=next((ROOT/'supabase/migrations').glob('*_release_cr_order_writer_auth_usage.sql'))
 test('USAGE_GRANT_IDEMPOTENT',q(acl.read_text()).returncode==0)
 q('ALTER ROLE cr_order_writer LOGIN;')
 try:
  r=q(acl.read_text(),False);test('UNSAFE_WRITER_REJECTED',r.returncode!=0 and 'RELEASE_UNSAFE_OR_MISSING_ORDER_WRITER' in r.stderr)
 finally:q('ALTER ROLE cr_order_writer NOLOGIN;')
 print(json.dumps({'status':'RELEASE_CORRECTIONS_SYNTHETIC_PASS','checks':checks,'productionConnection':False}))
except Exception as e:
 print(json.dumps({'status':'RELEASE_CORRECTIONS_SYNTHETIC_BLOCKED','failedCheck':str(e),'checks':checks}));raise SystemExit(1)
