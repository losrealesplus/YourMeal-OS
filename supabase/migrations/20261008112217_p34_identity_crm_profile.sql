-- P34: canonical CRM aggregate. Local qualification only; no provider execution authorized.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
CREATE SCHEMA p34_private;
REVOKE ALL ON SCHEMA p34_private FROM PUBLIC,anon,authenticated,service_role;
CREATE ROLE p34_writer NOLOGIN NOINHERIT NOBYPASSRLS;
DO $$ BEGIN EXECUTE format('GRANT p34_writer TO %I',current_user); END $$;
GRANT USAGE ON SCHEMA public,auth,p34_private TO p34_writer;
GRANT CREATE ON SCHEMA p34_private TO p34_writer;
GRANT EXECUTE ON FUNCTION auth.uid(),public.has_role(uuid,uuid,public.app_role),public.is_saas_admin(uuid) TO p34_writer;
DO $$ BEGIN IF NOT has_schema_privilege('p34_writer','auth','USAGE') OR NOT has_function_privilege('p34_writer','auth.uid()','EXECUTE') THEN RAISE EXCEPTION 'P34_EXECUTOR_GRANTS_INSUFFICIENT'; END IF; END $$;
ALTER TABLE public.customers ADD COLUMN revision bigint NOT NULL DEFAULT 1 CHECK(revision>0);
CREATE UNIQUE INDEX p34_active_identity ON public.customers(tenant_id,user_id) WHERE deleted_at IS NULL AND user_id IS NOT NULL;
CREATE UNIQUE INDEX p34_customer_tenant_identity ON public.customers(tenant_id,id);
ALTER TABLE public.customer_addresses ADD CONSTRAINT p34_address_tenant_customer FOREIGN KEY(tenant_id,customer_id) REFERENCES public.customers(tenant_id,id);
ALTER TABLE public.customer_phones ADD CONSTRAINT p34_phone_tenant_customer FOREIGN KEY(tenant_id,customer_id) REFERENCES public.customers(tenant_id,id);
CREATE UNIQUE INDEX p34_one_default ON public.customer_addresses(tenant_id,customer_id) WHERE deleted_at IS NULL AND is_default;
CREATE UNIQUE INDEX p34_one_primary ON public.customer_phones(tenant_id,customer_id) WHERE deleted_at IS NULL AND is_primary;
-- Fail on pre-existing inconsistencies rather than backfill or arbitrarily choose records.
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.customer_addresses a JOIN public.customers c ON c.id=a.customer_id WHERE a.tenant_id<>c.tenant_id)
 OR EXISTS(SELECT 1 FROM public.customer_phones p JOIN public.customers c ON c.id=p.customer_id WHERE p.tenant_id<>c.tenant_id)
 OR EXISTS(SELECT 1 FROM public.customer_addresses WHERE deleted_at IS NULL GROUP BY tenant_id,customer_id HAVING count(*) FILTER(WHERE is_default)<>1)
 THEN RAISE EXCEPTION 'P34_LEGACY_INCONSISTENT'; END IF;
END $$;
CREATE TABLE p34_private.requests(
 tenant_id uuid NOT NULL,actor_id uuid NOT NULL,request_id uuid NOT NULL,
 fingerprint text NOT NULL,result jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(tenant_id,actor_id,request_id)
);
CREATE TABLE p34_private.identity_requests(
 id uuid PRIMARY KEY,tenant_id uuid NOT NULL REFERENCES public.tenants(id),
 user_id uuid NOT NULL REFERENCES auth.users(id),customer_id uuid REFERENCES public.customers(id),
 state text NOT NULL CHECK(state IN('requested','approved','consumed','expired')),
 approved_by uuid REFERENCES auth.users(id),approved_revision bigint,expires_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),consumed_at timestamptz
);
CREATE UNIQUE INDEX p34_pending_identity ON p34_private.identity_requests(tenant_id,user_id) WHERE state IN('requested','approved');
ALTER TABLE p34_private.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE p34_private.identity_requests ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE ON p34_private.requests,p34_private.identity_requests TO p34_writer;
CREATE POLICY p34_requests_internal ON p34_private.requests TO p34_writer USING(true) WITH CHECK(true);
CREATE POLICY p34_identity_internal ON p34_private.identity_requests TO p34_writer USING(true) WITH CHECK(true);
GRANT SELECT,INSERT,UPDATE ON public.customers,public.customer_addresses,public.customer_phones TO p34_writer;
GRANT SELECT ON public.tenant_members,public.user_roles TO p34_writer;
GRANT INSERT ON public.audit_log TO p34_writer;
CREATE POLICY p34_member_internal ON public.tenant_members FOR SELECT TO p34_writer USING(true);
CREATE POLICY p34_roles_internal ON public.user_roles FOR SELECT TO p34_writer USING(true);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['customers','customer_addresses','customer_phones','audit_log'] LOOP
 EXECUTE format('CREATE POLICY p34_canonical ON public.%I TO p34_writer USING(true) WITH CHECK(true)',t);
 END LOOP;
END $$;
CREATE FUNCTION p34_private.member(t uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.tenant_members WHERE tenant_id=t AND user_id=auth.uid() AND status='approved' AND deleted_at IS NULL)
$$;
CREATE FUNCTION p34_private.staff(t uuid,link_only boolean DEFAULT false) RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT p34_private.member(t) AND (public.has_role(auth.uid(),t,'company_admin') OR public.has_role(auth.uid(),t,'operations_manager') OR (NOT link_only AND (public.has_role(auth.uid(),t,'support') OR public.is_saas_admin(auth.uid()))))
$$;
CREATE FUNCTION p34_private.profile(t uuid,c uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT jsonb_build_object('customerId',id,'tenantId',tenant_id,'revision',revision,'displayName',display_name,'email',email,'kind',kind,
 'phone',(SELECT phone FROM public.customer_phones WHERE customer_id=c AND tenant_id=t AND deleted_at IS NULL AND is_primary),
 'addresses',coalesce((SELECT jsonb_agg(jsonb_build_object('id',a.id,'label',a.label,'street',a.street,'city',a.city,'zip',a.zip,'isDefault',a.is_default,'archived',a.deleted_at IS NOT NULL) ORDER BY a.id) FROM public.customer_addresses a WHERE a.customer_id=c AND a.tenant_id=t),'[]'::jsonb))
 FROM public.customers WHERE tenant_id=t AND id=c AND deleted_at IS NULL
$$;
CREATE FUNCTION p34_private.execute(t uuid,r uuid,j jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); op text:=j->>'operation'; c public.customers%ROWTYPE;
 previous p34_private.requests%ROWTYPE; link p34_private.identity_requests%ROWTYPE;
 result jsonb; cid uuid; aid uuid; replacement uuid; a public.customer_addresses%ROWTYPE;
 patch jsonb:=coalesce(j->'patch','{}'::jsonb); key text; val text; count_active integer;
BEGIN
 IF NOT p34_private.member(t) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 IF jsonb_typeof(j)<>'object' OR op IS NULL OR r IS NULL THEN RAISE EXCEPTION 'INVALID_INPUT'; END IF;
 FOR key IN SELECT jsonb_object_keys(j) LOOP
  IF NOT key=ANY(CASE op
    WHEN 'onboard' THEN ARRAY['operation','declaration','displayName','phone']
    WHEN 'create_staff' THEN ARRAY['operation','displayName','kind','email','phone','street','city']
    WHEN 'request_link' THEN ARRAY['operation']
    WHEN 'approve_link' THEN ARRAY['operation','customerId','expectedRevision','linkRequestId','verified']
    WHEN 'confirm_link' THEN ARRAY['operation','customerId','expectedRevision','linkRequestId','confirmed']
    WHEN 'profile' THEN ARRAY['operation','customerId','expectedRevision','patch']
    ELSE ARRAY['operation','customerId','expectedRevision','addressId','replacementAddressId','patch'] END)
   THEN RAISE EXCEPTION 'FIELD_NOT_ALLOWED'; END IF;
 END LOOP;
 IF j ? 'expectedRevision' AND (jsonb_typeof(j->'expectedRevision')<>'number' OR (j->>'expectedRevision') !~ '^[1-9][0-9]*$' OR (j->>'expectedRevision')::numeric>9007199254740991) THEN RAISE EXCEPTION 'INVALID_REVISION'; END IF;
 -- Actor lock serializes new onboarding/link claims before a customer row exists.
 PERFORM pg_advisory_xact_lock(hashtextextended(t::text||actor::text,0));
 SELECT * INTO previous FROM p34_private.requests WHERE tenant_id=t AND actor_id=actor AND request_id=r;
 IF FOUND THEN
  IF previous.fingerprint<>encode(sha256(convert_to(j::text,'UTF8')),'hex') THEN RAISE EXCEPTION 'REQUEST_PAYLOAD_MISMATCH'; END IF;
  -- Recheck present ownership for stored aggregate results, not merely past admission.
  IF previous.result ? 'customerId' AND NOT p34_private.staff(t) AND NOT EXISTS(SELECT 1 FROM public.customers WHERE id=(previous.result->>'customerId')::uuid AND tenant_id=t AND user_id=actor AND deleted_at IS NULL) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
  RETURN previous.result||jsonb_build_object('replayed',true,'profile',CASE WHEN previous.result ? 'customerId' THEN p34_private.profile(t,(previous.result->>'customerId')::uuid) ELSE NULL END);
 END IF;
 IF op='request_link' THEN
  UPDATE p34_private.identity_requests SET state='expired' WHERE tenant_id=t AND user_id=actor AND state='approved' AND expires_at<=now();
  IF EXISTS(SELECT 1 FROM public.customers WHERE tenant_id=t AND user_id=actor AND deleted_at IS NULL) THEN RAISE EXCEPTION 'ALREADY_ASSOCIATED'; END IF;
  INSERT INTO p34_private.identity_requests(id,tenant_id,user_id,state) VALUES(r,t,actor,'requested');
  result:=jsonb_build_object('linkRequestId',r,'state','requested');
 ELSIF op IN('approve_link','confirm_link') THEN
  SELECT * INTO link FROM p34_private.identity_requests WHERE id=(j->>'linkRequestId')::uuid AND tenant_id=t FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'LINK_NOT_FOUND'; END IF;
  IF op='approve_link' THEN
   IF NOT p34_private.staff(t,true) OR link.state<>'requested' OR j->'verified' IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
   cid:=(j->>'customerId')::uuid;
  ELSE
   IF link.user_id<>actor OR link.state<>'approved' OR link.expires_at<=now() OR j->'confirmed' IS DISTINCT FROM 'true'::jsonb OR j->>'customerId' IS DISTINCT FROM link.customer_id::text THEN RAISE EXCEPTION 'LINK_NOT_CONFIRMABLE'; END IF;
   cid:=link.customer_id;
  END IF;
  SELECT * INTO c FROM public.customers WHERE id=cid AND tenant_id=t AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND OR c.user_id IS NOT NULL THEN RAISE EXCEPTION 'IDENTITY_CONFLICT'; END IF;
  IF c.revision IS DISTINCT FROM (j->>'expectedRevision')::bigint THEN RAISE EXCEPTION 'STALE_REVISION'; END IF;
  IF op='approve_link' THEN
   UPDATE p34_private.identity_requests SET customer_id=cid,state='approved',approved_by=actor,approved_revision=c.revision,expires_at=now()+interval '24 hours' WHERE id=link.id;
   result:=jsonb_build_object('linkRequestId',link.id,'state','approved','customerId',cid,'revision',c.revision);
  ELSE
   IF c.revision<>link.approved_revision THEN RAISE EXCEPTION 'STALE_REVISION'; END IF;
   UPDATE public.customers SET user_id=actor,revision=revision+1 WHERE id=cid;
   UPDATE p34_private.identity_requests SET state='consumed',consumed_at=now() WHERE id=link.id;
   result:=p34_private.profile(t,cid);
  END IF;
 ELSIF op IN('onboard','create_staff') THEN
  IF op='onboard' THEN
   IF EXISTS(SELECT 1 FROM public.user_roles WHERE tenant_id=t AND user_id=actor AND role<>'customer') THEN RAISE EXCEPTION 'STAFF_ONBOARDING_FORBIDDEN'; END IF;
   IF j->>'declaration' IS DISTINCT FROM 'new' OR EXISTS(SELECT 1 FROM p34_private.identity_requests WHERE tenant_id=t AND user_id=actor AND state IN('requested','approved')) THEN RAISE EXCEPTION 'ONBOARDING_BLOCKED'; END IF;
   IF EXISTS(SELECT 1 FROM public.customers WHERE tenant_id=t AND user_id=actor AND deleted_at IS NULL) THEN RAISE EXCEPTION 'ALREADY_ASSOCIATED'; END IF;
  ELSIF NOT p34_private.staff(t) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
  IF jsonb_typeof(j->'displayName') IS DISTINCT FROM 'string' THEN RAISE EXCEPTION 'INVALID_TYPE'; END IF;
  IF length(btrim(j->>'displayName')) NOT BETWEEN 1 AND 200 OR j->>'displayName' IS NULL THEN RAISE EXCEPTION 'INVALID_NAME'; END IF;
  INSERT INTO public.customers(tenant_id,user_id,kind,display_name,email) VALUES(t,CASE WHEN op='onboard' THEN actor ELSE NULL END,
   CASE WHEN op='create_staff' AND j->>'kind'='company_employee' THEN 'company_employee'::public.customer_kind ELSE 'individual'::public.customer_kind END,btrim(j->>'displayName'),NULL) RETURNING id INTO cid;
  FOR key IN SELECT unnest(ARRAY['email','phone','street','city','kind']) LOOP
   IF j ? key AND jsonb_typeof(j->key) NOT IN('string','null') THEN RAISE EXCEPTION 'INVALID_TYPE'; END IF;
  END LOOP;
  IF nullif(btrim(j->>'email'),'') IS NOT NULL AND j->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN RAISE EXCEPTION 'INVALID_EMAIL'; END IF;
  IF length(coalesce(j->>'email',''))>254 OR length(coalesce(j->>'phone',''))>64 OR length(coalesce(j->>'city',''))>200 OR length(coalesce(j->>'street',''))>500 THEN RAISE EXCEPTION 'INVALID_LENGTH'; END IF;
  IF op='create_staff' THEN
   UPDATE public.customers SET email=nullif(btrim(j->>'email'),'') WHERE id=cid;
   IF nullif(btrim(j->>'street'),'') IS NOT NULL THEN INSERT INTO public.customer_addresses(tenant_id,customer_id,street,city,is_default) VALUES(t,cid,btrim(j->>'street'),j->>'city',true); END IF;
  END IF;
  IF nullif(btrim(j->>'phone'),'') IS NOT NULL THEN
   IF jsonb_typeof(j->'phone') IS DISTINCT FROM 'string' THEN RAISE EXCEPTION 'INVALID_TYPE'; END IF;
   INSERT INTO public.customer_phones(tenant_id,customer_id,phone,is_primary) VALUES(t,cid,btrim(j->>'phone'),true);
  END IF;
  result:=p34_private.profile(t,cid);
 ELSE
  cid:=(j->>'customerId')::uuid;
  SELECT * INTO c FROM public.customers WHERE id=cid AND tenant_id=t AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'CUSTOMER_NOT_FOUND'; END IF;
  IF c.user_id IS DISTINCT FROM actor AND NOT p34_private.staff(t) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
  IF c.revision IS DISTINCT FROM (j->>'expectedRevision')::bigint THEN RAISE EXCEPTION 'STALE_REVISION'; END IF;
  IF op='profile' THEN
   IF jsonb_typeof(patch) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'INVALID_TYPE'; END IF;
   FOR key,val IN SELECT * FROM jsonb_each_text(patch) LOOP
    IF key NOT IN('displayName','email','phone','street','city') THEN RAISE EXCEPTION 'FIELD_NOT_ALLOWED'; END IF;
    IF key='email' AND nullif(btrim(val),'') IS NOT NULL AND val !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN RAISE EXCEPTION 'INVALID_EMAIL'; END IF;
    IF key='displayName' AND (val IS NULL OR length(btrim(val)) NOT BETWEEN 1 AND 200) THEN RAISE EXCEPTION 'INVALID_NAME'; END IF;
    IF jsonb_typeof(patch->key) NOT IN('string','null') THEN RAISE EXCEPTION 'INVALID_TYPE'; END IF;
    IF length(coalesce(val,''))>(CASE key WHEN 'email' THEN 254 WHEN 'phone' THEN 64 WHEN 'street' THEN 500 ELSE 200 END) THEN RAISE EXCEPTION 'INVALID_LENGTH'; END IF;
   END LOOP;
   UPDATE public.customers SET display_name=CASE WHEN patch ? 'displayName' THEN btrim(patch->>'displayName') ELSE display_name END,email=CASE WHEN patch ? 'email' THEN nullif(btrim(patch->>'email'),'') ELSE email END WHERE id=cid;
   IF patch ? 'phone' THEN
    UPDATE public.customer_phones SET is_primary=false,deleted_at=now() WHERE tenant_id=t AND customer_id=cid AND deleted_at IS NULL AND is_primary;
    IF nullif(btrim(patch->>'phone'),'') IS NOT NULL THEN INSERT INTO public.customer_phones(tenant_id,customer_id,phone,is_primary) VALUES(t,cid,btrim(patch->>'phone'),true); END IF;
   END IF;
   IF patch ? 'street' OR patch ? 'city' THEN
    SELECT * INTO a FROM public.customer_addresses WHERE tenant_id=t AND customer_id=cid AND deleted_at IS NULL AND is_default FOR UPDATE;
    IF FOUND THEN
     IF patch ? 'street' AND length(btrim(coalesce(patch->>'street',''))) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'INVALID_STREET'; END IF;
     UPDATE public.customer_addresses SET street=CASE WHEN patch ? 'street' THEN btrim(patch->>'street') ELSE street END,city=CASE WHEN patch ? 'city' THEN nullif(btrim(patch->>'city'),'') ELSE city END WHERE id=a.id;
    ELSE
     IF patch ? 'street' OR nullif(btrim(patch->>'city'),'') IS NOT NULL THEN RAISE EXCEPTION 'ADDRESS_REQUIRED'; END IF;
    END IF;
   END IF;
  ELSIF op='customer_archive' THEN
   IF NOT p34_private.staff(t) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
   UPDATE public.customers SET deleted_at=now() WHERE id=cid;
  ELSIF op IN('address_create','address_edit','address_archive','address_restore','address_default') THEN
   IF op<>'address_create' THEN
    aid:=(j->>'addressId')::uuid;
    SELECT * INTO a FROM public.customer_addresses WHERE id=aid AND customer_id=cid AND tenant_id=t FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'ADDRESS_NOT_FOUND'; END IF;
    IF (op='address_restore')<>(a.deleted_at IS NOT NULL) THEN RAISE EXCEPTION 'INVALID_ADDRESS_STATE'; END IF;
   END IF;
   SELECT count(*) INTO count_active FROM public.customer_addresses WHERE customer_id=cid AND tenant_id=t AND deleted_at IS NULL;
   IF op IN('address_create','address_edit') THEN
    IF jsonb_typeof(patch) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'INVALID_TYPE'; END IF;
    FOR key,val IN SELECT * FROM jsonb_each_text(patch) LOOP
     IF key NOT IN('label','street','city','zip') THEN RAISE EXCEPTION 'FIELD_NOT_ALLOWED'; END IF;
     IF jsonb_typeof(patch->key) NOT IN('string','null') THEN RAISE EXCEPTION 'INVALID_TYPE'; END IF;
    IF length(coalesce(val,''))>(CASE key WHEN 'label' THEN 100 WHEN 'street' THEN 500 WHEN 'city' THEN 200 ELSE 32 END) THEN RAISE EXCEPTION 'INVALID_LENGTH'; END IF;
    END LOOP;
    IF op='address_create' OR patch ? 'street' THEN
     IF length(btrim(coalesce(patch->>'street',''))) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'INVALID_STREET'; END IF;
    END IF;
    IF op='address_create' THEN
     INSERT INTO public.customer_addresses(tenant_id,customer_id,label,street,city,zip,is_default) VALUES(t,cid,patch->>'label',btrim(patch->>'street'),patch->>'city',patch->>'zip',count_active=0) RETURNING id INTO aid;
    ELSE UPDATE public.customer_addresses SET label=CASE WHEN patch ? 'label' THEN patch->>'label' ELSE label END,street=CASE WHEN patch ? 'street' THEN btrim(patch->>'street') ELSE street END,city=CASE WHEN patch ? 'city' THEN patch->>'city' ELSE city END,zip=CASE WHEN patch ? 'zip' THEN patch->>'zip' ELSE zip END WHERE id=aid; END IF;
   ELSIF op='address_archive' THEN
    IF a.is_default AND count_active>1 THEN
     replacement:=(j->>'replacementAddressId')::uuid;
     IF replacement IS NULL OR replacement=aid OR NOT EXISTS(SELECT 1 FROM public.customer_addresses WHERE id=replacement AND tenant_id=t AND customer_id=cid AND deleted_at IS NULL) THEN RAISE EXCEPTION 'DEFAULT_REPLACEMENT_REQUIRED'; END IF;
    END IF;
    UPDATE public.customer_addresses SET deleted_at=now(),is_default=false WHERE id=aid;
    IF replacement IS NOT NULL THEN UPDATE public.customer_addresses SET is_default=true WHERE id=replacement; END IF;
   ELSIF op='address_restore' THEN UPDATE public.customer_addresses SET deleted_at=NULL,is_default=count_active=0 WHERE id=aid;
   ELSE
    UPDATE public.customer_addresses SET is_default=false WHERE tenant_id=t AND customer_id=cid AND deleted_at IS NULL AND is_default;
    UPDATE public.customer_addresses SET is_default=true WHERE id=aid;
   END IF;
  ELSE RAISE EXCEPTION 'OPERATION_NOT_ALLOWED'; END IF;
  UPDATE public.customers SET revision=revision+1 WHERE id=cid;
  IF EXISTS(SELECT 1 FROM public.customer_addresses WHERE customer_id=cid AND tenant_id=t AND deleted_at IS NULL GROUP BY customer_id HAVING count(*) FILTER(WHERE is_default)<>1) THEN RAISE EXCEPTION 'DEFAULT_INCONSISTENT'; END IF;
  result:=CASE WHEN op='customer_archive' THEN jsonb_build_object('customerId',cid,'revision',c.revision+1) ELSE p34_private.profile(t,cid) END;
 END IF;
 INSERT INTO public.audit_log(tenant_id,actor_id,entity_type,entity_id,action,new_data) VALUES(t,actor,'customer',coalesce(cid,r),'p34.'||op,jsonb_build_object('requestId',r,'revision',result->'revision','fields',(SELECT coalesce(jsonb_agg(k),'[]'::jsonb) FROM jsonb_object_keys(patch) k)));
 INSERT INTO p34_private.requests(tenant_id,actor_id,request_id,fingerprint,result) VALUES(t,actor,r,encode(sha256(convert_to(j::text,'UTF8')),'hex'),jsonb_strip_nulls(jsonb_build_object('customerId',result->'customerId','committedRevision',result->'revision','linkRequestId',result->'linkRequestId','state',result->'state')));
 RETURN result||jsonb_build_object('replayed',false);
END $$;
ALTER FUNCTION p34_private.execute(uuid,uuid,jsonb) OWNER TO p34_writer;
REVOKE ALL ON FUNCTION p34_private.member(uuid),p34_private.staff(uuid,boolean),p34_private.profile(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION p34_private.member(uuid),p34_private.staff(uuid,boolean),p34_private.profile(uuid,uuid) TO p34_writer;
CREATE FUNCTION public.p34_customer_command(_tenant uuid,_request uuid,_command jsonb) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT p34_private.execute(_tenant,_request,_command) $$;
REVOKE ALL ON FUNCTION p34_private.execute(uuid,uuid,jsonb),public.p34_customer_command(uuid,uuid,jsonb) FROM PUBLIC,anon,service_role;
GRANT USAGE ON SCHEMA p34_private TO authenticated;
GRANT EXECUTE ON FUNCTION p34_private.execute(uuid,uuid,jsonb),public.p34_customer_command(uuid,uuid,jsonb) TO authenticated;
-- Public reads still verify current membership and ownership through the private function.
CREATE FUNCTION p34_private.read_profile(t uuid,c uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT p34_private.member(t) OR NOT EXISTS(SELECT 1 FROM public.customers WHERE tenant_id=t AND id=c AND deleted_at IS NULL AND (user_id=auth.uid() OR p34_private.staff(t))) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 RETURN p34_private.profile(t,c);
END $$;
ALTER FUNCTION p34_private.read_profile(uuid,uuid) OWNER TO p34_writer;
CREATE FUNCTION public.p34_customer_profile(_tenant uuid,_customer uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT p34_private.read_profile(_tenant,_customer) $$;
REVOKE ALL ON FUNCTION p34_private.read_profile(uuid,uuid),public.p34_customer_profile(uuid,uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION p34_private.read_profile(uuid,uuid),public.p34_customer_profile(uuid,uuid) TO authenticated;
CREATE FUNCTION p34_private.read_requests(t uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT p34_private.member(t) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'userId',user_id,'customerId',customer_id,'state',CASE WHEN state='approved' AND expires_at<=now() THEN 'expired' ELSE state END,'revision',approved_revision,'expiresAt',expires_at,'displayName',(SELECT display_name FROM public.customers c WHERE c.id=customer_id AND c.tenant_id=t)) ORDER BY created_at) FROM p34_private.identity_requests WHERE tenant_id=t AND (user_id=auth.uid() OR p34_private.staff(t,true))),'[]');
END $$;
ALTER FUNCTION p34_private.read_requests(uuid) OWNER TO p34_writer;
CREATE FUNCTION public.p34_identity_requests(_tenant uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT p34_private.read_requests(_tenant) $$;
REVOKE ALL ON FUNCTION p34_private.read_requests(uuid),public.p34_identity_requests(uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION p34_private.read_requests(uuid),public.p34_identity_requests(uuid) TO authenticated;
CREATE FUNCTION p34_private.readback(t uuid,r uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb; BEGIN
 IF NOT p34_private.member(t) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 SELECT q.result INTO result FROM p34_private.requests q WHERE tenant_id=t AND actor_id=auth.uid() AND request_id=r;
 IF result ? 'customerId' AND NOT p34_private.staff(t) AND NOT EXISTS(SELECT 1 FROM public.customers WHERE tenant_id=t AND id=(result->>'customerId')::uuid AND user_id=auth.uid() AND deleted_at IS NULL) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 RETURN result;
END $$;
ALTER FUNCTION p34_private.readback(uuid,uuid) OWNER TO p34_writer;
CREATE FUNCTION public.p34_customer_readback(_tenant uuid,_request uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT p34_private.readback(_tenant,_request) $$;
REVOKE ALL ON FUNCTION p34_private.readback(uuid,uuid),public.p34_customer_readback(uuid,uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION p34_private.readback(uuid,uuid),public.p34_customer_readback(uuid,uuid) TO authenticated;
-- No generic browser write may bypass canonical revision/audit or move identity/tenant.
REVOKE INSERT,UPDATE,DELETE ON public.customers,public.customer_addresses,public.customer_phones FROM authenticated;
-- Canonical order writer privileges and its existing policies are untouched.
-- Legacy signature retained, but membership and roles are never provisioned here.
CREATE OR REPLACE FUNCTION public.ensure_individual_customer(p_tenant_id uuid,p_user_id uuid,p_display_name text DEFAULT NULL,p_email text DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE existing_id uuid; BEGIN
 IF p_user_id IS DISTINCT FROM auth.uid() OR NOT EXISTS(SELECT 1 FROM public.tenant_members WHERE tenant_id=p_tenant_id AND user_id=auth.uid() AND status='approved' AND deleted_at IS NULL) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 SELECT id INTO existing_id FROM public.customers WHERE tenant_id=p_tenant_id AND user_id=p_user_id AND deleted_at IS NULL;
 IF FOUND THEN RETURN existing_id; END IF;
 RAISE EXCEPTION 'EXPLICIT_ONBOARDING_REQUIRED';
END $$;
REVOKE CREATE ON SCHEMA p34_private FROM p34_writer;
COMMIT;
