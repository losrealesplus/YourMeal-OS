-- Phase 2.2 — Cold customer tenant association via join code.
--
-- PRODUCT LOCKS:
--   P2-DEC-001 — reuse tenants.join_code (do not invent a second credential)
--   P2-DEC-002 — self-registration membership status = pending (NOT approved)
--   P2-DEC-003 — do NOT redesign ensure_individual_customer for cold membership
--   ADR 0018 — Create ≠ access; pending cannot pass is_tenant_member
--
-- This RPC:
--   - authenticates the caller
--   - resolves an EXISTING tenant from join_code (server-side)
--   - creates durable tenant_members(status=pending, type=customer, channel=self_registration)
--   - NEVER creates a Tenant
--   - NEVER accepts client-supplied tenant_id as authority
--   - NEVER auto-approves on valid join code
--   - NEVER creates customers / roles (those follow approval + ensure_individual_customer)

CREATE OR REPLACE FUNCTION public.request_tenant_association_by_join_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_norm text;
  v_tenant_id uuid;
  v_tenant_name text;
  v_tenant_status public.tenant_status;
  v_membership_id uuid;
  v_status public.membership_status;
  v_created boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  v_norm := upper(btrim(COALESCE(p_code, '')));

  IF v_norm = '' OR v_norm !~ '^TJ-[A-Z0-9]{6,16}$' THEN
    RAISE EXCEPTION 'invalid join code';
  END IF;

  IF v_norm LIKE 'EC-%' THEN
    RAISE EXCEPTION 'invalid join code';
  END IF;

  SELECT t.id, t.name, t.status
  INTO v_tenant_id, v_tenant_name, v_tenant_status
  FROM public.tenants t
  WHERE t.join_code IS NOT NULL
    AND upper(t.join_code) = v_norm
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'join code not found';
  END IF;

  IF v_tenant_status IS DISTINCT FROM 'active'::public.tenant_status THEN
    RAISE EXCEPTION 'tenant not available';
  END IF;

  SELECT tm.id, tm.status
  INTO v_membership_id, v_status
  FROM public.tenant_members tm
  WHERE tm.tenant_id = v_tenant_id
    AND tm.user_id = v_uid
  LIMIT 1;

  IF v_membership_id IS NULL THEN
    INSERT INTO public.tenant_members (
      tenant_id,
      user_id,
      status,
      membership_type,
      provisioning_channel
    )
    VALUES (
      v_tenant_id,
      v_uid,
      'pending'::public.membership_status,
      'customer'::public.membership_type,
      'self_registration'::public.provisioning_channel
    )
    RETURNING id, status INTO v_membership_id, v_status;
    v_created := true;
  END IF;

  -- Idempotent: existing row is returned as-is (never escalate pending → approved here).
  RETURN jsonb_build_object(
    'tenant_id', v_tenant_id,
    'display_name', v_tenant_name,
    'membership_id', v_membership_id,
    'status', v_status,
    'created', v_created
  );
END;
$$;

COMMENT ON FUNCTION public.request_tenant_association_by_join_code(text) IS
  'Phase 2.2 cold association: join_code → pending tenant_members. Does not create tenants or auto-approve.';

REVOKE ALL ON FUNCTION public.request_tenant_association_by_join_code(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.request_tenant_association_by_join_code(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.request_tenant_association_by_join_code(text) TO authenticated;
