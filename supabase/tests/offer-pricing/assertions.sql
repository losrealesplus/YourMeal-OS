DO $$
DECLARE baseline public.offer_fixture_baseline; value text;
BEGIN
  SELECT * INTO baseline FROM public.offer_fixture_baseline;
  ASSERT baseline.acl = (SELECT relacl::text FROM pg_class WHERE oid='public.weekly_menu_slots'::regclass), 'ACL changed';
  ASSERT baseline.policy = (SELECT row_to_json(p)::text FROM pg_policy p WHERE polrelid='public.weekly_menu_slots'::regclass), 'policy changed';
  ASSERT baseline.catalogue = (SELECT jsonb_agg(to_jsonb(d) ORDER BY id) FROM public.dishes d), 'catalogue changed';
  ASSERT baseline.slots = (SELECT jsonb_agg(to_jsonb(s) - 'unit_price' ORDER BY id) FROM public.weekly_menu_slots s), 'legacy rows changed';
  ASSERT (SELECT bool_and(unit_price IS NULL) FROM public.weekly_menu_slots), 'backfill not allowed';
  ASSERT (SELECT column_default IS NULL AND is_nullable='YES' AND numeric_precision=12 AND numeric_scale=4 FROM information_schema.columns WHERE table_schema='public' AND table_name='weekly_menu_slots' AND column_name='unit_price'), 'column contract mismatch';
  FOREACH value IN ARRAY ARRAY['-1','NaN','Infinity','-Infinity','100000000'] LOOP
    BEGIN
      EXECUTE format('UPDATE public.weekly_menu_slots SET unit_price=%L::numeric',value);
      RAISE EXCEPTION 'invalid price accepted: %',value;
    EXCEPTION WHEN check_violation OR numeric_value_out_of_range THEN NULL;
    END;
  END LOOP;
  UPDATE public.weekly_menu_slots SET unit_price=0 WHERE id='50000000-0000-4000-8000-000000000001';
  ASSERT (SELECT unit_price=0 FROM public.weekly_menu_slots WHERE id='50000000-0000-4000-8000-000000000001'), 'explicit zero lost';
  UPDATE public.weekly_menu_slots SET unit_price=2.5000 WHERE id='50000000-0000-4000-8000-000000000001';
  ASSERT (SELECT unit_price=2.5000 FROM public.weekly_menu_slots WHERE id='50000000-0000-4000-8000-000000000001'), 'offer lost';
  -- Typmod round happens before CHECK: extra scale MUST be rejected before cast in M2 boundary.
  UPDATE public.weekly_menu_slots SET unit_price=1.00001 WHERE id='50000000-0000-4000-8000-000000000001';
  ASSERT (SELECT unit_price=1.0000 FROM public.weekly_menu_slots WHERE id='50000000-0000-4000-8000-000000000001'), 'numeric typmod assumption changed';
END $$;
SET ROLE authenticated;
SET app.test_tenant='10000000-0000-4000-8000-000000000001';
DO $$ BEGIN
  ASSERT (SELECT count(*)=1 FROM public.weekly_menu_slots), 'tenant SELECT leakage';
  UPDATE public.weekly_menu_slots SET unit_price=9 WHERE tenant_id='10000000-0000-4000-8000-000000000002';
  ASSERT NOT FOUND, 'tenant UPDATE leakage';
  DELETE FROM public.weekly_menu_slots WHERE tenant_id='10000000-0000-4000-8000-000000000002';
  ASSERT NOT FOUND, 'tenant DELETE leakage';
  BEGIN
    UPDATE public.weekly_menu_slots SET tenant_id='10000000-0000-4000-8000-000000000002';
    RAISE EXCEPTION 'tenant reassignment accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO public.weekly_menu_slots VALUES ('50000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000002',2.5);
    RAISE EXCEPTION 'cross tenant insert accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
RESET ROLE;
DO $$ BEGIN
  ASSERT (SELECT unit_price IS NULL FROM public.weekly_menu_slots WHERE id='50000000-0000-4000-8000-000000000002'), 'other tenant row changed';
END $$;
