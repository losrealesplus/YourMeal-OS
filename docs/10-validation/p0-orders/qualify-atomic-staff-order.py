"""Synthetic PG17.6 only; exact owned tmpfs container, no network or host DSN."""
import subprocess,time,pathlib,json,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[3]
NAME='yourmeal-p0-orders-atomic-20261011'
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
 skip=('20261007020208_','20261007020245_','20261007020849_','20261008112217_','20261008160753_','20261010155728_','20261010155729_','20261011163814_')
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
 check('ACTIVATION_REQUIRES_AUTH_USAGE',failed.returncode!=0 and 'STAFF_ORDER_ACTIVATION_AUTH_USAGE_REQUIRED' in failed.stderr and scalar("SELECT NOT has_function_privilege('authenticated','public.capture_staff_existing_order(uuid,jsonb)','EXECUTE')")=='t')
 # Both grants run only in this owned networkless synthetic cluster.
 sql((ROOT/'supabase/migrations/20261010155728_release_cr_order_writer_auth_usage.sql').read_text())
 sql('SET ROLE postgres;\n'+activation)
 check('EXPLICIT_ACTIVATION_EFFECTIVE',scalar("SELECT has_function_privilege('authenticated','public.capture_staff_existing_order(uuid,jsonb)','EXECUTE')")=='t')
 result=json.loads(sql(call()).stdout.strip().splitlines()[-1])
 oid=result['order']['id']
 check('CONFIRMED_HEADER_LINES_TOTAL',result['order']['status']=='confirmed' and result['total']==17 and len(result['items'])==1 and result['items'][0]['qty']==2 and result['items'][0]['unit_price']==8.5)
 check('COMMENT_PRESERVED',result['items'][0]['comment']=='Synthetic comment')
 check('PERSISTED_READ',scalar(f"SELECT total=17 AND status='confirmed' FROM orders WHERE id='{oid}'")=='t')
 check('TRANSACTIONAL_AUDIT',scalar(f"SELECT count(*) FROM audit_log WHERE entity_id='{oid}' AND actor_id='{U}'")=='1')
 check('INVOKER_EMPTY_SEARCH_PATH',scalar("SELECT NOT prosecdef AND proconfig=ARRAY['search_path=\"\"'] FROM pg_proc WHERE oid='public.capture_staff_existing_order(uuid,jsonb)'::regprocedure")=='t')
 check('AUTHENTICATED_ONLY_EXECUTE',scalar("SELECT has_function_privilege('authenticated','public.capture_staff_existing_order(uuid,jsonb)','EXECUTE') AND NOT has_function_privilege('anon','public.capture_staff_existing_order(uuid,jsonb)','EXECUTE') AND NOT has_function_privilege('service_role','public.capture_staff_existing_order(uuid,jsonb)','EXECUTE')")=='t')
 reject('CUSTOMER_NOT_STAFF',actor=U2,code='STAFF_ORDER_PERMISSION_DENIED')
 reject('MISSING_ACTOR',actor='',code='STAFF_ORDER_PERMISSION_DENIED')
 reject('FOREIGN_TENANT',tenant=T2,code='STAFF_ORDER_TENANT_NOT_ENABLED')
 reject('NONEXISTENT_CUSTOMER',command(customerId='33000000-0000-4000-8000-000000000099'),code='STAFF_ORDER_CUSTOMER_NOT_FOUND')

 sql(f"INSERT INTO customers(id,tenant_id,kind,display_name) VALUES('33000000-0000-4000-8000-000000000002','{T2}','individual','Other synthetic');")

 sql(f"INSERT INTO tenant_members(tenant_id,user_id,status,membership_type) VALUES('{T2}','{U}','approved','customer'); INSERT INTO user_roles(user_id,tenant_id,role) VALUES('{U}','{T2}','company_admin');")
 check('OTHER_TENANT_STAFF_ACTUALLY_AUTHORIZED',scalar(session()+f"SELECT public.is_tenant_member('{T2}') AND public.has_role('{U}','{T2}','company_admin');")=='t')
 reject('AUTHORIZED_OTHER_TENANT_SCOPE_DENIED',command(customerId='33000000-0000-4000-8000-000000000002'),tenant=T2,code='STAFF_ORDER_TENANT_NOT_ENABLED')
 reject('EXISTING_FOREIGN_CUSTOMER',command(customerId='33000000-0000-4000-8000-000000000002'),code='STAFF_ORDER_CUSTOMER_NOT_FOUND')
 sql(f"UPDATE tenant_members SET status='pending' WHERE tenant_id='{T}' AND user_id='{U}';")
 reject('UNAPPROVED_STAFF_MEMBERSHIP',code='STAFF_ORDER_PERMISSION_DENIED')
 sql(f"UPDATE tenant_members SET status='approved' WHERE tenant_id='{T}' AND user_id='{U}'; UPDATE user_roles SET role='kitchen' WHERE tenant_id='{T}' AND user_id='{U}';")
 reject('KITCHEN_CANNOT_CAPTURE',code='STAFF_ORDER_PERMISSION_DENIED')
 sql(f"UPDATE user_roles SET role='operations_manager' WHERE tenant_id='{T}' AND user_id='{U}';")
 result=json.loads(sql(call(command(autoConfirm=False))).stdout.strip().splitlines()[-1])
 check('OPERATIONS_MANAGER_CAPTURE',result['order']['status']=='draft')
 sql(f"UPDATE user_roles SET role='company_admin' WHERE tenant_id='{T}' AND user_id='{U}';")
 reject('NO_LINES',command(lines=[]),code='STAFF_ORDER_LINES_REQUIRED')
 reject('ZERO_QUANTITY',command(lines=[{'dishId':D,'dayDate':'2026-10-12','qty':0}]),code='STAFF_ORDER_QUANTITY_INVALID')
 reject('FRACTIONAL_QUANTITY',command(lines=[{'dishId':D,'dayDate':'2026-10-12','qty':1.5}]),code='STAFF_ORDER_QUANTITY_INVALID')
 reject('NEGATIVE_PRICE',command(lines=[{'dishId':D,'dayDate':'2026-10-12','qty':1,'unitPriceOverride':-1}]),code='STAFF_ORDER_PRICE_INVALID')
 reject('TEXT_PRICE',command(lines=[{'dishId':D,'dayDate':'2026-10-12','qty':1,'unitPriceOverride':'NaN'}]),code='STAFF_ORDER_PRICE_INVALID')
 reject('SECOND_LINE_FOREIGN_DISH_ROLLBACK',command(lines=command()['lines']+[{'dishId':F,'dayDate':'2026-10-12','qty':1}]),code='OFFER_NOT_FOUND')
 reject('SECOND_LINE_DAY_ROLLBACK',command(lines=command()['lines']+[{'dishId':D,'dayDate':'2026-10-19','qty':1}]),code='STAFF_ORDER_DAY_INVALID')
 reject('UNPUBLISHED_WEEK',command(weekStart='2026-10-19'),code='OFFER_NOT_FOUND')
 reject('DIETARY_REASON_REQUIRED',command(dietaryOverride={'allergens':['milk']}),code='STAFF_ORDER_DIETARY_REASON_REQUIRED')
 reject('DIETARY_ARRAY_INVALID',command(dietaryOverride={'allergens':[123],'overrideReason':'synthetic'}),code='STAFF_ORDER_DIETARY_INVALID')
 reject('FOREIGN_COMPANY_CONTEXT',command(demandChannel='company',companyId='77000000-0000-4000-8000-000000000099'),code='STAFF_ORDER_COMPANY_INVALID')

 company='77000000-0000-4000-8000-000000000001';site='77000000-0000-4000-8000-000000000002';unit='77000000-0000-4000-8000-000000000003'
 sql(f"INSERT INTO companies(id,tenant_id,name,company_code) VALUES('{company}','{T}','Synthetic company','P0-SYNTH'); INSERT INTO company_locations(id,tenant_id,company_id,name) VALUES('{site}','{T}','{company}','Synthetic site'); INSERT INTO company_departments(id,tenant_id,company_location_id,name) VALUES('{unit}','{T}','{site}','Synthetic unit');")
 result=json.loads(sql(call(command(demandChannel='company',companyId=company,siteId=site,organizationalUnitId=unit))).stdout.strip().splitlines()[-1])
 check('COMPANY_SITE_UNIT_PRESERVED',result['order']['company_id']==company and result['order']['site_id']==site and result['order']['organizational_unit_id']==unit)
 reject('SITE_PARENT_MISMATCH',command(demandChannel='company',companyId=company,siteId=unit),code='STAFF_ORDER_SITE_INVALID')
 reject('UNIT_REQUIRES_SITE',command(demandChannel='company',companyId=company,organizationalUnitId=unit),code='STAFF_ORDER_UNIT_INVALID')
 result=json.loads(sql(call(command(lines=[{'dishId':D,'dayDate':'2026-10-12','qty':3,'unitPriceOverride':9.125}]))).stdout.strip().splitlines()[-1])
 check('POSITIVE_OVERRIDE_SERVER_TOTAL',result['total']==27.38 and result['items'][0]['unit_price']==9.125)
 # Catalog price remains unchanged even when an authorized staff override is used.
 result=json.loads(sql(call(command(autoConfirm=False,lines=[{'dishId':D,'dayDate':'2026-10-12','qty':3,'unitPriceOverride':0}],dietaryOverride={'allergens':['milk'],'overrideReason':'Synthetic override'}))).stdout.strip().splitlines()[-1])
 check('DRAFT_EXPLICIT_ZERO_OVERRIDE',result['order']['status']=='draft' and result['total']==0 and result['items'][0]['price_snapshot_status']=='explicit_zero')
 check('DIETARY_AUTHOR_FROM_SESSION',result['order']['dietary_snapshot']['authorUserId']==U and result['order']['dietary_snapshot']['allergens']==['milk'])
 check('CATALOG_NOT_MUTATED',scalar(f"SELECT price=8.5 FROM dishes WHERE id='{D}'")=='t')
 sql(f"INSERT INTO weekly_menus(id,tenant_id,week_start,status) VALUES('55000000-0000-4000-8000-000000000002','{T}','2026-10-19','draft'); INSERT INTO weekly_menu_slots(weekly_menu_id,tenant_id,day_date,dish_id,unit_price) VALUES('55000000-0000-4000-8000-000000000002','{T}','2026-10-19','{D}',9); UPDATE weekly_menus SET status='published' WHERE id='55000000-0000-4000-8000-000000000002';")
 reject('QUOTE_ONLY_OFFER_STILL_REJECTED',command(weekStart='2026-10-19',lines=[{'dishId':D,'dayDate':'2026-10-19','qty':1}]),code='OFFER_PRICING_QUOTE_REQUIRED')
 # Inject failures only in synthetic test fixtures: no production guards are changed.
 sql("CREATE FUNCTION public.p0_fail_confirmation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.status='confirmed' THEN RAISE EXCEPTION 'SYNTHETIC_CONFIRMATION_FAILURE'; END IF; RETURN NEW; END $$; CREATE TRIGGER p0_confirmation BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION public.p0_fail_confirmation();")
 reject('CONFIRMATION_FAILURE_ROLLBACK_ALL',code='SYNTHETIC_CONFIRMATION_FAILURE')
 sql('DROP TRIGGER p0_confirmation ON orders; DROP FUNCTION public.p0_fail_confirmation();')
 sql("CREATE FUNCTION public.p0_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'SYNTHETIC_AUDIT_FAILURE'; END $$; CREATE TRIGGER p0_audit BEFORE INSERT ON audit_log FOR EACH ROW EXECUTE FUNCTION public.p0_fail_audit();")
 reject('AUDIT_FAILURE_ROLLBACK_ALL',code='SYNTHETIC_AUDIT_FAILURE')
 sql('DROP TRIGGER p0_audit ON audit_log; DROP FUNCTION public.p0_fail_audit();')
 check('RLS_REMAINS_ENABLED',scalar("SELECT bool_and(relrowsecurity) FROM pg_class WHERE oid IN ('public.orders'::regclass,'public.order_items'::regclass)")=='t')
 check('OTHER_TENANT_READ_HIDDEN',sql(session(U2)+f"SELECT id FROM orders WHERE tenant_id='{T2}';").stdout.strip().splitlines()==[U2])
 print(json.dumps({'status':'P0_ORDERS_ATOMIC_SQL_PASS','checks':checks,'authenticatedAppE2E':'NOT_TESTED','productionConnection':False}))
except Exception as e:
 print(json.dumps({'status':'P0_ORDERS_ATOMIC_BLOCKED','error':str(e),'checks':checks,'productionConnection':False}));raise SystemExit(1)
finally:
 if owned:
  label=docker('inspect',NAME,'--format','{{index .Config.Labels "yourmeal.p0"}}').stdout.strip()
  if label=='synthetic-20261011':
   r=docker('rm','-f',NAME); absent=not docker('ps','-a','--filter','name=^/'+NAME+'$','--format','{{.Names}}').stdout.strip();print('CLEANUP PASS' if r.returncode==0 and absent else 'CLEANUP FAIL')
  else:print('CLEANUP STOP OWNERSHIP_MISMATCH')
