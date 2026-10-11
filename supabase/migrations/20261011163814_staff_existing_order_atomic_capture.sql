-- P0 staff intake for existing customers. Local preparation only.
-- INVOKER: retain all table RLS and existing guards, including auth USAGE prerequisite.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
CREATE FUNCTION public.capture_staff_existing_order(_tenant_id uuid, _command jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
 actor uuid := auth.uid(); resolved_customer_id uuid; week date; line jsonb;
 customer public.customers; dish public.dishes; header public.orders;
 menu public.weekly_menus; profile public.customer_dietary_profiles;
 selected_company_id uuid; selected_site_id uuid; selected_unit_id uuid; channel public.demand_channel;
 quantity integer; price numeric; applied_total numeric := 0; items jsonb := '[]';
 snapshot jsonb; overrides jsonb; field text; override_used boolean := false;
BEGIN
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
 -- Same lock order as the legacy offer guard: menu, slots, dishes.
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
 -- Build dietary snapshot from current tenant data; never accept a caller-supplied author/snapshot.
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
 -- Header, every line, and optional confirmation are one transaction. No compensation DELETE.
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
  price := dish.price;
  IF line ? 'unitPriceOverride' AND line->'unitPriceOverride'<>'null'::jsonb THEN
   IF jsonb_typeof(line->'unitPriceOverride')<>'number' THEN RAISE EXCEPTION 'STAFF_ORDER_PRICE_INVALID'; END IF;
   price := (line->>'unitPriceOverride')::numeric;
  END IF;
  IF price IS NULL OR price::text IN ('NaN','Infinity','-Infinity') OR price<0 OR price<>round(price,4) OR price>99999999.9999 THEN RAISE EXCEPTION 'STAFF_ORDER_PRICE_INVALID'; END IF;
  -- Trigger validates published offer, uniqueness and rejects quote-only pricing.
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
REVOKE ALL ON FUNCTION public.capture_staff_existing_order(uuid,jsonb) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.capture_staff_existing_order(uuid,jsonb) TO authenticated;
COMMENT ON FUNCTION public.capture_staff_existing_order(uuid,jsonb) IS 'Atomic legacy staff intake, existing customer only; INVOKER RLS, no V2/A5 activation.';
COMMIT;
