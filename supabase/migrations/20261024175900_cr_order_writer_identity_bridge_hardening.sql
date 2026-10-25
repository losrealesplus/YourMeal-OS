-- Forward hardening: cr_order_writer identity bridge & decoupling from managed auth schema
-- Ensures zero direct auth.uid() invocations by cr_order_writer functions.
-- Idempotent and self-contained for environments where 20261011190421 was not registered.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SET LOCAL ROLE postgres;

-- 1. Ensure schema cr_order_private exists with secure boundaries
CREATE SCHEMA IF NOT EXISTS cr_order_private;
REVOKE ALL ON SCHEMA cr_order_private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA cr_order_private TO cr_order_writer, service_role;

-- 2. Define or replace the canonical session_uid_bridge() function
-- Owned by postgres (which has USAGE on auth and EXECUTE on auth.uid())
-- SECURITY DEFINER with empty search_path
CREATE OR REPLACE FUNCTION cr_order_private.session_uid_bridge() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT auth.uid() $$;

ALTER FUNCTION cr_order_private.session_uid_bridge() OWNER TO postgres;
REVOKE ALL ON FUNCTION cr_order_private.session_uid_bridge() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION cr_order_private.session_uid_bridge() TO cr_order_writer;

-- 3. Define or replace the canonical actor() routing function
-- Owned by postgres, SECURITY INVOKER
-- Resolves identity via session_uid_bridge() when called by cr_order_writer
CREATE OR REPLACE FUNCTION cr_order_private.actor() RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF current_user='cr_order_writer' THEN
  RETURN coalesce(cr_order_private.session_uid_bridge(),nullif(current_setting('cr_order.verified_actor',true),'')::uuid);
 END IF;
 RETURN auth.uid();
END $$;

ALTER FUNCTION cr_order_private.actor() OWNER TO postgres;
REVOKE ALL ON FUNCTION cr_order_private.actor() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION cr_order_private.actor() TO cr_order_writer;

-- 4. Define or replace can_operate_custom_batch(uuid)
CREATE OR REPLACE FUNCTION cr_order_private.can_operate_custom_batch(_tenant uuid) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE session_actor uuid;
BEGIN
 IF current_user='cr_order_writer' THEN
  session_actor:=cr_order_private.session_uid_bridge();
 ELSE
  session_actor:=auth.uid();
 END IF;
 RETURN session_actor IS NOT NULL
 AND EXISTS(SELECT 1 FROM public.tenant_members WHERE tenant_id=_tenant AND user_id=session_actor AND status='approved' AND deleted_at IS NULL)
 AND (public.has_role(session_actor,_tenant,'company_admin') OR public.has_role(session_actor,_tenant,'operations_manager') OR public.has_role(session_actor,_tenant,'kitchen'));
END $$;

ALTER FUNCTION cr_order_private.can_operate_custom_batch(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION cr_order_private.can_operate_custom_batch(uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION cr_order_private.can_operate_custom_batch(uuid) TO cr_order_writer;

-- 5. Update cr_order_private.guard_legacy_offer()
-- Owned by cr_order_writer, SECURITY DEFINER
-- Unconditionally uses session_uid_bridge() for all tenants (no hardcoded tenant checks)
CREATE OR REPLACE FUNCTION cr_order_private.guard_legacy_offer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 actor uuid; week date; version integer; n integer; explicit boolean;
 expected_price numeric; customer_user uuid; menu_id uuid;
BEGIN
 SELECT week_start,write_contract_version INTO week,version FROM public.orders WHERE tenant_id=NEW.tenant_id AND id=NEW.order_id;
 IF version=2 THEN RETURN NEW; END IF;

 actor:=cr_order_private.session_uid_bridge();
 IF actor IS NULL THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 IF NOT cr_order_private.can_write(NEW.tenant_id) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;

 SELECT c.user_id INTO customer_user FROM public.orders o JOIN public.customers c ON c.id=o.customer_id AND c.tenant_id=o.tenant_id WHERE o.tenant_id=NEW.tenant_id AND o.id=NEW.order_id AND c.deleted_at IS NULL;
 IF NOT FOUND OR (NOT cr_order_private.is_staff(NEW.tenant_id) AND customer_user IS DISTINCT FROM cr_order_private.actor()) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;

 IF TG_OP='UPDATE' AND NEW.dish_id IS NOT DISTINCT FROM OLD.dish_id AND NEW.day_date IS NOT DISTINCT FROM OLD.day_date AND NEW.qty IS NOT DISTINCT FROM OLD.qty AND NEW.unit_price IS NOT DISTINCT FROM OLD.unit_price AND NEW.price_snapshot_status IS NOT DISTINCT FROM OLD.price_snapshot_status AND NOT (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN RETURN NEW; END IF;

 SELECT id INTO menu_id FROM public.weekly_menus WHERE tenant_id=NEW.tenant_id AND week_start=week AND status='published' AND deleted_at IS NULL FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'OFFER_NOT_FOUND'; END IF;
 PERFORM id FROM public.weekly_menu_slots WHERE tenant_id=NEW.tenant_id AND weekly_menu_id=menu_id ORDER BY id FOR SHARE;
 PERFORM id FROM public.dishes WHERE tenant_id=NEW.tenant_id AND id=NEW.dish_id FOR SHARE;

 SELECT count(*),bool_or(s.unit_price IS NOT NULL),min(coalesce(s.unit_price, d.price))
 INTO n,explicit,expected_price
 FROM public.weekly_menu_slots s JOIN public.weekly_menus m ON m.id=s.weekly_menu_id AND m.tenant_id=s.tenant_id JOIN public.dishes d ON d.id=s.dish_id AND d.tenant_id=s.tenant_id
 WHERE s.tenant_id=NEW.tenant_id AND m.week_start=week AND m.status='published' AND m.deleted_at IS NULL AND s.day_date=NEW.day_date AND s.dish_id=NEW.dish_id AND d.status='active' AND d.deleted_at IS NULL;

 IF n=0 OR n IS NULL THEN RAISE EXCEPTION 'OFFER_NOT_FOUND'; ELSIF n>1 THEN RAISE EXCEPTION 'OFFER_AMBIGUOUS'; END IF;

 IF explicit THEN
  RAISE EXCEPTION 'OFFER_PRICING_QUOTE_REQUIRED';
 END IF;

 RETURN NEW;
END $$;

ALTER FUNCTION cr_order_private.guard_legacy_offer() OWNER TO cr_order_writer;
REVOKE ALL ON FUNCTION cr_order_private.guard_legacy_offer() FROM PUBLIC, anon, authenticated, service_role;

-- 6. Update cr_order_private.write_dish_v2
-- Replaces direct auth.uid() fallback with cr_order_private.actor()
CREATE OR REPLACE FUNCTION cr_order_private.write_dish_v2(
  _tenant_id uuid,
  _request_id uuid,
  _command jsonb,
  _verified_actor uuid DEFAULT NULL::uuid,
  _trusted_quote jsonb DEFAULT NULL::jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE actor uuid; staff boolean; op text; h text; req public.order_write_requests; o public.orders;
 c public.customers; d public.dishes; old_item public.order_items; line jsonb; cid uuid; oid uuid; iid uuid;
 week date; day date; v_qty integer; p numeric; grand numeric:=0; keep uuid[]:='{}';
 before_order jsonb; before_items jsonb; output_items jsonb; price_overrides jsonb:='[]'::jsonb; custom_confirmations jsonb:='[]'::jsonb; captured timestamptz:=statement_timestamp();
 source_item public.order_items; field text; val jsonb; phone text; address public.customer_addresses; profile public.customer_dietary_profiles; dietary jsonb; result jsonb; address_snapshot jsonb;
 is_off_menu boolean;
BEGIN
 IF _verified_actor IS NOT NULL THEN
   IF current_setting('role',true)<>'service_role' THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
   actor:=_verified_actor;
 ELSE actor:=cr_order_private.actor(); END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(_command->'lines') x WHERE x->>'kind'='custom') THEN PERFORM cr_order_private.require_custom(_tenant_id,actor); END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(_command->'lines') x WHERE coalesce((x->>'isOffMenu')::boolean, false)) THEN PERFORM cr_order_private.require_off_menu(_tenant_id,actor); END IF;
 IF actor IS NULL THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 PERFORM set_config('cr_order.verified_actor',actor::text,true);
 IF NOT cr_order_private.can_write(_tenant_id) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 staff:=cr_order_private.is_staff(_tenant_id);
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
   IF req.input_hash<>h THEN RAISE EXCEPTION 'REQUEST_HASH_MISMATCH'; END IF;
   SELECT * INTO o FROM public.orders WHERE tenant_id=_tenant_id AND id=req.order_id;
   SELECT coalesce(jsonb_agg(to_jsonb(i) ORDER BY i.id),'[]') INTO output_items FROM public.order_items i WHERE i.tenant_id=_tenant_id AND order_id=o.id AND deleted_at IS NULL;
   RETURN jsonb_build_object('order',to_jsonb(o),'items',output_items,'committedRevision',req.committed_revision,'replayed',true,'inputHash',h);
 END IF;
 week:=(_command->>'weekStart')::date;
 IF op='capture' THEN
   IF week IS NULL OR extract(isodow FROM week)<>1 THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
   IF NOT staff AND cr_order_private.is_weekly_order_cutoff_passed(_tenant_id, week) THEN
     RAISE EXCEPTION 'WEEKLY_ORDER_CUTOFF_PASSED';
   END IF;
   IF _command->'customer'->>'kind'='new' THEN
     IF NOT staff THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
     phone:=_command->'customer'->>'phone';
     IF phone IS NOT NULL AND length(phone)>50 THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
     INSERT INTO public.customers(tenant_id,display_name,email,phone)
     VALUES(_tenant_id,btrim(_command->'customer'->>'displayName'),btrim(_command->'customer'->>'email'),phone)
     RETURNING * INTO c;
     cid:=c.id;
   ELSE
     cid:=(_command->'customer'->>'id')::uuid;
     SELECT * INTO c FROM public.customers WHERE tenant_id=_tenant_id AND id=cid AND deleted_at IS NULL;
     IF NOT FOUND OR (NOT staff AND c.user_id IS DISTINCT FROM actor) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
   END IF;
   IF _command->'dietaryOverride' IS NOT NULL AND _command->'dietaryOverride'<>'null'::jsonb THEN
     dietary:=_command->'dietaryOverride';
   ELSE
     SELECT * INTO profile FROM public.customer_dietary_profiles WHERE tenant_id=_tenant_id AND customer_id=cid AND deleted_at IS NULL;
     IF FOUND THEN dietary:=profile.dietary_snapshot; ELSE dietary:=jsonb_build_object('capturedAt',captured,'authorUserId',actor,'isOverride',false,'overrideReason',NULL,
       'allergens','[]'::jsonb,'dietaryRequirements','[]'::jsonb,'notes',NULL); END IF;
   END IF;
   INSERT INTO public.orders(tenant_id,customer_id,status,delivery_address_id,week_start,notes,total,dietary_snapshot,write_contract_version,revision,
     demand_channel,company_id,site_id,organizational_unit_id,delivery_group_id)
   VALUES(_tenant_id,cid,'draft',(_command->>'deliveryAddressId')::uuid,week,_command->>'orderNotes',0,dietary,2,1,
     _command->>'demandChannel',(_command->>'companyId')::uuid,(_command->>'siteId')::uuid,(_command->>'organizationalUnitId')::uuid,(_command->>'deliveryGroupId')::uuid)
   RETURNING * INTO o;
   oid:=o.id;
 ELSE
   oid:=(_command->>'orderId')::uuid;
   SELECT * INTO o FROM public.orders WHERE tenant_id=_tenant_id AND id=oid FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
   IF o.revision<>coalesce((_command->>'expectedRevision')::integer,-1) THEN RAISE EXCEPTION 'REVISION_CONFLICT'; END IF;
   SELECT * INTO c FROM public.customers WHERE tenant_id=_tenant_id AND id=o.customer_id AND deleted_at IS NULL;
   IF NOT FOUND OR (NOT staff AND c.user_id IS DISTINCT FROM actor) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
   cid:=c.id;
   IF NOT staff AND cr_order_private.is_weekly_order_cutoff_passed(_tenant_id, o.week_start) THEN
     RAISE EXCEPTION 'WEEKLY_ORDER_CUTOFF_PASSED';
   END IF;
   IF _command ? 'deliveryAddressId' THEN o.delivery_address_id:=(_command->>'deliveryAddressId')::uuid; END IF;
   SELECT to_jsonb(o) INTO before_order;
   SELECT coalesce(jsonb_agg(to_jsonb(i) ORDER BY i.id),'[]') INTO before_items FROM public.order_items i WHERE i.tenant_id=_tenant_id AND order_id=oid AND deleted_at IS NULL;
   IF _command->'dietaryOverride' IS NOT NULL AND _command->'dietaryOverride'<>'null'::jsonb THEN
     dietary:=_command->'dietaryOverride';
   END IF;
   week:=o.week_start;
 END IF;
 IF o.delivery_address_id IS NOT NULL THEN
   SELECT * INTO address FROM public.customer_addresses WHERE tenant_id=_tenant_id AND id=o.delivery_address_id AND customer_id=cid AND deleted_at IS NULL;
   IF NOT FOUND THEN RAISE EXCEPTION 'ADDRESS_NOT_FOUND'; END IF;
   address_snapshot:=to_jsonb(address);
 END IF;
 FOR line IN SELECT * FROM jsonb_array_elements(_command->'lines') LOOP
   day:=(line->>'dayDate')::date;
   IF day IS NULL OR day<week OR day>week+INTERVAL '6 days' THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
   v_qty:=(line->>'qty')::integer;
   IF v_qty IS NULL OR v_qty<1 OR v_qty>99 THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
   iid:=CASE WHEN line ? 'id' THEN (line->>'id')::uuid ELSE gen_random_uuid() END;
   keep:=array_append(keep,iid);
   old_item:=NULL;
   IF op='modify' AND line ? 'id' THEN
     SELECT * INTO old_item FROM public.order_items WHERE tenant_id=_tenant_id AND order_id=oid AND id=iid AND deleted_at IS NULL;
     IF NOT FOUND THEN RAISE EXCEPTION 'ITEM_NOT_FOUND'; END IF;
   END IF;
   IF line->>'kind'='custom' THEN
     p:=cr_order_private.dish_write_price(_tenant_id,actor,line,0,old_item.unit_price,_trusted_quote);
     custom_confirmations:=custom_confirmations||jsonb_build_array(jsonb_build_object('lineId',iid,'dayDate',day,'confirmed',true,'customUnitGross',p));
     IF old_item.id IS NULL THEN
       INSERT INTO public.order_items(id,tenant_id,order_id,dish_id,day_date,qty,comment,unit_price,price_snapshot_status,item_kind,name_snapshot,description_snapshot,allergen_state,allergens,snapshot_captured_at,snapshot_author_id)
       VALUES(iid,_tenant_id,oid,NULL,day,v_qty,line->>'comment',p,CASE WHEN p=0 THEN 'explicit_zero' ELSE 'captured' END,'custom',btrim(line->>'name'),line->>'description','unspecified','[]',captured,actor);
     ELSE
       UPDATE public.order_items SET day_date=day,qty=v_qty,comment=line->>'comment',unit_price=p,price_snapshot_status=CASE WHEN p=0 THEN 'explicit_zero' ELSE 'captured' END,name_snapshot=btrim(line->>'name'),description_snapshot=line->>'description',snapshot_captured_at=captured,snapshot_author_id=actor WHERE tenant_id=_tenant_id AND id=iid;
     END IF;
     grand:=grand+p*v_qty;
   ELSIF line->>'kind'='dish' THEN
     SELECT * INTO d FROM public.dishes WHERE tenant_id=_tenant_id AND id=(line->>'dishId')::uuid;
     IF NOT FOUND THEN RAISE EXCEPTION 'DISH_NOT_FOUND'; END IF;
     is_off_menu := coalesce((line->>'isOffMenu')::boolean, false);
     IF NOT is_off_menu AND NOT EXISTS(
       SELECT 1 FROM public.weekly_menu_slots s JOIN public.weekly_menus m ON m.id=s.weekly_menu_id AND m.tenant_id=s.tenant_id
       WHERE s.tenant_id=_tenant_id AND m.week_start=week AND m.status='published' AND m.deleted_at IS NULL
         AND s.day_date=day AND s.dish_id=d.id AND d.status='active' AND d.deleted_at IS NULL
     ) THEN RAISE EXCEPTION 'OFFER_NOT_FOUND'; END IF;
     p:=cr_order_private.dish_write_price(_tenant_id,actor,line,d.price,old_item.unit_price,_trusted_quote);
     IF p IS DISTINCT FROM d.price THEN
       price_overrides:=price_overrides||jsonb_build_array(jsonb_build_object('lineId',iid,'dishId',d.id,'dayDate',day,'basePrice',d.price,'authorizedPrice',p));
     END IF;
     IF old_item.id IS NULL THEN
       INSERT INTO public.order_items(id,tenant_id,order_id,dish_id,day_date,qty,comment,unit_price,price_snapshot_status,item_kind,name_snapshot,description_snapshot,allergen_state,allergens,snapshot_captured_at,snapshot_author_id)
       VALUES(iid,_tenant_id,oid,d.id,day,v_qty,line->>'comment',p,CASE WHEN p=0 THEN 'explicit_zero' ELSE 'captured' END,
         'dish',d.name,d.description,coalesce(d.allergen_state,'unspecified'),coalesce(to_jsonb(d.allergens),'[]'),captured,actor);
     ELSE
       UPDATE public.order_items SET dish_id=d.id,day_date=day,qty=v_qty,comment=line->>'comment',unit_price=p,price_snapshot_status=CASE WHEN p=0 THEN 'explicit_zero' ELSE 'captured' END,
         name_snapshot=d.name,description_snapshot=d.description,allergen_state=coalesce(d.allergen_state,'unspecified'),allergens_snapshot=coalesce(to_jsonb(d.allergens),'[]'),
         snapshot_captured_at=captured,snapshot_author_id=actor WHERE tenant_id=_tenant_id AND id=iid;
     END IF;
     grand:=grand+p*v_qty;
   ELSE RAISE EXCEPTION 'INPUT_INVALID'; END IF;
 END LOOP;
 UPDATE public.order_items SET deleted_at=captured WHERE tenant_id=_tenant_id AND order_id=oid AND deleted_at IS NULL AND NOT id=ANY(keep);
 UPDATE public.orders SET total=grand,notes=_command->>'orderNotes',week_start=week,delivery_address_id=o.delivery_address_id,
   dietary_snapshot=CASE WHEN _command->'dietaryOverride' IS NOT NULL AND _command->'dietaryOverride'<>'null'::jsonb THEN dietary ELSE dietary_snapshot END,
   write_contract_version=2,revision=CASE WHEN op='capture' THEN 1 ELSE revision+1 END WHERE tenant_id=_tenant_id AND id=oid RETURNING * INTO o;
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
  delivery_address_id=excluded.delivery_address_id,delivery_address_snapshot=excluded.delivery_address_snapshot,
  customer_contact_snapshot=excluded.customer_contact_snapshot,dietary_snapshot=excluded.dietary_snapshot,
  delivery_instructions=excluded.delivery_instructions;
 IF op='capture' AND coalesce((_command->>'autoConfirm')::boolean,false) THEN
   INSERT INTO public.kitchen_production_batches(tenant_id,item_kind,dish_id,delivery_date,status,updated_by)
   SELECT _tenant_id,'dish',i.dish_id,i.day_date,'pending'::public.kitchen_batch_status,actor
     FROM public.order_items i WHERE i.tenant_id=_tenant_id AND i.order_id=oid AND i.deleted_at IS NULL AND i.item_kind='dish'
   ON CONFLICT (tenant_id, delivery_date, dish_id)
   DO UPDATE SET status=CASE WHEN public.kitchen_production_batches.status='pending' THEN 'pending' ELSE public.kitchen_production_batches.status END;

   INSERT INTO public.kitchen_production_batches(tenant_id,item_kind,custom_order_item_id,delivery_date,status,updated_by)
   SELECT _tenant_id,'custom',i.id,i.day_date,'pending'::public.kitchen_batch_status,actor
     FROM public.order_items i WHERE i.tenant_id=_tenant_id AND i.order_id=oid AND i.deleted_at IS NULL AND i.item_kind='custom'
   ON CONFLICT (tenant_id, delivery_date, custom_order_item_id) WHERE item_kind = 'custom'
   DO UPDATE SET status=CASE WHEN public.kitchen_production_batches.status='pending' THEN 'pending' ELSE public.kitchen_production_batches.status END;
 END IF;
 IF op='modify' THEN
   INSERT INTO public.audit_log(tenant_id,actor_id,entity_type,entity_id,action,old_data,new_data)
   VALUES(_tenant_id,actor,'order',oid,'order.modify',jsonb_build_object('order',before_order,'items',before_items),
     jsonb_build_object('order',to_jsonb(o),'items',output_items,'priceOverrides',price_overrides,'customConfirmations',custom_confirmations,'dietarySnapshot',o.dietary_snapshot,'deliveryAddressSnapshot',address_snapshot));
 ELSE
   INSERT INTO public.audit_log(tenant_id,actor_id,entity_type,entity_id,action,new_data)
   VALUES(_tenant_id,actor,'order',oid,'order.capture',
     jsonb_build_object('order',to_jsonb(o),'items',output_items,'priceOverrides',price_overrides,'customConfirmations',custom_confirmations,'dietarySnapshot',o.dietary_snapshot,'deliveryAddressSnapshot',address_snapshot));
 END IF;
 INSERT INTO public.order_write_requests(tenant_id,request_id,order_id,operation,input_hash,committed_revision)
 VALUES(_tenant_id,_request_id,oid,op,h,o.revision);
 SELECT coalesce(jsonb_agg(to_jsonb(i) ORDER BY i.id),'[]') INTO output_items FROM public.order_items i WHERE i.tenant_id=_tenant_id AND order_id=oid AND deleted_at IS NULL;
 RETURN jsonb_build_object('order',to_jsonb(o),'items',output_items,'committedRevision',o.revision,'replayed',false,'inputHash',h);
END $$;

ALTER FUNCTION cr_order_private.write_dish_v2(uuid,uuid,jsonb,uuid,jsonb) OWNER TO cr_order_writer;
REVOKE ALL ON FUNCTION cr_order_private.write_dish_v2(uuid,uuid,jsonb,uuid,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION cr_order_private.write_dish_v2(uuid,uuid,jsonb,uuid,jsonb) TO service_role;

-- 7. Update cr_order_private.offer_state
-- Replaces direct auth.uid() fallback with cr_order_private.actor()
CREATE OR REPLACE FUNCTION cr_order_private.offer_state(
  _tenant uuid,
  _command jsonb,
  _commercial_mode text
) RETURNS jsonb LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE
  menu public.weekly_menus;
  slot public.weekly_menu_slots;
  dish public.dishes;
  old_item public.order_items;
  line jsonb;
  result jsonb:='[]';
  candidates integer;
  p numeric;
  source text;
  mode text;
  cust_id uuid;
  is_off_menu boolean;
BEGIN
  mode := coalesce(_commercial_mode, 'commercial_inactive');
  IF jsonb_typeof(_command->'lines')<>'array' OR jsonb_array_length(_command->'lines')=0 THEN
    RAISE EXCEPTION 'INPUT_INVALID';
  END IF;

  FOR line IN SELECT * FROM jsonb_array_elements(_command->'lines') LOOP
    IF jsonb_typeof(line)<>'object' OR NOT line ? 'kind' THEN
      RAISE EXCEPTION 'INPUT_INVALID';
    END IF;

    IF line->>'kind' = 'custom' THEN
      PERFORM cr_order_private.require_custom(_tenant, cr_order_private.actor());
      result := result || jsonb_build_array(jsonb_build_object(
        'slotId', NULL,
        'menuId', NULL,
        'dishId', NULL,
        'dayDate', (line->>'dayDate')::date,
        'qty', (line->>'qty')::integer,
        'lineId', line->>'lineId',
        'basePrice', (line->>'unitPrice')::text,
        'slotPrice', NULL,
        'unitPrice', (line->>'unitPrice')::text,
        'priceSource', 'custom',
        'priceSnapshotStatus', CASE WHEN (line->>'unitPrice')::numeric=0 THEN 'explicit_zero' ELSE 'captured' END,
        'isOffMenu', false,
        'menuState', NULL,
        'dishState', NULL
      ));
      CONTINUE;
    END IF;

    IF line->>'kind' <> 'dish' THEN
      RAISE EXCEPTION 'INPUT_INVALID';
    END IF;

    is_off_menu := coalesce((line->>'isOffMenu')::boolean, false);
    IF is_off_menu THEN
      PERFORM cr_order_private.require_off_menu(_tenant, cr_order_private.actor());
      SELECT * INTO dish FROM public.dishes
      WHERE tenant_id=_tenant AND id=(line->>'dishId')::uuid AND status='active' AND deleted_at IS NULL;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'OFFER_NOT_FOUND';
      END IF;

      result := result || jsonb_build_array(jsonb_build_object(
        'slotId', NULL,
        'menuId', NULL,
        'dishId', dish.id,
        'dayDate', (line->>'dayDate')::date,
        'qty', (line->>'qty')::integer,
        'lineId', line->>'lineId',
        'basePrice', dish.price::text,
        'slotPrice', NULL,
        'unitPrice', dish.price::text,
        'priceSource', 'off_menu',
        'priceSnapshotStatus', CASE WHEN dish.price=0 THEN 'explicit_zero' ELSE 'captured' END,
        'isOffMenu', true,
        'menuState', NULL,
        'dishState', jsonb_build_object('name', dish.name, 'description', dish.description, 'allergens', dish.allergens, 'status', dish.status, 'price', dish.price, 'deletedAt', dish.deleted_at)
      ));
      CONTINUE;
    END IF;

    SELECT * INTO menu FROM public.weekly_menus
    WHERE tenant_id=_tenant AND week_start=(_command->>'weekStart')::date AND status='published' AND deleted_at IS NULL;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'OFFER_NOT_FOUND';
    END IF;

    SELECT count(*) INTO candidates FROM public.weekly_menu_slots s JOIN public.dishes d ON d.id=s.dish_id AND d.tenant_id=s.tenant_id
    WHERE s.tenant_id=_tenant AND s.weekly_menu_id=menu.id AND s.day_date=(line->>'dayDate')::date AND s.dish_id=(line->>'dishId')::uuid AND d.status='active' AND d.deleted_at IS NULL;

    IF candidates = 0 THEN
      RAISE EXCEPTION 'OFFER_NOT_FOUND';
    ELSIF candidates > 1 THEN
      RAISE EXCEPTION 'OFFER_AMBIGUOUS';
    END IF;

    SELECT s.* INTO slot FROM public.weekly_menu_slots s JOIN public.dishes d ON d.id=s.dish_id AND d.tenant_id=s.tenant_id
    WHERE s.tenant_id=_tenant AND s.weekly_menu_id=menu.id AND s.day_date=(line->>'dayDate')::date AND s.dish_id=(line->>'dishId')::uuid AND d.status='active' AND d.deleted_at IS NULL;

    SELECT * INTO dish FROM public.dishes WHERE tenant_id=_tenant AND id=slot.dish_id;

    IF mode = 'weekly_plan' THEN
      IF slot.unit_price IS NOT NULL THEN
        p := slot.unit_price;
        source := 'slot';
      ELSE
        p := dish.price;
        source := 'dish';
      END IF;
    ELSE
      IF slot.unit_price IS NOT NULL THEN
        RAISE EXCEPTION 'COMMERCIAL_QUOTE_REQUIRED';
      END IF;
      p := dish.price;
      source := 'dish';
    END IF;

    IF p = 0 AND coalesce((line->>'explicitZeroConfirmed')::boolean, false) IS NOT TRUE THEN
      RAISE EXCEPTION 'EXPLICIT_ZERO_CONFIRMATION_REQUIRED';
    END IF;

    result := result || jsonb_build_array(jsonb_build_object(
      'slotId', slot.id,
      'menuId', menu.id,
      'dishId', dish.id,
      'dayDate', slot.day_date,
      'qty', (line->>'qty')::integer,
      'lineId', line->>'lineId',
      'basePrice', dish.price::text,
      'slotPrice', slot.unit_price::text,
      'unitPrice', p::text,
      'priceSource', source,
      'priceSnapshotStatus', CASE WHEN p=0 THEN 'explicit_zero' ELSE 'captured' END,
      'isOffMenu', false,
      'menuState', jsonb_build_object('weekStart', menu.week_start, 'status', menu.status, 'publishedAt', menu.published_at),
      'dishState', jsonb_build_object('name', dish.name, 'description', dish.description, 'allergens', dish.allergens, 'status', dish.status, 'price', dish.price, 'deletedAt', dish.deleted_at)
    ));
  END LOOP;
  RETURN result;
END $$;

ALTER FUNCTION cr_order_private.offer_state(uuid,jsonb,text) OWNER TO cr_order_writer;
REVOKE ALL ON FUNCTION cr_order_private.offer_state(uuid,jsonb,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION cr_order_private.offer_state(uuid,jsonb,text) TO service_role;

-- 8. Post-verification: ensure 0 functions owned by cr_order_writer reference auth.uid() directly
DO $$
DECLARE
  v_direct_calls integer;
  v_bridge_owner text;
  v_bridge_secdef boolean;
BEGIN
  SELECT pg_get_userbyid(p.proowner), p.prosecdef
  INTO v_bridge_owner, v_bridge_secdef
  FROM pg_proc p
  WHERE p.oid = 'cr_order_private.session_uid_bridge()'::regprocedure;

  IF v_bridge_owner IS DISTINCT FROM 'postgres' OR NOT v_bridge_secdef THEN
    RAISE EXCEPTION 'POSTCHECK_FAILED: session_uid_bridge must be SECURITY DEFINER and owned by postgres';
  END IF;

  IF NOT has_function_privilege('cr_order_writer', 'cr_order_private.session_uid_bridge()', 'EXECUTE') THEN
    RAISE EXCEPTION 'POSTCHECK_FAILED: cr_order_writer missing EXECUTE on session_uid_bridge';
  END IF;

  IF has_function_privilege('anon', 'cr_order_private.session_uid_bridge()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'cr_order_private.session_uid_bridge()', 'EXECUTE') THEN
    RAISE EXCEPTION 'POSTCHECK_FAILED: unexpected EXECUTE on session_uid_bridge for public/anon/authenticated';
  END IF;

  SELECT count(*) INTO v_direct_calls
  FROM pg_proc p
  WHERE pg_get_userbyid(p.proowner) = 'cr_order_writer'
    AND p.prosrc ILIKE '%auth.uid%';

  IF v_direct_calls > 0 THEN
    RAISE EXCEPTION 'POSTCHECK_FAILED: % functions owned by cr_order_writer still reference auth.uid directly', v_direct_calls;
  END IF;
END $$;

COMMIT;
