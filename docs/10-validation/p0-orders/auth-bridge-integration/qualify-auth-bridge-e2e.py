import importlib.util,pathlib,json,time,sys
ROOT=pathlib.Path(__file__).resolve().parents[4]
s=(ROOT/'scripts/staging-e2e-lab.py').read_text().replace("ROOT=pathlib.Path(__file__).resolve().parents[1]",'ROOT=pathlib.Path('+repr(str(ROOT))+')')
s=s.replace('yourmeal-e2e','yourmeal-p0-authbridge').replace('synthetic-38eb0b5d','synthetic-authbridge')
s=s.replace("('20261007020208_','20261007020245_','20261007020849_')","('20261007020208_','20261007020245_','20261007020849_','20261008112217_','20261008160753_','20261010155729_','20261011190421_')")
p=pathlib.Path('/private/tmp/p0-authbridge-lab.py');p.write_text(s)
spec=importlib.util.spec_from_file_location('lab',p);lab=importlib.util.module_from_spec(spec);spec.loader.exec_module(lab)
checks=[];created=False
T='8bba00ba-331b-42c8-9283-4e3836ffb870';O='11000000-0000-4000-8000-000000000002';C='33000000-0000-4000-8000-000000000001';D='44000000-0000-4000-8000-000000000001';D2='44000000-0000-4000-8000-000000000002';M='55000000-0000-4000-8000-000000000001'
def check(n,v):
 checks.append({'name':n,'result':'PASS' if v else 'FAIL'})
 if not v:raise RuntimeError(n)
def http(path,body=None,token=None,auth=False):
 # DNS destinations are fixed to the exact owned containers, no arbitrary URL.
 x={'url':'http://'+(lab.AUTH+':9999' if auth else lab.REST+':3000')+path,'body':body,'token':token}
 js="let s='';for await(const c of process.stdin)s+=c;const x=JSON.parse(s);const r=await fetch(x.url,{method:x.body===null?'GET':'POST',headers:{'Content-Type':'application/json',...(x.token?{Authorization:'Bearer '+x.token}:{})},body:x.body===null?undefined:JSON.stringify(x.body),signal:AbortSignal.timeout(10000)}); console.log(JSON.stringify({status:r.status,body:await r.json()}));"
 r=lab.d('exec','-i','yourmeal-p0-authbridge-transport','node','--input-type=module','-e',js,input=json.dumps(x));return json.loads(r.stdout)
def scalar(s):return lab.sql(s).strip().splitlines()[-1]
try:
 lab.start();created=True
 lab.sql('REVOKE USAGE ON SCHEMA auth FROM cr_order_writer;')
 for _ in range(30):
  try:
   if http('/health',auth=True)['status']==200:break
  except Exception:pass
  time.sleep(.5)
 else:raise RuntimeError('GOTRUE_NOT_READY')
 users=[];tokens=[]
 for name in ['admin','customer','foreignadmin']:
  creds={'email':name+'@p0-authbridge.example.test','password':'Synthetic-only-P0-2026!'}
  signup=http('/signup',creds,auth=True);check('GOTRUE_SIGNUP_'+name,signup['status']==200)
  login=http('/token?grant_type=password',creds,auth=True);check('GOTRUE_PASSWORD_LOGIN_'+name,login['status']==200 and bool(login['body'].get('access_token')))
  users.append(login['body']['user']['id']);tokens.append(login['body']['access_token'])
 a,c,o=users
 lab.sql(f"INSERT INTO tenants(id,slug,name) VALUES('{T}','p0-synthetic','Synthetic'),('{O}','p0-other','Other'); INSERT INTO tenant_members(tenant_id,user_id,status,membership_type) VALUES('{T}','{a}','approved','customer'),('{T}','{c}','approved','customer'),('{O}','{o}','approved','customer'); INSERT INTO user_roles(user_id,tenant_id,role) VALUES('{a}','{T}','company_admin'),('{c}','{T}','customer'),('{o}','{O}','company_admin'); INSERT INTO customers(id,tenant_id,user_id,kind,display_name) VALUES('{C}','{T}','{c}','individual','Synthetic'); INSERT INTO dishes(id,tenant_id,name,status,price) VALUES('{D}','{T}','First','active',8.5),('{D2}','{T}','Second','active',6.25); INSERT INTO weekly_menus(id,tenant_id,week_start,status) VALUES('{M}','{T}','2026-10-12','published'); INSERT INTO weekly_menu_slots(weekly_menu_id,tenant_id,day_date,dish_id,unit_price) VALUES('{M}','{T}','2026-10-12','{D}',NULL),('{M}','{T}','2026-10-12','{D2}',NULL);")
 check('INSTALL_EXECUTE_REVOKED',scalar("SELECT NOT has_function_privilege('authenticated','public.capture_staff_existing_order(uuid,jsonb)','EXECUTE')")=='t')
 payload={'_tenant_id':T,'_command':{'customerId':C,'weekStart':'2026-10-12','autoConfirm':True,'lines':[{'dishId':D,'dayDate':'2026-10-12','qty':2},{'dishId':D2,'dayDate':'2026-10-12','qty':3}]}}
 before=scalar('SELECT count(*) FROM orders')
 closed=http('/rpc/capture_staff_existing_order',payload,tokens[0]);check('POSTGREST_INSTALL_CLOSED',closed['status'] in (401,403,404) and scalar('SELECT count(*) FROM orders')==before)
 lab.sql('SET ROLE postgres; GRANT EXECUTE ON FUNCTION public.capture_staff_existing_order(uuid,jsonb) TO authenticated;')
 lab.sql("NOTIFY pgrst,'reload schema';");time.sleep(1)
 before=scalar('SELECT count(*) FROM orders')
 rejected=http('/rpc/capture_staff_existing_order',payload,tokens[0])
 check('BASELINE_42501_REPRODUCED',rejected['status']==403 and rejected['body'].get('code')=='42501' and scalar('SELECT count(*) FROM orders')==before)
 check('BASELINE_WRITER_AUTH_USAGE_ABSENT',scalar("SELECT NOT has_schema_privilege('cr_order_writer','auth','USAGE')")=='t')
 lab.sql((ROOT/'supabase/migrations/20261011190421_eatclean_private_session_identity_bridge.sql').read_text())
 check('BRIDGE_INSTALLATION_CLOSED',scalar("SELECT NOT has_function_privilege('authenticated','public.capture_staff_existing_order(uuid,jsonb)','EXECUTE')")=='t')
 lab.sql((ROOT/'scripts/release/activate-eatclean-staff-existing-order.sql').read_text())
 check('BRIDGE_WRITER_AUTH_USAGE_STILL_ABSENT',scalar("SELECT NOT has_schema_privilege('cr_order_writer','auth','USAGE')")=='t')
 lab.sql("NOTIFY pgrst,'reload schema';")
 time.sleep(1)
 r=http('/rpc/capture_staff_existing_order',payload,tokens[0]);
 if r['status']!=200:raise RuntimeError('RPC_'+str(r['status'])+'_'+json.dumps({k:r['body'].get(k) for k in ['code','message']}))
 order=r['body']['order'];oid=order['id'];check('POSTGREST_MULTI_LINE_CONFIRMED',order['status']=='confirmed' and len(r['body']['items'])==2 and r['body']['total']==35.75)
 read=http('/orders?id=eq.'+oid+'&select=id,status,total,tenant_id',token=tokens[0]);check('POSTGREST_ORDER_READ',read['status']==200 and len(read['body'])==1 and read['body'][0]['total']==35.75)
 items=http('/order_items?order_id=eq.'+oid+'&select=qty,unit_price',token=tokens[0]);check('POSTGREST_PRICE_PERSISTENCE',items['status']==200 and sorted((i['qty'],float(i['unit_price'])) for i in items['body'])==[(2,8.5),(3,6.25)])
 check('AUDIT_SESSION_ACTOR',scalar(f"SELECT count(*) FROM audit_log WHERE entity_id='{oid}' AND actor_id='{a}' AND entity_type='order'")=='1')
 before=scalar('SELECT count(*) FROM orders')
 bad=http('/rpc/capture_staff_existing_order',payload,tokens[1]);check('POSTGREST_CUSTOMER_NOT_STAFF',bad['status'] in (401,403) and bad['body'].get('message')=='STAFF_ORDER_PERMISSION_DENIED')
 foreign=json.loads(json.dumps(payload));foreign['_tenant_id']=O
 bad=http('/rpc/capture_staff_existing_order',foreign,tokens[2]);check('POSTGREST_AUTHORIZED_OTHER_TENANT_REJECTED',bad['status'] in (401,403) and bad['body'].get('message')=='STAFF_ORDER_TENANT_NOT_ENABLED')
 hidden=http('/orders?id=eq.'+oid+'&select=id',token=tokens[2]);check('POSTGREST_RLS_FOREIGN_READ_HIDDEN',hidden['status']==200 and hidden['body']==[])
 check('REJECTIONS_NO_EXTRA_ORDERS',scalar('SELECT count(*) FROM orders')==before)
 # Tampered JWT signature cannot establish an actor in PostgREST.
 parts=tokens[1].split('.')
 import base64
 claims=json.loads(base64.urlsafe_b64decode(parts[1]+'='*((-len(parts[1]))%4)));claims['sub']=users[0]
 parts[1]=base64.urlsafe_b64encode(json.dumps(claims).encode()).decode().rstrip('=')
 tampered=http('/rpc/capture_staff_existing_order',payload,'.'.join(parts))
 check('TAMPERED_JWT_REJECTED',tampered['status']==401 and scalar('SELECT count(*) FROM orders')==before)
 anon=http('/rpc/capture_staff_existing_order',payload)
 check('ANONYMOUS_REJECTED',anon['status'] in (401,403,404))
 private=http('/rpc/session_uid_bridge',{},tokens[0]);check('BRIDGE_NOT_EXPOSED_POSTGREST',private['status']==404)
 # SQL-only adversarial probe: fake verified_actor must not supersede a genuine customer claim.
 try:
  lab.sql(f"SET SESSION AUTHORIZATION authenticated; SELECT set_config('request.jwt.claim.sub','{users[1]}',false); SELECT set_config('cr_order.verified_actor','{users[0]}',false); SELECT public.capture_staff_existing_order('{T}', '{json.dumps(payload['_command'])}'::jsonb);")
  raise RuntimeError('FAKE_VERIFIED_ACTOR_ACCEPTED')
 except Exception as denied:
  check('CALLER_FAKE_VERIFIED_ACTOR_IGNORED','STAFF_ORDER_PERMISSION_DENIED' in str(denied))
 check('ISOLATION' ,lab.d('network','inspect',lab.NET,'--format','{{.Internal}}').stdout.strip()=='true' and all(lab.d('inspect',n,'--format','{{json .HostConfig.PortBindings}}').stdout.strip() in ('{}','null') for n in [lab.DB,lab.AUTH,lab.REST]))
 print(json.dumps({'status':'AUTH_BRIDGE_E2E_PASS','checks':checks,'ordersCreated':1,'productionConnection':False,'browserUI':'NOT_TESTED','source':'7e652d36372572be203964cb0f997485b57642ec'}))
except Exception as e:
 print(json.dumps({'status':'AUTHENTICATED_API_E2E_BLOCKED','error':str(e),'checks':checks,'productionConnection':False}));sys.exitcode=1
finally:
 if created:lab.cleanup()
if getattr(sys,'exitcode',0):sys.exit(1)
