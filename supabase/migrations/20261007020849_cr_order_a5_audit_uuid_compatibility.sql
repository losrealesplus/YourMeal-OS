-- A5 compatibility prerequisite: UUID audit identities. No business rule or historical migration changes.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
GRANT CREATE ON SCHEMA cr_order_private TO cr_order_writer;
SELECT set_config('cr_order.a5_migration_actor',current_user,true);
SET LOCAL ROLE cr_order_writer;
CREATE OR REPLACE FUNCTION cr_order_private.write_dish_v2(_tenant_id uuid,_request_id uuid,_command jsonb,
 _verified_actor uuid DEFAULT NULL,_trusted_quote jsonb DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql
SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid; staff boolean; op text; h text; req public.order_write_requests; o public.orders;
 c public.customers; d public.dishes; old_item public.order_items; line jsonb; cid uuid; oid uuid; iid uuid;
 week date; day date; v_qty integer; p numeric; grand numeric:=0; keep uuid[]:='{}';
 before_order jsonb; before_items jsonb; output_items jsonb; price_overrides jsonb:='[]'::jsonb; custom_confirmations jsonb:='[]'::jsonb; captured timestamptz:=statement_timestamp();
 source_item public.order_items; field text; val jsonb; phone text; address public.customer_addresses; profile public.customer_dietary_profiles; dietary jsonb; result jsonb; address_snapshot jsonb;
BEGIN
 IF _verified_actor IS NOT NULL THEN
   IF current_setting('role',true)<>'service_role' THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
   actor:=_verified_actor;
 ELSE actor:=auth.uid(); END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(_command->'lines') x WHERE x->>'kind'='custom') THEN PERFORM cr_order_private.require_custom(_tenant_id,actor); END IF;
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
     SELECT 'cr-order-day:'||_tenant_id||':'||to_char((x->>'dayDate')::date,'YYYY-MM-DD')||':'||CASE WHEN x->>'kind'='custom' THEN 'custom:'||coalesce(x->>'lineId',_request_id::text) ELSE 'dish:'||(x->>'dishId')::uuid END AS key
       FROM jsonb_array_elements(_command->'lines') x
     UNION ALL
     SELECT 'cr-order-day:'||i.tenant_id||':'||to_char(i.day_date,'YYYY-MM-DD')||':'||CASE WHEN i.item_kind='custom' THEN 'custom:'||i.id ELSE 'dish:'||i.dish_id END FROM public.order_items i
       WHERE op='modify' AND i.tenant_id=_tenant_id AND i.order_id=(_command->>'orderId')::uuid AND i.deleted_at IS NULL
   ) keys ORDER BY key
 ) sorted_keys;
 IF op='modify' THEN
   oid:=(_command->>'orderId')::uuid;
   SELECT * INTO o FROM public.orders WHERE tenant_id=_tenant_id AND id=oid AND deleted_at IS NULL FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
   IF EXISTS(SELECT 1 FROM public.order_items WHERE tenant_id=_tenant_id AND order_id=oid AND item_kind='custom' AND deleted_at IS NULL) THEN PERFORM cr_order_private.require_custom(_tenant_id,actor); END IF;
   IF NOT (_command ? 'expectedRevision') OR jsonb_typeof(_command->'expectedRevision')<>'number'
     OR (_command->>'expectedRevision') !~ '^\d+$' THEN RAISE EXCEPTION 'REVISION_REQUIRED'; END IF;
   IF o.revision<>(_command->>'expectedRevision')::integer THEN RAISE EXCEPTION 'STALE_REVISION'; END IF;
   IF o.week_start<>week THEN RAISE EXCEPTION 'WEEK_IMMUTABLE'; END IF;
   IF o.status::text NOT IN('draft','confirmed','in_production','prepared') THEN RAISE EXCEPTION 'ORDER_CLOSED'; END IF;
   PERFORM 1 FROM public.delivery_services s WHERE s.tenant_id=_tenant_id AND s.order_id=oid AND s.deleted_at IS NULL FOR UPDATE;
   PERFORM 1 FROM public.kitchen_production_batches b JOIN public.order_items i ON i.tenant_id=b.tenant_id AND i.day_date=b.delivery_date AND ((i.item_kind='dish' AND b.item_kind='dish' AND i.dish_id=b.dish_id) OR (i.item_kind='custom' AND b.item_kind='custom' AND i.id=b.custom_order_item_id))
     WHERE i.tenant_id=_tenant_id AND i.order_id=oid AND i.deleted_at IS NULL FOR UPDATE OF b;
   IF EXISTS(SELECT 1 FROM public.delivery_services s WHERE s.tenant_id=_tenant_id AND s.order_id=oid
     AND s.deleted_at IS NULL AND s.status::text NOT IN('pending')) OR EXISTS(
     SELECT 1 FROM public.order_items i JOIN public.kitchen_production_batches b ON b.tenant_id=i.tenant_id
       AND b.delivery_date=i.day_date AND ((i.item_kind='dish' AND b.item_kind='dish' AND b.dish_id=i.dish_id) OR (i.item_kind='custom' AND b.item_kind='custom' AND b.custom_order_item_id=i.id))
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
   IF line->>'kind'='custom' THEN
     FOR field,val IN SELECT * FROM jsonb_each(line) LOOP
       IF NOT field=ANY(ARRAY['kind','lineId','name','description','dayDate','qty','unitPrice','explicitZeroConfirmed','comment','repeatConfirmation']) THEN RAISE EXCEPTION 'UNTRUSTED_AUTHORITY_FIELD'; END IF;
       IF field IN('description','comment') AND (jsonb_typeof(val) NOT IN('string','null') OR length(line->>field)>2000) THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
     END LOOP;
     IF jsonb_typeof(line->'name') IS DISTINCT FROM 'string' OR length(btrim(line->>'name')) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'CUSTOM_NAME_INVALID'; END IF;
     IF jsonb_typeof(line->'unitPrice') IS DISTINCT FROM 'string' OR (line->>'unitPrice') !~ '^(0|[1-9][0-9]{0,7})(\.[0-9]{1,4})?$' THEN RAISE EXCEPTION 'PRICE_INVALID'; END IF;
     p:=(line->>'unitPrice')::numeric;
     IF p=0 AND line->'explicitZeroConfirmed' IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'EXPLICIT_ZERO_CONFIRMATION_REQUIRED'; END IF;
     IF line ? 'explicitZeroConfirmed' AND jsonb_typeof(line->'explicitZeroConfirmed')<>'boolean' THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
     IF coalesce(line->>'dayDate','') !~ '^\d{4}-\d{2}-\d{2}$' THEN RAISE EXCEPTION 'DATE_INVALID'; END IF;
     day:=(line->>'dayDate')::date;
     IF day<week OR day>week+6 THEN RAISE EXCEPTION 'DATE_OUTSIDE_WEEK'; END IF;
     IF jsonb_typeof(line->'qty') IS DISTINCT FROM 'number' OR (line->>'qty') !~ '^[1-9][0-9]*$' THEN RAISE EXCEPTION 'QTY_INVALID'; END IF;
     v_qty:=(line->>'qty')::integer;
     old_item:=NULL;
     IF line ? 'lineId' THEN
       IF op<>'modify' THEN RAISE EXCEPTION 'LINE_ID_INVALID'; END IF;
       iid:=(line->>'lineId')::uuid;
       SELECT * INTO old_item FROM public.order_items WHERE tenant_id=_tenant_id AND order_id=oid AND id=iid AND item_kind='custom' AND deleted_at IS NULL FOR UPDATE;
       IF NOT FOUND THEN RAISE EXCEPTION 'LINE_ID_INVALID'; END IF;
       IF iid=ANY(keep) THEN RAISE EXCEPTION 'LINE_ID_DUPLICATE'; END IF;
     ELSE iid:=gen_random_uuid(); END IF;
     IF line ? 'repeatConfirmation' THEN
       val:=line->'repeatConfirmation';
       IF jsonb_typeof(val) IS DISTINCT FROM 'object' OR val->'availabilityConfirmed' IS DISTINCT FROM 'true'::jsonb OR val->'preparationConfirmed' IS DISTINCT FROM 'true'::jsonb OR val->'priceConfirmed' IS DISTINCT FROM 'true'::jsonb OR NOT (val ? 'sourceOrderItemId') OR (val-ARRAY['sourceOrderItemId','availabilityConfirmed','preparationConfirmed','priceConfirmed','confirmedName','confirmedDescription','confirmedQuantity','confirmedDayDate','confirmedUnitPrice'])<>'{}'::jsonb THEN RAISE EXCEPTION 'CUSTOM_REPEAT_CONFIRMATION_REQUIRED'; END IF;
       SELECT * INTO source_item FROM public.order_items WHERE tenant_id=_tenant_id AND id=(val->>'sourceOrderItemId')::uuid AND item_kind='custom' FOR SHARE;
       IF NOT FOUND THEN RAISE EXCEPTION 'CUSTOM_REPEAT_SOURCE_INVALID'; END IF;
       IF val->>'confirmedName' IS DISTINCT FROM line->>'name' OR val->'confirmedDescription' IS DISTINCT FROM coalesce(line->'description','null'::jsonb) OR val->'confirmedQuantity' IS DISTINCT FROM line->'qty' OR val->>'confirmedDayDate' IS DISTINCT FROM line->>'dayDate' OR val->>'confirmedUnitPrice' IS DISTINCT FROM line->>'unitPrice' THEN RAISE EXCEPTION 'CUSTOM_REPEAT_CONFIRMATION_REQUIRED'; END IF;
     END IF;
     PERFORM 1 FROM public.kitchen_production_batches WHERE tenant_id=_tenant_id AND custom_order_item_id=iid AND item_kind='custom' FOR UPDATE;
     IF EXISTS(SELECT 1 FROM public.kitchen_production_batches WHERE tenant_id=_tenant_id AND custom_order_item_id=iid AND status<>'pending') THEN RAISE EXCEPTION 'ORDER_OPERATIONALLY_LOCKED'; END IF;
     IF old_item.id IS NULL THEN
       INSERT INTO public.order_items(id,tenant_id,order_id,dish_id,day_date,qty,comment,unit_price,price_snapshot_status,item_kind,name_snapshot,description_snapshot,allergen_state,allergens_snapshot,snapshot_captured_at,snapshot_author_id)
       VALUES(iid,_tenant_id,oid,NULL,day,v_qty,line->>'comment',p,CASE WHEN p=0 THEN 'explicit_zero' ELSE 'captured' END,'custom',btrim(line->>'name'),line->>'description','UNKNOWN','{}',captured,actor);
     ELSE
       UPDATE public.order_items SET day_date=day,qty=v_qty,comment=line->>'comment',unit_price=p,price_snapshot_status=CASE WHEN p=0 THEN 'explicit_zero' ELSE 'captured' END,name_snapshot=btrim(line->>'name'),description_snapshot=line->>'description',snapshot_captured_at=captured,snapshot_author_id=actor WHERE tenant_id=_tenant_id AND id=iid;
     END IF;
     custom_confirmations:=custom_confirmations||jsonb_build_array(jsonb_build_object('orderItemId',iid,'unitPrice',p::text,'explicitZeroConfirmed',coalesce(line->'explicitZeroConfirmed','false'::jsonb),'repeatConfirmation',line->'repeatConfirmation'));
     keep:=array_append(keep,iid); grand:=grand+p*v_qty;
     CONTINUE;
   END IF;
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
 VALUES(_tenant_id,actor,'order',oid,'order.v2.'||op,jsonb_build_object('order',before_order,'items',before_items),
   jsonb_build_object('order',to_jsonb(o),'items',output_items,'requestId',_request_id,'inputHash',h,'priceOverrides',price_overrides,'customConfirmations',custom_confirmations));
 INSERT INTO public.order_write_requests(tenant_id,request_id,operation,input_hash,order_id,committed_revision)
 VALUES(_tenant_id,_request_id,op,h,oid,o.revision);
 RETURN jsonb_build_object('order',to_jsonb(o),'items',output_items,'committedRevision',o.revision,'replayed',false,'inputHash',h);
END $$;

CREATE OR REPLACE FUNCTION cr_order_private.custom_batch_transition(_tenant_id uuid,_order_item_id uuid,_delivery_date date,_to_status text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE item public.order_items; order_row public.orders; batch public.kitchen_production_batches; allowed text; BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'authenticated' OR NOT cr_order_private.can_operate_custom_batch(_tenant_id) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 IF NOT EXISTS(SELECT 1 FROM cr_order_private.custom_activation WHERE tenant_id=_tenant_id AND enabled) THEN RAISE EXCEPTION 'CUSTOM_NOT_ENABLED'; END IF;
 IF _to_status IS NULL OR _to_status NOT IN('pending','preparing','plating','finished') THEN RAISE EXCEPTION 'BATCH_TRANSITION_INVALID'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('cr-order-day:'||_tenant_id||':'||to_char(_delivery_date,'YYYY-MM-DD')||':custom:'||_order_item_id,0));
 SELECT * INTO item FROM public.order_items WHERE tenant_id=_tenant_id AND id=_order_item_id AND day_date=_delivery_date AND item_kind='custom' AND deleted_at IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'CUSTOM_BATCH_ITEM_INVALID'; END IF;
 SELECT * INTO order_row FROM public.orders WHERE tenant_id=_tenant_id AND id=item.order_id AND deleted_at IS NULL FOR UPDATE;
 IF NOT FOUND OR order_row.status::text NOT IN('confirmed','in_production','prepared') THEN RAISE EXCEPTION 'ORDER_CLOSED'; END IF;
 SELECT * INTO batch FROM public.kitchen_production_batches WHERE tenant_id=_tenant_id AND custom_order_item_id=_order_item_id AND delivery_date=_delivery_date AND item_kind='custom' FOR UPDATE;
 IF NOT FOUND THEN
  IF _to_status NOT IN('pending','preparing') THEN RAISE EXCEPTION 'BATCH_TRANSITION_INVALID'; END IF;
  INSERT INTO public.kitchen_production_batches(tenant_id,item_kind,dish_id,custom_order_item_id,delivery_date,status,updated_by,started_at)
  VALUES(_tenant_id,'custom',NULL,_order_item_id,_delivery_date,_to_status::public.kitchen_batch_status,auth.uid(),CASE WHEN _to_status='preparing' THEN now() END) RETURNING * INTO batch;
 ELSE
  allowed:=CASE batch.status::text WHEN 'pending' THEN 'preparing' WHEN 'preparing' THEN 'plating' WHEN 'plating' THEN 'finished' END;
  IF _to_status=batch.status::text THEN RETURN to_jsonb(batch); END IF;
  IF _to_status IS DISTINCT FROM allowed THEN RAISE EXCEPTION 'BATCH_TRANSITION_INVALID'; END IF;
  UPDATE public.kitchen_production_batches SET status=_to_status::public.kitchen_batch_status,updated_by=auth.uid(),started_at=CASE WHEN _to_status='preparing' THEN now() ELSE started_at END,finished_at=CASE WHEN _to_status='finished' THEN now() ELSE finished_at END WHERE id=batch.id AND tenant_id=_tenant_id RETURNING * INTO batch;
 END IF;
 INSERT INTO public.audit_log(tenant_id,actor_id,entity_type,entity_id,action,new_data) VALUES(_tenant_id,auth.uid(),'kitchen_batch',batch.id,'custom.batch.transition',jsonb_build_object('orderItemId',_order_item_id,'status',_to_status,'deliveryDate',_delivery_date));
 RETURN to_jsonb(batch);
END $$;

SELECT set_config('role',current_setting('cr_order.a5_migration_actor'),true);
REVOKE CREATE ON SCHEMA cr_order_private FROM cr_order_writer;
CREATE OR REPLACE FUNCTION public.cr_order_offer_quote_commit(
  _tenant_id uuid,
  _actor_id uuid,
  _request_id uuid,
  _quote_id uuid,
  _command jsonb,
  _commercial_context jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE
  q cr_order_private.offer_quotes;
  trusted jsonb;
  state jsonb;
  result jsonb;
  hash text;
  request public.order_write_requests;
  mode text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(_tenant_id::text||':'||_request_id::text, 0));
  PERFORM cr_order_private.check_offer_actor(_tenant_id, _actor_id, _command);
  IF _request_id IS NULL OR _quote_id IS NULL OR coalesce(_commercial_context->>'policyHash','') !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'INPUT_INVALID';
  END IF;

  SELECT * INTO q FROM cr_order_private.offer_quotes
   WHERE id=_quote_id AND tenant_id=_tenant_id AND actor_id=_actor_id AND request_id=_request_id
   FOR SHARE;
  IF NOT FOUND OR q.command_hash <> encode(sha256(convert_to(_command::text, 'UTF8')), 'hex') THEN
    RAISE EXCEPTION 'QUOTE_INPUT_MISMATCH';
  END IF;

  trusted := jsonb_build_object('quoteId', q.id, 'tenantId', q.tenant_id, 'actorId', q.actor_id, 'requestId', q.request_id, 'commandHash', q.command_hash, 'policyHash', q.policy_hash, 'lines', q.lines);
  hash := encode(sha256(convert_to(jsonb_build_object('actor', _actor_id, 'command', _command, 'trustedQuote', trusted)::text, 'UTF8')), 'hex');

  SELECT * INTO request FROM public.order_write_requests WHERE tenant_id=_tenant_id AND request_id=_request_id;
  IF FOUND THEN
    IF request.input_hash <> hash THEN RAISE EXCEPTION 'REQUEST_ID_CONFLICT'; END IF;
    RETURN cr_order_private.write_dish_v2(_tenant_id, _request_id, _command, _actor_id, trusted);
  END IF;

  IF q.expires_at < now() OR q.policy_hash IS DISTINCT FROM _commercial_context->>'policyHash' THEN
    RAISE EXCEPTION 'PRICE_CHANGED';
  END IF;

  mode := coalesce(
    _commercial_context->>'mode',
    CASE WHEN coalesce((_commercial_context->>'active')::boolean, false) THEN 'weekly_plan' ELSE 'commercial_inactive' END
  );

  BEGIN
    state := cr_order_private.offer_state(_tenant_id, _command, mode);
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM IN ('OFFER_NOT_FOUND', 'OFFER_AMBIGUOUS', 'PRICE_UNAVAILABLE') THEN
      RAISE EXCEPTION 'PRICE_CHANGED';
    END IF;
    RAISE;
  END;

  IF state IS DISTINCT FROM q.state THEN
    RAISE EXCEPTION 'PRICE_CHANGED';
  END IF;

  result := cr_order_private.write_dish_v2(_tenant_id, _request_id, _command, _actor_id, trusted);

  IF coalesce((result->>'replayed')::boolean, false) IS FALSE THEN
    INSERT INTO public.audit_log(tenant_id, actor_id, entity_type, entity_id, action, new_data)
    VALUES(_tenant_id, _actor_id, 'order', (result->'order'->>'id')::uuid, 'order.offer.capture', jsonb_build_object('quoteId', q.id, 'requestId', _request_id, 'provenance', q.lines));
  END IF;

  RETURN result;
END $$;


COMMIT;
