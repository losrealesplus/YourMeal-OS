-- Verification of RLS enforcement on EatClean Supabase
DO $$
DECLARE
  v_fake_tenant_id uuid := gen_random_uuid();
  v_real_tenant_id uuid;
BEGIN
  SELECT id INTO v_real_tenant_id FROM public.tenants WHERE slug = 'eatclean';

  -- 1. Verify RLS is enabled on all core business tables
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customers' AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS_DISABLED on customers table';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders' AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS_DISABLED on orders table';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'dishes' AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS_DISABLED on dishes table';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'operational_exceptions' AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS_DISABLED on operational_exceptions table';
  END IF;

  RAISE NOTICE 'RLS_AUDIT_PASSED: All core business tables have row level security enabled.';
END $$;
