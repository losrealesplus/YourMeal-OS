-- CR-ORDER / P0: Customer Approved Membership Order Authorization
-- Forward migration: Authorizes B2C customers with approved tenant membership (ADR 0064 & ADR 0065)
-- to quote and commit canonical orders in cr_order_private without requiring explicit user_roles records.
-- Security Invariants:
--   1. Strict tenant boundary: tenant_members.tenant_id = _tenant AND status = 'approved' AND membership_type = 'customer' AND deleted_at IS NULL.
--   2. Strict identity boundary: _actor must match auth.uid() when set; orders.customer_id must belong to _actor.
--   3. Non-staff defense-in-depth: custom lines, off-menu items, autoConfirm, and dietary overrides remain strictly forbidden.
--   4. is_staff remains unchanged: limited to saas_admin, company_admin, and operations_manager.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- 1. Update cr_order_private.can_write to recognize approved customer membership
CREATE OR REPLACE FUNCTION cr_order_private.can_write(_tenant uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER
SET search_path='' AS $$
 SELECT cr_order_private.actor() IS NOT NULL AND (
   public.is_saas_admin(cr_order_private.actor()) OR (
     EXISTS(SELECT 1 FROM public.tenant_members m WHERE m.tenant_id=_tenant AND m.user_id=cr_order_private.actor()
       AND m.status='approved' AND m.deleted_at IS NULL)
     AND (public.has_role(cr_order_private.actor(),_tenant,'company_admin')
       OR public.has_role(cr_order_private.actor(),_tenant,'operations_manager')
       OR public.has_role(cr_order_private.actor(),_tenant,'customer')
       OR EXISTS(SELECT 1 FROM public.tenant_members m WHERE m.tenant_id=_tenant AND m.user_id=cr_order_private.actor()
         AND m.status='approved' AND m.membership_type='customer' AND m.deleted_at IS NULL))
   )
 )
$$;

GRANT EXECUTE ON FUNCTION cr_order_private.can_write(uuid) TO cr_order_writer, service_role, authenticated;

-- 2. Update cr_order_private.check_offer_actor to recognize approved customer membership
CREATE OR REPLACE FUNCTION cr_order_private.check_offer_actor(_tenant uuid,_actor uuid,_command jsonb) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE staff boolean; customer_user uuid; BEGIN
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
 ELSIF _command->>'operation'='modify' THEN
   SELECT c.user_id INTO customer_user FROM public.orders o JOIN public.customers c ON c.id=o.customer_id AND c.tenant_id=o.tenant_id
    WHERE o.tenant_id=_tenant AND o.id=(_command->>'orderId')::uuid AND o.deleted_at IS NULL AND c.deleted_at IS NULL;
   IF NOT FOUND OR (NOT staff AND customer_user IS DISTINCT FROM _actor) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 ELSE RAISE EXCEPTION 'INPUT_INVALID'; END IF;
 PERFORM set_config('cr_order.verified_actor',_actor::text,true);
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(_command->'lines') x WHERE x->>'kind'='custom') THEN PERFORM cr_order_private.require_custom(_tenant,_actor); END IF;
 IF NOT staff AND (coalesce((_command->>'autoConfirm')::boolean,false) OR _command ? 'dietaryOverride') THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
END $$;

REVOKE ALL ON FUNCTION cr_order_private.check_offer_actor(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION cr_order_private.check_offer_actor(uuid,uuid,jsonb) TO service_role;

COMMIT;
