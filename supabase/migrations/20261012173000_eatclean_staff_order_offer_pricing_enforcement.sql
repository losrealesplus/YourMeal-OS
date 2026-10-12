-- EatClean server offer pricing enforcement & atomic staff capture.
-- Preserves V2 canonical quote contract: legacy writers cannot write explicit offers.
-- Only authorized administrative intake (capture_staff_existing_order) can write published offer prices.
-- Preserves existing authenticated EXECUTE privileges without revocation side effects.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
SET LOCAL ROLE postgres;

-- 1. Tighten DDL privileges on orders and order_items:
-- Explicitly revoke TRIGGER and TRUNCATE from anon and authenticated to seal privilege boundaries.
REVOKE TRIGGER, TRUNCATE ON public.orders, public.order_items FROM anon, authenticated;

-- 2. Update cr_order_private.guard_legacy_offer()
-- PRESERVE V2 CONTRACT & ELIMINATE STACK PARSING:
-- Any direct legacy writer attempting to write an explicit offer (unit_price IS NOT NULL)
-- is strictly rejected with OFFER_PRICING_QUOTE_REQUIRED. Explicit offer pricing requires
-- the canonical V2 quote engine (cr_order_offer_quote_issue & cr_order_offer_quote_commit).
CREATE OR REPLACE FUNCTION cr_order_private.guard_legacy_offer() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
 actor uuid; week date; version integer; n integer; explicit boolean;
 expected_price numeric; customer_user uuid; menu_id uuid;
BEGIN
 SELECT week_start,write_contract_version INTO week,version FROM public.orders WHERE tenant_id=NEW.tenant_id AND id=NEW.order_id;
 IF version=2 THEN RETURN NEW; END IF;

 IF NEW.tenant_id='8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid THEN
  actor:=cr_order_private.session_uid_bridge();
 ELSE
  actor:=auth.uid();
 END IF;
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
  -- Direct legacy writes of explicit offers are strictly blocked.
  -- Authoritative commercial offer pricing must flow through canonical V2 engine.
  RAISE EXCEPTION 'OFFER_PRICING_QUOTE_REQUIRED';
 END IF;

 RETURN NEW;
END $$;

GRANT CREATE ON SCHEMA cr_order_private TO cr_order_writer;
ALTER FUNCTION cr_order_private.guard_legacy_offer() OWNER TO cr_order_writer;
REVOKE CREATE ON SCHEMA cr_order_private FROM cr_order_writer;
REVOKE ALL ON FUNCTION cr_order_private.guard_legacy_offer() FROM PUBLIC,anon,authenticated,service_role;

-- 2. Update public.capture_staff_existing_order()
-- Authoritative server pricing: resolves slot price from weekly_menu_slots, validates overrides, prevents tampering.
CREATE OR REPLACE FUNCTION public.capture_staff_existing_order(_tenant_id uuid, _command jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
 actor uuid := auth.uid(); resolved_customer_id uuid; week date; line jsonb;
 customer public.customers; dish public.dishes; header public.orders;
 menu public.weekly_menus; slot public.weekly_menu_slots; profile public.customer_dietary_profiles;
 selected_company_id uuid; selected_site_id uuid; selected_unit_id uuid; channel public.demand_channel;
 quantity integer; price numeric; expected_price numeric; applied_total numeric := 0; items jsonb := '[]';
 snapshot jsonb; overrides jsonb; field text; override_used boolean := false;
 slot_count integer;
BEGIN
 IF _tenant_id IS DISTINCT FROM '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid THEN
  RAISE EXCEPTION 'STAFF_ORDER_TENANT_NOT_ENABLED' USING ERRCODE='42501';
 END IF;
 IF actor IS NULL OR _tenant_id IS NULL OR NOT public.is_tenant_member(_tenant_id)
 OR NOT (public.has_role(actor,_tenant_id,'company_admin')
      OR public.has_role(actor,_tenant_id,'operations_manager')) THEN
  RAISE EXCEPTION 'STAFF_ORDER_PERMISSION_DENIED' USING ERRCODE='42501';
 END IF;
 IF jsonb_typeof(_command) IS DISTINCT FROM 'object'
 OR jsonb_typeof(_command->'lines') IS DISTINCT FROM 'array' THEN
  RAISE EXCEPTION 'STAFF_ORDER_INPUT_INVALID';
 END IF;
 IF jsonb_array_length(_command->'lines')=0 THEN RAISE EXCEPTION 'STAFF_ORDER_LINES_REQUIRED'; END IF;
 resolved_customer_id := (_command->>'customerId')::uuid;
 week := (_command->>'weekStart')::date;
 IF week IS NULL THEN RAISE EXCEPTION 'STAFF_ORDER_WEEK_REQUIRED'; END IF;
 SELECT * INTO customer FROM public.customers c
 WHERE c.tenant_id=_tenant_id AND c.id=resolved_customer_id AND c.deleted_at IS NULL FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'STAFF_ORDER_CUSTOMER_NOT_FOUND'; END IF;
 SELECT * INTO menu FROM public.weekly_menus m
 WHERE m.tenant_id=_tenant_id AND m.week_start=week AND m.status='published' AND m.deleted_at IS NULL FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'OFFER_NOT_FOUND'; END IF;
 PERFORM s.id FROM public.weekly_menu_slots s WHERE s.tenant_id=_tenant_id AND s.weekly_menu_id=menu.id ORDER BY s.id FOR SHARE;
 PERFORM d.id FROM public.dishes d WHERE d.tenant_id=_tenant_id
 AND d.id IN (SELECT (l->>'dishId')::uuid FROM jsonb_array_elements(_command->'lines') l) ORDER BY d.id FOR SHARE;
 channel := coalesce(_command->>'demandChannel','individual')::public.demand_channel;
 IF channel='company' THEN
  selected_company_id := (_command->>'companyId')::uuid;
  selected_site_id := (_command->>'siteId')::uuid;
  selected_unit_id := (_command->>'organizationalUnitId')::uuid;
  IF selected_company_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.companies c WHERE c.tenant_id=_tenant_id AND c.id=selected_company_id AND c.deleted_at IS NULL) THEN
   RAISE EXCEPTION 'STAFF_ORDER_COMPANY_INVALID';
  END IF;
  IF selected_site_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.company_locations s WHERE s.tenant_id=_tenant_id AND s.id=selected_site_id AND s.company_id=selected_company_id AND s.deleted_at IS NULL) THEN
   RAISE EXCEPTION 'STAFF_ORDER_SITE_INVALID';
  END IF;
  IF selected_unit_id IS NOT NULL AND (selected_site_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.company_departments u WHERE u.tenant_id=_tenant_id AND u.id=selected_unit_id AND u.company_location_id=selected_site_id AND u.deleted_at IS NULL)) THEN
   RAISE EXCEPTION 'STAFF_ORDER_UNIT_INVALID';
  END IF;
 ELSIF channel<>'individual' OR _command->>'companyId' IS NOT NULL OR _command->>'siteId' IS NOT NULL OR _command->>'organizationalUnitId' IS NOT NULL THEN
  RAISE EXCEPTION 'STAFF_ORDER_COMPANY_CONTEXT_INVALID';
 END IF;

 SELECT * INTO profile FROM public.customer_dietary_profiles p
 WHERE p.tenant_id=_tenant_id AND p.customer_id=resolved_customer_id FOR SHARE;
 snapshot := jsonb_build_object('allergens',coalesce(to_jsonb(profile.allergens),'[]'),
  'customAllergens',coalesce(to_jsonb(profile.custom_allergens),'[]'),
  'restrictions',coalesce(to_jsonb(profile.restrictions),'[]'),
  'preferences',coalesce(to_jsonb(profile.preferences),'[]'), 'dietaryNotes',profile.dietary_notes);
 overrides := _command->'dietaryOverride';
 IF overrides IS NOT NULL AND overrides<>'null'::jsonb THEN
  IF jsonb_typeof(overrides)<>'object' THEN RAISE EXCEPTION 'STAFF_ORDER_DIETARY_INVALID'; END IF;
  FOREACH field IN ARRAY ARRAY['allergens','customAllergens','restrictions','preferences'] LOOP
   IF overrides ? field THEN
    IF jsonb_typeof(overrides->field)<>'array' OR EXISTS(SELECT 1 FROM jsonb_array_elements(overrides->field) a WHERE jsonb_typeof(a)<>'string') THEN
     RAISE EXCEPTION 'STAFF_ORDER_DIETARY_INVALID';
    END IF;
    snapshot := jsonb_set(snapshot,ARRAY[field],overrides->field); override_used := true;
   END IF;
  END LOOP;
  IF overrides ? 'dietaryNotes' THEN
   IF jsonb_typeof(overrides->'dietaryNotes') NOT IN ('string','null') THEN RAISE EXCEPTION 'STAFF_ORDER_DIETARY_INVALID'; END IF;
   snapshot := jsonb_set(snapshot,'{dietaryNotes}',overrides->'dietaryNotes'); override_used := true;
  END IF;
  IF override_used AND length(btrim(coalesce(overrides->>'overrideReason',''))) < 5 THEN RAISE EXCEPTION 'STAFF_ORDER_DIETARY_REASON_REQUIRED'; END IF;
 END IF;
 IF snapshot->'allergens'='[]' AND snapshot->'customAllergens'='[]' AND snapshot->'restrictions'='[]' AND snapshot->'preferences'='[]'
 AND coalesce(btrim(snapshot->>'dietaryNotes'),'')='' THEN snapshot := NULL;
 ELSE snapshot := snapshot || jsonb_build_object('capturedAt',clock_timestamp(),'authorUserId',actor,'isOverride',override_used,
  'overrideReason',CASE WHEN override_used THEN btrim(overrides->>'overrideReason') ELSE NULL END); END IF;

 INSERT INTO public.orders(tenant_id,customer_id,week_start,status,total,notes,dietary_snapshot,demand_channel,company_id,site_id,organizational_unit_id)
 VALUES(_tenant_id,resolved_customer_id,week,'draft',0,nullif(btrim(_command->>'orderNotes'),''),snapshot,channel,selected_company_id,selected_site_id,selected_unit_id)
 RETURNING * INTO header;

 FOR line IN SELECT * FROM jsonb_array_elements(_command->'lines') LOOP
  IF jsonb_typeof(line)<>'object' OR jsonb_typeof(line->'qty') IS DISTINCT FROM 'number'
  OR coalesce(line->>'qty','') !~ '^[1-9][0-9]*$' THEN RAISE EXCEPTION 'STAFF_ORDER_QUANTITY_INVALID'; END IF;
  quantity := (line->>'qty')::integer;
  IF (line->>'dayDate')::date IS NULL OR (line->>'dayDate')::date < week OR (line->>'dayDate')::date > week+6 THEN RAISE EXCEPTION 'STAFF_ORDER_DAY_INVALID'; END IF;
  SELECT * INTO dish FROM public.dishes d WHERE d.tenant_id=_tenant_id AND d.id=(line->>'dishId')::uuid AND d.status='active' AND d.deleted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'OFFER_NOT_FOUND'; END IF;

  SELECT count(*) INTO slot_count FROM public.weekly_menu_slots s
  WHERE s.tenant_id=_tenant_id AND s.weekly_menu_id=menu.id AND s.dish_id=dish.id AND s.day_date=(line->>'dayDate')::date;
  IF slot_count=0 THEN RAISE EXCEPTION 'OFFER_NOT_FOUND'; ELSIF slot_count<>1 THEN RAISE EXCEPTION 'OFFER_AMBIGUOUS'; END IF;

  SELECT * INTO slot FROM public.weekly_menu_slots s
  WHERE s.tenant_id=_tenant_id AND s.weekly_menu_id=menu.id AND s.dish_id=dish.id AND s.day_date=(line->>'dayDate')::date;

  expected_price := coalesce(slot.unit_price, dish.price);
  IF expected_price IS NULL OR expected_price<0 OR expected_price::text IN ('NaN','Infinity','-Infinity') OR expected_price<>round(expected_price,4) THEN
   RAISE EXCEPTION 'STAFF_ORDER_PRICE_INVALID';
  END IF;

  IF line ? 'unitPriceOverride' AND line->'unitPriceOverride'<>'null'::jsonb THEN
   IF jsonb_typeof(line->'unitPriceOverride')<>'number' THEN RAISE EXCEPTION 'STAFF_ORDER_PRICE_INVALID'; END IF;
   price := (line->>'unitPriceOverride')::numeric;
   IF price IS DISTINCT FROM expected_price THEN
    RAISE EXCEPTION 'STAFF_ORDER_PRICE_MISMATCH';
   END IF;
  ELSE
   price := expected_price;
  END IF;

  INSERT INTO public.order_items(tenant_id,order_id,dish_id,day_date,qty,comment,unit_price,price_snapshot_status)
  VALUES(_tenant_id,header.id,dish.id,(line->>'dayDate')::date,quantity,nullif(btrim(line->>'comment'),''),price,
   CASE WHEN price=0 THEN 'explicit_zero' ELSE 'captured' END);
 END LOOP;

 SELECT round(sum(i.unit_price*i.qty),2),jsonb_agg(to_jsonb(i) ORDER BY i.day_date,i.id) INTO applied_total,items
 FROM public.order_items i WHERE i.tenant_id=_tenant_id AND i.order_id=header.id AND i.deleted_at IS NULL;
 IF applied_total IS NULL OR jsonb_array_length(items)<>jsonb_array_length(_command->'lines') THEN RAISE EXCEPTION 'STAFF_ORDER_INCOMPLETE'; END IF;
 UPDATE public.orders o SET total=applied_total WHERE o.tenant_id=_tenant_id AND o.id=header.id RETURNING * INTO header;
 IF coalesce((_command->>'autoConfirm')::boolean,false) THEN
  UPDATE public.orders o SET status='confirmed' WHERE o.tenant_id=_tenant_id AND o.id=header.id RETURNING * INTO header;
 END IF;
 IF header.id IS NULL THEN RAISE EXCEPTION 'STAFF_ORDER_HEADER_NOT_VISIBLE'; END IF;
 INSERT INTO public.audit_log(tenant_id,actor_id,entity_type,entity_id,action,new_data)
 VALUES(_tenant_id,actor,'order',header.id,'create',jsonb_build_object('source','admin','itemsCount',jsonb_array_length(items),'autoConfirm',header.status='confirmed','appliedTotal',header.total));
 RETURN jsonb_build_object('order',to_jsonb(header),'items',items,'customerId',resolved_customer_id,'isNewCustomer',false,'total',header.total);
END $$;

COMMENT ON FUNCTION public.capture_staff_existing_order(uuid,jsonb) IS 'EatClean-only atomic legacy staff intake with server-authoritative offer pricing; INVOKER RLS.';

-- 3. Update lifecycle identity checks to use cr_order_private.actor() (session_uid_bridge)
-- Under cr_order_writer, auth.uid() fails if schema auth USAGE is ungranted; actor() bridges seamlessly.
CREATE OR REPLACE FUNCTION cr_order_private.lifecycle_member(_tenant uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT cr_order_private.actor() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = _tenant AND user_id = cr_order_private.actor()
      AND status = 'approved' AND deleted_at IS NULL
  )
$$;

CREATE OR REPLACE FUNCTION cr_order_private.lifecycle_staff(_tenant uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT cr_order_private.lifecycle_member(_tenant) AND (
    public.has_role(cr_order_private.actor(), _tenant, 'company_admin')
    OR public.has_role(cr_order_private.actor(), _tenant, 'operations_manager')
    OR public.is_saas_admin(cr_order_private.actor())
  )
$$;

CREATE OR REPLACE FUNCTION cr_order_private.lifecycle_operator(_tenant uuid, _domain text) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT cr_order_private.lifecycle_member(_tenant) AND (
    cr_order_private.lifecycle_staff(_tenant)
    OR CASE _domain
      WHEN 'kitchen' THEN public.has_role(cr_order_private.actor(), _tenant, 'kitchen')
      WHEN 'production' THEN public.has_role(cr_order_private.actor(), _tenant, 'production')
      WHEN 'logistics' THEN public.has_role(cr_order_private.actor(), _tenant, 'logistics')
        OR public.has_role(cr_order_private.actor(), _tenant, 'delivery')
        OR public.has_role(cr_order_private.actor(), _tenant, 'driver')
      ELSE false END
  )
$$;

-- 4. POST-MIGRATION ACL PRESERVATION ASSERTION
-- Ensure authenticated retains EXECUTE on capture_staff_existing_order (no accidental revocation)
DO $$
BEGIN
 IF NOT has_function_privilege('authenticated', 'public.capture_staff_existing_order(uuid,jsonb)', 'EXECUTE') THEN
  RAISE EXCEPTION 'POST_MIGRATION_ACL_REGRESSION: authenticated MUST retain EXECUTE on capture_staff_existing_order';
 END IF;
END $$;

COMMIT;
