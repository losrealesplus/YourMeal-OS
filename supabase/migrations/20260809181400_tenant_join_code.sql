-- Phase 2.1 — Trusted tenant association credential (tenant_join_code).
--
-- PRODUCT DECISION (P2-DEC-001):
--   NEW credential, DISTINCT from companies.company_code.
--   companies.company_code remains private company identity inside a tenant.
--
-- Scope of this migration:
--   - durable globally unique join_code on tenants
--   - staff/saas generate + rotate via SECURITY DEFINER RPC
--   - authenticated resolve via SECURITY DEFINER RPC (minimum payload)
--   - NO membership creation (Phase 2.2)
--   - NO ensure_individual_customer changes (P2-DEC-003)
--   - does NOT open companies SELECT to customers

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS join_code text;

COMMENT ON COLUMN public.tenants.join_code IS
  'Phase 2.1 globally unique tenant_join_code. NOT companies.company_code.';

CREATE UNIQUE INDEX IF NOT EXISTS tenants_join_code_uidx
  ON public.tenants (upper(join_code))
  WHERE join_code IS NOT NULL AND btrim(join_code) <> '';

-- Allocate / rotate join code for a tenant (staff / saas only).
CREATE OR REPLACE FUNCTION public.generate_tenant_join_code(p_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_i int := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT (
    public.is_saas_admin(auth.uid())
    OR public.has_role(auth.uid(), p_tenant_id, 'company_admin')
    OR public.has_role(auth.uid(), p_tenant_id, 'operations_manager')
  ) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = p_tenant_id) THEN
    RAISE EXCEPTION 'tenant not found';
  END IF;

  LOOP
    v_i := v_i + 1;
    IF v_i > 50 THEN
      RAISE EXCEPTION 'could not allocate join code';
    END IF;
    -- Prefix TJ- distinguishes from company codes (EC-…).
    v_code := 'TJ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.tenants t
      WHERE t.join_code IS NOT NULL
        AND upper(t.join_code) = upper(v_code)
    );
  END LOOP;

  UPDATE public.tenants
  SET join_code = v_code
  WHERE id = p_tenant_id;

  RETURN v_code;
END;
$$;

-- Cold-path resolver: join code → minimum tenant identity.
-- Does NOT create tenant_members / roles / customers.
CREATE OR REPLACE FUNCTION public.resolve_tenant_join_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm text;
  v_id uuid;
  v_name text;
  v_status public.tenant_status;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  v_norm := upper(btrim(COALESCE(p_code, '')));

  -- Explicit rejection of empty / malformed / company-code shaped values.
  IF v_norm = '' OR v_norm !~ '^TJ-[A-Z0-9]{6,16}$' THEN
    RAISE EXCEPTION 'invalid join code';
  END IF;

  IF v_norm LIKE 'EC-%' THEN
    RAISE EXCEPTION 'invalid join code';
  END IF;

  SELECT t.id, t.name, t.status
  INTO v_id, v_name, v_status
  FROM public.tenants t
  WHERE t.join_code IS NOT NULL
    AND upper(t.join_code) = v_norm
  LIMIT 1;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'join code not found';
  END IF;

  IF v_status IS DISTINCT FROM 'active'::public.tenant_status THEN
    RAISE EXCEPTION 'tenant not available';
  END IF;

  RETURN jsonb_build_object(
    'tenant_id', v_id,
    'display_name', v_name
  );
END;
$$;

REVOKE ALL ON FUNCTION public.generate_tenant_join_code(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generate_tenant_join_code(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.generate_tenant_join_code(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.resolve_tenant_join_code(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_tenant_join_code(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.resolve_tenant_join_code(text) TO authenticated;

-- Backfill one join code per existing tenant (migration role; not client-callable).
DO $$
DECLARE
  r record;
  v_code text;
  v_i int;
BEGIN
  FOR r IN
    SELECT id FROM public.tenants
    WHERE join_code IS NULL OR btrim(join_code) = ''
  LOOP
    v_i := 0;
    LOOP
      v_i := v_i + 1;
      IF v_i > 50 THEN
        RAISE EXCEPTION 'could not backfill join code for %', r.id;
      END IF;
      v_code := 'TJ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM public.tenants t
        WHERE t.join_code IS NOT NULL
          AND upper(t.join_code) = upper(v_code)
      );
    END LOOP;
    UPDATE public.tenants SET join_code = v_code WHERE id = r.id;
  END LOOP;
END $$;
