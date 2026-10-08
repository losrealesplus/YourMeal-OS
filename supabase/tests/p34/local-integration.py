"""Isolated Docker PostgreSQL qualification. Never reads host DSNs/PG credentials."""
import json, os, subprocess, pathlib, hashlib, sys
ROOT=pathlib.Path(__file__).resolve().parents[3]
NAME='yourmeal-p34-cert-'+str(os.getpid())
IMAGE='public.ecr.aws/supabase/postgres@sha256:3866d94d8426927e8db3f1c5d790752292bfbe27b5f1f46e199ae1b7d3c1710b'
passed=[]
def docker(*args, input=None, check=True):
 r=subprocess.run(['docker',*args],input=input,capture_output=True,text=True)
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
try:
 docker('run','--detach','--name',NAME,'--network','none','--env','POSTGRES_PASSWORD=p34-synthetic-local-only',IMAGE)
 import time
 for _ in range(50):
  if docker('exec',NAME,'cat','/proc/1/comm',check=False).stdout.strip()=='postgres' and docker('exec',NAME,'pg_isready',check=False).returncode==0:break
  time.sleep(.1)
 # Supabase image contains Auth; isolated synthetic Storage is sufficient for SQL history policies.
 sql('CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text,owner uuid); ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; GRANT ALL ON storage.buckets,storage.objects TO postgres; GRANT USAGE,CREATE ON SCHEMA storage TO postgres;')
 manifest=[]
 writer_query="SELECT coalesce(string_agg(md5(pg_get_functiondef(p.oid)),',' ORDER BY p.oid),'') FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND (p.proname LIKE 'cr_order_%' OR p.proname LIKE 'offer_quote%')"
 writer_before=None
 order_acl_before=None
 for p in sorted((ROOT/'supabase/migrations').glob('*.sql')):
  if p.name.endswith('_p34_identity_crm_profile.sql'):
   writer_before=sql(writer_query).stdout.strip()
   order_acl_before=sql("SELECT has_schema_privilege('cr_order_writer','auth','USAGE')").stdout.strip()
  sql('SET ROLE postgres;\n'+p.read_text());manifest.append({'file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
 print('PASS','migration history',len(manifest))
 assert sql("SELECT has_schema_privilege('p34_writer','auth','USAGE')").stdout.strip()=='f';passed.append('writer has no auth schema access')
 assert sql("SELECT rolsuper OR rolbypassrls OR rolcanlogin FROM pg_roles WHERE rolname='p34_writer'").stdout.strip()=='f';passed.append('writer remains NOLOGIN NOSUPERUSER NOBYPASSRLS')
 assert order_acl_before==sql("SELECT has_schema_privilege('cr_order_writer','auth','USAGE')").stdout.strip();passed.append('existing order writer auth ACL unchanged')
 # Removing required resolver grants must still trip the security assertion. Roll back test only.
 denied=sql("BEGIN; REVOKE EXECUTE ON FUNCTION public.current_membership_id(uuid) FROM PUBLIC,p34_writer; DO $$ BEGIN IF NOT has_schema_privilege('p34_writer','public','USAGE') OR NOT has_function_privilege('p34_writer','public.current_membership_id(uuid)','EXECUTE') THEN RAISE EXCEPTION 'P34_EXECUTOR_GRANTS_INSUFFICIENT'; END IF; END $$; ROLLBACK;",check=False)
 assert denied.returncode and 'P34_EXECUTOR_GRANTS_INSUFFICIENT' in denied.stderr;passed.append('insufficient resolver grant still fails closed')
 assert writer_before is not None and writer_before==sql(writer_query).stdout.strip();passed.append('existing order and offer writer function definitions unchanged')
 sql(f"INSERT INTO public.tenants(id,slug,name) VALUES('{T}','p34-synthetic','Synthetic P34'),('10000000-0000-4000-8000-000000000002','p34-b','Synthetic B'); INSERT INTO auth.users(id) VALUES "+','.join(f"('{U(i)}')" for i in range(1,8))+f"; INSERT INTO public.tenant_members(tenant_id,user_id,status,membership_type) VALUES "+','.join(f"('{T}','{U(i)}','approved','customer')" for i in range(1,6))+f"; INSERT INTO public.user_roles(user_id,tenant_id,role) VALUES('{U(3)}','{T}','operations_manager'),('{U(4)}','{T}','support');")
 sql(f"INSERT INTO public.tenant_members(tenant_id,user_id,status,membership_type) VALUES('{T}','{U(7)}','approved','customer');")
 failure({'operation':'onboard','displayName':'Implicit'},'ONBOARDING_BLOCKED',n=5,r=101)
 failure({'operation':'create_staff','displayName':'Malformed','email':{}},'INVALID_TYPE',n=3,r=102)
 failure({'operation':'create_staff','displayName':'Malformed','email':'broken'},'INVALID_EMAIL',n=3,r=103)
 a=command({'operation':'onboard','declaration':'new','displayName':'Ana'},r=1);cid=a['customerId'];assert a['revision']==1
 test('onboarding creates canonical CRM without membership/role grants',lambda:assertion(sql(f"SELECT count(*) FROM public.user_roles WHERE user_id='{U(1)}'").stdout.strip()=='0'))
 failure({'operation':'onboard','declaration':'new','displayName':'Ana'},'ALREADY_ASSOCIATED',r=2)
 failure({'operation':'onboard','declaration':'new','displayName':'Staff'},'STAFF_ONBOARDING_FORBIDDEN',n=3,r=3)
 failure({'operation':'onboard','declaration':'new','displayName':'Pending'},'PERMISSION_DENIED',n=6,r=4)
 cmd={'operation':'profile','customerId':cid,'expectedRevision':1,'patch':{'displayName':'Ana CRM','phone':'123'}}
 failure({**cmd,'patch':{'email':'broken'}},'INVALID_EMAIL',r=104)
 result=command(cmd,r=5);assert result['revision']==2 and result['phone']=='123';passed.append('profile atomic')
 replay=command(cmd,r=5);assert replay['replayed'] and replay['committedRevision']==2;passed.append('exact idempotent replay')
 failure({**cmd,'patch':{'displayName':'Different'}},'REQUEST_PAYLOAD_MISMATCH',r=5)
 failure(cmd,'STALE_REVISION',r=6)
 failure({**cmd,'expectedRevision':2},'PERMISSION_DENIED',n=2,r=7)
 failure({**cmd,'expectedRevision':2,'patch':{'userId':U(2)}},'FIELD_NOT_ALLOWED',r=8)
 create={'operation':'address_create','customerId':cid,'expectedRevision':2,'patch':{'street':'Synthetic 1','label':'Casa'}}
 result=command(create,r=9);a1=result['addresses'][0]['id'];assert result['addresses'][0]['isDefault'];passed.append('first address default')
 result=command({**create,'expectedRevision':3,'patch':{'street':'Synthetic 2','label':'Trabajo'}},r=10);a2=next(x['id'] for x in result['addresses'] if x['id']!=a1);assert sum(x['isDefault'] for x in result['addresses'])==1;passed.append('second address preserves default')
 archive={'operation':'address_archive','customerId':cid,'expectedRevision':4,'addressId':a1}
 failure(archive,'DEFAULT_REPLACEMENT_REQUIRED',r=11)
 result=command({**archive,'replacementAddressId':a2},r=12);assert result['revision']==5;passed.append('explicit replacement atomic')
 result=command({'operation':'address_restore','customerId':cid,'expectedRevision':5,'addressId':a1},r=13);assert next(x for x in result['addresses'] if x['id']==a2)['isDefault'];passed.append('restore preserves default')
 foreign='10000000-0000-4000-8000-000000000002'
 failure({**cmd,'expectedRevision':6},'PERMISSION_DENIED',r=14,tenant=foreign)
 for table in ['customers','customer_addresses','customer_phones']:
  out=sql(f"SET SESSION AUTHORIZATION authenticated; SELECT set_config('request.jwt.claim.sub','{U(1)}',false); DELETE FROM public.{table};",check=False);assert out.returncode and 'permission denied' in out.stderr;passed.append('raw '+table+' denied')
 # Staff and customer share the same revision lock.
 from concurrent.futures import ThreadPoolExecutor
 c1={'operation':'profile','customerId':cid,'expectedRevision':6,'patch':{'displayName':'Client'}};c2={**c1,'patch':{'displayName':'Staff'}}
 with ThreadPoolExecutor(2) as pool:
  outs=list(pool.map(lambda item:sql(stmt(*item),check=False),[(c1,1,15),(c2,3,16)]))
 assert sum(x.returncode==0 for x in outs)==1 and any('STALE_REVISION' in x.stderr for x in outs);passed.append('staff/customer concurrency one winner')
 # Assisted link: user declares existing; staff selects exact row; user confirms.
 link=command({'operation':'request_link'},n=2,r=20)
 failure({'operation':'onboard','declaration':'new','displayName':'Duplicate'},'ONBOARDING_BLOCKED',n=2,r=21)
 customer=command({'operation':'create_staff','displayName':'Existing CRM','phone':'555'},n=3,r=22)
 approved={'operation':'approve_link','linkRequestId':R(20),'customerId':customer['customerId'],'expectedRevision':1,'verified':True}
 failure(approved,'PERMISSION_DENIED',n=4,r=23)
 command(approved,n=3,r=24)
 confirm={'operation':'confirm_link','linkRequestId':R(20),'customerId':customer['customerId'],'expectedRevision':1,'confirmed':True}
 failure(confirm,'LINK_NOT_CONFIRMABLE',n=5,r=25)
 result=command(confirm,n=2,r=26);assert result['revision']==2;passed.append('double confirmation exact identity')
 # P2.3: only the request owner may terminally close a proven revision conflict.
 conflict_customer=command({'operation':'create_staff','displayName':'Conflict CRM'},n=3,r=200)
 ccid=conflict_customer['customerId']
 command({'operation':'request_link'},n=7,r=201)
 capprove={'operation':'approve_link','linkRequestId':R(201),'customerId':ccid,'expectedRevision':1,'verified':True}
 command(capprove,n=3,r=202)
 close={'operation':'close_conflicted_link','linkRequestId':R(201),'reason':'REVISION_CONFLICT'}
 failure(close,'LINK_NOT_CONFLICTED',n=7,r=203)
 failure(close,'PERMISSION_DENIED',n=3,r=204)
 failure(close,'PERMISSION_DENIED',n=7,r=205,tenant=foreign)
 sql(f"INSERT INTO public.tenant_members(tenant_id,user_id,status,membership_type) VALUES('{foreign}','{U(7)}','approved','customer');")
 failure(close,'LINK_NOT_FOUND',n=7,r=218,tenant=foreign)
 command({'operation':'profile','customerId':ccid,'expectedRevision':1,'patch':{'displayName':'Staff changed CRM'}},n=3,r=206)
 cconfirm={'operation':'confirm_link','linkRequestId':R(201),'customerId':ccid,'expectedRevision':1,'confirmed':True}
 failure(cconfirm,'STALE_REVISION',n=7,r=207)
 # Race close against the old confirmation: only close can succeed.
 with ThreadPoolExecutor(2) as pool:
  outs=list(pool.map(lambda item:sql(stmt(*item),check=False),[(close,7,208),(cconfirm,7,209)]))
 assert outs[0].returncode==0 and outs[1].returncode!=0 and any(code in outs[1].stderr for code in ['STALE_REVISION','LINK_NOT_CONFIRMABLE']);passed.append('conflict close/confirmation concurrency never links')
 closed=command(close,n=7,r=208);assert closed['replayed'] and closed['state']=='closed';passed.append('closure exact request replay')
 repeated=command(close,n=7,r=210);assert repeated['closedAt']==closed['closedAt'];passed.append('closure new UUID preserves original terminal evidence')
 with ThreadPoolExecutor(2) as pool:
  repeated_closures=list(pool.map(lambda rid:command(close,n=7,r=rid),[219,220]))
 assert all(x['closedAt']==closed['closedAt'] and x['state']=='closed' for x in repeated_closures);passed.append('concurrent repeated closures preserve terminal evidence')
 failure({**close,'reason':'OTHER'},'INVALID_INPUT',n=7,r=211)
 failure({'operation':'request_link'},'REQUEST_PAYLOAD_MISMATCH',n=7,r=208)
 audit=json.loads(sql(f"SELECT json_build_object('n',count(*),'actor',min(actor_id::text),'reason',min(new_data->>'reason'),'time',min(new_data->>'closedAt')) FROM public.audit_log WHERE tenant_id='{T}' AND entity_id='{R(201)}' AND action='p34.close_conflicted_link'").stdout.strip())
 assert audit['n']==1 and audit['actor']==U(7) and audit['reason']=='REVISION_CONFLICT' and audit['time']==closed['closedAt'];passed.append('single audit closure actor tenant request reason timestamp')
 failure({**cconfirm,'expectedRevision':2},'LINK_NOT_CONFIRMABLE',n=7,r=212)
 failure(capprove,'PERMISSION_DENIED',n=3,r=213)
 command({'operation':'request_link'},n=7,r=214)
 fresh={**cconfirm,'linkRequestId':R(214),'expectedRevision':2}
 failure(fresh,'LINK_NOT_CONFIRMABLE',n=7,r=215)
 command({**capprove,'linkRequestId':R(214),'expectedRevision':2},n=3,r=216)
 linked=command(fresh,n=7,r=217);assert linked['revision']==3;passed.append('fresh explicit request requires fresh double confirmation')
 # Transport/admin identities have no authority without actor and explicit EXECUTE.
 for role in ['service_role']:
  out=sql(f"SET SESSION AUTHORIZATION {role}; SELECT public.p34_customer_command('{T}','{R(30)}','{{\"operation\":\"request_link\"}}');",check=False);assert out.returncode;passed.append(role+' denied')
 report={'state':'LOCAL_SQL_QUALIFIED_PROVIDER_UNVERIFIED','architecture':'linux/aarch64','image':IMAGE,'tests':passed,'migrations':manifest,'network':'none','provider_access':False,'limitations':['Synthetic Storage fixture; no provider/live certification','Browser E2E and legacy callers qualification separate']}
 (ROOT/'../../reports/eatclean-sprint-02/p34-local-sql.json').resolve().write_text(json.dumps(report,indent=2))
 print('TOTAL',len(passed),flush=True)

 if '--serve-ui' in sys.argv:
  from http.server import HTTPServer,BaseHTTPRequestHandler
  class Handler(BaseHTTPRequestHandler):
   def log_message(self,*args):pass
   def do_POST(self):
    try:
     body=json.loads(self.rfile.read(int(self.headers['Content-Length'])));n=body.get('actor',1)
     if n not in range(1,7):raise ValueError('INVALID_TEST_ACTOR')
     mode=body['mode'];tid=body.get('tenantId',T)
     if tid not in (T,'10000000-0000-4000-8000-000000000002'):raise ValueError('INVALID_TEST_TENANT')
     if mode=='customer_id':
      value=sql(f"SELECT id FROM public.customers WHERE tenant_id='{tid}' AND user_id='{U(n)}' AND deleted_at IS NULL").stdout.strip() or None
     else:
      def literal(v):return "'"+str(v).replace("'","''")+"'"
      if mode=='command':
       rid=body['requestId'];import uuid;uuid.UUID(rid)
       query=f"SELECT public.p34_customer_command('{tid}','{rid}',{literal(json.dumps(body['command']))}::jsonb)"
      elif mode=='read':query=f"SELECT public.p34_customer_profile('{tid}',{literal(body['customerId'])}::uuid)"
      elif mode=='links':query=f"SELECT public.p34_identity_requests('{tid}')"
      elif mode=='readback':query=f"SELECT public.p34_customer_readback('{tid}',{literal(body['requestId'])}::uuid)"
      else:raise ValueError('INVALID_TEST_MODE')
      out=sql(f"SET SESSION AUTHORIZATION authenticated; BEGIN; SELECT set_config('request.jwt.claim.sub','{U(n)}',true); {query}; COMMIT;",check=False)
      if out.returncode:
       # Only the fixed DB error, never SQL command context/contact payload.
       raise ValueError(next((x.removeprefix('ERROR:').strip() for x in out.stderr.splitlines() if x.startswith('ERROR:')),'LOCAL_SQL_ERROR'))
      line=out.stdout.strip().splitlines()[-1];value=json.loads(line) if line else None
     payload=json.dumps({'data':value}).encode();self.send_response(200)
    except Exception as e:
     payload=json.dumps({'error':str(e)}).encode();self.send_response(400)
    self.send_header('Content-Type','application/json');self.send_header('Access-Control-Allow-Origin','http://127.0.0.1:4179');self.end_headers();self.wfile.write(payload)
   def do_OPTIONS(self):
    self.send_response(204);self.send_header('Access-Control-Allow-Origin','http://127.0.0.1:4179');self.send_header('Access-Control-Allow-Headers','content-type');self.end_headers()
  server=HTTPServer(('127.0.0.1',0),Handler);print('P34_UI_PORT:'+str(server.server_port),flush=True)
  server.serve_forever()

finally:
 docker('rm','--force',NAME,check=False)
