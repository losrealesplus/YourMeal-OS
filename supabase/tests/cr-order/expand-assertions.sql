CREATE FUNCTION pg_temp.assert_ok(ok boolean, message text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM TRUE THEN RAISE EXCEPTION 'assertion failed: %',message; END IF; END $$;
CREATE FUNCTION pg_temp.expect_error(command text, expected text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
 BEGIN EXECUTE command;
 EXCEPTION WHEN OTHERS THEN
   IF SQLSTATE <> expected THEN RAISE EXCEPTION 'expected %, got %', expected, SQLSTATE; END IF;
   RETURN;
 END;
 RAISE EXCEPTION 'unexpected success: expected %', expected;
END $$;
SELECT pg_temp.assert_ok((SELECT count(*)=2 AND bool_and(item_kind='dish' AND allergen_state='HISTORICAL_UNAVAILABLE'
 AND name_snapshot IS NULL AND allergens_snapshot IS NULL AND snapshot_captured_at IS NULL) FROM public.order_items),'legacy knowledge unchanged');
SELECT pg_temp.assert_ok((SELECT unit_price=12.5 AND qty=2 FROM public.order_items WHERE id='50000000-0000-4000-8000-000000000001'),'financial snapshot unchanged');
SELECT pg_temp.assert_ok((SELECT unit_price IS NULL AND price_snapshot_status='historical_unavailable' FROM public.order_items WHERE id='50000000-0000-4000-8000-000000000002'),'unknown price not zero');
SELECT pg_temp.assert_ok((SELECT bool_and(revision=0 AND write_contract_version=1) FROM public.orders),'order defaults');
SELECT pg_temp.assert_ok((SELECT count(*)=1 AND bool_and(item_kind='dish' AND custom_order_item_id IS NULL AND status='pending') FROM public.kitchen_production_batches),'batch preserved');
SELECT pg_temp.assert_ok((SELECT relrowsecurity FROM pg_class WHERE oid='public.order_write_requests'::regclass),'RLS enabled');
SELECT pg_temp.assert_ok((SELECT count(*)=1 FROM pg_constraint WHERE contype='f' AND conrelid='public.order_items'::regclass AND confrelid='public.dishes'::regclass),'one unambiguous dish embed');
SELECT pg_temp.assert_ok((SELECT count(*)=1 FROM pg_constraint WHERE contype='f' AND conrelid='public.order_items'::regclass AND confrelid='public.orders'::regclass),'one unambiguous order embed');
SELECT pg_temp.expect_error($q$UPDATE public.order_items SET dish_id='40000000-0000-4000-8000-000000000002' WHERE id='50000000-0000-4000-8000-000000000001'$q$,'23503');
SELECT pg_temp.expect_error($q$UPDATE public.order_items SET order_id='30000000-0000-4000-8000-000000000002' WHERE id='50000000-0000-4000-8000-000000000001'$q$,'23503');
SELECT pg_temp.expect_error($q$UPDATE public.kitchen_production_batches SET dish_id='40000000-0000-4000-8000-000000000002'$q$,'23503');
SELECT pg_temp.expect_error($q$UPDATE public.order_items SET item_kind='custom' WHERE id='50000000-0000-4000-8000-000000000001'$q$,'23514');
SELECT pg_temp.expect_error($q$UPDATE public.order_items SET dish_id=NULL WHERE id='50000000-0000-4000-8000-000000000001'$q$,'23502');
SELECT pg_temp.expect_error($q$UPDATE public.order_items SET name_snapshot='Invented history' WHERE id='50000000-0000-4000-8000-000000000001'$q$,'23514');
SELECT pg_temp.expect_error($q$UPDATE public.orders SET write_contract_version=2$q$,'23514');
SELECT pg_temp.expect_error($q$UPDATE public.orders SET revision=-1$q$,'23514');
SELECT pg_temp.expect_error($q$UPDATE public.kitchen_production_batches SET item_kind='custom',custom_order_item_id='50000000-0000-4000-8000-000000000001'$q$,'23514');
-- Owner-only fixture access to test closed idempotency integrity before RPC/policies exist.
INSERT INTO public.order_write_requests VALUES ('10000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001','capture',repeat('a',64),'30000000-0000-4000-8000-000000000001',0,now());
SELECT pg_temp.expect_error($q$INSERT INTO public.order_write_requests SELECT * FROM public.order_write_requests$q$,'23505');
SELECT pg_temp.expect_error($q$UPDATE public.order_write_requests SET order_id='30000000-0000-4000-8000-000000000002'$q$,'23503');
SELECT pg_temp.expect_error($q$UPDATE public.order_write_requests SET input_hash='invalid'$q$,'23514');
SET ROLE authenticated;
SET test.tenant='10000000-0000-4000-8000-000000000001';
SET test.role='staff';
SET request.jwt.claim.sub='20000000-0000-4000-8000-000000000001';
SELECT pg_temp.assert_ok((SELECT count(*)=1 FROM public.order_items),'staff sees own tenant only');
INSERT INTO public.order_items(tenant_id,order_id,dish_id,qty,day_date,unit_price) VALUES
 ('10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001',1,'2026-10-05',2.5);
SELECT pg_temp.expect_error($q$SELECT * FROM public.order_write_requests$q$,'42501');
SELECT pg_temp.expect_error($q$INSERT INTO public.order_write_requests VALUES ('10000000-0000-4000-8000-000000000001',gen_random_uuid(),'capture',repeat('b',64),'30000000-0000-4000-8000-000000000001',0,now())$q$,'42501');
SELECT pg_temp.expect_error($q$UPDATE public.order_write_requests SET operation='modify'$q$,'42501');
SELECT pg_temp.expect_error($q$DELETE FROM public.order_write_requests$q$,'42501');
SELECT pg_temp.expect_error($q$UPDATE public.order_items SET item_kind='custom'$q$,'23514');
SET test.role='customer';
SELECT pg_temp.assert_ok((SELECT count(*)=2 FROM public.order_items),'customer retains owning order access');
SELECT pg_temp.expect_error($q$UPDATE public.order_items SET item_kind='custom'$q$,'23514');
SET test.role='kitchen';
SET request.jwt.claim.sub='20000000-0000-4000-8000-000000000099';
SELECT pg_temp.assert_ok((SELECT count(*)=0 FROM public.order_items),'non-owner non-staff denied by fixture');
RESET ROLE;
SET ROLE anon;
SELECT pg_temp.expect_error($q$SELECT * FROM public.order_write_requests$q$,'42501');
SELECT pg_temp.expect_error($q$SELECT * FROM public.order_items$q$,'42501');
RESET ROLE;
-- Even granting SELECT on the closed foundation does not bypass RLS default deny.
GRANT SELECT ON public.order_write_requests TO authenticated;
SET ROLE authenticated;
SELECT pg_temp.assert_ok((SELECT count(*)=0 FROM public.order_write_requests),'RLS default deny independent of ACL');
RESET ROLE;
REVOKE SELECT ON public.order_write_requests FROM authenticated;
