-- Forward-only migration: bridge A5 lifecycle identity to cr_order_private.actor() (session_uid_bridge).
-- Resolves "permission denied for schema auth" when cr_order_writer executes lifecycle_v2.
-- Preserves all state invariants, operational evidence, audit logging, and idempotency contracts.
-- Does NOT grant schema auth USAGE to cr_order_writer; preserves security separation.
-- Includes fail-closed drift detection across all involved functions, owners, languages, search paths, and ACLs.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SET LOCAL ROLE postgres;

-- -----------------------------------------------------------------------------
-- PRECHECKS: DRIFT FAIL-CLOSED
-- -----------------------------------------------------------------------------
DO $$ 
DECLARE
  v_hash text;
  v_owner text;
  v_secdef boolean;
  v_lang text;
  v_config text[];
BEGIN
  -- 1. Caller authority check
  IF current_user IS DISTINCT FROM 'postgres' OR NOT pg_has_role(current_user, 'cr_order_writer', 'SET') THEN
    RAISE EXCEPTION 'A5_PRECHECK_FAILED: caller must be postgres with SET on cr_order_writer';
  END IF;

  -- 2. Validate cr_order_private.session_uid_bridge() definition & attributes
  SELECT 
    encode(sha256(convert_to(p.prosrc, 'UTF8')), 'hex'),
    pg_get_userbyid(p.proowner),
    p.prosecdef,
    l.lanname,
    p.proconfig
  INTO v_hash, v_owner, v_secdef, v_lang, v_config
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_language l ON l.oid = p.prolang
  WHERE n.nspname = 'cr_order_private' AND p.proname = 'session_uid_bridge'
    AND p.oid = to_regprocedure('cr_order_private.session_uid_bridge()');

  IF v_hash IS NULL THEN
    RAISE EXCEPTION 'A5_PRECHECK_FAILED: session_uid_bridge() not found';
  END IF;
  IF v_hash IS DISTINCT FROM 'c628b78ce1d2a3b15ddbaf7b0a5838fa26c925d332103e53f34ba73b9b227604' THEN
    RAISE EXCEPTION 'A5_PRECHECK_FAILED: session_uid_bridge() source hash drift: expected c628b78ce1d2a3b15ddbaf7b0a5838fa26c925d332103e53f34ba73b9b227604, got %', v_hash;
  END IF;
  IF v_owner IS DISTINCT FROM 'postgres' THEN
    RAISE EXCEPTION 'A5_PRECHECK_FAILED: session_uid_bridge() owner must be postgres, got %', v_owner;
  END IF;
  IF NOT v_secdef THEN
    RAISE EXCEPTION 'A5_PRECHECK_FAILED: session_uid_bridge() must be SECURITY DEFINER';
  END IF;
  IF v_lang IS DISTINCT FROM 'sql' THEN
    RAISE EXCEPTION 'A5_PRECHECK_FAILED: session_uid_bridge() language must be sql, got %', v_lang;
  END IF;
  IF v_config IS DISTINCT FROM ARRAY['search_path=""'] THEN
    RAISE EXCEPTION 'A5_PRECHECK_FAILED: session_uid_bridge() search_path must be empty, got %', array_to_string(v_config, ',');
  END IF;
  IF NOT has_function_privilege('cr_order_writer', to_regprocedure('cr_order_private.session_uid_bridge()'), 'EXECUTE') THEN
    RAISE EXCEPTION 'A5_PRECHECK_FAILED: session_uid_bridge() missing EXECUTE for cr_order_writer';
  END IF;
  IF has_function_privilege('authenticated', to_regprocedure('cr_order_private.session_uid_bridge()'), 'EXECUTE')
     OR has_function_privilege('anon', to_regprocedure('cr_order_private.session_uid_bridge()'), 'EXECUTE') THEN
    RAISE EXCEPTION 'A5_PRECHECK_FAILED: session_uid_bridge() unexpected EXECUTE for public/anon/authenticated';
  END IF;

  -- 3. Validate cr_order_private.actor() definition & attributes
  SELECT 
    encode(sha256(convert_to(p.prosrc, 'UTF8')), 'hex'),
    pg_get_userbyid(p.proowner),
    p.prosecdef,
    l.lanname,
    p.proconfig
  INTO v_hash, v_owner, v_secdef, v_lang, v_config
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_language l ON l.oid = p.prolang
  WHERE n.nspname = 'cr_order_private' AND p.proname = 'actor'
    AND p.oid = to_regprocedure('cr_order_private.actor()');

  IF v_hash IS NULL THEN
    RAISE EXCEPTION 'A5_PRECHECK_FAILED: actor() not found';
  END IF;
  IF v_hash IS DISTINCT FROM '9094c00b9605600a6e5329dc1d7c2ac7aced0ef57c08b3e83f3b9e02d477894c' THEN
    RAISE EXCEPTION 'A5_PRECHECK_FAILED: actor() source hash drift: expected 9094c00b9605600a6e5329dc1d7c2ac7aced0ef57c08b3e83f3b9e02d477894c, got %', v_hash;
  END IF;
  IF v_owner IS DISTINCT FROM 'postgres' THEN
    RAISE EXCEPTION 'A5_PRECHECK_FAILED: actor() owner must be postgres, got %', v_owner;
  END IF;
  IF v_secdef THEN
    RAISE EXCEPTION 'A5_PRECHECK_FAILED: actor() must be SECURITY INVOKER';
  END IF;
  IF v_lang IS DISTINCT FROM 'plpgsql' THEN
    RAISE EXCEPTION 'A5_PRECHECK_FAILED: actor() language must be plpgsql, got %', v_lang;
  END IF;
  IF v_config IS DISTINCT FROM ARRAY['search_path=""'] THEN
    RAISE EXCEPTION 'A5_PRECHECK_FAILED: actor() search_path must be empty, got %', array_to_string(v_config, ',');
  END IF;
  IF NOT has_function_privilege('cr_order_writer', to_regprocedure('cr_order_private.actor()'), 'EXECUTE') THEN
    RAISE EXCEPTION 'A5_PRECHECK_FAILED: actor() missing EXECUTE for cr_order_writer';
  END IF;

  -- 4. Validate cr_order_private.lifecycle_v2(uuid,uuid,jsonb) historical definition & attributes
  SELECT 
    encode(sha256(convert_to(p.prosrc, 'UTF8')), 'hex'),
    pg_get_userbyid(p.proowner),
    p.prosecdef,
    l.lanname,
    p.proconfig
  INTO v_hash, v_owner, v_secdef, v_lang, v_config
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_language l ON l.oid = p.prolang
  WHERE n.nspname = 'cr_order_private' AND p.proname = 'lifecycle_v2'
    AND p.oid = to_regprocedure('cr_order_private.lifecycle_v2(uuid,uuid,jsonb)');

  IF v_hash IS NULL THEN
    RAISE EXCEPTION 'A5_PRECHECK_FAILED: lifecycle_v2(uuid,uuid,jsonb) not found';
  END IF;
  -- Expected baseline hash from 20261007020245_cr_order_a5_lifecycle_writer.sql
  IF v_hash IS DISTINCT FROM '8859600d93efd94b37c7de2d49a68340d433e695f59d6bb51ed9447945dba0d8' THEN
    RAISE EXCEPTION 'A5_PRECHECK_FAILED: lifecycle_v2(uuid,uuid,jsonb) source hash drift: expected 8859600d93efd94b37c7de2d49a68340d433e695f59d6bb51ed9447945dba0d8, got %', v_hash;
  END IF;
  IF v_owner IS DISTINCT FROM 'cr_order_writer' THEN
    RAISE EXCEPTION 'A5_PRECHECK_FAILED: lifecycle_v2(uuid,uuid,jsonb) owner must be cr_order_writer, got %', v_owner;
  END IF;
  IF NOT v_secdef THEN
    RAISE EXCEPTION 'A5_PRECHECK_FAILED: lifecycle_v2(uuid,uuid,jsonb) must be SECURITY DEFINER';
  END IF;
  IF v_lang IS DISTINCT FROM 'plpgsql' THEN
    RAISE EXCEPTION 'A5_PRECHECK_FAILED: lifecycle_v2(uuid,uuid,jsonb) language must be plpgsql, got %', v_lang;
  END IF;
  IF v_config IS DISTINCT FROM ARRAY['search_path=""'] THEN
    RAISE EXCEPTION 'A5_PRECHECK_FAILED: lifecycle_v2(uuid,uuid,jsonb) search_path must be empty, got %', array_to_string(v_config, ',');
  END IF;
  IF NOT has_function_privilege('authenticated', to_regprocedure('cr_order_private.lifecycle_v2(uuid,uuid,jsonb)'), 'EXECUTE') THEN
    RAISE EXCEPTION 'A5_PRECHECK_FAILED: lifecycle_v2(uuid,uuid,jsonb) missing EXECUTE for authenticated';
  END IF;
  IF has_function_privilege('anon', to_regprocedure('cr_order_private.lifecycle_v2(uuid,uuid,jsonb)'), 'EXECUTE')
     OR has_function_privilege('service_role', to_regprocedure('cr_order_private.lifecycle_v2(uuid,uuid,jsonb)'), 'EXECUTE') THEN
    RAISE EXCEPTION 'A5_PRECHECK_FAILED: lifecycle_v2(uuid,uuid,jsonb) unexpected EXECUTE for anon or service_role';
  END IF;
END $$;

-- Exact ACL contract: reject unknown grantees, PUBLIC, grantors and delegation.
-- Effective API checks additionally detect inherited EXECUTE permissions.
DO $$
DECLARE
  f record;
  actual_acl text[];
BEGIN
  FOR f IN SELECT * FROM (VALUES
    ('cr_order_private.session_uid_bridge()', 'postgres', ARRAY['cr_order_writer','postgres']::text[]),
    ('cr_order_private.actor()', 'postgres', ARRAY['authenticated','cr_order_writer','postgres']::text[]),
    ('cr_order_private.lifecycle_v2(uuid,uuid,jsonb)', 'cr_order_writer', ARRAY['authenticated','cr_order_writer']::text[])
  ) AS expected(signature, owner_name, grantees) LOOP
    SELECT array_agg(pg_get_userbyid(a.grantee)::text ORDER BY pg_get_userbyid(a.grantee)::text)
      INTO actual_acl
      FROM pg_proc p CROSS JOIN LATERAL aclexplode(coalesce(p.proacl, acldefault('f',p.proowner))) a
      WHERE p.oid=to_regprocedure(f.signature);
    IF actual_acl IS DISTINCT FROM f.grantees OR EXISTS (
      SELECT 1 FROM pg_proc p
      CROSS JOIN LATERAL aclexplode(coalesce(p.proacl, acldefault('f',p.proowner))) a
      WHERE p.oid=to_regprocedure(f.signature)
        AND (a.grantee=0 OR a.is_grantable OR a.privilege_type<>'EXECUTE'
          OR a.grantor<>(SELECT oid FROM pg_roles WHERE rolname=f.owner_name))
    ) THEN
      RAISE EXCEPTION 'A5_PRECHECK_FAILED: unexpected ACL on %', f.signature;
    END IF;
    IF has_function_privilege('anon',to_regprocedure(f.signature),'EXECUTE')
      OR has_function_privilege('service_role',to_regprocedure(f.signature),'EXECUTE')
      OR (f.signature='cr_order_private.session_uid_bridge()'
        AND has_function_privilege('authenticated',to_regprocedure(f.signature),'EXECUTE')) THEN
      RAISE EXCEPTION 'A5_PRECHECK_FAILED: unexpected effective EXECUTE on %', f.signature;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role')
      AND (pg_has_role(r.oid,'cr_order_writer','SET') OR pg_has_role(r.oid,'postgres','SET'))) THEN
      RAISE EXCEPTION 'A5_PRECHECK_FAILED: API role can assume privileged owner';
    END IF;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- FUNCTION REPLACEMENT
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cr_order_private.lifecycle_v2(_tenant uuid, _request uuid, _command jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  actor uuid := cr_order_private.actor();
  action text := _command->>'action';
  domain text;
  authority text;
  target text;
  original text;
  h text;
  field text;
  oid uuid;
  o public.orders;
  req public.order_write_requests;
  evidence cr_order_private.operational_evidence;
  service public.delivery_services;
  service_target text;
  result jsonb;
  dependent_before jsonb;
  dependent_after jsonb;
  stamp timestamptz := statement_timestamp();
BEGIN
  IF current_setting('role', true) IS DISTINCT FROM 'authenticated'
    OR NOT cr_order_private.lifecycle_reader(_tenant) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED';
  END IF;
  IF _request IS NULL OR jsonb_typeof(_command) IS DISTINCT FROM 'object'
    OR _command->'schemaVersion' IS DISTINCT FROM '1'::jsonb
    OR jsonb_typeof(_command->'expectedRevision') IS DISTINCT FROM 'number'
    OR coalesce(_command->>'expectedRevision','') !~ '^(0|[1-9][0-9]*)$'
    OR coalesce(_command->>'orderId','') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    OR jsonb_typeof(_command->'fromState') IS DISTINCT FROM 'string' THEN
    RAISE EXCEPTION 'INPUT_INVALID';
  END IF;
  FOR field IN SELECT jsonb_object_keys(_command) LOOP
    IF NOT field = ANY(ARRAY['schemaVersion','orderId','action','fromState','expectedRevision','reason','serviceId']) THEN
      RAISE EXCEPTION 'UNTRUSTED_AUTHORITY_FIELD';
    END IF;
  END LOOP;
  domain := CASE action
    WHEN 'start_production' THEN 'kitchen'
    WHEN 'complete_production' THEN 'production'
    WHEN 'start_packing' THEN 'kitchen'
    WHEN 'complete_packing' THEN 'kitchen'
    WHEN 'assign_delivery' THEN 'kitchen'
    WHEN 'dispatch' THEN 'logistics'
    WHEN 'delivery_issue' THEN 'logistics'
    WHEN 'retry_delivery' THEN 'logistics'
    WHEN 'complete_delivery' THEN 'logistics'
    WHEN 'service_start' THEN 'kitchen'
    WHEN 'service_prepare' THEN 'production'
    WHEN 'service_ready' THEN 'kitchen'
    WHEN 'service_dispatch' THEN 'logistics'
    WHEN 'service_deliver' THEN 'logistics'
    WHEN 'service_issue' THEN 'logistics'
    WHEN 'service_retry' THEN 'logistics'
  END;
  IF action IN ('confirm','cancel') THEN
    IF NOT cr_order_private.lifecycle_staff(_tenant) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
  ELSIF domain IS NULL OR NOT (cr_order_private.lifecycle_operator(_tenant, domain)
    OR action IN ('complete_production','service_prepare') AND cr_order_private.lifecycle_operator(_tenant,'kitchen')) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED';
  END IF;
  IF _command ? 'reason' AND (jsonb_typeof(_command->'reason') IS DISTINCT FROM 'string'
    OR length(_command->>'reason') > 2000) THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
  IF action='cancel' AND coalesce(length(btrim(_command->>'reason')),0)=0 THEN
    RAISE EXCEPTION 'INPUT_INVALID';
  END IF;
  oid := (_command->>'orderId')::uuid;
  authority := CASE WHEN action IN ('confirm','cancel') THEN 'orders.write:staff' ELSE 'domain:'||domain END;
  PERFORM pg_advisory_xact_lock(hashtextextended(_tenant::text||':'||_request::text,0));
  SELECT * INTO req FROM public.order_write_requests WHERE tenant_id=_tenant AND request_id=_request;
  IF FOUND THEN
    h := encode(sha256(convert_to(jsonb_build_object('tenant',_tenant,'request',_request,
      'actor',actor,'authority',authority,'command',_command,'targetState',req.lifecycle_result->>'toState')::text,'UTF8')),'hex');
    IF req.operation<>'lifecycle' OR req.input_hash<>h THEN RAISE EXCEPTION 'REQUEST_ID_CONFLICT'; END IF;
    RETURN req.lifecycle_result;
  END IF;
  -- Match A3/A4a lock order: day keys before parent, then dependent rows.
  PERFORM pg_advisory_xact_lock(hashtextextended(key,0)) FROM (
    SELECT DISTINCT 'cr-order-day:'||_tenant||':'||to_char(day_date,'YYYY-MM-DD')||':'||
      CASE WHEN item_kind='custom' THEN 'custom:'||id ELSE 'dish:'||dish_id END AS key
    FROM public.order_items WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL
  ) keys ORDER BY key;
  SELECT * INTO o FROM public.orders WHERE tenant_id=_tenant AND id=oid AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF o.write_contract_version<>2 THEN RAISE EXCEPTION 'V2_REQUIRED'; END IF;
  IF action='cancel' AND o.status::text='cancelled' THEN
    RETURN jsonb_build_object('outcome','ALREADY_CANCELLED','tenantId',_tenant,'orderId',oid,
      'committedRevision',o.revision,'toState','cancelled');
  END IF;
  IF o.revision IS DISTINCT FROM (_command->>'expectedRevision')::integer THEN
    RAISE EXCEPTION 'REVISION_CONFLICT';
  END IF;
  IF o.status::text IS DISTINCT FROM _command->>'fromState' THEN RAISE EXCEPTION 'INVALID_STATE'; END IF;
  IF o.status::text IN ('delivered','cancelled') THEN RAISE EXCEPTION 'ORDER_CLOSED'; END IF;
  original := o.status::text;
  IF action LIKE 'service_%' THEN
    SELECT * INTO service FROM public.delivery_services WHERE tenant_id=_tenant AND order_id=oid
      AND id=(_command->>'serviceId')::uuid AND deleted_at IS NULL;
    IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
    service_target := CASE
      WHEN action='service_start' AND service.status::text='pending' THEN 'in_production'
      WHEN action='service_prepare' AND service.status::text='in_production' THEN 'prepared'
      WHEN action='service_ready' AND service.status::text='prepared' THEN 'ready_for_delivery'
      WHEN action='service_dispatch' AND service.status::text='ready_for_delivery' THEN 'out_for_delivery'
      WHEN action='service_deliver' AND service.status::text='out_for_delivery' THEN 'delivered'
      WHEN action='service_issue' AND service.status::text='out_for_delivery' THEN 'delivery_issue'
      WHEN action='service_retry' AND service.status::text='delivery_issue' THEN 'out_for_delivery'
    END;
    IF service_target IS NULL THEN RAISE EXCEPTION 'INVALID_STATE'; END IF;
  ELSIF _command ? 'serviceId' THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
  target := CASE action
    WHEN 'confirm' THEN 'confirmed'
    WHEN 'start_production' THEN 'in_production'
    WHEN 'complete_production' THEN 'prepared'
    WHEN 'start_packing' THEN original
    WHEN 'complete_packing' THEN original
    WHEN 'assign_delivery' THEN 'ready_for_delivery'
    WHEN 'dispatch' THEN 'out_for_delivery'
    WHEN 'delivery_issue' THEN 'delivery_issue'
    WHEN 'retry_delivery' THEN 'out_for_delivery'
    WHEN 'complete_delivery' THEN 'delivered'
    WHEN 'cancel' THEN 'cancelled'
    ELSE original
  END;
  IF NOT (
    action='confirm' AND original='draft'
    OR action='start_production' AND original='confirmed'
    OR action='complete_production' AND original='in_production'
    OR action IN ('start_packing','complete_packing','assign_delivery') AND original='prepared'
    OR action='dispatch' AND original='ready_for_delivery'
    OR action='delivery_issue' AND original='out_for_delivery'
    OR action='retry_delivery' AND original='delivery_issue'
    OR action='complete_delivery' AND original='out_for_delivery'
    OR action='cancel' AND original IN ('draft','confirmed','in_production','prepared','ready_for_delivery')
    OR service_target IS NOT NULL AND original<>'draft'
  ) THEN RAISE EXCEPTION 'INVALID_STATE'; END IF;
  PERFORM id FROM public.delivery_services WHERE tenant_id=_tenant AND order_id=oid ORDER BY id FOR UPDATE;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'status',status) ORDER BY id),'[]'::jsonb)
    INTO dependent_before FROM public.delivery_services WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL;
  INSERT INTO cr_order_private.operational_evidence(tenant_id,order_id) VALUES(_tenant,oid)
    ON CONFLICT DO NOTHING;
  SELECT * INTO evidence FROM cr_order_private.operational_evidence
    WHERE tenant_id=_tenant AND order_id=oid FOR UPDATE;
  IF service_target IS NOT NULL THEN
    UPDATE public.delivery_services SET status=service_target::public.delivery_service_status,
      packed_at=CASE WHEN service_target='ready_for_delivery' THEN coalesce(packed_at,stamp) ELSE packed_at END,
      packed_by=CASE WHEN service_target='ready_for_delivery' THEN coalesce(packed_by,actor) ELSE packed_by END,
      dispatched_at=CASE WHEN service_target='out_for_delivery' THEN coalesce(dispatched_at,stamp) ELSE dispatched_at END,
      delivered_at=CASE WHEN service_target='delivered' THEN coalesce(delivered_at,stamp) ELSE delivered_at END,
      delivered_by=CASE WHEN service_target='delivered' THEN coalesce(delivered_by,actor) ELSE delivered_by END
      WHERE tenant_id=_tenant AND id=service.id RETURNING * INTO service;
    IF original='confirmed' AND service_target='in_production' THEN target:='in_production';
    ELSIF original='in_production' AND service_target='prepared' AND NOT EXISTS(
      SELECT 1 FROM public.delivery_services WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL
        AND status::text NOT IN ('prepared','ready_for_delivery','out_for_delivery','delivered')
    ) THEN target:='prepared';
    ELSIF original='prepared' AND service_target='ready_for_delivery' AND NOT EXISTS(
      SELECT 1 FROM public.delivery_services WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL
        AND (status::text NOT IN ('ready_for_delivery','out_for_delivery','delivered') OR packed_at IS NULL OR packed_by IS NULL)
    ) THEN target:='ready_for_delivery';
    ELSIF original='ready_for_delivery' AND service_target='out_for_delivery' THEN target:='out_for_delivery';
    ELSIF original='out_for_delivery' AND service_target='delivery_issue' THEN target:='delivery_issue';
    ELSIF original='delivery_issue' AND action='service_retry' THEN target:='out_for_delivery'; END IF;
    IF original='out_for_delivery' AND NOT EXISTS(
      SELECT 1 FROM public.delivery_services WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL
        AND (status::text<>'delivered' OR delivered_at IS NULL OR delivered_by IS NULL)
    ) THEN target:='delivered'; END IF;
    IF target='in_production' AND original='confirmed' THEN
      UPDATE cr_order_private.operational_evidence SET production_started_at=coalesce(production_started_at,stamp)
        WHERE tenant_id=_tenant AND order_id=oid;
    ELSIF target='prepared' AND original='in_production' THEN
      UPDATE cr_order_private.operational_evidence SET production_completed_at=stamp
        WHERE tenant_id=_tenant AND order_id=oid;
    ELSIF target='ready_for_delivery' AND original='prepared' THEN
      UPDATE cr_order_private.operational_evidence SET packing_completed_at=stamp
        WHERE tenant_id=_tenant AND order_id=oid;
    END IF;
  ELSIF action='cancel' THEN
    IF (original='in_production' AND evidence.production_completed_at IS NULL)
      OR (original IN ('prepared','ready_for_delivery') AND evidence.production_completed_at IS NULL)
      OR (evidence.production_started_at IS NOT NULL AND evidence.production_completed_at IS NULL)
      OR (evidence.packing_started_at IS NOT NULL AND evidence.packing_completed_at IS NULL)
      OR EXISTS(SELECT 1 FROM public.delivery_services WHERE tenant_id=_tenant AND order_id=oid
        AND deleted_at IS NULL AND (status::text NOT IN ('pending','in_production','prepared','ready_for_delivery','cancelled')
          OR dispatched_at IS NOT NULL OR delivered_at IS NOT NULL))
      OR EXISTS(SELECT 1 FROM public.kitchen_production_batches b JOIN public.order_items i
        ON i.tenant_id=b.tenant_id AND i.day_date=b.delivery_date
        AND (b.custom_order_item_id=i.id OR b.item_kind='dish' AND b.dish_id=i.dish_id)
        WHERE i.tenant_id=_tenant AND i.order_id=oid AND i.deleted_at IS NULL
          AND b.status::text IN ('preparing','plating')) THEN
      RAISE EXCEPTION 'OPERATIONAL_WORK_STARTED';
    END IF;
    UPDATE public.delivery_services SET status='cancelled'
      WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL AND status::text<>'cancelled';
  ELSIF action='start_production' THEN
    UPDATE cr_order_private.operational_evidence SET production_started_at=stamp WHERE tenant_id=_tenant AND order_id=oid;
    UPDATE public.delivery_services SET status='in_production'
      WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL AND status::text='pending';
  ELSIF action='complete_production' THEN
    IF evidence.production_started_at IS NULL THEN RAISE EXCEPTION 'OPERATIONAL_EVIDENCE_REQUIRED'; END IF;
    UPDATE cr_order_private.operational_evidence SET production_completed_at=stamp WHERE tenant_id=_tenant AND order_id=oid;
    UPDATE public.delivery_services SET status='prepared'
      WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL AND status::text='in_production';
  ELSIF action='start_packing' THEN
    IF evidence.production_completed_at IS NULL OR evidence.packing_started_at IS NOT NULL THEN
      RAISE EXCEPTION 'OPERATIONAL_EVIDENCE_REQUIRED'; END IF;
    UPDATE cr_order_private.operational_evidence SET packing_started_at=stamp WHERE tenant_id=_tenant AND order_id=oid;
  ELSIF action='complete_packing' THEN
    IF evidence.packing_started_at IS NULL OR evidence.packing_completed_at IS NOT NULL THEN
      RAISE EXCEPTION 'OPERATIONAL_EVIDENCE_REQUIRED'; END IF;
    UPDATE cr_order_private.operational_evidence SET packing_completed_at=stamp WHERE tenant_id=_tenant AND order_id=oid;
  ELSIF action='assign_delivery' THEN
    IF evidence.packing_completed_at IS NULL THEN RAISE EXCEPTION 'OPERATIONAL_EVIDENCE_REQUIRED'; END IF;
    UPDATE cr_order_private.operational_evidence SET assigned_at=stamp WHERE tenant_id=_tenant AND order_id=oid;
    UPDATE public.delivery_services SET status='ready_for_delivery',packed_at=coalesce(packed_at,stamp),packed_by=coalesce(packed_by,actor)
      WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL AND status::text='prepared';
  ELSIF action='dispatch' THEN
    IF evidence.assigned_at IS NULL OR NOT EXISTS(SELECT 1 FROM public.delivery_services WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL)
      OR EXISTS(SELECT 1 FROM public.delivery_services WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL
        AND status::text NOT IN ('ready_for_delivery','delivered'))
      THEN RAISE EXCEPTION 'OPERATIONAL_EVIDENCE_REQUIRED'; END IF;
    UPDATE public.delivery_services SET status='out_for_delivery',dispatched_at=coalesce(dispatched_at,stamp)
      WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL
        AND status::text='ready_for_delivery';
  ELSIF action='complete_delivery' THEN
    -- Positive evidence, nonempty required set, no cancelled-as-delivered shortcut.
    IF NOT EXISTS(SELECT 1 FROM public.delivery_services WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL)
      OR EXISTS(SELECT 1 FROM public.delivery_services WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL
        AND (status::text<>'delivered' OR delivered_at IS NULL OR delivered_by IS NULL)) THEN
      RAISE EXCEPTION 'DELIVERY_RESOLUTION_REQUIRED';
    END IF;
  END IF;
  -- Evidence-only operations also serialize edits and cancellation using revision.
  UPDATE public.orders SET status=target::public.order_status,revision=revision+1
    WHERE tenant_id=_tenant AND id=oid RETURNING * INTO o;
  result := jsonb_build_object('tenantId',_tenant,'orderId',oid,'requestId',_request,'actorId',actor,
    'schemaVersion',1,'fromState',original,'toState',target,'committedRevision',o.revision,'outcome','COMMITTED','authority',authority);
  h := encode(sha256(convert_to(jsonb_build_object('tenant',_tenant,'request',_request,
    'actor',actor,'authority',authority,'command',_command,'targetState',target)::text,'UTF8')),'hex');
  IF service_target IS NOT NULL THEN
    result:=result||jsonb_build_object('serviceId',service.id,'serviceStatus',service_target,
      'resolutionRequired',service_target='delivered' AND target<>'delivered');
  END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'status',status) ORDER BY id),'[]'::jsonb)
    INTO dependent_after FROM public.delivery_services WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL;
  INSERT INTO public.audit_log(tenant_id,actor_id,entity_type,entity_id,action,old_data,new_data)
    VALUES(_tenant,actor,'order',oid,'order.v2.lifecycle',jsonb_build_object('status',original,'revision',o.revision-1,'deliveryServices',dependent_before),
      result||jsonb_build_object('action',action,'reason',_command->>'reason','inputHash',h,'deliveryServices',dependent_after));
  INSERT INTO public.order_write_requests(tenant_id,request_id,operation,input_hash,order_id,committed_revision,lifecycle_result)
    VALUES(_tenant,_request,'lifecycle',h,oid,o.revision,result);
  RETURN result;
END $$;

-- -----------------------------------------------------------------------------
-- OWNERSHIP AND PRIVILEGE CONFIGURATION
-- -----------------------------------------------------------------------------
GRANT CREATE ON SCHEMA cr_order_private TO cr_order_writer;
ALTER FUNCTION cr_order_private.lifecycle_v2(uuid, uuid, jsonb) OWNER TO cr_order_writer;
REVOKE CREATE ON SCHEMA cr_order_private FROM cr_order_writer;

REVOKE ALL ON FUNCTION cr_order_private.lifecycle_v2(uuid, uuid, jsonb) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION cr_order_private.lifecycle_v2(uuid, uuid, jsonb) TO authenticated;

-- -----------------------------------------------------------------------------
-- POSTCHECKS: INTEGRITY & ATTRIBUTES VERIFICATION
-- -----------------------------------------------------------------------------
DO $$ 
DECLARE
  v_hash text;
  v_owner text;
  v_secdef boolean;
  v_lang text;
  v_config text[];
BEGIN
  SELECT 
    encode(sha256(convert_to(p.prosrc, 'UTF8')), 'hex'),
    pg_get_userbyid(p.proowner),
    p.prosecdef,
    l.lanname,
    p.proconfig
  INTO v_hash, v_owner, v_secdef, v_lang, v_config
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_language l ON l.oid = p.prolang
  WHERE n.nspname = 'cr_order_private' AND p.proname = 'lifecycle_v2'
    AND p.oid = to_regprocedure('cr_order_private.lifecycle_v2(uuid,uuid,jsonb)');

  IF v_owner IS DISTINCT FROM 'cr_order_writer' THEN
    RAISE EXCEPTION 'A5_POSTCHECK_FAILED: cr_order_private.lifecycle_v2 must be owned by cr_order_writer, got %', v_owner;
  END IF;
  IF NOT v_secdef THEN
    RAISE EXCEPTION 'A5_POSTCHECK_FAILED: cr_order_private.lifecycle_v2 must be SECURITY DEFINER';
  END IF;
  IF v_lang IS DISTINCT FROM 'plpgsql' THEN
    RAISE EXCEPTION 'A5_POSTCHECK_FAILED: cr_order_private.lifecycle_v2 language must be plpgsql, got %', v_lang;
  END IF;
  IF v_config IS DISTINCT FROM ARRAY['search_path=""'] THEN
    RAISE EXCEPTION 'A5_POSTCHECK_FAILED: cr_order_private.lifecycle_v2 search_path must be empty';
  END IF;
  IF v_hash IS DISTINCT FROM '4e28f7c539e19f08bf1561b1dfc367f4370a1e732a1c341dbc61657a477ace6f' THEN
    RAISE EXCEPTION 'A5_POSTCHECK_FAILED: cr_order_private.lifecycle_v2 replacement hash mismatch: %', v_hash;
  END IF;
  IF NOT has_function_privilege('authenticated', to_regprocedure('cr_order_private.lifecycle_v2(uuid,uuid,jsonb)'), 'EXECUTE') THEN
    RAISE EXCEPTION 'A5_POSTCHECK_FAILED: authenticated must possess EXECUTE on cr_order_private.lifecycle_v2';
  END IF;
  IF has_function_privilege('anon', to_regprocedure('cr_order_private.lifecycle_v2(uuid,uuid,jsonb)'), 'EXECUTE')
     OR has_function_privilege('service_role', to_regprocedure('cr_order_private.lifecycle_v2(uuid,uuid,jsonb)'), 'EXECUTE') THEN
    RAISE EXCEPTION 'A5_POSTCHECK_FAILED: unexpected EXECUTE on cr_order_private.lifecycle_v2 for anon or service_role';
  END IF;
END $$;

-- Exact ACL contract: reject unknown grantees, PUBLIC, grantors and delegation.
-- Effective API checks additionally detect inherited EXECUTE permissions.
DO $$
DECLARE
  f record;
  actual_acl text[];
BEGIN
  FOR f IN SELECT * FROM (VALUES
    ('cr_order_private.session_uid_bridge()', 'postgres', ARRAY['cr_order_writer','postgres']::text[]),
    ('cr_order_private.actor()', 'postgres', ARRAY['authenticated','cr_order_writer','postgres']::text[]),
    ('cr_order_private.lifecycle_v2(uuid,uuid,jsonb)', 'cr_order_writer', ARRAY['authenticated','cr_order_writer']::text[])
  ) AS expected(signature, owner_name, grantees) LOOP
    SELECT array_agg(pg_get_userbyid(a.grantee)::text ORDER BY pg_get_userbyid(a.grantee)::text)
      INTO actual_acl
      FROM pg_proc p CROSS JOIN LATERAL aclexplode(coalesce(p.proacl, acldefault('f',p.proowner))) a
      WHERE p.oid=to_regprocedure(f.signature);
    IF actual_acl IS DISTINCT FROM f.grantees OR EXISTS (
      SELECT 1 FROM pg_proc p
      CROSS JOIN LATERAL aclexplode(coalesce(p.proacl, acldefault('f',p.proowner))) a
      WHERE p.oid=to_regprocedure(f.signature)
        AND (a.grantee=0 OR a.is_grantable OR a.privilege_type<>'EXECUTE'
          OR a.grantor<>(SELECT oid FROM pg_roles WHERE rolname=f.owner_name))
    ) THEN
      RAISE EXCEPTION 'A5_POSTCHECK_FAILED: unexpected ACL on %', f.signature;
    END IF;
    IF has_function_privilege('anon',to_regprocedure(f.signature),'EXECUTE')
      OR has_function_privilege('service_role',to_regprocedure(f.signature),'EXECUTE')
      OR (f.signature='cr_order_private.session_uid_bridge()'
        AND has_function_privilege('authenticated',to_regprocedure(f.signature),'EXECUTE')) THEN
      RAISE EXCEPTION 'A5_POSTCHECK_FAILED: unexpected effective EXECUTE on %', f.signature;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role')
      AND (pg_has_role(r.oid,'cr_order_writer','SET') OR pg_has_role(r.oid,'postgres','SET'))) THEN
      RAISE EXCEPTION 'A5_POSTCHECK_FAILED: API role can assume privileged owner';
    END IF;
  END LOOP;
END $$;

COMMIT;
