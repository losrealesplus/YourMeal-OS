-- Synthetic fixtures only, loaded into a disposable database by local-integration.mjs.
SET session_replication_role = replica;
INSERT INTO public.tenants(id,slug,name) VALUES
 ('10000000-0000-4000-8000-000000000001','rollback-a','Rollback A'),
 ('10000000-0000-4000-8000-000000000002','rollback-b','Rollback B');
INSERT INTO auth.users(id) VALUES ('20000000-0000-4000-8000-000000000001'),('20000000-0000-4000-8000-000000000002');
INSERT INTO public.user_roles(user_id,tenant_id,role) VALUES
 ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','kitchen'),
 ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','accounting');
INSERT INTO public.customers(id,tenant_id,display_name) VALUES
 ('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Synthetic');
INSERT INTO public.orders(id,tenant_id,customer_id,week_start,status,write_contract_version,revision,total)
 SELECT ('40000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
 '10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','2026-10-19',
 'in_production',CASE WHEN n=3 THEN 2 ELSE 1 END,0,0 FROM generate_series(1,5)n;
INSERT INTO public.order_items(id,tenant_id,order_id,day_date,dish_id,qty,unit_price)
 SELECT gen_random_uuid(),'10000000-0000-4000-8000-000000000001',id,'2026-10-19',
 '60000000-0000-4000-8000-000000000001',1,0 FROM public.orders;
INSERT INTO public.order_items(id,tenant_id,order_id,day_date,dish_id,qty,unit_price) VALUES
 (gen_random_uuid(),'10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002','2026-10-20','60000000-0000-4000-8000-000000000001',1,0);
SET session_replication_role = origin;
CREATE FUNCTION pg_temp.expect_error(statement text, fragment text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN EXECUTE statement;
  EXCEPTION WHEN OTHERS THEN
    IF position(fragment in SQLERRM)>0 THEN RETURN; END IF;
    RAISE;
  END;
  RAISE EXCEPTION 'Expected error %',fragment;
END $$;
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000001',false);
CREATE FUNCTION pg_temp.call_rollback(n integer, reason text DEFAULT 'synthetic correction', tenant uuid DEFAULT '10000000-0000-4000-8000-000000000001', revision integer DEFAULT 0, dates date[] DEFAULT ARRAY['2026-10-19'::date], consent boolean DEFAULT false) RETURNS public.orders LANGUAGE sql AS $$
 SELECT public.rollback_order_status_v1(tenant,('40000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'in_production','confirmed',reason,revision,dates,consent,NULL)
$$;
SELECT pg_temp.expect_error($q$SELECT pg_temp.call_rollback(1,' ')$q$,'reason');
SELECT pg_temp.expect_error($q$SELECT pg_temp.call_rollback(1,'test','10000000-0000-4000-8000-000000000002')$q$,'not allowed');
SELECT pg_temp.expect_error($q$SELECT pg_temp.call_rollback(3)$q$,'canonical v2');
SELECT pg_temp.expect_error($q$SELECT pg_temp.call_rollback(1,'test',revision=>99)$q$,'Revision conflict');
SELECT pg_temp.expect_error($q$SELECT pg_temp.call_rollback(2)$q$,'Temporal scope conflict');
SELECT pg_temp.expect_error($q$SELECT pg_temp.call_rollback(2,dates=>ARRAY['2026-10-19'::date,'2026-10-20'::date])$q$,'multi-day');
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000002',false);
SELECT pg_temp.expect_error($q$SELECT pg_temp.call_rollback(1)$q$,'not allowed');
SELECT set_config('request.jwt.claim.sub','',false);
SELECT pg_temp.expect_error($q$SELECT pg_temp.call_rollback(1)$q$,'not authenticated');
SELECT set_config('request.jwt.claim.sub','20000000-0000-4000-8000-000000000001',false);
-- Audit failure must cancel the status update and revision increment.
CREATE FUNCTION public.test_audit_failure() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN IF NEW.new_data->>'reason'='fail-audit' THEN RAISE EXCEPTION 'synthetic audit failure'; END IF; RETURN NEW; END $$;
CREATE TRIGGER test_audit_failure BEFORE INSERT ON public.audit_log FOR EACH ROW EXECUTE FUNCTION public.test_audit_failure();
SELECT pg_temp.expect_error($q$SELECT pg_temp.call_rollback(1,'fail-audit')$q$,'synthetic audit failure');
DO $$ BEGIN
 IF (SELECT revision FROM public.orders WHERE id='40000000-0000-4000-8000-000000000001')<>0 THEN RAISE EXCEPTION 'Audit failure leaked mutation'; END IF;
 IF has_function_privilege('anon','public.rollback_order_status_v1(uuid,uuid,public.order_status,public.order_status,text,integer,date[],boolean,date)','EXECUTE') THEN RAISE EXCEPTION 'Anonymous RPC access'; END IF;
END $$;
SELECT pg_temp.call_rollback(1);
SELECT pg_temp.call_rollback(2,dates=>ARRAY['2026-10-19'::date,'2026-10-20'::date],consent=>true);
SELECT pg_temp.expect_error($q$SELECT pg_temp.call_rollback(1)$q$,'Concurrency conflict');
DO $$ BEGIN
 IF (SELECT count(*) FROM public.audit_log WHERE action='status_change' AND new_data->>'isRollback'='true')<>2 THEN RAISE EXCEPTION 'Audit count'; END IF;
 IF (SELECT count(*) FROM public.orders WHERE status='in_production' AND revision=0)<>3 THEN RAISE EXCEPTION 'Unselected orders changed'; END IF;
 IF (SELECT count(*) FROM public.orders WHERE status='confirmed' AND revision=1)<>2 THEN RAISE EXCEPTION 'Selected status/revision mismatch'; END IF;
END $$;
SELECT pg_temp.expect_error($q$SELECT pg_temp.call_rollback(5,dates=>NULL)$q$,'Temporal scope conflict');
SELECT pg_temp.expect_error($q$SELECT public.rollback_order_status_v1('10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000005','in_production','draft','bad transition',0,ARRAY['2026-10-19'::date],false,NULL)$q$,'Invalid rollback transition');
SET session_replication_role=replica;
INSERT INTO public.delivery_services(tenant_id,order_id,customer_id,delivery_date,status)
 VALUES('10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000005','30000000-0000-4000-8000-000000000001','2026-10-19','delivered');
SET session_replication_role=origin;
SELECT pg_temp.expect_error($q$SELECT pg_temp.call_rollback(5)$q$,'Dependent delivery services');
-- Check both other allowed transitions, using the actual authenticated EXECUTE grant.
SET session_replication_role=replica;
INSERT INTO public.orders(id,tenant_id,customer_id,week_start,status,write_contract_version,revision,total)
 SELECT ('40000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,
 '10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','2026-10-19',
 CASE WHEN n=6 THEN 'prepared'::public.order_status ELSE 'ready_for_delivery'::public.order_status END,1,0,0 FROM generate_series(6,7)n;
INSERT INTO public.order_items(id,tenant_id,order_id,day_date,dish_id,qty,unit_price)
 SELECT gen_random_uuid(),'10000000-0000-4000-8000-000000000001',id,'2026-10-19',
 '60000000-0000-4000-8000-000000000001',1,0 FROM public.orders WHERE id IN ('40000000-0000-4000-8000-000000000006','40000000-0000-4000-8000-000000000007');
SET session_replication_role=origin;
SET ROLE authenticated;
SELECT public.rollback_order_status_v1('10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000006','prepared','in_production','correction',0,ARRAY['2026-10-19'::date],false,NULL);
SELECT public.rollback_order_status_v1('10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000007','ready_for_delivery','prepared','correction',0,ARRAY['2026-10-19'::date],false,NULL);
RESET ROLE;
