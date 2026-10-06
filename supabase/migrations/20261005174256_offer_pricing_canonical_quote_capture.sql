-- Offer Pricing M2 / ADR0103. Files only; apply only after separately authorized preflight.
-- Depends on A3 20261005174218. No custom, catalogue/slot data edits or commercial allocation.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
CREATE TABLE cr_order_private.offer_quotes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES public.tenants(id),
 actor_id uuid NOT NULL REFERENCES auth.users(id), request_id uuid NOT NULL,
 command_hash text NOT NULL CHECK(command_hash ~ '^[0-9a-f]{64}$'),
 policy_hash text NOT NULL CHECK(policy_hash ~ '^[0-9a-f]{64}$'),
 lines jsonb NOT NULL CHECK(jsonb_typeof(lines)='array'), state jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL DEFAULT now()+interval '15 minutes'
);
ALTER TABLE cr_order_private.offer_quotes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON cr_order_private.offer_quotes FROM PUBLIC,anon,authenticated,service_role,cr_order_writer;
GRANT SELECT,INSERT,UPDATE ON cr_order_private.offer_quotes TO service_role;
-- UPDATE privilege permits row locks only; immutable trigger rejects actual updates/deletes.
CREATE FUNCTION cr_order_private.immutable_offer_quote() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$ BEGIN RAISE EXCEPTION 'QUOTE_IMMUTABLE'; END $$;
CREATE TRIGGER offer_quote_immutable BEFORE UPDATE OR DELETE ON cr_order_private.offer_quotes FOR EACH ROW EXECUTE FUNCTION cr_order_private.immutable_offer_quote();
REVOKE ALL ON FUNCTION cr_order_private.immutable_offer_quote() FROM PUBLIC,anon,authenticated,service_role;
-- Issued financial payload is immutable, including after expiry.
GRANT EXECUTE ON FUNCTION public.has_role(uuid,uuid,public.app_role), public.is_saas_admin(uuid) TO service_role;

CREATE FUNCTION cr_order_private.check_offer_actor(_tenant uuid,_actor uuid,_command jsonb) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE staff boolean; customer_user uuid; BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'service_role' OR _actor IS NULL OR _tenant IS NULL OR (auth.uid() IS NOT NULL AND auth.uid() IS DISTINCT FROM _actor) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 staff:=public.is_saas_admin(_actor) OR public.has_role(_actor,_tenant,'company_admin') OR public.has_role(_actor,_tenant,'operations_manager');
 IF NOT public.is_saas_admin(_actor) AND NOT EXISTS(SELECT 1 FROM public.tenant_members WHERE tenant_id=_tenant AND user_id=_actor AND status='approved' AND deleted_at IS NULL) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 IF NOT staff AND NOT public.has_role(_actor,_tenant,'customer') THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 IF _command->>'operation'='capture' THEN
   IF _command->'customer'->>'kind'='new' THEN
     IF NOT staff THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
   ELSIF _command->'customer'->>'kind'='existing' THEN
     SELECT user_id INTO customer_user FROM public.customers WHERE tenant_id=_tenant AND id=(_command->'customer'->>'id')::uuid AND deleted_at IS NULL;
     IF NOT FOUND OR (NOT staff AND customer_user IS DISTINCT FROM _actor) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
   ELSE RAISE EXCEPTION 'INPUT_INVALID'; END IF;
 ELSIF _command->>'operation'='modify' THEN
   SELECT c.user_id INTO customer_user FROM public.orders o JOIN public.customers c ON c.id=o.customer_id AND c.tenant_id=o.tenant_id
    WHERE o.tenant_id=_tenant AND o.id=(_command->>'orderId')::uuid AND o.deleted_at IS NULL AND c.deleted_at IS NULL;
   IF NOT FOUND OR (NOT staff AND customer_user IS DISTINCT FROM _actor) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 ELSE RAISE EXCEPTION 'INPUT_INVALID'; END IF;
 IF NOT staff AND (coalesce((_command->>'autoConfirm')::boolean,false) OR _command ? 'dietaryOverride') THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
END $$;

-- Lock the selected menu and all its slots; the menu FK blocks slot insert phantoms.
-- Active tenant/week uniqueness is already enforced by weekly_menus_tenant_week_start_ux.
CREATE FUNCTION cr_order_private.offer_state(_tenant uuid,_command jsonb,_commercial_active boolean) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE menu public.weekly_menus; slot public.weekly_menu_slots; dish public.dishes; old_item public.order_items;
 line jsonb; result jsonb:='[]'; candidates integer; p numeric; source text; BEGIN
 IF jsonb_typeof(_command->'lines') IS DISTINCT FROM 'array' OR jsonb_array_length(_command->'lines')=0 THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
 SELECT * INTO menu FROM public.weekly_menus WHERE tenant_id=_tenant AND week_start=(_command->>'weekStart')::date AND status='published' AND deleted_at IS NULL FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'OFFER_NOT_FOUND'; END IF;
 PERFORM id FROM public.weekly_menu_slots WHERE tenant_id=_tenant AND weekly_menu_id=menu.id ORDER BY id FOR UPDATE;
 FOR line IN SELECT * FROM jsonb_array_elements(_command->'lines') LOOP
  IF line->>'kind' IS DISTINCT FROM 'dish' OR line ?| ARRAY['unitPrice','price','commercialInactive','isExtra','unitPriceOverride'] THEN RAISE EXCEPTION 'OFFER_PRICING_OVERRIDE_UNSUPPORTED'; END IF;
  IF coalesce(line->>'qty','') !~ '^[1-9][0-9]*$' OR (line->>'dayDate')::date<menu.week_start OR (line->>'dayDate')::date>menu.week_start+6 THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
  SELECT * INTO dish FROM public.dishes WHERE tenant_id=_tenant AND id=(line->>'dishId')::uuid AND status='active' AND deleted_at IS NULL FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'OFFER_NOT_FOUND'; END IF;
  SELECT count(*) INTO candidates FROM public.weekly_menu_slots WHERE tenant_id=_tenant AND weekly_menu_id=menu.id AND dish_id=dish.id AND day_date=(line->>'dayDate')::date AND (NOT line ? 'slotId' OR id=(line->>'slotId')::uuid);
  IF candidates=0 THEN RAISE EXCEPTION 'OFFER_NOT_FOUND'; ELSIF candidates<>1 THEN RAISE EXCEPTION 'OFFER_AMBIGUOUS'; END IF;
  SELECT * INTO slot FROM public.weekly_menu_slots WHERE tenant_id=_tenant AND weekly_menu_id=menu.id AND dish_id=dish.id AND day_date=(line->>'dayDate')::date AND (NOT line ? 'slotId' OR id=(line->>'slotId')::uuid);
  IF _commercial_active AND slot.unit_price IS NOT NULL THEN RAISE EXCEPTION 'OFFER_PRICING_COMMERCIAL_UNSUPPORTED'; END IF;
  IF slot.unit_price IS NOT NULL AND (slot.unit_price<0 OR slot.unit_price IN ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric) OR slot.unit_price>99999999.9999 OR slot.unit_price<>round(slot.unit_price,4)) THEN RAISE EXCEPTION 'PRICE_UNAVAILABLE'; END IF;
  IF dish.price IS NULL OR dish.price<0 OR dish.price IN ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric) OR dish.price>99999999.9999 OR dish.price<>round(dish.price,4) THEN RAISE EXCEPTION 'PRICE_UNAVAILABLE'; END IF;
  p:=coalesce(slot.unit_price,dish.price); source:=CASE WHEN slot.unit_price IS NULL THEN 'catalogue' ELSE 'slot' END;
  old_item:=NULL;
  IF line ? 'lineId' THEN
    IF _command->>'operation'<>'modify' THEN RAISE EXCEPTION 'LINE_ID_INVALID'; END IF;
    SELECT * INTO old_item FROM public.order_items WHERE tenant_id=_tenant AND order_id=(_command->>'orderId')::uuid AND id=(line->>'lineId')::uuid AND dish_id=dish.id AND item_kind='dish' AND deleted_at IS NULL FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'LINE_ID_INVALID'; END IF;
    IF old_item.unit_price IS NULL OR old_item.price_snapshot_status NOT IN ('captured','explicit_zero') THEN RAISE EXCEPTION 'PRICE_UNAVAILABLE'; END IF;
    p:=old_item.unit_price; source:='captured_snapshot';
  END IF;
  IF p=0 AND old_item.id IS NULL THEN
    IF slot.unit_price IS NULL THEN RAISE EXCEPTION 'PRICE_UNAVAILABLE'; END IF;
    IF line->'explicitZeroConfirmed' IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'EXPLICIT_ZERO_CONFIRMATION_REQUIRED'; END IF;
  END IF;
  result:=result||jsonb_build_array(jsonb_build_object('slotId',slot.id,'menuId',menu.id,'dishId',dish.id,'dayDate',slot.day_date,'qty',(line->>'qty')::integer,'lineId',line->>'lineId',
    'basePrice',dish.price::text,'slotPrice',slot.unit_price::text,'unitPrice',p::text,'priceSource',source,
    'priceSnapshotStatus',CASE WHEN p=0 THEN 'explicit_zero' ELSE 'captured' END,
    'menuState',jsonb_build_object('weekStart',menu.week_start,'status',menu.status,'publishedAt',menu.published_at),
    'dishState',jsonb_build_object('name',dish.name,'description',dish.description,'allergens',dish.allergens,'status',dish.status,'price',dish.price,'deletedAt',dish.deleted_at)));
 END LOOP;
 RETURN result;
END $$;

CREATE FUNCTION public.cr_order_offer_quote_issue(_tenant_id uuid,_actor_id uuid,_request_id uuid,_command jsonb,_commercial_context jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE state jsonb; q cr_order_private.offer_quotes; h text; BEGIN
 PERFORM cr_order_private.check_offer_actor(_tenant_id,_actor_id,_command);
 IF _request_id IS NULL OR coalesce(_commercial_context->>'policyHash','') !~ '^[0-9a-f]{64}$' OR jsonb_typeof(_commercial_context->'active') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
 state:=cr_order_private.offer_state(_tenant_id,_command,(_commercial_context->>'active')::boolean);
 IF (_commercial_context->>'active')::boolean THEN
   IF EXISTS(SELECT 1 FROM jsonb_array_elements(state) l WHERE l->'slotPrice'<>'null'::jsonb) THEN RAISE EXCEPTION 'OFFER_PRICING_COMMERCIAL_UNSUPPORTED'; END IF;
   RAISE EXCEPTION 'COMMERCIAL_QUOTE_REQUIRED';
 END IF;
 h:=encode(sha256(convert_to(_command::text,'UTF8')),'hex');
 INSERT INTO cr_order_private.offer_quotes(tenant_id,actor_id,request_id,command_hash,policy_hash,lines,state)
 VALUES(_tenant_id,_actor_id,_request_id,h,_commercial_context->>'policyHash',state,state) RETURNING * INTO q;
 RETURN jsonb_build_object('quoteId',q.id,'expiresAt',q.expires_at,'lines',q.lines,'policyHash',q.policy_hash,'total',(SELECT round(sum((l->>'unitPrice')::numeric*(l->>'qty')::integer),2)::text FROM jsonb_array_elements(q.lines) l));
END $$;

CREATE OR REPLACE FUNCTION cr_order_private.dish_write_price(_tenant uuid,_actor uuid,_line jsonb,_catalogue_price numeric,_existing_price numeric,_trusted_quote jsonb)
RETURNS numeric LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE price numeric; count_lines integer; distinct_prices integer; BEGIN
 IF _trusted_quote IS NULL OR _trusted_quote->>'tenantId'<>_tenant::text OR _trusted_quote->>'actorId'<>_actor::text THEN RAISE EXCEPTION 'COMMERCIAL_QUOTE_REQUIRED'; END IF;
 SELECT count(*), count(DISTINCT jsonb_build_array(l->'slotId',l->'unitPrice',l->'priceSource')), max((l->>'unitPrice')::numeric)
 INTO count_lines,distinct_prices,price FROM jsonb_array_elements(_trusted_quote->'lines') l WHERE l->>'dishId'=_line->>'dishId' AND l->>'dayDate'=_line->>'dayDate' AND l->>'qty'=_line->>'qty' AND coalesce(l->>'lineId','')=coalesce(_line->>'lineId','') AND (NOT _line ? 'slotId' OR l->>'slotId'=_line->>'slotId');
 IF count_lines=0 OR distinct_prices<>1 THEN RAISE EXCEPTION 'OFFER_AMBIGUOUS'; END IF;
 -- Repeated identical financial lines may have separate comments; all matches must agree.
 IF _existing_price IS NOT NULL THEN RETURN _existing_price; END IF;
 RETURN price;
END $$;
GRANT CREATE ON SCHEMA cr_order_private TO cr_order_writer;
ALTER FUNCTION cr_order_private.dish_write_price(uuid,uuid,jsonb,numeric,numeric,jsonb) OWNER TO cr_order_writer;
REVOKE CREATE ON SCHEMA cr_order_private FROM cr_order_writer;

CREATE FUNCTION public.cr_order_offer_quote_commit(_tenant_id uuid,_actor_id uuid,_request_id uuid,_quote_id uuid,_command jsonb,_commercial_context jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE q cr_order_private.offer_quotes; trusted jsonb; state jsonb; result jsonb; hash text; request public.order_write_requests; BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(_tenant_id::text||':'||_request_id::text,0));
 PERFORM cr_order_private.check_offer_actor(_tenant_id,_actor_id,_command);
 IF _request_id IS NULL OR _quote_id IS NULL OR coalesce(_commercial_context->>'policyHash','') !~ '^[0-9a-f]{64}$' OR jsonb_typeof(_commercial_context->'active') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
 SELECT * INTO q FROM cr_order_private.offer_quotes WHERE id=_quote_id AND tenant_id=_tenant_id AND actor_id=_actor_id AND request_id=_request_id FOR SHARE;
 IF NOT FOUND OR q.command_hash<>encode(sha256(convert_to(_command::text,'UTF8')),'hex') THEN RAISE EXCEPTION 'QUOTE_INPUT_MISMATCH'; END IF;
 trusted:=jsonb_build_object('quoteId',q.id,'tenantId',q.tenant_id,'actorId',q.actor_id,'requestId',q.request_id,'commandHash',q.command_hash,'policyHash',q.policy_hash,'lines',q.lines);
 hash:=encode(sha256(convert_to(jsonb_build_object('actor',_actor_id,'command',_command,'trustedQuote',trusted)::text,'UTF8')),'hex');
 SELECT * INTO request FROM public.order_write_requests WHERE tenant_id=_tenant_id AND request_id=_request_id;
 IF FOUND THEN
   IF request.input_hash<>hash THEN RAISE EXCEPTION 'REQUEST_ID_CONFLICT'; END IF;
   RETURN cr_order_private.write_dish_v2(_tenant_id,_request_id,_command,_actor_id,trusted);
 END IF;
 IF q.expires_at<now() OR q.policy_hash IS DISTINCT FROM _commercial_context->>'policyHash' THEN RAISE EXCEPTION 'PRICE_CHANGED'; END IF;
 BEGIN
  state:=cr_order_private.offer_state(_tenant_id,_command,(_commercial_context->>'active')::boolean);
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM IN ('OFFER_NOT_FOUND','OFFER_AMBIGUOUS','PRICE_UNAVAILABLE') THEN RAISE EXCEPTION 'PRICE_CHANGED'; END IF;
  RAISE;
 END;
 IF (_commercial_context->>'active')::boolean THEN
   IF EXISTS(SELECT 1 FROM jsonb_array_elements(state) l WHERE l->'slotPrice'<>'null'::jsonb) THEN RAISE EXCEPTION 'OFFER_PRICING_COMMERCIAL_UNSUPPORTED'; END IF;
   RAISE EXCEPTION 'COMMERCIAL_QUOTE_REQUIRED';
 END IF;
 IF state IS DISTINCT FROM q.state THEN RAISE EXCEPTION 'PRICE_CHANGED'; END IF;
 result:=cr_order_private.write_dish_v2(_tenant_id,_request_id,_command,_actor_id,trusted);
 IF coalesce((result->>'replayed')::boolean,false) IS FALSE THEN
 INSERT INTO public.audit_log(tenant_id,actor_id,entity_type,entity_id,action,new_data)
 VALUES(_tenant_id,_actor_id,'order',result->'order'->>'id','order.offer.capture',jsonb_build_object('quoteId',q.id,'requestId',_request_id,'provenance',q.lines));
 END IF;
 RETURN result;
END $$;
-- No authenticated browser RPC can bypass a verified server quote after M2.
REVOKE EXECUTE ON FUNCTION public.cr_order_write_v2(uuid,uuid,jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION cr_order_private.write_dish_v2(uuid,uuid,jsonb,uuid,jsonb) FROM authenticated;
REVOKE ALL ON FUNCTION cr_order_private.check_offer_actor(uuid,uuid,jsonb),cr_order_private.offer_state(uuid,jsonb,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION cr_order_private.check_offer_actor(uuid,uuid,jsonb),cr_order_private.offer_state(uuid,jsonb,boolean) TO service_role;
REVOKE ALL ON FUNCTION public.cr_order_offer_quote_issue(uuid,uuid,uuid,jsonb,jsonb),public.cr_order_offer_quote_commit(uuid,uuid,uuid,uuid,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.cr_order_offer_quote_issue(uuid,uuid,uuid,jsonb,jsonb),public.cr_order_offer_quote_commit(uuid,uuid,uuid,uuid,jsonb,jsonb) TO service_role;
GRANT SELECT ON public.order_write_requests TO service_role;
-- service_role RLS bypass is backend-only; grants do not expose idempotency to clients.

CREATE FUNCTION cr_order_private.guard_legacy_offer() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE week date; version integer; n integer; explicit boolean; customer_user uuid; menu_id uuid; BEGIN
 SELECT week_start,write_contract_version INTO week,version FROM public.orders WHERE tenant_id=NEW.tenant_id AND id=NEW.order_id;
 -- Alphabetically prior cr_order_v2_item_guard rejects every non-core v2 mutation.
 IF version=2 THEN RETURN NEW; END IF;
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 IF NOT cr_order_private.can_write(NEW.tenant_id) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 SELECT c.user_id INTO customer_user FROM public.orders o JOIN public.customers c ON c.id=o.customer_id AND c.tenant_id=o.tenant_id WHERE o.tenant_id=NEW.tenant_id AND o.id=NEW.order_id AND c.deleted_at IS NULL;
 IF NOT FOUND OR (NOT cr_order_private.is_staff(NEW.tenant_id) AND customer_user IS DISTINCT FROM cr_order_private.actor()) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 IF TG_OP='UPDATE' AND NEW.dish_id IS NOT DISTINCT FROM OLD.dish_id AND NEW.day_date IS NOT DISTINCT FROM OLD.day_date AND NEW.qty IS NOT DISTINCT FROM OLD.qty AND NEW.unit_price IS NOT DISTINCT FROM OLD.unit_price AND NEW.price_snapshot_status IS NOT DISTINCT FROM OLD.price_snapshot_status AND NOT (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN RETURN NEW; END IF;
 SELECT id INTO menu_id FROM public.weekly_menus WHERE tenant_id=NEW.tenant_id AND week_start=week AND status='published' AND deleted_at IS NULL FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'OFFER_NOT_FOUND'; END IF;
 PERFORM id FROM public.weekly_menu_slots WHERE tenant_id=NEW.tenant_id AND weekly_menu_id=menu_id ORDER BY id FOR SHARE;
 PERFORM id FROM public.dishes WHERE tenant_id=NEW.tenant_id AND id=NEW.dish_id FOR SHARE;
 SELECT count(*),bool_or(s.unit_price IS NOT NULL) INTO n,explicit FROM public.weekly_menu_slots s JOIN public.weekly_menus m ON m.id=s.weekly_menu_id AND m.tenant_id=s.tenant_id JOIN public.dishes d ON d.id=s.dish_id AND d.tenant_id=s.tenant_id
 WHERE s.tenant_id=NEW.tenant_id AND m.week_start=week AND m.status='published' AND m.deleted_at IS NULL AND s.day_date=NEW.day_date AND s.dish_id=NEW.dish_id AND d.status='active' AND d.deleted_at IS NULL;
 IF n=0 THEN RAISE EXCEPTION 'OFFER_NOT_FOUND'; ELSIF n<>1 THEN RAISE EXCEPTION 'OFFER_AMBIGUOUS'; END IF;
 IF explicit THEN RAISE EXCEPTION 'OFFER_PRICING_QUOTE_REQUIRED'; END IF;
 RETURN NEW;
END $$;
GRANT CREATE ON SCHEMA cr_order_private TO cr_order_writer;
ALTER FUNCTION cr_order_private.guard_legacy_offer() OWNER TO cr_order_writer;
REVOKE CREATE ON SCHEMA cr_order_private FROM cr_order_writer;
CREATE TRIGGER order_items_legacy_offer_guard BEFORE INSERT OR UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION cr_order_private.guard_legacy_offer();
REVOKE ALL ON FUNCTION cr_order_private.guard_legacy_offer() FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
