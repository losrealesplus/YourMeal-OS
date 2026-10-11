"""Synthetic PG17.6 only; exact owned tmpfs container, no network or host DSN."""
import subprocess,time,pathlib,json,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[4]
NAME='yourmeal-p0-activation-contract-20261011'
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
 skip=('20261007020208_','20261007020245_','20261007020849_','20261008112217_','20261008160753_','20261010155728_','20261010155729_','20261011163814_','20261011190421_')
 for p in sorted((ROOT/'supabase/migrations').glob('*.sql')):
  if p.name.startswith(skip):continue
  sql('SET ROLE postgres;\n'+p.read_text())
 sql(f"INSERT INTO tenants(id,slug,name) VALUES('{T}','p0-synthetic','Synthetic'),('{T2}','p0-other','Other'); INSERT INTO auth.users(id) VALUES('{U}'),('{U2}'); INSERT INTO tenant_members(tenant_id,user_id,status,membership_type) VALUES('{T}','{U}','approved','customer'),('{T}','{U2}','approved','customer'); INSERT INTO user_roles(user_id,tenant_id,role) VALUES('{U}','{T}','company_admin'),('{U2}','{T}','customer'); INSERT INTO customers(id,tenant_id,user_id,kind,display_name) VALUES('{C}','{T}','{U2}','individual','Synthetic'); INSERT INTO dishes(id,tenant_id,name,status,price) VALUES('{D}','{T}','Paid','active',8.5),('{F}','{T2}','Foreign','active',99); INSERT INTO weekly_menus(id,tenant_id,week_start,status) VALUES('55000000-0000-4000-8000-000000000001','{T}','2026-10-12','published'); INSERT INTO weekly_menu_slots(weekly_menu_id,tenant_id,day_date,dish_id,unit_price) VALUES('55000000-0000-4000-8000-000000000001','{T}','2026-10-12','{D}',NULL);")

 # Public EatClean UUID is used only as a synthetic tenant identifier, never a production DSN.
 sql('SET ROLE postgres;\n'+(ROOT/'supabase/migrations/20261011163814_staff_existing_order_atomic_capture.sql').read_text())
 def command(**overrides):
  payload={'customerId':C,'weekStart':'2026-10-12','autoConfirm':True,'lines':[{'dishId':D,'dayDate':'2026-10-12','qty':2,'comment':'Synthetic comment'}]}
  payload.update(overrides);return payload
 def call(payload=None,actor=U,tenant=T):
  encoded=json.dumps(payload or command()).replace("'","''")
  return session(actor)+f"SELECT public.capture_staff_existing_order('{tenant}','{encoded}'::jsonb);"
 def state():return scalar("SELECT concat((SELECT count(*) FROM orders),':',(SELECT count(*) FROM order_items),':',(SELECT count(*) FROM audit_log WHERE entity_type='order'))")
 def reject(name,payload=None,actor=U,tenant=T,code=None):
  before=state();r=sql(call(payload,actor,tenant),False)
  check(name,r.returncode!=0 and (code is None or code in r.stderr) and state()==before)

 check('INSTALLATION_API_EXECUTE_REVOKED',scalar("SELECT NOT has_function_privilege('authenticated','public.capture_staff_existing_order(uuid,jsonb)','EXECUTE') AND NOT has_function_privilege('anon','public.capture_staff_existing_order(uuid,jsonb)','EXECUTE') AND NOT has_function_privilege('service_role','public.capture_staff_existing_order(uuid,jsonb)','EXECUTE')")=='t')
 reject('INSTALLED_RPC_DIRECT_CALL_DENIED',code='42501')
 activation=(ROOT/'scripts/release/activate-eatclean-staff-existing-order.sql').read_text()
 failed=sql('SET ROLE postgres;\n'+activation,False)
 check('ACTIVATION_REQUIRES_BRIDGE',failed.returncode!=0 and 'STAFF_ORDER_ACTIVATION_BRIDGE_MISSING' in failed.stderr and scalar("SELECT NOT has_function_privilege('authenticated','public.capture_staff_existing_order(uuid,jsonb)','EXECUTE')")=='t')
 # Both grants run only in this owned networkless synthetic cluster.
 sql('REVOKE USAGE ON SCHEMA auth FROM cr_order_writer;')
 baseline=sql(call(),False) # API activation is still closed here.
 sql('SET ROLE postgres; GRANT EXECUTE ON FUNCTION public.capture_staff_existing_order(uuid,jsonb) TO authenticated;')
 before=state();r=sql(call(),False)
 check('BRIDGE_BASELINE_42501',r.returncode!=0 and '42501' in r.stderr and state()==before)
 original_actor=sql("SELECT pg_get_functiondef('cr_order_private.actor()'::regprocedure)").stdout
 sql("CREATE OR REPLACE FUNCTION cr_order_private.actor() RETURNS uuid LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT NULL::uuid $$;")
 failed=sql((ROOT/'supabase/migrations/20261011190421_eatclean_private_session_identity_bridge.sql').read_text(),False)
 check('INSTALLATION_SOURCE_DRIFT_REJECTED',failed.returncode!=0 and 'IDENTITY_BRIDGE_ACTOR_SOURCE_DRIFT' in failed.stderr and scalar("SELECT to_regprocedure('cr_order_private.session_uid_bridge()') IS NULL")=='t')
 sql(original_actor)
 sql((ROOT/'supabase/migrations/20261011190421_eatclean_private_session_identity_bridge.sql').read_text())
 check('BRIDGE_INSTALLATION_CLOSED',scalar("SELECT NOT has_function_privilege('authenticated','public.capture_staff_existing_order(uuid,jsonb)','EXECUTE')")=='t')
 print('CATALOG_FINGERPRINT '+scalar("SELECT encode(sha256(convert_to(jsonb_build_object('policies',(SELECT coalesce(jsonb_agg(jsonb_build_object('schema',schemaname,'table',tablename,'name',policyname,'permissive',permissive,'roles',roles,'cmd',cmd,'qual',qual,'check',with_check) ORDER BY schemaname,tablename,policyname),'[]'::jsonb) FROM pg_policies WHERE schemaname='public' AND tablename IN ('orders','order_items','audit_log')),'triggers',(SELECT coalesce(jsonb_agg(jsonb_build_object('table',c.relname,'name',t.tgname,'enabled',t.tgenabled,'definition',pg_get_triggerdef(t.oid,true)) ORDER BY c.relname,t.tgname),'[]'::jsonb) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('orders','order_items','audit_log') AND NOT t.tgisinternal))::text,'UTF8')),'hex')"))
 sql((ROOT/'scripts/release/activate-eatclean-staff-existing-order.sql').read_text())
 # Verify manual activation cannot accept privilege, code or policy drift.
 sql('REVOKE EXECUTE ON FUNCTION public.capture_staff_existing_order(uuid,jsonb) FROM authenticated; GRANT EXECUTE ON FUNCTION cr_order_private.session_uid_bridge() TO PUBLIC;')
 failed=sql(activation,False)
 check('ACTIVATION_PUBLIC_EXECUTE_DRIFT_REJECTED',failed.returncode!=0 and 'BRIDGE_ACL_INVALID' in failed.stderr and scalar("SELECT NOT has_function_privilege('authenticated','public.capture_staff_existing_order(uuid,jsonb)','EXECUTE')")=='t')
 sql('REVOKE EXECUTE ON FUNCTION cr_order_private.session_uid_bridge() FROM PUBLIC;')
 sql('GRANT EXECUTE ON FUNCTION cr_order_private.session_uid_bridge() TO cr_order_writer WITH GRANT OPTION;')
 failed=sql(activation,False)
 check('ACTIVATION_BRIDGE_GRANT_OPTION_REJECTED',failed.returncode!=0 and 'BRIDGE_ACL_INVALID' in failed.stderr)
 sql('REVOKE GRANT OPTION FOR EXECUTE ON FUNCTION cr_order_private.session_uid_bridge() FROM cr_order_writer;')
 sql('GRANT USAGE ON SCHEMA auth TO cr_order_writer;')
 failed=sql(activation,False)
 check('ACTIVATION_WRITER_AUTH_USAGE_REJECTED',failed.returncode!=0 and 'WRITER_AUTH_USAGE_PRESENT' in failed.stderr)
 sql('REVOKE USAGE ON SCHEMA auth FROM cr_order_writer;')
 sql('CREATE POLICY synthetic_bad_policy ON public.orders FOR SELECT TO authenticated USING(true);')
 failed=sql(activation,False)
 check('ACTIVATION_POLICY_DRIFT_REJECTED',failed.returncode!=0 and 'RLS_TRIGGER_DRIFT' in failed.stderr)
 sql('DROP POLICY synthetic_bad_policy ON public.orders;')
 restored_actor=sql("SELECT pg_get_functiondef('cr_order_private.actor()'::regprocedure)").stdout
 sql("CREATE OR REPLACE FUNCTION cr_order_private.actor() RETURNS uuid LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT NULL::uuid $$;")
 failed=sql(activation,False)
 check('ACTIVATION_ADAPTED_FUNCTION_DRIFT_REJECTED',failed.returncode!=0 and 'ACTOR_DRIFT' in failed.stderr)
 sql(restored_actor)
 sql(activation)
 check('EXPLICIT_ACTIVATION_EFFECTIVE',scalar("SELECT has_function_privilege('authenticated','public.capture_staff_existing_order(uuid,jsonb)','EXECUTE')")=='t')
 # PostgreSQL deparses the same object identities differently under these paths.
 raw_lab=scalar("SELECT encode(sha256(convert_to(jsonb_build_object('policies',(SELECT coalesce(jsonb_agg(jsonb_build_object('schema',schemaname,'table',tablename,'name',policyname,'permissive',permissive,'roles',roles,'cmd',cmd,'qual',qual,'check',with_check) ORDER BY schemaname,tablename,policyname),'[]'::jsonb) FROM pg_policies WHERE schemaname='public' AND tablename IN ('orders','order_items','audit_log')),'triggers',(SELECT coalesce(jsonb_agg(jsonb_build_object('table',c.relname,'name',t.tgname,'enabled',t.tgenabled,'definition',pg_get_triggerdef(t.oid,true)) ORDER BY c.relname,t.tgname),'[]'::jsonb) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('orders','order_items','audit_log') AND NOT t.tgisinternal))::text,'UTF8')),'hex')")
 raw_prod=scalar("SET search_path=public; "+"SELECT encode(sha256(convert_to(jsonb_build_object('policies',(SELECT coalesce(jsonb_agg(jsonb_build_object('schema',schemaname,'table',tablename,'name',policyname,'permissive',permissive,'roles',roles,'cmd',cmd,'qual',qual,'check',with_check) ORDER BY schemaname,tablename,policyname),'[]'::jsonb) FROM pg_policies WHERE schemaname='public' AND tablename IN ('orders','order_items','audit_log')),'triggers',(SELECT coalesce(jsonb_agg(jsonb_build_object('table',c.relname,'name',t.tgname,'enabled',t.tgenabled,'definition',pg_get_triggerdef(t.oid,true)) ORDER BY c.relname,t.tgname),'[]'::jsonb) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('orders','order_items','audit_log') AND NOT t.tgisinternal))::text,'UTF8')),'hex')")
 check('RAW_LAB_HASH_REPRODUCED',raw_lab=='80c377b50e563141042c92631a999de87ad8468520fe103655a399409cd5e4c3')
 check('RAW_PRODUCTION_HASH_REPRODUCED',raw_prod=='2cd39f785f109ac2d4d7c64a5ab297bf2bd89ad3108f6a4f1c0cdba7e1572073')
 canonical=scalar("SET search_path=pg_catalog,pg_temp; "+"SELECT encode(sha256(convert_to(jsonb_build_object('policies',(SELECT coalesce(jsonb_agg(jsonb_build_object('schema',schemaname,'table',tablename,'name',policyname,'permissive',permissive,'roles',roles,'cmd',cmd,'qual',qual,'check',with_check) ORDER BY schemaname,tablename,policyname),'[]'::jsonb) FROM pg_policies WHERE schemaname='public' AND tablename IN ('orders','order_items','audit_log')),'triggers',(SELECT coalesce(jsonb_agg(jsonb_build_object('table',c.relname,'name',t.tgname,'enabled',t.tgenabled,'definition',pg_get_triggerdef(t.oid,true)) ORDER BY c.relname,t.tgname),'[]'::jsonb) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('orders','order_items','audit_log') AND NOT t.tgisinternal))::text,'UTF8')),'hex')")
 check('CANONICAL_HASH_MATCHES_PRODUCTION',canonical=='08a95d476c85c39bf33547251622436f63e0291b7a0e186ce920b7da885c9a7a')
 expected=json.loads((ROOT/'docs/10-validation/p0-orders/auth-bridge-integration/production-catalog-canonical.json').read_text())
 observed=json.loads(scalar("SET search_path=pg_catalog,pg_temp; "+"SELECT jsonb_build_object('policies',(SELECT coalesce(jsonb_agg(jsonb_build_object('schema',schemaname,'table',tablename,'name',policyname,'permissive',permissive,'roles',roles,'cmd',cmd,'qual',qual,'check',with_check) ORDER BY schemaname,tablename,policyname),'[]'::jsonb) FROM pg_policies WHERE schemaname='public' AND tablename IN ('orders','order_items','audit_log')),'triggers',(SELECT coalesce(jsonb_agg(jsonb_build_object('table',c.relname,'name',t.tgname,'enabled',t.tgenabled,'definition',pg_get_triggerdef(t.oid,true)) ORDER BY c.relname,t.tgname),'[]'::jsonb) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('orders','order_items','audit_log') AND NOT t.tgisinternal))"))
 check('ALL_15_POLICIES_5_TRIGGERS_EQUAL_PRODUCTION',observed==expected)
 for path in ['public','public,auth,extensions','pg_catalog']:
  sql('REVOKE EXECUTE ON FUNCTION public.capture_staff_existing_order(uuid,jsonb) FROM authenticated;')
  sql('SET search_path='+path+'; '+activation)
  check('ACTIVATION_PATH_'+path,scalar("SELECT has_function_privilege('authenticated','public.capture_staff_existing_order(uuid,jsonb)','EXECUTE')")=='t')
 sql('REVOKE EXECUTE ON FUNCTION public.capture_staff_existing_order(uuid,jsonb) FROM authenticated;')
 sql('CREATE TEMP TABLE pg_policies AS SELECT * FROM pg_catalog.pg_policies WHERE false; CREATE TEMP TABLE pg_proc AS SELECT * FROM pg_catalog.pg_proc WHERE false; '+activation)
 check('TEMP_CATALOG_SHADOW_CANNOT_CHANGE_CONTRACT',scalar("SELECT has_function_privilege('authenticated','public.capture_staff_existing_order(uuid,jsonb)','EXECUTE')")=='t')
 sql('REVOKE EXECUTE ON FUNCTION public.capture_staff_existing_order(uuid,jsonb) FROM authenticated; ALTER TABLE public.order_items DISABLE TRIGGER order_items_legacy_offer_guard;')
 failed=sql(activation,False)
 check('DISABLED_TRIGGER_REJECTED_CLOSED',failed.returncode!=0 and 'RLS_TRIGGER_DRIFT' in failed.stderr and scalar("SELECT NOT has_function_privilege('authenticated','public.capture_staff_existing_order(uuid,jsonb)','EXECUTE')")=='t')
 sql('ALTER TABLE public.order_items ENABLE TRIGGER order_items_legacy_offer_guard; ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;')
 failed=sql(activation,False)
 check('DISABLED_RLS_REJECTED_CLOSED',failed.returncode!=0 and 'RLS_DISABLED' in failed.stderr and scalar("SELECT NOT has_function_privilege('authenticated','public.capture_staff_existing_order(uuid,jsonb)','EXECUTE')")=='t')
 sql('ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;')
 sql(activation)
 result=json.loads(sql(call()).stdout.strip().splitlines()[-1])
 check('CONFIRMED_ORDER_TOTAL_AUDIT_PERSISTED',result['order']['status']=='confirmed' and result['total']==17 and scalar("SELECT count(*) FROM audit_log WHERE entity_id='"+result['order']['id']+"' AND actor_id='"+U+"'")=='1')
 check('WRITER_AUTH_USAGE_REMAINS_ABSENT',scalar("SELECT NOT has_schema_privilege('cr_order_writer','auth','USAGE')")=='t')
 reject('TENANT_ISOLATION_AFTER_CONTEXT_FIX',actor=U2,tenant=T2,code='STAFF_ORDER')
 reject('UNAUTHORIZED_CUSTOMER_AFTER_CONTEXT_FIX',actor=U2,code='STAFF_ORDER_PERMISSION_DENIED')
 print(json.dumps({'status':'ACTIVATION_CATALOG_CONTRACT_PASS','checks':checks,'productionConnection':False}))
except Exception as e:
 print(json.dumps({'status':'P0_ORDERS_ATOMIC_BLOCKED','error':str(e),'checks':checks,'productionConnection':False}));raise SystemExit(1)
finally:
 if owned:
  label=docker('inspect',NAME,'--format','{{index .Config.Labels "yourmeal.p0"}}').stdout.strip()
  if label=='synthetic-20261011':
   r=docker('rm','-f',NAME); absent=not docker('ps','-a','--filter','name=^/'+NAME+'$','--format','{{.Names}}').stdout.strip();print('CLEANUP PASS' if r.returncode==0 and absent else 'CLEANUP FAIL')
  else:print('CLEANUP STOP OWNERSHIP_MISMATCH')
