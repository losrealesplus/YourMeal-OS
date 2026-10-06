-- CR-MENU M3 / ADR0103. Individual line pricing mode & OP08 published offer protection.
-- Depends on A4a 20261006072046 and M2 20261005174256.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';

CREATE SCHEMA IF NOT EXISTS cr_menu_private;
REVOKE ALL ON SCHEMA cr_menu_private FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA cr_menu_private TO service_role;

-- 1. Updated offer_state accepting explicit commercial_mode string
CREATE OR REPLACE FUNCTION cr_order_private.offer_state(
  _tenant uuid,
  _command jsonb,
  _commercial_mode text
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
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
BEGIN
  mode := coalesce(_commercial_mode, 'commercial_inactive');
  IF jsonb_typeof(_command->'lines') IS DISTINCT FROM 'array' OR jsonb_array_length(_command->'lines')=0 THEN
    RAISE EXCEPTION 'INPUT_INVALID';
  END IF;

  IF EXISTS(SELECT 1 FROM jsonb_array_elements(_command->'lines') x WHERE x->>'kind'='custom') THEN
    PERFORM cr_order_private.require_custom(_tenant, coalesce(auth.uid(), nullif(current_setting('cr_order.verified_actor', true), '')::uuid));
  END IF;

  IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(_command->'lines') x WHERE x->>'kind'='dish') THEN
    RAISE EXCEPTION 'CUSTOM_ONLY_NO_OFFER_QUOTE';
  END IF;

  SELECT * INTO menu FROM public.weekly_menus
   WHERE tenant_id=_tenant AND week_start=(_command->>'weekStart')::date AND status='published' AND deleted_at IS NULL
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'OFFER_NOT_FOUND'; END IF;

  PERFORM id FROM public.weekly_menu_slots
   WHERE tenant_id=_tenant AND weekly_menu_id=menu.id
   ORDER BY id FOR UPDATE;

  FOR line IN SELECT * FROM jsonb_array_elements(_command->'lines') LOOP
    IF line->>'kind'='custom' THEN CONTINUE; END IF;
    IF line->>'kind' IS DISTINCT FROM 'dish' OR line ?| ARRAY['unitPrice','price','commercialInactive','isExtra','unitPriceOverride'] THEN
      RAISE EXCEPTION 'OFFER_PRICING_OVERRIDE_UNSUPPORTED';
    END IF;

    IF coalesce(line->>'qty','') !~ '^[1-9][0-9]*$' OR (line->>'dayDate')::date<menu.week_start OR (line->>'dayDate')::date>menu.week_start+6 THEN
      RAISE EXCEPTION 'INPUT_INVALID';
    END IF;

    SELECT * INTO dish FROM public.dishes
     WHERE tenant_id=_tenant AND id=(line->>'dishId')::uuid AND status='active' AND deleted_at IS NULL
     FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'OFFER_NOT_FOUND'; END IF;

    SELECT count(*) INTO candidates FROM public.weekly_menu_slots
     WHERE tenant_id=_tenant AND weekly_menu_id=menu.id AND dish_id=dish.id AND day_date=(line->>'dayDate')::date
       AND (NOT line ? 'slotId' OR id=(line->>'slotId')::uuid);
    IF candidates=0 THEN
      RAISE EXCEPTION 'OFFER_NOT_FOUND';
    ELSIF candidates<>1 THEN
      RAISE EXCEPTION 'OFFER_AMBIGUOUS';
    END IF;

    SELECT * INTO slot FROM public.weekly_menu_slots
     WHERE tenant_id=_tenant AND weekly_menu_id=menu.id AND dish_id=dish.id AND day_date=(line->>'dayDate')::date
       AND (NOT line ? 'slotId' OR id=(line->>'slotId')::uuid);

    -- Commercial mode checks:
    -- In individual_line_pricing_v1 and commercial_inactive, explicit slot price is accepted.
    -- In unsupported commercial modes (weekly_plan, monthly_plan, packages, etc.), explicit slot price fails closed.
    IF mode NOT IN ('commercial_inactive', 'individual_line_pricing_v1') THEN
      IF slot.unit_price IS NOT NULL THEN
        RAISE EXCEPTION 'OFFER_PRICING_COMMERCIAL_UNSUPPORTED';
      END IF;
      RAISE EXCEPTION 'COMMERCIAL_QUOTE_REQUIRED';
    END IF;

    IF slot.unit_price IS NOT NULL AND (slot.unit_price<0 OR slot.unit_price IN ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric) OR slot.unit_price>99999999.9999 OR slot.unit_price<>round(slot.unit_price,4)) THEN
      RAISE EXCEPTION 'PRICE_UNAVAILABLE';
    END IF;

    IF dish.price IS NULL OR dish.price<0 OR dish.price IN ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric) OR dish.price>99999999.9999 OR dish.price<>round(dish.price,4) THEN
      RAISE EXCEPTION 'PRICE_UNAVAILABLE';
    END IF;

    p := coalesce(slot.unit_price, dish.price);
    source := CASE WHEN slot.unit_price IS NULL THEN 'catalogue' ELSE 'slot' END;
    old_item := NULL;

    IF line ? 'lineId' THEN
      IF _command->>'operation'<>'modify' THEN RAISE EXCEPTION 'LINE_ID_INVALID'; END IF;
      SELECT * INTO old_item FROM public.order_items
       WHERE tenant_id=_tenant AND order_id=(_command->>'orderId')::uuid AND id=(line->>'lineId')::uuid AND dish_id=dish.id AND item_kind='dish' AND deleted_at IS NULL
       FOR SHARE;
      IF NOT FOUND THEN RAISE EXCEPTION 'LINE_ID_INVALID'; END IF;
      IF old_item.unit_price IS NULL OR old_item.price_snapshot_status NOT IN ('captured','explicit_zero') THEN
        RAISE EXCEPTION 'PRICE_UNAVAILABLE';
      END IF;
      p := old_item.unit_price;
      source := 'captured_snapshot';
    END IF;

    IF p=0 AND old_item.id IS NULL THEN
      IF slot.unit_price IS NULL THEN RAISE EXCEPTION 'PRICE_UNAVAILABLE'; END IF;
      IF line->'explicitZeroConfirmed' IS DISTINCT FROM 'true'::jsonb THEN
        RAISE EXCEPTION 'EXPLICIT_ZERO_CONFIRMATION_REQUIRED';
      END IF;
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
      'menuState', jsonb_build_object('weekStart', menu.week_start, 'status', menu.status, 'publishedAt', menu.published_at),
      'dishState', jsonb_build_object('name', dish.name, 'description', dish.description, 'allergens', dish.allergens, 'status', dish.status, 'price', dish.price, 'deletedAt', dish.deleted_at)
    ));
  END LOOP;
  RETURN result;
END $$;

-- 2. Backward compatibility wrapper for boolean commercial_active
CREATE OR REPLACE FUNCTION cr_order_private.offer_state(
  _tenant uuid,
  _command jsonb,
  _commercial_active boolean
) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
  SELECT cr_order_private.offer_state(
    _tenant,
    _command,
    CASE WHEN _commercial_active THEN 'weekly_plan' ELSE 'commercial_inactive' END
  );
$$;

-- 3. Updated quote issue
CREATE OR REPLACE FUNCTION public.cr_order_offer_quote_issue(
  _tenant_id uuid,
  _actor_id uuid,
  _request_id uuid,
  _command jsonb,
  _commercial_context jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE
  state jsonb;
  q cr_order_private.offer_quotes;
  h text;
  mode text;
BEGIN
  PERFORM cr_order_private.check_offer_actor(_tenant_id, _actor_id, _command);
  IF _request_id IS NULL OR coalesce(_commercial_context->>'policyHash','') !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'INPUT_INVALID';
  END IF;

  mode := coalesce(
    _commercial_context->>'mode',
    CASE WHEN coalesce((_commercial_context->>'active')::boolean, false) THEN 'weekly_plan' ELSE 'commercial_inactive' END
  );

  state := cr_order_private.offer_state(_tenant_id, _command, mode);

  h := encode(sha256(convert_to(_command::text, 'UTF8')), 'hex');
  INSERT INTO cr_order_private.offer_quotes(tenant_id, actor_id, request_id, command_hash, policy_hash, lines, state)
  VALUES(_tenant_id, _actor_id, _request_id, h, _commercial_context->>'policyHash', state, state)
  RETURNING * INTO q;

  RETURN jsonb_build_object(
    'quoteId', q.id,
    'expiresAt', q.expires_at,
    'policyHash', q.policy_hash,
    'total', (SELECT to_char(round(sum((l->>'unitPrice')::numeric * (l->>'qty')::numeric), 2), 'FM999999990.00') FROM jsonb_array_elements(state) l),
    'lines', (SELECT jsonb_agg(jsonb_build_object(
      'slotId', l->'slotId',
      'menuId', l->'menuId',
      'dishId', l->'dishId',
      'dayDate', l->'dayDate',
      'qty', (l->>'qty')::integer,
      'basePrice', l->'basePrice',
      'slotPrice', CASE WHEN l->'slotPrice'='null'::jsonb THEN NULL ELSE l->'slotPrice' END,
      'unitPrice', l->'unitPrice',
      'priceSource', l->'priceSource',
      'priceSnapshotStatus', l->'priceSnapshotStatus'
    )) FROM jsonb_array_elements(state) l)
  );
END $$;

-- 4. Updated quote commit
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
    VALUES(_tenant_id, _actor_id, 'order', result->'order'->>'id', 'order.offer.capture', jsonb_build_object('quoteId', q.id, 'requestId', _request_id, 'provenance', q.lines));
  END IF;

  RETURN result;
END $$;

-- 5. OP08 Published Offer Price Protection Trigger
CREATE OR REPLACE FUNCTION cr_menu_private.protect_published_weekly_menu_slots()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE
  menu_status text;
BEGIN
  IF OLD.unit_price IS DISTINCT FROM NEW.unit_price THEN
    SELECT status INTO menu_status FROM public.weekly_menus WHERE id=OLD.weekly_menu_id AND tenant_id=OLD.tenant_id;
    IF menu_status = 'published' THEN
      IF coalesce(current_setting('cr_menu.remediation_active', true), 'false') IS DISTINCT FROM 'true' THEN
        RAISE EXCEPTION 'PUBLISHED_OFFER_PRICE_MODIFICATION_BLOCKED';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS protect_published_slots ON public.weekly_menu_slots;
CREATE TRIGGER protect_published_slots
  BEFORE UPDATE ON public.weekly_menu_slots
  FOR EACH ROW EXECUTE FUNCTION cr_menu_private.protect_published_weekly_menu_slots();

-- 5. OP08 Published Offer Price Remediation RPC
CREATE OR REPLACE FUNCTION public.cr_menu_published_offer_price_remediation(
  _tenant_id uuid,
  _actor_id uuid,
  _request_id uuid,
  _manifest jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE
  staff boolean;
  item jsonb;
  slot_row public.weekly_menu_slots;
  menu_row public.weekly_menus;
  remediated_count integer := 0;
  expected_old numeric;
  new_p numeric;
  manifest_hash text;
  calc_hash text;
  old_val text;
BEGIN
  IF current_setting('role', true) IS DISTINCT FROM 'service_role' OR _actor_id IS NULL OR _tenant_id IS NULL THEN
    RAISE EXCEPTION 'PERMISSION_DENIED';
  END IF;

  staff := public.is_saas_admin(_actor_id)
        OR public.has_role(_actor_id, _tenant_id, 'company_admin')
        OR public.has_role(_actor_id, _tenant_id, 'operations_manager');
  IF NOT staff THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;

  IF _manifest->>'manifestVersion' IS DISTINCT FROM 'v1'
     OR (_manifest->>'tenantId')::uuid IS DISTINCT FROM _tenant_id
     OR jsonb_typeof(_manifest->'items') IS DISTINCT FROM 'array'
     OR jsonb_array_length(_manifest->'items') = 0
     OR coalesce(_manifest->>'reason', '') = '' THEN
    RAISE EXCEPTION 'INPUT_INVALID';
  END IF;

  manifest_hash := _manifest->>'manifestHash';
  IF manifest_hash IS NULL OR manifest_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'INPUT_INVALID';
  END IF;

  -- Verify all items and lock them atomically
  FOR item IN SELECT * FROM jsonb_array_elements(_manifest->'items') LOOP
    SELECT * INTO menu_row FROM public.weekly_menus
     WHERE id=(item->>'menuId')::uuid AND tenant_id=_tenant_id AND status='published' AND deleted_at IS NULL
     FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'REMEDIATION_MANIFEST_MISMATCH'; END IF;

    SELECT * INTO slot_row FROM public.weekly_menu_slots
     WHERE id=(item->>'slotId')::uuid AND weekly_menu_id=menu_row.id AND tenant_id=_tenant_id
       AND dish_id=(item->>'dishId')::uuid AND day_date=(item->>'dayDate')::date
     FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'REMEDIATION_MANIFEST_MISMATCH'; END IF;

    IF item->>'expectedOldPrice' IS NULL THEN
      IF slot_row.unit_price IS NOT NULL THEN
        RAISE EXCEPTION 'REMEDIATION_EXPECTED_PRICE_MISMATCH';
      END IF;
    ELSE
      expected_old := (item->>'expectedOldPrice')::numeric;
      IF slot_row.unit_price IS NULL OR slot_row.unit_price <> expected_old THEN
        RAISE EXCEPTION 'REMEDIATION_EXPECTED_PRICE_MISMATCH';
      END IF;
    END IF;

    new_p := (item->>'newPrice')::numeric;
    IF new_p IS NULL OR new_p < 0 OR new_p IN ('NaN'::numeric, 'Infinity'::numeric, '-Infinity'::numeric)
       OR new_p > 99999999.9999 OR new_p <> round(new_p, 4) THEN
      RAISE EXCEPTION 'PRICE_UNAVAILABLE';
    END IF;
  END LOOP;

  -- Apply updates within privileged remediation context
  PERFORM set_config('cr_menu.remediation_active', 'true', true);

  FOR item IN SELECT * FROM jsonb_array_elements(_manifest->'items') LOOP
    SELECT unit_price::text INTO old_val FROM public.weekly_menu_slots WHERE id=(item->>'slotId')::uuid;

    UPDATE public.weekly_menu_slots
       SET unit_price = (item->>'newPrice')::numeric
     WHERE id=(item->>'slotId')::uuid AND tenant_id=_tenant_id;

    remediated_count := remediated_count + 1;

    -- Append-only audit log
    INSERT INTO public.audit_log(tenant_id, actor_id, action, entity_type, entity_id, old_data, new_data)
    VALUES(
      _tenant_id,
      _actor_id,
      'published_offer_price_remediation',
      'weekly_menu_slot',
      (item->>'slotId')::text,
      jsonb_build_object('unitPrice', old_val),
      jsonb_build_object(
        'unitPrice', item->>'newPrice',
        'requestId', _request_id,
        'manifestHash', manifest_hash,
        'reason', _manifest->>'reason',
        'menuId', item->>'menuId',
        'dishId', item->>'dishId',
        'dayDate', item->>'dayDate'
      )
    );
  END LOOP;

  PERFORM set_config('cr_menu.remediation_active', 'false', true);

  RETURN jsonb_build_object(
    'success', true,
    'remediatedCount', remediated_count,
    'manifestHash', manifest_hash
  );
END $$;

GRANT EXECUTE ON FUNCTION public.cr_menu_published_offer_price_remediation(uuid,uuid,uuid,jsonb) TO service_role;

COMMIT;
