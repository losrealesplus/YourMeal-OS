-- Forward-only candidate migration: bridge custom batch transition & serialization trigger identity to cr_order_private.can_operate_custom_batch() / cr_order_private.actor().
-- Resolves "permission denied for schema auth" when cr_order_writer executes custom_batch_transition and serialize_batch.
-- Preserves all state invariants, operational evidence, audit logging, and idempotency contracts.
-- Does NOT grant schema auth USAGE to cr_order_writer; preserves strict security separation.
-- Includes full fail-closed drift detection and exact ACL contract across all involved functions, owners, languages, search paths, and grant options.

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
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: caller must be postgres with SET on cr_order_writer';
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
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: session_uid_bridge() not found';
  END IF;
  IF v_hash IS DISTINCT FROM 'c628b78ce1d2a3b15ddbaf7b0a5838fa26c925d332103e53f34ba73b9b227604' THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: session_uid_bridge() source hash drift: expected c628b78ce1d2a3b15ddbaf7b0a5838fa26c925d332103e53f34ba73b9b227604, got %', v_hash;
  END IF;
  IF v_owner IS DISTINCT FROM 'postgres' THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: session_uid_bridge() owner must be postgres, got %', v_owner;
  END IF;
  IF NOT v_secdef THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: session_uid_bridge() must be SECURITY DEFINER';
  END IF;
  IF v_lang IS DISTINCT FROM 'sql' THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: session_uid_bridge() language must be sql, got %', v_lang;
  END IF;
  IF v_config IS DISTINCT FROM ARRAY['search_path=""'] THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: session_uid_bridge() search_path must be empty, got %', array_to_string(v_config, ',');
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
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: actor() not found';
  END IF;
  IF v_hash IS DISTINCT FROM '9094c00b9605600a6e5329dc1d7c2ac7aced0ef57c08b3e83f3b9e02d477894c' THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: actor() source hash drift: expected 9094c00b9605600a6e5329dc1d7c2ac7aced0ef57c08b3e83f3b9e02d477894c, got %', v_hash;
  END IF;
  IF v_owner IS DISTINCT FROM 'postgres' THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: actor() owner must be postgres, got %', v_owner;
  END IF;
  IF v_secdef THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: actor() must be SECURITY INVOKER';
  END IF;
  IF v_lang IS DISTINCT FROM 'plpgsql' THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: actor() language must be plpgsql, got %', v_lang;
  END IF;
  IF v_config IS DISTINCT FROM ARRAY['search_path=""'] THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: actor() search_path must be empty, got %', array_to_string(v_config, ',');
  END IF;

  -- 4. Validate cr_order_private.can_operate_custom_batch(uuid) definition & attributes
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
  WHERE n.nspname = 'cr_order_private' AND p.proname = 'can_operate_custom_batch'
    AND p.oid = to_regprocedure('cr_order_private.can_operate_custom_batch(uuid)');

  IF v_hash IS NULL THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: can_operate_custom_batch() not found';
  END IF;
  IF v_hash IS DISTINCT FROM '9177bccac3e088123d5fc039fb5eedc3b2929be871fa761ebab4f207f9384860' THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: can_operate_custom_batch() source hash drift: expected 9177bccac3e088123d5fc039fb5eedc3b2929be871fa761ebab4f207f9384860, got %', v_hash;
  END IF;
  IF v_owner IS DISTINCT FROM 'postgres' THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: can_operate_custom_batch() owner must be postgres, got %', v_owner;
  END IF;
  IF v_secdef THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: can_operate_custom_batch() must be SECURITY INVOKER';
  END IF;
  IF v_lang IS DISTINCT FROM 'plpgsql' THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: can_operate_custom_batch() language must be plpgsql, got %', v_lang;
  END IF;
  IF v_config IS DISTINCT FROM ARRAY['search_path=""'] THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: can_operate_custom_batch() search_path must be empty, got %', array_to_string(v_config, ',');
  END IF;

  -- 5. Validate cr_order_private.serialize_batch() baseline hash and attributes
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
  WHERE n.nspname = 'cr_order_private' AND p.proname = 'serialize_batch'
    AND p.oid = to_regprocedure('cr_order_private.serialize_batch()');

  IF v_hash IS NULL THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: serialize_batch() not found';
  END IF;
  IF v_hash IS DISTINCT FROM '1bcd59f09d76b09081656e99157e3ecf29968911afff6d4c07b2a2655f40a0b1' THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: serialize_batch source hash drift: expected 1bcd59f09d76b09081656e99157e3ecf29968911afff6d4c07b2a2655f40a0b1, got %', v_hash;
  END IF;
  IF v_owner IS DISTINCT FROM 'postgres' THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: serialize_batch owner must be postgres, got %', v_owner;
  END IF;
  IF v_secdef THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: serialize_batch must be SECURITY INVOKER';
  END IF;
  IF v_lang IS DISTINCT FROM 'plpgsql' THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: serialize_batch language must be plpgsql, got %', v_lang;
  END IF;
  IF v_config IS DISTINCT FROM ARRAY['search_path=""'] THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: serialize_batch search_path must be empty, got %', array_to_string(v_config, ',');
  END IF;

  -- 6. Validate cr_order_private.custom_batch_transition baseline hash and attributes
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
  WHERE n.nspname = 'cr_order_private' AND p.proname = 'custom_batch_transition'
    AND p.oid = to_regprocedure('cr_order_private.custom_batch_transition(uuid,uuid,date,text)');

  IF v_hash IS NULL THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: custom_batch_transition not found';
  END IF;
  IF v_hash IS DISTINCT FROM '8ac980cb557b250118098c8dabaab045c9ab2fe8c8da74048267d28f38025613' THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: custom_batch_transition source hash drift: expected 8ac980cb557b250118098c8dabaab045c9ab2fe8c8da74048267d28f38025613, got %', v_hash;
  END IF;
  IF v_owner IS DISTINCT FROM 'cr_order_writer' THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: custom_batch_transition owner must be cr_order_writer, got %', v_owner;
  END IF;
  IF NOT v_secdef THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: custom_batch_transition must be SECURITY DEFINER';
  END IF;
  IF v_lang IS DISTINCT FROM 'plpgsql' THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: custom_batch_transition language must be plpgsql, got %', v_lang;
  END IF;
  IF v_config IS DISTINCT FROM ARRAY['search_path=""'] THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: custom_batch_transition search_path must be empty, got %', array_to_string(v_config, ',');
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- PRECHECKS: EXACT ACL & GRANT OPTION CONTRACT
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  f record;
  actual_acl text[];
BEGIN
  FOR f IN SELECT * FROM (VALUES
    ('cr_order_private.session_uid_bridge()', 'postgres', ARRAY['cr_order_writer','postgres']::text[]),
    ('cr_order_private.actor()', 'postgres', ARRAY['cr_order_writer','postgres']::text[]),
    ('cr_order_private.can_operate_custom_batch(uuid)', 'postgres', ARRAY['cr_order_writer','postgres']::text[]),
    ('cr_order_private.serialize_batch()', 'postgres', ARRAY['postgres']::text[]),
    ('cr_order_private.custom_batch_transition(uuid,uuid,date,text)', 'cr_order_writer', ARRAY['authenticated','cr_order_writer']::text[])
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
      RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: unexpected ACL on %', f.signature;
    END IF;
    IF has_function_privilege('anon',to_regprocedure(f.signature),'EXECUTE')
      OR has_function_privilege('service_role',to_regprocedure(f.signature),'EXECUTE')
      OR (f.signature IN ('cr_order_private.session_uid_bridge()', 'cr_order_private.actor()', 'cr_order_private.can_operate_custom_batch(uuid)', 'cr_order_private.serialize_batch()')
        AND has_function_privilege('authenticated',to_regprocedure(f.signature),'EXECUTE')) THEN
      RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: unexpected effective EXECUTE on %', f.signature;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role')
      AND (pg_has_role(r.oid,'cr_order_writer','SET') OR pg_has_role(r.oid,'postgres','SET'))) THEN
      RAISE EXCEPTION 'CUSTOM_BATCH_PRECHECK_FAILED: API role can assume privileged owner';
    END IF;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- REPLACEMENT 1: cr_order_private.serialize_batch()
-- Route kitchen batch authorization through cr_order_private.can_operate_custom_batch()
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cr_order_private.serialize_batch() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE keys text[]:='{}'; k text; BEGIN
 IF TG_OP<>'INSERT' THEN keys:=array_append(keys,'cr-order-day:'||OLD.tenant_id||':'||to_char(OLD.delivery_date,'YYYY-MM-DD')||':'||CASE WHEN OLD.item_kind='custom' THEN 'custom:'||OLD.custom_order_item_id ELSE 'dish:'||OLD.dish_id END); END IF;
 IF TG_OP<>'DELETE' THEN keys:=array_append(keys,'cr-order-day:'||NEW.tenant_id||':'||to_char(NEW.delivery_date,'YYYY-MM-DD')||':'||CASE WHEN NEW.item_kind='custom' THEN 'custom:'||NEW.custom_order_item_id ELSE 'dish:'||NEW.dish_id END); END IF;
 FOR k IN SELECT DISTINCT x FROM unnest(keys)x ORDER BY x LOOP PERFORM pg_advisory_xact_lock(hashtextextended(k,0)); END LOOP;
 IF TG_OP='DELETE' THEN
  IF OLD.item_kind='custom' THEN RAISE EXCEPTION 'CUSTOM_HARD_DELETE_FORBIDDEN'; END IF;
  RETURN OLD;
 END IF;
 IF TG_OP='UPDATE' AND (OLD.id IS DISTINCT FROM NEW.id OR OLD.tenant_id IS DISTINCT FROM NEW.tenant_id OR OLD.item_kind IS DISTINCT FROM NEW.item_kind OR OLD.dish_id IS DISTINCT FROM NEW.dish_id OR OLD.custom_order_item_id IS DISTINCT FROM NEW.custom_order_item_id OR OLD.delivery_date IS DISTINCT FROM NEW.delivery_date) THEN RAISE EXCEPTION 'BATCH_IDENTITY_IMMUTABLE'; END IF;
 IF NEW.item_kind='custom' THEN
  IF current_user<>'cr_order_writer' OR NOT cr_order_private.can_operate_custom_batch(NEW.tenant_id) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
  PERFORM 1 FROM public.order_items WHERE tenant_id=NEW.tenant_id AND id=NEW.custom_order_item_id AND item_kind='custom' AND day_date=NEW.delivery_date AND deleted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'CUSTOM_BATCH_ITEM_INVALID'; END IF;
 END IF;
 RETURN NEW;
END $$;

-- -----------------------------------------------------------------------------
-- REPLACEMENT 2: cr_order_private.custom_batch_transition()
-- Route actor identity through cr_order_private.actor() (session_uid_bridge)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cr_order_private.custom_batch_transition(_tenant_id uuid,_order_item_id uuid,_delivery_date date,_to_status text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE item public.order_items; order_row public.orders; batch public.kitchen_production_batches; allowed text; actor_id uuid; BEGIN
 IF current_setting('role',true) IS DISTINCT FROM 'authenticated' OR NOT cr_order_private.can_operate_custom_batch(_tenant_id) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 actor_id := cr_order_private.actor();
 IF actor_id IS NULL THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
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
  VALUES(_tenant_id,'custom',NULL,_order_item_id,_delivery_date,_to_status::public.kitchen_batch_status,actor_id,CASE WHEN _to_status='preparing' THEN now() END) RETURNING * INTO batch;
 ELSE
  allowed:=CASE batch.status::text WHEN 'pending' THEN 'preparing' WHEN 'preparing' THEN 'plating' WHEN 'plating' THEN 'finished' END;
  IF _to_status=batch.status::text THEN RETURN to_jsonb(batch); END IF;
  IF _to_status IS DISTINCT FROM allowed THEN RAISE EXCEPTION 'BATCH_TRANSITION_INVALID'; END IF;
  UPDATE public.kitchen_production_batches SET status=_to_status::public.kitchen_batch_status,updated_by=actor_id,started_at=CASE WHEN _to_status='preparing' THEN now() ELSE started_at END,finished_at=CASE WHEN _to_status='finished' THEN now() ELSE finished_at END WHERE id=batch.id AND tenant_id=_tenant_id RETURNING * INTO batch;
 END IF;
 INSERT INTO public.audit_log(tenant_id,actor_id,entity_type,entity_id,action,new_data) VALUES(_tenant_id,actor_id,'kitchen_batch',batch.id,'custom.batch.transition',jsonb_build_object('orderItemId',_order_item_id,'status',_to_status,'deliveryDate',_delivery_date));
 RETURN to_jsonb(batch);
END $$;

-- -----------------------------------------------------------------------------
-- POSTCHECKS: INTEGRITY & ATTRIBUTES
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_hash text;
  v_owner text;
  v_secdef boolean;
  v_lang text;
  v_config text[];
BEGIN
  -- 1. Check serialize_batch post-replacement
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
  WHERE n.nspname = 'cr_order_private' AND p.proname = 'serialize_batch'
    AND p.oid = to_regprocedure('cr_order_private.serialize_batch()');

  IF v_hash IS DISTINCT FROM 'e2a46e830748cecfbb4479f371a5d23bc67aa688019ffdeb3f7bd6fd8b7f1f1c' THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_POSTCHECK_FAILED: serialize_batch replacement hash mismatch: %', v_hash;
  END IF;
  IF v_owner IS DISTINCT FROM 'postgres' THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_POSTCHECK_FAILED: serialize_batch owner must be postgres, got %', v_owner;
  END IF;
  IF v_secdef THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_POSTCHECK_FAILED: serialize_batch must be SECURITY INVOKER';
  END IF;
  IF v_lang IS DISTINCT FROM 'plpgsql' THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_POSTCHECK_FAILED: serialize_batch language must be plpgsql, got %', v_lang;
  END IF;
  IF v_config IS DISTINCT FROM ARRAY['search_path=""'] THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_POSTCHECK_FAILED: serialize_batch search_path must be empty, got %', array_to_string(v_config, ',');
  END IF;

  -- 2. Check custom_batch_transition post-replacement
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
  WHERE n.nspname = 'cr_order_private' AND p.proname = 'custom_batch_transition'
    AND p.oid = to_regprocedure('cr_order_private.custom_batch_transition(uuid,uuid,date,text)');

  IF v_hash IS DISTINCT FROM '3706054148ecf70327e2998967133899f48085c7225df79f486c356bd3a91a12' THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_POSTCHECK_FAILED: custom_batch_transition replacement hash mismatch: %', v_hash;
  END IF;
  IF v_owner IS DISTINCT FROM 'cr_order_writer' THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_POSTCHECK_FAILED: custom_batch_transition owner must be cr_order_writer, got %', v_owner;
  END IF;
  IF NOT v_secdef THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_POSTCHECK_FAILED: custom_batch_transition must be SECURITY DEFINER';
  END IF;
  IF v_lang IS DISTINCT FROM 'plpgsql' THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_POSTCHECK_FAILED: custom_batch_transition language must be plpgsql, got %', v_lang;
  END IF;
  IF v_config IS DISTINCT FROM ARRAY['search_path=""'] THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_POSTCHECK_FAILED: custom_batch_transition search_path must be empty, got %', array_to_string(v_config, ',');
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- POSTCHECKS: EXACT ACL & GRANT OPTION CONTRACT
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  f record;
  actual_acl text[];
BEGIN
  FOR f IN SELECT * FROM (VALUES
    ('cr_order_private.session_uid_bridge()', 'postgres', ARRAY['cr_order_writer','postgres']::text[]),
    ('cr_order_private.actor()', 'postgres', ARRAY['cr_order_writer','postgres']::text[]),
    ('cr_order_private.can_operate_custom_batch(uuid)', 'postgres', ARRAY['cr_order_writer','postgres']::text[]),
    ('cr_order_private.serialize_batch()', 'postgres', ARRAY['postgres']::text[]),
    ('cr_order_private.custom_batch_transition(uuid,uuid,date,text)', 'cr_order_writer', ARRAY['authenticated','cr_order_writer']::text[])
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
      RAISE EXCEPTION 'CUSTOM_BATCH_POSTCHECK_FAILED: unexpected ACL on %', f.signature;
    END IF;
    IF has_function_privilege('anon',to_regprocedure(f.signature),'EXECUTE')
      OR has_function_privilege('service_role',to_regprocedure(f.signature),'EXECUTE')
      OR (f.signature IN ('cr_order_private.session_uid_bridge()', 'cr_order_private.actor()', 'cr_order_private.can_operate_custom_batch(uuid)', 'cr_order_private.serialize_batch()')
        AND has_function_privilege('authenticated',to_regprocedure(f.signature),'EXECUTE')) THEN
      RAISE EXCEPTION 'CUSTOM_BATCH_POSTCHECK_FAILED: unexpected effective EXECUTE on %', f.signature;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles r WHERE r.rolname IN ('anon','authenticated','service_role')
      AND (pg_has_role(r.oid,'cr_order_writer','SET') OR pg_has_role(r.oid,'postgres','SET'))) THEN
      RAISE EXCEPTION 'CUSTOM_BATCH_POSTCHECK_FAILED: API role can assume privileged owner';
    END IF;
  END LOOP;

  -- Ensure cr_order_writer has NOT received auth schema privileges
  IF has_schema_privilege('cr_order_writer', 'auth', 'USAGE') THEN
    RAISE EXCEPTION 'CUSTOM_BATCH_POSTCHECK_FAILED: cr_order_writer must NOT have auth schema USAGE';
  END IF;
END $$;

COMMIT;
