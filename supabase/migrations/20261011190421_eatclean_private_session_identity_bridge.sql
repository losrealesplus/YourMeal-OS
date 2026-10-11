-- Private identity bridge. Installation does not activate the staff order RPC.
-- No auth table reads, no auth grants, no guard ownership transfer.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
SET LOCAL ROLE postgres;
DO $$ BEGIN
 IF NOT has_schema_privilege(current_user,'auth','USAGE') OR NOT has_function_privilege(current_user,'auth.uid()','EXECUTE')
 THEN RAISE EXCEPTION 'BRIDGE_OWNER_AUTH_ACCESS_REQUIRED'; END IF;
 IF current_user IS DISTINCT FROM 'postgres' OR NOT pg_has_role(current_user,'cr_order_writer','SET')
 THEN RAISE EXCEPTION 'BRIDGE_REPLACEMENT_AUTHORITY_REQUIRED'; END IF;
END $$;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=to_regprocedure('cr_order_private.actor()') AND encode(sha256(convert_to(prosrc,'UTF8')),'hex')='2ef624d527ed4eee3dc2ec00fcf91be36ae0136f171f26b8199854958b2d779b') THEN RAISE EXCEPTION 'IDENTITY_BRIDGE_ACTOR_SOURCE_DRIFT'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=to_regprocedure('cr_order_private.guard_legacy_offer()') AND encode(sha256(convert_to(prosrc,'UTF8')),'hex')='0d256343c95c063c41b79f6c816fdaac411f1a87a960dfc166302a647d234b2c') THEN RAISE EXCEPTION 'IDENTITY_BRIDGE_GUARD_LEGACY_OFFER_SOURCE_DRIFT'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=to_regprocedure('cr_order_private.can_operate_custom_batch(uuid)') AND encode(sha256(convert_to(prosrc,'UTF8')),'hex')='796fa9a740313625ef08ada4b96024cbf45dc47c3732723e928c2b0785813876') THEN RAISE EXCEPTION 'IDENTITY_BRIDGE_CAN_OPERATE_CUSTOM_BATCH_SOURCE_DRIFT'; END IF;
 IF (SELECT pg_get_userbyid(proowner) FROM pg_proc WHERE oid='cr_order_private.guard_legacy_offer()'::regprocedure) IS DISTINCT FROM 'cr_order_writer' THEN RAISE EXCEPTION 'IDENTITY_BRIDGE_GUARD_OWNER_INVALID'; END IF;
END $$;
CREATE FUNCTION cr_order_private.session_uid_bridge() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT auth.uid() $$;
REVOKE ALL ON FUNCTION cr_order_private.session_uid_bridge() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION cr_order_private.session_uid_bridge() TO cr_order_writer;
-- The caller role is evaluated before entering the bridge, not inside it.
-- PL/pgSQL branches avoid resolving auth.uid() under a role lacking schema USAGE.
CREATE OR REPLACE FUNCTION cr_order_private.actor() RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF current_user='cr_order_writer' THEN
  RETURN coalesce(cr_order_private.session_uid_bridge(),nullif(current_setting('cr_order.verified_actor',true),'')::uuid);
 END IF;
 RETURN auth.uid();
END $$;
-- This RLS predicate must retain auth.uid semantics (no verified_actor fallback).
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
CREATE OR REPLACE FUNCTION cr_order_private.guard_legacy_offer() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid; week date; version integer; n integer; explicit boolean; customer_user uuid; menu_id uuid; BEGIN
 SELECT week_start,write_contract_version INTO week,version FROM public.orders WHERE tenant_id=NEW.tenant_id AND id=NEW.order_id;
 -- Alphabetically prior cr_order_v2_item_guard rejects every non-core v2 mutation.
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
 SELECT count(*),bool_or(s.unit_price IS NOT NULL) INTO n,explicit FROM public.weekly_menu_slots s JOIN public.weekly_menus m ON m.id=s.weekly_menu_id AND m.tenant_id=s.tenant_id JOIN public.dishes d ON d.id=s.dish_id AND d.tenant_id=s.tenant_id
 WHERE s.tenant_id=NEW.tenant_id AND m.week_start=week AND m.status='published' AND m.deleted_at IS NULL AND s.day_date=NEW.day_date AND s.dish_id=NEW.dish_id AND d.status='active' AND d.deleted_at IS NULL;
 IF n=0 THEN RAISE EXCEPTION 'OFFER_NOT_FOUND'; ELSIF n<>1 THEN RAISE EXCEPTION 'OFFER_AMBIGUOUS'; END IF;
 IF explicit THEN RAISE EXCEPTION 'OFFER_PRICING_QUOTE_REQUIRED'; END IF;
 RETURN NEW;
END $$;
DO $$ BEGIN
 IF (SELECT pg_get_userbyid(proowner) FROM pg_proc WHERE oid='cr_order_private.guard_legacy_offer()'::regprocedure) IS DISTINCT FROM 'cr_order_writer'
 THEN RAISE EXCEPTION 'IDENTITY_BRIDGE_GUARD_OWNER_CHANGED'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.capture_staff_existing_order(uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
