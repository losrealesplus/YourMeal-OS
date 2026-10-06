-- ADR 0102 / A3: dish-only transactional foundation. File only; provider application requires approval.
-- Public API stays INVOKER. The private canonical operation uses a dedicated NOLOGIN,
-- NOBYPASSRLS role solely for closed idempotency access and unforgeable write provenance.
-- No caller-set GUC authorizes writes; authenticated cannot SET ROLE to this role.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='cr_order_writer') THEN
    CREATE ROLE cr_order_writer NOLOGIN NOINHERIT NOBYPASSRLS;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='cr_order_writer' AND (rolcanlogin OR rolbypassrls OR rolsuper OR rolinherit)) THEN
    RAISE EXCEPTION 'CR_ORDER_WRITER_ROLE_UNSAFE';
  END IF;
  IF pg_has_role('authenticated','cr_order_writer','MEMBER') OR pg_has_role('anon','cr_order_writer','MEMBER')
    OR pg_has_role('service_role','cr_order_writer','MEMBER') THEN RAISE EXCEPTION 'CR_ORDER_WRITER_ROLE_UNSAFE'; END IF;
END $$;
CREATE SCHEMA IF NOT EXISTS cr_order_private;
REVOKE ALL ON SCHEMA cr_order_private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA cr_order_private TO authenticated, cr_order_writer, service_role;
GRANT USAGE ON SCHEMA public, auth TO cr_order_writer;
-- Non-superuser function ownership transfer requires CREATE; revoke after transfers.
GRANT CREATE ON SCHEMA cr_order_private TO cr_order_writer;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,uuid,public.app_role),public.is_saas_admin(uuid),auth.uid() TO cr_order_writer;
-- Needed to transfer function ownership; never grant this role to API callers.
DO $$ BEGIN EXECUTE format('GRANT cr_order_writer TO %I', current_user); END $$;

ALTER TABLE public.orders DROP CONSTRAINT orders_expand_v1_only,
  ADD CONSTRAINT orders_write_version_closed CHECK(write_contract_version IN (1,2));
ALTER TABLE public.order_items DROP CONSTRAINT order_items_expand_dish_only,
  ADD CONSTRAINT order_items_v2_dish_only CHECK (
    item_kind='dish' AND dish_id IS NOT NULL AND (
      (name_snapshot IS NULL AND description_snapshot IS NULL AND allergen_state='HISTORICAL_UNAVAILABLE'
        AND allergens_snapshot IS NULL AND snapshot_captured_at IS NULL AND snapshot_author_id IS NULL)
      OR (name_snapshot IS NOT NULL AND length(btrim(name_snapshot)) BETWEEN 1 AND 200 AND snapshot_captured_at IS NOT NULL AND allergens_snapshot IS NOT NULL
        AND (
          (allergen_state='UNKNOWN' AND allergens_snapshot='{}'::text[])
          OR (allergen_state='DECLARED' AND cardinality(allergens_snapshot)>0)
        ))
    )
  );
-- dish_id NOT NULL and batch dish-only foundation remain intact; no custom writes.

CREATE FUNCTION cr_order_private.actor() RETURNS uuid LANGUAGE sql STABLE SECURITY INVOKER
SET search_path='' AS $$
 SELECT CASE WHEN current_user='cr_order_writer' THEN
   coalesce(auth.uid(), nullif(current_setting('cr_order.verified_actor',true),'')::uuid)
 ELSE auth.uid() END
$$;
CREATE FUNCTION cr_order_private.can_write(_tenant uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER
SET search_path='' AS $$
 SELECT cr_order_private.actor() IS NOT NULL AND (
   public.is_saas_admin(cr_order_private.actor()) OR (
     EXISTS(SELECT 1 FROM public.tenant_members m WHERE m.tenant_id=_tenant AND m.user_id=cr_order_private.actor()
       AND m.status='approved' AND m.deleted_at IS NULL)
     AND (public.has_role(cr_order_private.actor(),_tenant,'company_admin')
       OR public.has_role(cr_order_private.actor(),_tenant,'operations_manager')
       OR public.has_role(cr_order_private.actor(),_tenant,'customer'))
   )
 )
$$;
CREATE FUNCTION cr_order_private.is_staff(_tenant uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER
SET search_path='' AS $$
 SELECT cr_order_private.can_write(_tenant) AND (
   public.is_saas_admin(cr_order_private.actor()) OR public.has_role(cr_order_private.actor(),_tenant,'company_admin')
   OR public.has_role(cr_order_private.actor(),_tenant,'operations_manager'))
$$;
GRANT SELECT ON public.tenant_members TO cr_order_writer;
CREATE POLICY cr_order_membership_read ON public.tenant_members FOR SELECT TO cr_order_writer
USING(user_id=cr_order_private.actor());
GRANT SELECT ON public.customers, public.dishes, public.weekly_menus, public.weekly_menu_slots,
  public.customer_addresses,public.customer_phones,public.customer_preferences,public.customer_dietary_profiles,public.kitchen_production_batches TO cr_order_writer;
-- PostgreSQL row locking SELECT requires UPDATE privilege; the NOLOGIN role exposes no arbitrary SQL.
GRANT UPDATE ON public.customers,public.dishes,public.weekly_menus,public.weekly_menu_slots,public.customer_addresses,
  public.customer_dietary_profiles,public.kitchen_production_batches TO cr_order_writer;
GRANT INSERT ON public.customers,public.customer_phones,public.customer_addresses,public.customer_preferences,
  public.customer_dietary_profiles,public.audit_log TO cr_order_writer;
GRANT SELECT,INSERT,UPDATE ON public.orders,public.order_items,public.delivery_services TO cr_order_writer;
GRANT SELECT,INSERT ON public.order_write_requests TO cr_order_writer;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['customers','dishes','weekly_menus','weekly_menu_slots','customer_addresses',
   'customer_dietary_profiles','customer_phones','customer_preferences','orders','order_items','delivery_services',
   'audit_log','order_write_requests','kitchen_production_batches'] LOOP
   EXECUTE format('CREATE POLICY cr_order_canonical_role ON public.%I TO cr_order_writer USING(cr_order_private.can_write(tenant_id)) WITH CHECK(cr_order_private.can_write(tenant_id))',t);
 END LOOP;
END $$;

CREATE FUNCTION cr_order_private.guard_v2() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
SET search_path='' AS $$
DECLARE v2 boolean; r record;
BEGIN
 IF TG_TABLE_NAME='orders' THEN
   IF TG_OP='DELETE' THEN v2:=OLD.write_contract_version=2;
   ELSIF TG_OP='INSERT' THEN v2:=NEW.write_contract_version=2;
   ELSE v2:=OLD.write_contract_version=2 OR NEW.write_contract_version=2; END IF;
 ELSE
   IF TG_OP='DELETE' THEN r:=OLD; ELSE r:=NEW; END IF;
   SELECT o.write_contract_version=2 INTO v2 FROM public.orders o WHERE o.id=r.order_id AND o.tenant_id=r.tenant_id;
   v2:=coalesce(v2,false) OR r.name_snapshot IS NOT NULL OR r.allergen_state<>'HISTORICAL_UNAVAILABLE';
   IF TG_OP='UPDATE' THEN
     IF pg_trigger_depth()>1 AND OLD.snapshot_author_id IS NOT NULL AND NEW.snapshot_author_id IS NULL
       AND (to_jsonb(OLD)-'snapshot_author_id')=(to_jsonb(NEW)-'snapshot_author_id') THEN RETURN NEW; END IF;
     v2:=v2 OR OLD.name_snapshot IS NOT NULL OR OLD.allergen_state<>'HISTORICAL_UNAVAILABLE';
     IF OLD.tenant_id IS DISTINCT FROM NEW.tenant_id OR OLD.order_id IS DISTINCT FROM NEW.order_id
        OR OLD.item_kind IS DISTINCT FROM NEW.item_kind THEN RAISE EXCEPTION 'ORDER_ITEM_IDENTITY_IMMUTABLE'; END IF;
   END IF;
 END IF;
 IF v2 AND current_user<>'cr_order_writer' THEN RAISE EXCEPTION 'V2_CANONICAL_WRITER_REQUIRED'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER cr_order_v2_header_guard BEFORE INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION cr_order_private.guard_v2();
CREATE TRIGGER cr_order_v2_item_guard BEFORE INSERT OR UPDATE OR DELETE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION cr_order_private.guard_v2();

-- Deferred integrity protects headers, direct legacy RPCs and every live v2 line.
CREATE FUNCTION cr_order_private.check_v2_total() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path='' AS $$
DECLARE oid uuid; tid uuid; o public.orders; n integer; total numeric;
BEGIN
 IF TG_TABLE_NAME='orders' THEN
   IF TG_OP='DELETE' THEN oid:=OLD.id; tid:=OLD.tenant_id; ELSE oid:=NEW.id; tid:=NEW.tenant_id; END IF;
 ELSE
   IF TG_OP='DELETE' THEN oid:=OLD.order_id;tid:=OLD.tenant_id; ELSE oid:=NEW.order_id;tid:=NEW.tenant_id; END IF;
 END IF;
 SELECT * INTO o FROM public.orders WHERE id=oid AND tenant_id=tid;
 IF NOT FOUND OR o.write_contract_version<>2 THEN RETURN NULL; END IF;
 SELECT count(*),round(sum(i.unit_price*i.qty),2) INTO n,total FROM public.order_items i
 WHERE i.tenant_id=tid AND i.order_id=oid AND i.deleted_at IS NULL;
 IF n=0 OR total IS DISTINCT FROM o.total OR EXISTS(SELECT 1 FROM public.order_items i
  WHERE i.tenant_id=tid AND i.order_id=oid AND i.deleted_at IS NULL AND (
    i.item_kind<>'dish' OR i.qty<=0 OR i.unit_price IS NULL OR i.unit_price::text IN('NaN','Infinity','-Infinity')
    OR i.unit_price<0 OR i.name_snapshot IS NULL OR i.day_date<o.week_start OR i.day_date>o.week_start+6))
 THEN RAISE EXCEPTION 'V2_ORDER_TOTAL_INCONSISTENT'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.order_write_requests w WHERE w.tenant_id=tid AND w.order_id=oid
   AND w.committed_revision=o.revision) THEN RAISE EXCEPTION 'V2_AUDITED_REQUEST_REQUIRED'; END IF;
 RETURN NULL;
END $$;
ALTER FUNCTION cr_order_private.check_v2_total() OWNER TO cr_order_writer;
CREATE CONSTRAINT TRIGGER cr_order_v2_total_header AFTER INSERT OR UPDATE ON public.orders
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION cr_order_private.check_v2_total();
CREATE CONSTRAINT TRIGGER cr_order_v2_total_items AFTER INSERT OR UPDATE OR DELETE ON public.order_items
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION cr_order_private.check_v2_total();

-- M2 may replace this trusted hook. A3 never trusts client price snapshots or commercial claims.
CREATE FUNCTION cr_order_private.dish_write_price(_tenant uuid,_actor uuid,_line jsonb,
 _catalogue_price numeric,_existing_price numeric,_trusted_quote jsonb) RETURNS numeric LANGUAGE plpgsql
SECURITY INVOKER SET search_path='' AS $$
DECLARE p numeric;
BEGIN
 IF _trusted_quote IS NOT NULL THEN RAISE EXCEPTION 'TRUSTED_QUOTE_UNSUPPORTED'; END IF;
 IF _line ? 'slotId' OR _line ? 'quoteId' THEN RAISE EXCEPTION 'COMMERCIAL_QUOTE_REQUIRED'; END IF;
 IF _line ? 'unitPriceOverride' THEN
   IF NOT cr_order_private.is_staff(_tenant) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
   IF jsonb_typeof(_line->'unitPriceOverrideReason') IS DISTINCT FROM 'string'
     OR length(btrim(_line->>'unitPriceOverrideReason'))=0 OR length(_line->>'unitPriceOverrideReason')>2000 THEN
     RAISE EXCEPTION 'PRICE_OVERRIDE_REASON_REQUIRED'; END IF;
   IF jsonb_typeof(_line->'unitPriceOverride') IS DISTINCT FROM 'string'
     OR (_line->>'unitPriceOverride') !~ '^(0|[1-9][0-9]{0,7})(\.[0-9]{1,4})?$' THEN RAISE EXCEPTION 'PRICE_INVALID'; END IF;
   p:=(_line->>'unitPriceOverride')::numeric;
 ELSE p:=coalesce(_existing_price,_catalogue_price); END IF;
 IF p IS NULL OR p::text IN('NaN','Infinity','-Infinity') OR p<0 OR p>=100000000 OR scale(p)>4 THEN
   RAISE EXCEPTION 'PRICE_INVALID'; END IF;
 RETURN p;
END $$;

-- Serialize batch creation/state changes with capture/modify, including absent batch rows.
CREATE FUNCTION cr_order_private.serialize_batch() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE keys text[] := '{}'; k text;
BEGIN
 IF TG_OP<>'INSERT' THEN keys:=array_append(keys,'cr-order-day:'||OLD.tenant_id||':'||to_char(OLD.delivery_date,'YYYY-MM-DD')||':'||OLD.dish_id); END IF;
 IF TG_OP<>'DELETE' THEN keys:=array_append(keys,'cr-order-day:'||NEW.tenant_id||':'||to_char(NEW.delivery_date,'YYYY-MM-DD')||':'||NEW.dish_id); END IF;
 FOR k IN SELECT DISTINCT x FROM unnest(keys) x ORDER BY x LOOP
  PERFORM pg_advisory_xact_lock(hashtextextended(k,0));
 END LOOP;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER cr_order_batch_serialize BEFORE INSERT OR UPDATE OR DELETE ON public.kitchen_production_batches
FOR EACH ROW EXECUTE FUNCTION cr_order_private.serialize_batch();

CREATE FUNCTION cr_order_private.validate_profile(p jsonb,override_allowed boolean) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE k text; v jsonb;
BEGIN
 IF jsonb_typeof(p) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
 FOR k,v IN SELECT * FROM jsonb_each(p) LOOP
  IF k=ANY(ARRAY['allergens','customAllergens','restrictions','preferences']) THEN
    IF jsonb_typeof(v)<>'array' OR EXISTS(SELECT 1 FROM jsonb_array_elements(v) x WHERE jsonb_typeof(x)<>'string') THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
  ELSIF k='dietaryNotes' OR (k='overrideReason' AND override_allowed) THEN
    IF jsonb_typeof(v) NOT IN('string','null') OR length(p->>k)>2000 THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
  ELSE RAISE EXCEPTION 'UNTRUSTED_AUTHORITY_FIELD'; END IF;
 END LOOP;
END $$;

CREATE FUNCTION cr_order_private.write_dish_v2(_tenant_id uuid,_request_id uuid,_command jsonb,
 _verified_actor uuid DEFAULT NULL,_trusted_quote jsonb DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql
SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid; staff boolean; op text; h text; req public.order_write_requests; o public.orders;
 c public.customers; d public.dishes; old_item public.order_items; line jsonb; cid uuid; oid uuid; iid uuid;
 week date; day date; v_qty integer; p numeric; grand numeric:=0; keep uuid[]:='{}';
 before_order jsonb; before_items jsonb; output_items jsonb; price_overrides jsonb:='[]'::jsonb; captured timestamptz:=statement_timestamp();
 field text; val jsonb; phone text; address public.customer_addresses; profile public.customer_dietary_profiles; dietary jsonb; result jsonb; address_snapshot jsonb;
BEGIN
 IF _verified_actor IS NOT NULL THEN
   IF current_setting('role',true)<>'service_role' THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
   actor:=_verified_actor;
 ELSE actor:=auth.uid(); END IF;
 IF actor IS NULL THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 PERFORM set_config('cr_order.verified_actor',actor::text,true);
 IF NOT cr_order_private.can_write(_tenant_id) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 staff:=cr_order_private.is_staff(_tenant_id);
 -- Bare catalogue foundation is not a replacement for customer commercial pricing.
 IF NOT staff AND _trusted_quote IS NULL THEN RAISE EXCEPTION 'COMMERCIAL_QUOTE_REQUIRED'; END IF;
 IF _request_id IS NULL OR jsonb_typeof(_command) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
 IF _command ?| ARRAY['tenantId','actorId','inputHash','total','dietarySnapshot','priceSnapshot','commercialInactive','quoteId'] THEN
   RAISE EXCEPTION 'UNTRUSTED_AUTHORITY_FIELD'; END IF;
 FOR field,val IN SELECT * FROM jsonb_each(_command) LOOP
   IF NOT field=ANY(ARRAY['operation','customer','weekStart','lines','orderNotes','autoConfirm','orderId','expectedRevision',
     'deliveryAddressId','demandChannel','companyId','siteId','organizationalUnitId','deliveryGroupId','dietaryOverride']) THEN
     RAISE EXCEPTION 'UNTRUSTED_AUTHORITY_FIELD'; END IF;
   IF field='orderNotes' AND (jsonb_typeof(val) NOT IN('string','null') OR length(_command->>field)>2000) THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
   IF field='autoConfirm' AND jsonb_typeof(val)<>'boolean' THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
   IF field='dietaryOverride' AND val<>'null'::jsonb THEN PERFORM cr_order_private.validate_profile(val,true); END IF;
 END LOOP;
 op:=_command->>'operation';
 IF op IS NULL OR op NOT IN('capture','modify') THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
 IF op='modify' AND _command ?| ARRAY['customer','autoConfirm'] OR op='capture' AND _command ?| ARRAY['orderId','expectedRevision'] THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
 h:=encode(sha256(convert_to(jsonb_build_object('actor',actor,'command',_command,'trustedQuote',_trusted_quote)::text,'UTF8')),'hex');
 PERFORM pg_advisory_xact_lock(hashtextextended(_tenant_id::text||':'||_request_id::text,0));
 SELECT * INTO req FROM public.order_write_requests WHERE tenant_id=_tenant_id AND request_id=_request_id;
 IF FOUND THEN
   IF req.input_hash<>h OR req.operation<>op THEN RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT'; END IF;
   -- Identity/revision of original commit; current read data may be a later revision.
   SELECT * INTO o FROM public.orders WHERE tenant_id=_tenant_id AND id=req.order_id;
   SELECT coalesce(jsonb_agg(to_jsonb(i) ORDER BY i.id),'[]') INTO output_items FROM public.order_items i
     WHERE tenant_id=_tenant_id AND order_id=req.order_id AND deleted_at IS NULL;
   RETURN jsonb_build_object('order',to_jsonb(o),'items',output_items,'committedRevision',req.committed_revision,'replayed',true,'inputHash',h);
 END IF;
 IF jsonb_typeof(_command->'lines') IS DISTINCT FROM 'array' OR jsonb_array_length(_command->'lines')=0 THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
 IF _command->>'weekStart' IS NULL OR (_command->>'weekStart') !~ '^\d{4}-\d{2}-\d{2}$' THEN RAISE EXCEPTION 'DATE_INVALID'; END IF;
 week:=(_command->>'weekStart')::date;
 IF extract(isodow FROM week)<>1 THEN RAISE EXCEPTION 'WEEK_START_INVALID'; END IF;
 -- Locks are acquired deterministically before the order row to avoid competing edits
 -- taking incompatible day/dish lock orders. Batch triggers use exactly the same key.
 PERFORM pg_advisory_xact_lock(hashtextextended(key,0)) FROM (
   SELECT DISTINCT key FROM (
     SELECT 'cr-order-day:'||_tenant_id||':'||to_char((x->>'dayDate')::date,'YYYY-MM-DD')||':'||(x->>'dishId')::uuid AS key
       FROM jsonb_array_elements(_command->'lines') x
     UNION ALL
     SELECT 'cr-order-day:'||i.tenant_id||':'||to_char(i.day_date,'YYYY-MM-DD')||':'||i.dish_id FROM public.order_items i
       WHERE op='modify' AND i.tenant_id=_tenant_id AND i.order_id=(_command->>'orderId')::uuid AND i.deleted_at IS NULL
   ) keys ORDER BY key
 ) sorted_keys;
 IF op='modify' THEN
   oid:=(_command->>'orderId')::uuid;
   SELECT * INTO o FROM public.orders WHERE tenant_id=_tenant_id AND id=oid AND deleted_at IS NULL FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
   IF NOT (_command ? 'expectedRevision') OR jsonb_typeof(_command->'expectedRevision')<>'number'
     OR (_command->>'expectedRevision') !~ '^\d+$' THEN RAISE EXCEPTION 'REVISION_REQUIRED'; END IF;
   IF o.revision<>(_command->>'expectedRevision')::integer THEN RAISE EXCEPTION 'STALE_REVISION'; END IF;
   IF o.week_start<>week THEN RAISE EXCEPTION 'WEEK_IMMUTABLE'; END IF;
   IF o.status::text NOT IN('draft','confirmed','in_production','prepared') THEN RAISE EXCEPTION 'ORDER_CLOSED'; END IF;
   PERFORM 1 FROM public.delivery_services s WHERE s.tenant_id=_tenant_id AND s.order_id=oid AND s.deleted_at IS NULL FOR UPDATE;
   PERFORM 1 FROM public.kitchen_production_batches b JOIN public.order_items i ON i.tenant_id=b.tenant_id AND i.day_date=b.delivery_date AND i.dish_id=b.dish_id
     WHERE i.tenant_id=_tenant_id AND i.order_id=oid AND i.deleted_at IS NULL FOR UPDATE OF b;
   IF EXISTS(SELECT 1 FROM public.delivery_services s WHERE s.tenant_id=_tenant_id AND s.order_id=oid
     AND s.deleted_at IS NULL AND s.status::text NOT IN('pending')) OR EXISTS(
     SELECT 1 FROM public.order_items i JOIN public.kitchen_production_batches b ON b.tenant_id=i.tenant_id
       AND b.delivery_date=i.day_date AND b.dish_id=i.dish_id
     WHERE i.tenant_id=_tenant_id AND i.order_id=oid AND i.deleted_at IS NULL AND b.status<>'pending') THEN
     RAISE EXCEPTION 'ORDER_OPERATIONALLY_LOCKED'; END IF;
   cid:=o.customer_id;
   before_order:=to_jsonb(o);
   SELECT coalesce(jsonb_agg(to_jsonb(i)),'[]') INTO before_items FROM public.order_items i
     WHERE i.tenant_id=_tenant_id AND i.order_id=oid AND deleted_at IS NULL;
 ELSE
   IF jsonb_typeof(_command->'customer') IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'CUSTOMER_REQUIRED'; END IF;
   FOR field,val IN SELECT * FROM jsonb_each(_command->'customer') LOOP
     IF _command->'customer'->>'kind'='existing' AND NOT field=ANY(ARRAY['kind','id']) OR
        _command->'customer'->>'kind'='new' AND NOT field=ANY(ARRAY['kind','displayName','phone','email','street','city','deliveryNotes','dietaryProfile']) THEN RAISE EXCEPTION 'UNTRUSTED_AUTHORITY_FIELD'; END IF;
     IF field='dietaryProfile' THEN PERFORM cr_order_private.validate_profile(val,false);
     ELSIF jsonb_typeof(val) NOT IN('string','null') THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
   END LOOP;
   IF _command->'customer'->>'kind'='existing'  THEN cid:=(_command->'customer'->>'id')::uuid;
   ELSIF _command->'customer'->>'kind'='new' AND staff THEN
     IF length(btrim(coalesce(_command->'customer'->>'displayName','')))=0 OR
       length(btrim(coalesce(_command->'customer'->>'phone','')))=0 THEN RAISE EXCEPTION 'CUSTOMER_REQUIRED'; END IF;
     INSERT INTO public.customers(tenant_id,display_name,email,kind) VALUES(_tenant_id,
       btrim(_command->'customer'->>'displayName'),nullif(btrim(_command->'customer'->>'email'),''),'individual') RETURNING * INTO c;
     cid:=c.id;
     INSERT INTO public.customer_phones(tenant_id,customer_id,phone,is_primary)
       VALUES(_tenant_id,cid,btrim(_command->'customer'->>'phone'),true);
     IF nullif(btrim(_command->'customer'->>'street'),'') IS NOT NULL THEN
       INSERT INTO public.customer_addresses(tenant_id,customer_id,street,city,is_default) VALUES(_tenant_id,cid,
         btrim(_command->'customer'->>'street'),nullif(btrim(_command->'customer'->>'city'),''),true);
     END IF;
     IF nullif(btrim(_command->'customer'->>'deliveryNotes'),'') IS NOT NULL THEN
       INSERT INTO public.customer_preferences(tenant_id,customer_id,key,value)
         VALUES(_tenant_id,cid,'delivery_notes',btrim(_command->'customer'->>'deliveryNotes'));
     END IF;
     IF _command->'customer' ? 'dietaryProfile' THEN
       profile:=NULL;
       INSERT INTO public.customer_dietary_profiles(tenant_id,customer_id,allergens,custom_allergens,restrictions,preferences,dietary_notes)
       VALUES(_tenant_id,cid,coalesce(_command->'customer'->'dietaryProfile'->'allergens','[]'),
         coalesce(_command->'customer'->'dietaryProfile'->'customAllergens','[]'),
         coalesce(_command->'customer'->'dietaryProfile'->'restrictions','[]'),
         coalesce(_command->'customer'->'dietaryProfile'->'preferences','[]'),_command->'customer'->'dietaryProfile'->>'dietaryNotes');
     END IF;
   ELSE RAISE EXCEPTION 'CUSTOMER_REQUIRED'; END IF;
 END IF;
 SELECT * INTO c FROM public.customers WHERE id=cid AND tenant_id=_tenant_id AND deleted_at IS NULL FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'CUSTOMER_NOT_FOUND'; END IF;
 IF NOT staff AND c.user_id IS DISTINCT FROM actor THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 IF NOT staff AND (op='modify' AND o.status::text<>'draft' OR coalesce((_command->>'autoConfirm')::boolean,false)) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 IF op='modify' AND NOT (_command ? 'deliveryAddressId') THEN
   SELECT * INTO address FROM public.customer_addresses WHERE id=o.delivery_address_id AND tenant_id=_tenant_id AND customer_id=cid AND deleted_at IS NULL FOR SHARE;
 ELSIF _command ? 'deliveryAddressId' AND _command->>'deliveryAddressId' IS NOT NULL THEN
   SELECT * INTO address FROM public.customer_addresses WHERE id=(_command->>'deliveryAddressId')::uuid
     AND tenant_id=_tenant_id AND customer_id=cid AND deleted_at IS NULL FOR SHARE;
   IF NOT FOUND THEN RAISE EXCEPTION 'ADDRESS_NOT_FOUND'; END IF;
 ELSIF NOT (_command ? 'deliveryAddressId') THEN SELECT * INTO address FROM public.customer_addresses WHERE tenant_id=_tenant_id AND customer_id=cid
   AND deleted_at IS NULL ORDER BY is_default DESC,id LIMIT 1 FOR SHARE; END IF;
 address_snapshot:=CASE WHEN address.id IS NULL THEN jsonb_build_object('unresolved',true,'reason','no_address_at_intake')
   ELSE jsonb_build_object('addressId',address.id,'street',address.street,'city',address.city,'zip',address.zip,'label',address.label) END;
 IF op='modify' AND NOT (_command ? 'deliveryAddressId') THEN
   SELECT coalesce(ds.delivery_address_snapshot,address_snapshot) INTO result FROM public.delivery_services ds
     WHERE ds.tenant_id=_tenant_id AND ds.order_id=oid ORDER BY ds.delivery_date,ds.id LIMIT 1;
   address_snapshot:=coalesce(result,address_snapshot);
 END IF;
 SELECT cp.phone INTO phone FROM public.customer_phones cp WHERE cp.tenant_id=_tenant_id AND cp.customer_id=cid ORDER BY cp.is_primary DESC,cp.id LIMIT 1;
 SELECT * INTO profile FROM public.customer_dietary_profiles WHERE tenant_id=_tenant_id AND customer_id=cid FOR SHARE;
 dietary:=jsonb_build_object('capturedAt',captured,'authorUserId',actor,'isOverride',false,'overrideReason',NULL,
   'allergens',coalesce(profile.allergens,'[]'),'customAllergens',coalesce(profile.custom_allergens,'[]'),
   'restrictions',coalesce(profile.restrictions,'[]'),'preferences',coalesce(profile.preferences,'[]'),'dietaryNotes',profile.dietary_notes);
 IF _command->'dietaryOverride' IS NOT NULL AND _command->'dietaryOverride'<>'null'::jsonb THEN
   IF NOT staff OR length(btrim(coalesce(_command->'dietaryOverride'->>'overrideReason','')))<5 THEN RAISE EXCEPTION 'DIETARY_OVERRIDE_REASON_REQUIRED'; END IF;
   dietary:=dietary||jsonb_build_object('isOverride',true,'overrideReason',btrim(_command->'dietaryOverride'->>'overrideReason'),
     'allergens',coalesce(_command->'dietaryOverride'->'allergens',profile.allergens,'[]'),
     'customAllergens',coalesce(_command->'dietaryOverride'->'customAllergens',profile.custom_allergens,'[]'),
     'restrictions',coalesce(_command->'dietaryOverride'->'restrictions',profile.restrictions,'[]'),
     'preferences',coalesce(_command->'dietaryOverride'->'preferences',profile.preferences,'[]'),
     'dietaryNotes',coalesce(_command->'dietaryOverride'->>'dietaryNotes',profile.dietary_notes));
 END IF;
 IF coalesce(_command->>'demandChannel',o.demand_channel::text,'individual')='company'
   OR coalesce(_command->>'companyId',o.company_id::text) IS NOT NULL
   OR coalesce(_command->>'siteId',o.site_id::text) IS NOT NULL
   OR coalesce(_command->>'organizationalUnitId',o.organizational_unit_id::text) IS NOT NULL
   OR coalesce(_command->>'deliveryGroupId',o.delivery_group_id::text) IS NOT NULL THEN
   RAISE EXCEPTION 'B2B_DELIVERY_UNSUPPORTED';
 END IF;
 IF op='capture' THEN
   INSERT INTO public.orders(tenant_id,customer_id,week_start,total,notes,status,write_contract_version,revision,
     delivery_address_id,dietary_snapshot,demand_channel,company_id,site_id,organizational_unit_id,delivery_group_id)
   VALUES(_tenant_id,cid,week,0,_command->>'orderNotes',
     CASE WHEN coalesce((_command->>'autoConfirm')::boolean,false) THEN 'confirmed'::public.order_status ELSE 'draft'::public.order_status END,
     2,1,address.id,dietary,coalesce(_command->>'demandChannel','individual')::public.demand_channel,
     (_command->>'companyId')::uuid,(_command->>'siteId')::uuid,(_command->>'organizationalUnitId')::uuid,(_command->>'deliveryGroupId')::uuid)
   RETURNING * INTO o; oid:=o.id;
 END IF;
 IF op='modify' THEN
   IF _command ? 'companyId' THEN o.company_id:=(_command->>'companyId')::uuid; END IF;
   IF _command ? 'siteId' THEN o.site_id:=(_command->>'siteId')::uuid; END IF;
   IF _command ? 'organizationalUnitId' THEN o.organizational_unit_id:=(_command->>'organizationalUnitId')::uuid; END IF;
   IF _command ? 'deliveryGroupId' THEN o.delivery_group_id:=(_command->>'deliveryGroupId')::uuid; END IF;
   IF _command ? 'demandChannel' THEN o.demand_channel:=(_command->>'demandChannel')::public.demand_channel; END IF;
   IF _command ? 'deliveryAddressId' THEN o.delivery_address_id:=address.id; END IF;
 END IF;
 FOR line IN SELECT value FROM jsonb_array_elements(_command->'lines') LOOP
   IF jsonb_typeof(line) IS DISTINCT FROM 'object' OR line->>'kind' IS DISTINCT FROM 'dish' OR line ?| ARRAY['name','description','allergenState','allergensSnapshot','unitPrice','itemKind','item_kind'] THEN
     RAISE EXCEPTION 'CUSTOM_NOT_ENABLED'; END IF;
   FOR field,val IN SELECT * FROM jsonb_each(line) LOOP
     IF NOT field=ANY(ARRAY['kind','lineId','dishId','dayDate','qty','comment','unitPriceOverride','unitPriceOverrideReason','explicitZeroConfirmed','slotId']) THEN RAISE EXCEPTION 'UNTRUSTED_AUTHORITY_FIELD'; END IF;
     IF field='comment' AND (jsonb_typeof(val) NOT IN('string','null') OR length(line->>field)>2000) THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
     IF field='unitPriceOverrideReason' AND (jsonb_typeof(val)<>'string' OR length(btrim(line->>field))=0 OR length(line->>field)>2000) THEN RAISE EXCEPTION 'PRICE_OVERRIDE_REASON_REQUIRED'; END IF;
     IF field='explicitZeroConfirmed' AND jsonb_typeof(val)<>'boolean' THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
   END LOOP;
   IF line->>'dayDate' IS NULL OR (line->>'dayDate') !~ '^\d{4}-\d{2}-\d{2}$' THEN RAISE EXCEPTION 'DATE_INVALID'; END IF;
   day:=(line->>'dayDate')::date;
   IF day<week OR day>week+6 THEN RAISE EXCEPTION 'DATE_OUTSIDE_WEEK'; END IF;
   IF jsonb_typeof(line->'qty') IS DISTINCT FROM 'number' OR (line->>'qty') !~ '^[1-9][0-9]*$' THEN RAISE EXCEPTION 'QTY_INVALID'; END IF;
   v_qty:=(line->>'qty')::integer;
   SELECT * INTO d FROM public.dishes WHERE tenant_id=_tenant_id AND id=(line->>'dishId')::uuid
     AND deleted_at IS NULL AND status='active' FOR SHARE;
   IF NOT FOUND THEN RAISE EXCEPTION 'DISH_NOT_FOUND'; END IF;
   PERFORM 1 FROM public.weekly_menus m JOIN public.weekly_menu_slots s ON s.weekly_menu_id=m.id AND s.tenant_id=m.tenant_id
    WHERE m.tenant_id=_tenant_id AND m.week_start=week AND m.status::text='published' AND s.dish_id=d.id AND s.day_date=day FOR SHARE OF m,s;
   IF NOT FOUND THEN RAISE EXCEPTION 'DISH_NOT_OFFERED'; END IF;
   IF NOT EXISTS(SELECT 1 FROM public.weekly_menus m JOIN public.weekly_menu_slots s ON s.weekly_menu_id=m.id AND s.tenant_id=m.tenant_id
     WHERE m.tenant_id=_tenant_id AND m.week_start=week AND m.status::text='published'
       AND s.dish_id=d.id AND s.day_date=day) THEN RAISE EXCEPTION 'DISH_NOT_OFFERED'; END IF;
   IF EXISTS(SELECT 1 FROM public.weekly_menus m JOIN public.weekly_menu_slots s ON s.weekly_menu_id=m.id AND s.tenant_id=m.tenant_id
     WHERE m.tenant_id=_tenant_id AND m.week_start=week AND m.status::text='published'
       AND s.dish_id=d.id AND s.day_date=day AND s.unit_price IS NOT NULL) AND _trusted_quote IS NULL THEN RAISE EXCEPTION 'COMMERCIAL_QUOTE_REQUIRED'; END IF;
   old_item:=NULL;
   IF line ? 'lineId' THEN
     IF op<>'modify' THEN RAISE EXCEPTION 'LINE_ID_INVALID'; END IF;
     iid:=(line->>'lineId')::uuid;
     SELECT * INTO old_item FROM public.order_items WHERE tenant_id=_tenant_id AND order_id=oid AND id=iid AND deleted_at IS NULL FOR UPDATE;
     IF NOT FOUND OR old_item.dish_id<>d.id OR old_item.item_kind<>'dish' THEN RAISE EXCEPTION 'LINE_ID_INVALID'; END IF;
     IF iid=ANY(keep) THEN RAISE EXCEPTION 'LINE_ID_DUPLICATE'; END IF;
   ELSE iid:=gen_random_uuid(); END IF;
   PERFORM 1 FROM public.kitchen_production_batches b WHERE b.tenant_id=_tenant_id AND b.delivery_date=day AND b.dish_id=d.id FOR UPDATE;
   IF EXISTS(SELECT 1 FROM public.kitchen_production_batches b WHERE b.tenant_id=_tenant_id AND b.delivery_date=day AND b.dish_id=d.id AND b.status<>'pending') THEN RAISE EXCEPTION 'ORDER_OPERATIONALLY_LOCKED'; END IF;
   p:=cr_order_private.dish_write_price(_tenant_id,actor,line,d.price,old_item.unit_price,_trusted_quote);
   IF p=0 AND (old_item.id IS NULL OR line ? 'unitPriceOverride') AND line->'explicitZeroConfirmed' IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'EXPLICIT_ZERO_CONFIRMATION_REQUIRED'; END IF;
   IF old_item.id IS NOT NULL AND old_item.name_snapshot IS NULL THEN
     -- A historical v1 line cannot masquerade as a captured snapshot; replacement must be explicit.
     RAISE EXCEPTION 'HISTORICAL_LINE_REQUIRES_REPLACEMENT';
   END IF;
   IF old_item.id IS NULL THEN
     INSERT INTO public.order_items(id,tenant_id,order_id,dish_id,day_date,qty,comment,unit_price,price_snapshot_status,
       item_kind,name_snapshot,description_snapshot,allergen_state,allergens_snapshot,snapshot_captured_at,snapshot_author_id)
     VALUES(iid,_tenant_id,oid,d.id,day,v_qty,line->>'comment',p,CASE WHEN p=0 THEN 'explicit_zero' ELSE 'captured' END,
       'dish',d.name,d.description,CASE WHEN cardinality(coalesce(d.allergens,'{}'))=0 THEN 'UNKNOWN' ELSE 'DECLARED' END,
       coalesce(d.allergens,'{}'),captured,actor);
   ELSE
     UPDATE public.order_items SET day_date=day,qty=v_qty,comment=line->>'comment',unit_price=p,
       price_snapshot_status=CASE WHEN p=0 THEN 'explicit_zero' ELSE 'captured' END WHERE tenant_id=_tenant_id AND id=iid;
   END IF;
   IF line ? 'unitPriceOverride' THEN
     price_overrides:=price_overrides||jsonb_build_array(jsonb_build_object('orderItemId',iid,'dishId',d.id,
       'cataloguePrice',d.price,'previousUnitPrice',old_item.unit_price,'unitPrice',p,
       'reason',btrim(line->>'unitPriceOverrideReason')));
   END IF;
   keep:=array_append(keep,iid); grand:=grand+p*v_qty;
 END LOOP;
 UPDATE public.order_items SET deleted_at=captured WHERE tenant_id=_tenant_id AND order_id=oid AND deleted_at IS NULL AND NOT(id=ANY(keep));
 UPDATE public.orders SET total=round(grand,2),notes=CASE WHEN _command ? 'orderNotes' THEN _command->>'orderNotes' ELSE notes END,
   company_id=o.company_id,site_id=o.site_id,organizational_unit_id=o.organizational_unit_id,delivery_group_id=o.delivery_group_id,
   demand_channel=o.demand_channel,delivery_address_id=o.delivery_address_id,
   dietary_snapshot=CASE WHEN _command->'dietaryOverride' IS NOT NULL AND _command->'dietaryOverride'<>'null'::jsonb THEN dietary ELSE dietary_snapshot END,
   write_contract_version=2,revision=CASE WHEN op='capture' THEN 1 ELSE revision+1 END WHERE tenant_id=_tenant_id AND id=oid RETURNING * INTO o;
 -- Delivery derivatives participate in this transaction, including new-address/contact snapshots.
 UPDATE public.delivery_services SET deleted_at=captured,status='cancelled',issue_notes='Order items rescheduled' WHERE tenant_id=_tenant_id AND order_id=oid AND deleted_at IS NULL
   AND NOT(delivery_date IN(SELECT day_date FROM public.order_items WHERE tenant_id=_tenant_id AND order_id=oid AND deleted_at IS NULL));
 INSERT INTO public.delivery_services(tenant_id,order_id,customer_id,delivery_date,delivery_address_id,
   delivery_address_snapshot,customer_contact_snapshot,dietary_snapshot,delivery_instructions,legacy_backfill)
 SELECT _tenant_id,oid,cid,i.day_date,o.delivery_address_id,address_snapshot,
   jsonb_build_object('customerId',cid,'displayName',c.display_name,'email',c.email,'phone',phone),coalesce(o.dietary_snapshot,'{}'),
 coalesce(o.notes,(SELECT pref.value FROM public.customer_preferences pref WHERE pref.tenant_id=_tenant_id AND pref.customer_id=cid AND pref.key='delivery_notes' ORDER BY pref.id LIMIT 1)),false
 FROM public.order_items i WHERE i.tenant_id=_tenant_id AND i.order_id=oid AND i.deleted_at IS NULL GROUP BY i.day_date
 ON CONFLICT(tenant_id,order_id,delivery_date) DO UPDATE SET deleted_at=NULL,
  status=CASE WHEN public.delivery_services.deleted_at IS NOT NULL THEN 'pending' ELSE public.delivery_services.status END,
  delivery_instructions=EXCLUDED.delivery_instructions,
  delivery_address_id=CASE WHEN _command ? 'deliveryAddressId' THEN EXCLUDED.delivery_address_id ELSE public.delivery_services.delivery_address_id END,
  delivery_address_snapshot=CASE WHEN _command ? 'deliveryAddressId' THEN EXCLUDED.delivery_address_snapshot ELSE public.delivery_services.delivery_address_snapshot END,
  dietary_snapshot=CASE WHEN _command->'dietaryOverride' IS NOT NULL AND _command->'dietaryOverride'<>'null'::jsonb THEN EXCLUDED.dietary_snapshot ELSE public.delivery_services.dietary_snapshot END;
 SELECT coalesce(jsonb_agg(to_jsonb(i) ORDER BY i.id),'[]') INTO output_items FROM public.order_items i
 WHERE tenant_id=_tenant_id AND order_id=oid AND deleted_at IS NULL;
 INSERT INTO public.audit_log(tenant_id,actor_id,entity_type,entity_id,action,old_data,new_data)
 VALUES(_tenant_id,actor,'order',oid::text,'order.v2.'||op,jsonb_build_object('order',before_order,'items',before_items),
   jsonb_build_object('order',to_jsonb(o),'items',output_items,'requestId',_request_id,'inputHash',h,'priceOverrides',price_overrides));
 INSERT INTO public.order_write_requests(tenant_id,request_id,operation,input_hash,order_id,committed_revision)
 VALUES(_tenant_id,_request_id,op,h,oid,o.revision);
 RETURN jsonb_build_object('order',to_jsonb(o),'items',output_items,'committedRevision',o.revision,'replayed',false,'inputHash',h);
END $$;
ALTER FUNCTION cr_order_private.write_dish_v2(uuid,uuid,jsonb,uuid,jsonb) OWNER TO cr_order_writer;

CREATE FUNCTION public.cr_order_write_v2(_tenant_id uuid,_request_id uuid,_command jsonb) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT cr_order_private.write_dish_v2(_tenant_id,_request_id,_command,NULL,NULL)
$$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA cr_order_private FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION cr_order_private.actor(),cr_order_private.can_write(uuid),cr_order_private.is_staff(uuid)
 TO cr_order_writer;
GRANT EXECUTE ON FUNCTION cr_order_private.validate_profile(jsonb,boolean) TO cr_order_writer;
GRANT EXECUTE ON FUNCTION cr_order_private.dish_write_price(uuid,uuid,jsonb,numeric,numeric,jsonb) TO cr_order_writer;
GRANT EXECUTE ON FUNCTION cr_order_private.write_dish_v2(uuid,uuid,jsonb,uuid,jsonb) TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.cr_order_write_v2(uuid,uuid,jsonb) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.cr_order_write_v2(uuid,uuid,jsonb) TO authenticated;
-- Trigger functions require no caller EXECUTE privilege. API users never receive writer-role membership.
COMMENT ON FUNCTION public.cr_order_write_v2(uuid,uuid,jsonb) IS
 'ADR0102 A3 dish-only foundation. Staff catalogue/explicit override only; customer commercial flow requires M2. No custom activation.';
REVOKE CREATE ON SCHEMA cr_order_private FROM cr_order_writer;
COMMIT;
