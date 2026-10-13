-- EatClean server offer pricing enforcement & DDL security hardening.
-- Preserves V2 canonical quote contract: legacy writers cannot write explicit offers.
-- All authoritative offer pricing flows exclusively through canonical V2 (cr_order_offer_quote_issue & cr_order_offer_quote_commit).
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

-- 2. Update lifecycle identity checks to use cr_order_private.actor() (session_uid_bridge)
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

COMMIT;
