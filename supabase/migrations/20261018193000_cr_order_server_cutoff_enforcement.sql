-- CR-ORDER / P0: Server-Side Weekly Order Cutoff Enforcement & Multi-Tenant Schedule Isolation
-- Authoritative PostgreSQL enforcement for weekly order cutoff rules across all order capture,
-- modification, quote issue, quote commit, and draft confirmation write paths.
--
-- Security Invariants:
--   1. Authoritative DB Gate: Non-staff writes (quotes, commits, drafts, status changes)
--      are rejected with 'WEEKLY_ORDER_CUTOFF_PASSED' if the weekly order cutoff has elapsed.
--   2. Multi-Tenant Schedule Isolation: Platform default applies no restrictive cutoff (NULL)
--      and full 7-day operations. EatClean operational cutoff (Friday 14:00 Atlantic/Canary)
--      is explicitly configured per-tenant in cr_order_private.tenant_order_schedule.
--   3. Authorized Staff Exception: saas_admin, company_admin, and operations_manager retain
--      operational override authority to capture, modify, and confirm orders past cutoff.
--   4. Zero Production Drift: Tested exclusively on local PostgreSQL environment.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- 1. Create table cr_order_private.tenant_order_schedule
CREATE TABLE IF NOT EXISTS cr_order_private.tenant_order_schedule (
  tenant_id uuid PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  timezone text NOT NULL DEFAULT 'Europe/Madrid',
  cutoff_day integer NULL CHECK (cutoff_day IS NULL OR (cutoff_day BETWEEN 1 AND 7)),
  cutoff_time time NOT NULL DEFAULT '23:59:00',
  active_delivery_days integer[] NOT NULL DEFAULT '{1,2,3,4,5,6,7}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cr_order_private.tenant_order_schedule ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON cr_order_private.tenant_order_schedule FROM PUBLIC, anon, authenticated;
GRANT SELECT ON cr_order_private.tenant_order_schedule TO cr_order_writer, service_role, authenticated;

DROP POLICY IF EXISTS tenant_order_schedule_read ON cr_order_private.tenant_order_schedule;
CREATE POLICY tenant_order_schedule_read ON cr_order_private.tenant_order_schedule
  FOR SELECT TO cr_order_writer, service_role, authenticated USING (true);

-- Grant SELECT on public.tenants to cr_order_writer for fallback timezone lookups
GRANT SELECT ON public.tenants TO cr_order_writer;
DROP POLICY IF EXISTS cr_order_tenants_read ON public.tenants;
CREATE POLICY cr_order_tenants_read ON public.tenants FOR SELECT TO cr_order_writer USING (true);

-- 2. Seed explicit configuration for EatClean tenant instances
INSERT INTO cr_order_private.tenant_order_schedule (
  tenant_id,
  timezone,
  cutoff_day,
  cutoff_time,
  active_delivery_days
)
SELECT id, 'Atlantic/Canary', 5, '14:00:00'::time, '{1,2,3,4,5}'::integer[]
FROM public.tenants
WHERE id = '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid OR slug IN ('eatclean', 'eatclean-staging', 'eatclean-tenerife')
ON CONFLICT (tenant_id) DO UPDATE SET
  timezone = EXCLUDED.timezone,
  cutoff_day = EXCLUDED.cutoff_day,
  cutoff_time = EXCLUDED.cutoff_time,
  active_delivery_days = EXCLUDED.active_delivery_days,
  updated_at = now();

-- 3. Pure helper function: cr_order_private.is_weekly_order_cutoff_passed
CREATE OR REPLACE FUNCTION cr_order_private.is_weekly_order_cutoff_passed(
  _tenant_id uuid,
  _week_start date,
  _check_at timestamptz DEFAULT statement_timestamp()
) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE
  v_tz text := 'Europe/Madrid';
  v_cutoff_day integer := NULL;
  v_cutoff_time time := '23:59:00'::time;
  v_cutoff_date date;
  v_cutoff_ts timestamptz;
  v_cal_monday date;
  v_tenant_now timestamp;
BEGIN
  IF _week_start IS NULL OR _tenant_id IS NULL THEN
    RETURN false;
  END IF;

  -- Extract tenant schedule config
  SELECT timezone, cutoff_day, cutoff_time
    INTO v_tz, v_cutoff_day, v_cutoff_time
    FROM cr_order_private.tenant_order_schedule
   WHERE tenant_id = _tenant_id;

  IF NOT FOUND THEN
    SELECT coalesce(timezone, 'Europe/Madrid') INTO v_tz
      FROM public.tenants
     WHERE id = _tenant_id;
    v_tz := coalesce(v_tz, 'Europe/Madrid');
    v_cutoff_day := NULL;
  END IF;

  -- Strict validation of ISO Monday
  IF extract(isodow FROM _week_start) <> 1 THEN
    RAISE EXCEPTION 'WEEK_START_INVALID';
  END IF;

  -- Civil Monday of current week in tenant timezone
  v_tenant_now := _check_at AT TIME ZONE v_tz;
  v_cal_monday := (v_tenant_now::date) - (extract(isodow FROM v_tenant_now)::integer - 1);

  -- If the week is strictly in the past (before current civil Monday), ordering is always closed
  IF _week_start < v_cal_monday THEN
    RETURN true;
  END IF;

  -- If unconfigured (cutoff_day IS NULL), upcoming weeks remain open without pre-week cutoff
  IF v_cutoff_day IS NULL THEN
    RETURN false;
  END IF;

  -- Calculate the exact cutoff timestamp in tenant timezone
  -- Cutoff occurs in the week of _week_start on day v_cutoff_day at v_cutoff_time
  v_cutoff_date := _week_start + (v_cutoff_day - 1);
  v_cutoff_ts := (v_cutoff_date + v_cutoff_time) AT TIME ZONE v_tz;

  RETURN _check_at >= v_cutoff_ts;
END $$;

GRANT CREATE ON SCHEMA cr_order_private TO cr_order_writer;
ALTER FUNCTION cr_order_private.is_weekly_order_cutoff_passed(uuid, date, timestamptz) OWNER TO cr_order_writer;
REVOKE CREATE ON SCHEMA cr_order_private FROM cr_order_writer;

GRANT EXECUTE ON FUNCTION cr_order_private.is_weekly_order_cutoff_passed(uuid, date, timestamptz) TO cr_order_writer, service_role, authenticated;

-- Expose helper in public schema for consumer inspection
CREATE OR REPLACE FUNCTION public.is_weekly_order_cutoff_passed(
  _tenant_id uuid,
  _week_start date
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT cr_order_private.is_weekly_order_cutoff_passed(_tenant_id, _week_start, statement_timestamp());
$$;
GRANT EXECUTE ON FUNCTION public.is_weekly_order_cutoff_passed(uuid, date) TO PUBLIC, anon, authenticated, service_role;

-- 4. Update cr_order_private.check_offer_actor to enforce weekly cutoff on quote issue & commit
CREATE OR REPLACE FUNCTION cr_order_private.check_offer_actor(_tenant uuid,_actor uuid,_command jsonb) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE staff boolean; customer_user uuid; v_week date; BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'service_role' OR _actor IS NULL OR _tenant IS NULL OR (auth.uid() IS NOT NULL AND auth.uid() IS DISTINCT FROM _actor) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 staff:=public.is_saas_admin(_actor) OR public.has_role(_actor,_tenant,'company_admin') OR public.has_role(_actor,_tenant,'operations_manager');
 IF NOT public.is_saas_admin(_actor) AND NOT EXISTS(SELECT 1 FROM public.tenant_members WHERE tenant_id=_tenant AND user_id=_actor AND status='approved' AND deleted_at IS NULL) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 IF NOT staff AND NOT (public.has_role(_actor,_tenant,'customer') OR EXISTS(SELECT 1 FROM public.tenant_members WHERE tenant_id=_tenant AND user_id=_actor AND status='approved' AND membership_type='customer' AND deleted_at IS NULL)) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 IF _command->>'operation'='capture' THEN
   IF _command->'customer'->>'kind'='new' THEN
     IF NOT staff THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
   ELSIF _command->'customer'->>'kind'='existing' THEN
     SELECT user_id INTO customer_user FROM public.customers WHERE tenant_id=_tenant AND id=(_command->'customer'->>'id')::uuid AND deleted_at IS NULL;
     IF NOT FOUND OR (NOT staff AND customer_user IS DISTINCT FROM _actor) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
   ELSE RAISE EXCEPTION 'INPUT_INVALID'; END IF;
   v_week := (_command->>'weekStart')::date;
 ELSIF _command->>'operation'='modify' THEN
   SELECT c.user_id, o.week_start INTO customer_user, v_week FROM public.orders o JOIN public.customers c ON c.id=o.customer_id AND c.tenant_id=o.tenant_id
    WHERE o.tenant_id=_tenant AND o.id=(_command->>'orderId')::uuid AND o.deleted_at IS NULL AND c.deleted_at IS NULL;
   IF NOT FOUND OR (NOT staff AND customer_user IS DISTINCT FROM _actor) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 ELSE RAISE EXCEPTION 'INPUT_INVALID'; END IF;

 -- P0 server cutoff enforcement: Non-staff cannot issue quotes or commit past cutoff
 IF NOT staff AND v_week IS NOT NULL AND cr_order_private.is_weekly_order_cutoff_passed(_tenant, v_week) THEN
   RAISE EXCEPTION 'WEEKLY_ORDER_CUTOFF_PASSED';
 END IF;

 PERFORM set_config('cr_order.verified_actor',_actor::text,true);
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(_command->'lines') x WHERE x->>'kind'='custom') THEN PERFORM cr_order_private.require_custom(_tenant,_actor); END IF;
 IF NOT staff AND (coalesce((_command->>'autoConfirm')::boolean,false) OR _command ? 'dietaryOverride') THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
END $$;

REVOKE ALL ON FUNCTION cr_order_private.check_offer_actor(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION cr_order_private.check_offer_actor(uuid,uuid,jsonb) TO service_role;

-- 5. Update cr_order_private.write_dish_v2 to enforce weekly cutoff on capture and modify
GRANT CREATE ON SCHEMA cr_order_private TO cr_order_writer;

CREATE OR REPLACE FUNCTION cr_order_private.write_dish_v2(_tenant_id uuid,_request_id uuid,_command jsonb,
 _verified_actor uuid DEFAULT NULL,_trusted_quote jsonb DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql
SECURITY DEFINER SET search_path='' AS $$
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
 ELSE actor:=auth.uid(); END IF;
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
   IF req.input_hash<>h OR req.operation<>op THEN RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT'; END IF;
   SELECT * INTO o FROM public.orders WHERE tenant_id=_tenant_id AND id=req.order_id;
   SELECT coalesce(jsonb_agg(to_jsonb(i) ORDER BY i.id),'[]') INTO output_items FROM public.order_items i
     WHERE tenant_id=_tenant_id AND order_id=req.order_id AND deleted_at IS NULL;
   RETURN jsonb_build_object('order',to_jsonb(o),'items',output_items,'committedRevision',req.committed_revision,'replayed',true,'inputHash',h);
 END IF;
 IF jsonb_typeof(_command->'lines') IS DISTINCT FROM 'array' OR jsonb_array_length(_command->'lines')=0 THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
 IF _command->>'weekStart' IS NULL OR (_command->>'weekStart') !~ '^\d{4}-\d{2}-\d{2}$' THEN RAISE EXCEPTION 'DATE_INVALID'; END IF;
 week:=(_command->>'weekStart')::date;
 IF extract(isodow FROM week)<>1 THEN RAISE EXCEPTION 'WEEK_START_INVALID'; END IF;

 -- P0 Cutoff check on capture
 IF op='capture' AND NOT staff AND cr_order_private.is_weekly_order_cutoff_passed(_tenant_id, week) THEN
   RAISE EXCEPTION 'WEEKLY_ORDER_CUTOFF_PASSED';
 END IF;

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

   -- P0 Cutoff check on modify
   IF NOT staff AND cr_order_private.is_weekly_order_cutoff_passed(_tenant_id, o.week_start) THEN
     RAISE EXCEPTION 'WEEKLY_ORDER_CUTOFF_PASSED';
   END IF;

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
     SELECT c.id INTO cid FROM public.customers c WHERE c.tenant_id=_tenant_id AND c.display_name=btrim(_command->'customer'->>'displayName') AND c.deleted_at IS NULL;
     IF cid IS NULL THEN
       cid:=gen_random_uuid();
       INSERT INTO public.customers(id,tenant_id,display_name,email,is_active,source)
       VALUES(cid,_tenant_id,btrim(_command->'customer'->>'displayName'),_command->'customer'->>'email',true,'staff_intake');
       IF _command->'customer' ? 'phone' AND _command->'customer'->>'phone' IS NOT NULL THEN
         INSERT INTO public.customer_phones(tenant_id,customer_id,phone,is_primary)
         VALUES(_tenant_id,cid,btrim(_command->'customer'->>'phone'),true);
       END IF;
     END IF;
   ELSE RAISE EXCEPTION 'CUSTOMER_REQUIRED'; END IF;
 END IF;
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
     IF NOT field=ANY(ARRAY['kind','lineId','dishId','dayDate','qty','comment','unitPriceOverride','unitPriceOverrideReason','explicitZeroConfirmed','slotId','isOffMenu']) THEN RAISE EXCEPTION 'UNTRUSTED_AUTHORITY_FIELD'; END IF;
     IF field='comment' AND (jsonb_typeof(val) NOT IN('string','null') OR length(line->>field)>2000) THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
     IF field='unitPriceOverrideReason' AND (jsonb_typeof(val)<>'string' OR length(btrim(line->>field))=0 OR length(line->>field)>2000) THEN RAISE EXCEPTION 'PRICE_OVERRIDE_REASON_REQUIRED'; END IF;
     IF field='explicitZeroConfirmed' AND jsonb_typeof(val)<>'boolean' THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
   END LOOP;
   IF line->>'dayDate' IS NULL OR (line->>'dayDate') !~ '^\d{4}-\d{2}-\d{2}$' THEN RAISE EXCEPTION 'DATE_INVALID'; END IF;
   day:=(line->>'dayDate')::date;
   IF day<week OR day>week+6 THEN RAISE EXCEPTION 'DATE_OUTSIDE_WEEK'; END IF;
   IF jsonb_typeof(line->'qty') IS DISTINCT FROM 'number' OR (line->>'qty') !~ '^[1-9][0-9]*$' THEN RAISE EXCEPTION 'QTY_INVALID'; END IF;
   v_qty:=(line->>'qty')::integer;
   is_off_menu := coalesce((line->>'isOffMenu')::boolean, false);

   SELECT * INTO d FROM public.dishes WHERE tenant_id=_tenant_id AND id=(line->>'dishId')::uuid
     AND deleted_at IS NULL AND status='active' FOR SHARE;
   IF NOT FOUND THEN RAISE EXCEPTION 'DISH_NOT_FOUND'; END IF;

   IF is_off_menu THEN
     IF NOT staff THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
     IF d.price IS NULL OR d.price <= 0 THEN RAISE EXCEPTION 'PRICE_UNAVAILABLE'; END IF;
   ELSE
     PERFORM 1 FROM public.weekly_menus m JOIN public.weekly_menu_slots s ON s.weekly_menu_id=m.id AND s.tenant_id=m.tenant_id
      WHERE m.tenant_id=_tenant_id AND m.week_start=week AND m.status::text='published' AND s.dish_id=d.id AND s.day_date=day FOR SHARE OF m,s;
     IF NOT FOUND THEN RAISE EXCEPTION 'DISH_NOT_OFFERED'; END IF;
     IF EXISTS(SELECT 1 FROM public.weekly_menus m JOIN public.weekly_menu_slots s ON s.weekly_menu_id=m.id AND s.tenant_id=m.tenant_id
       WHERE m.tenant_id=_tenant_id AND m.week_start=week AND m.status::text='published'
         AND s.dish_id=d.id AND s.day_date=day AND s.unit_price IS NOT NULL) AND _trusted_quote IS NULL THEN RAISE EXCEPTION 'COMMERCIAL_QUOTE_REQUIRED'; END IF;
   END IF;

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
REVOKE CREATE ON SCHEMA cr_order_private FROM cr_order_writer;
REVOKE ALL ON FUNCTION cr_order_private.write_dish_v2(uuid,uuid,jsonb,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION cr_order_private.write_dish_v2(uuid,uuid,jsonb,uuid,jsonb) TO service_role;

-- 6. Update public.program_draft_order to enforce weekly cutoff
CREATE OR REPLACE FUNCTION public.program_draft_order(
  _tenant_id uuid,
  _customer_id uuid,
  _week_start date,
  _total numeric,
  _notes text,
  _items jsonb,
  _demand_channel public.demand_channel DEFAULT 'individual',
  _company_id uuid DEFAULT NULL,
  _site_id uuid DEFAULT NULL,
  _organizational_unit_id uuid DEFAULT NULL,
  _delivery_group_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item jsonb;
  v_items jsonb := '[]'::jsonb;
  v_row public.order_items%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT public.is_tenant_member(_tenant_id) THEN
    RAISE EXCEPTION 'not a tenant member';
  END IF;

  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) < 1 THEN
    RAISE EXCEPTION 'items required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id = _customer_id
      AND c.tenant_id = _tenant_id
      AND c.deleted_at IS NULL
      AND (
        c.user_id = auth.uid()
        OR public.has_any_staff_role(auth.uid(), _tenant_id)
        OR public.is_saas_admin(auth.uid())
      )
  ) THEN
    RAISE EXCEPTION 'customer not allowed';
  END IF;

  -- P0 Cutoff check: non-staff cannot program draft order if cutoff passed
  IF NOT (public.has_any_staff_role(auth.uid(), _tenant_id) OR public.is_saas_admin(auth.uid())) THEN
    IF cr_order_private.is_weekly_order_cutoff_passed(_tenant_id, _week_start) THEN
      RAISE EXCEPTION 'WEEKLY_ORDER_CUTOFF_PASSED';
    END IF;
  END IF;

  INSERT INTO public.orders (
    tenant_id,
    customer_id,
    week_start,
    status,
    total,
    notes,
    demand_channel,
    company_id,
    site_id,
    organizational_unit_id,
    delivery_group_id
  )
  VALUES (
    _tenant_id,
    _customer_id,
    _week_start,
    'draft',
    _total,
    _notes,
    COALESCE(_demand_channel, 'individual'),
    _company_id,
    _site_id,
    _organizational_unit_id,
    _delivery_group_id
  )
  RETURNING * INTO v_order;

  FOR v_item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    INSERT INTO public.order_items (
      tenant_id,
      order_id,
      dish_id,
      day_date,
      qty,
      unit_price,
      price_snapshot_status
    )
    VALUES (
      _tenant_id,
      v_order.id,
      (v_item->>'dish_id')::uuid,
      (v_item->>'day_date')::date,
      COALESCE((v_item->>'qty')::integer, 1),
      (SELECT price FROM public.dishes WHERE id=(v_item->>'dish_id')::uuid AND tenant_id=_tenant_id),
      CASE WHEN (SELECT price FROM public.dishes WHERE id=(v_item->>'dish_id')::uuid AND tenant_id=_tenant_id)=0 THEN 'explicit_zero' ELSE 'captured' END
    )
    RETURNING * INTO v_row;

    v_items := v_items || jsonb_build_array(to_jsonb(v_row));
  END LOOP;

  RETURN jsonb_build_object(
    'order', to_jsonb(v_order),
    'items', v_items
  );
END;
$$;

-- 7. Trigger on public.orders to guard direct INSERT and UPDATE transitions (e.g. draft -> confirmed)
CREATE OR REPLACE FUNCTION cr_order_private.guard_order_cutoff() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
  v_actor uuid := cr_order_private.actor();
  v_is_staff boolean := false;
BEGIN
  IF v_actor IS NOT NULL THEN
    v_is_staff := public.is_saas_admin(v_actor)
      OR public.has_role(v_actor, NEW.tenant_id, 'company_admin')
      OR public.has_role(v_actor, NEW.tenant_id, 'operations_manager');
  END IF;

  -- 1. On INSERT: non-staff cannot insert orders for a week where cutoff passed
  IF TG_OP = 'INSERT' THEN
    IF NOT v_is_staff AND cr_order_private.is_weekly_order_cutoff_passed(NEW.tenant_id, NEW.week_start) THEN
      RAISE EXCEPTION 'WEEKLY_ORDER_CUTOFF_PASSED';
    END IF;
  END IF;

  -- 2. On UPDATE: non-staff cannot confirm an order or change week_start if cutoff passed
  IF TG_OP = 'UPDATE' THEN
    IF (OLD.status = 'draft' AND NEW.status = 'confirmed')
       OR (OLD.week_start IS DISTINCT FROM NEW.week_start) THEN
      IF NOT v_is_staff AND cr_order_private.is_weekly_order_cutoff_passed(NEW.tenant_id, NEW.week_start) THEN
        RAISE EXCEPTION 'WEEKLY_ORDER_CUTOFF_PASSED';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END $$;

GRANT CREATE ON SCHEMA cr_order_private TO cr_order_writer;
ALTER FUNCTION cr_order_private.guard_order_cutoff() OWNER TO cr_order_writer;
REVOKE CREATE ON SCHEMA cr_order_private FROM cr_order_writer;

DROP TRIGGER IF EXISTS cr_order_cutoff_header_guard ON public.orders;
CREATE TRIGGER cr_order_cutoff_header_guard
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION cr_order_private.guard_order_cutoff();

COMMIT;
