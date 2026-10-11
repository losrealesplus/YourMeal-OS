-- MANUAL ONLY. Not a migration; do not run as part of installation/reset/deploy.
-- Requires independent approval of activation timing and an authorized function owner.
-- Contains no business-row writes; enables a new write endpoint for EatClean staff.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DO $$
DECLARE definition_hash text;
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id='8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid) THEN
  RAISE EXCEPTION 'STAFF_ORDER_ACTIVATION_TENANT_MISSING';
 END IF;
 SELECT encode(sha256(convert_to(p.prosrc,'UTF8')),'hex') INTO definition_hash
 FROM pg_proc p WHERE p.oid=to_regprocedure('public.capture_staff_existing_order(uuid,jsonb)');
 IF definition_hash IS DISTINCT FROM 'b953706417c7689974ca855f2108fcb24a2b937d159407dfbf3313b97e5ce8ea' THEN
  RAISE EXCEPTION 'STAFF_ORDER_ACTIVATION_DEFINITION_DRIFT';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=to_regprocedure('public.capture_staff_existing_order(uuid,jsonb)') AND NOT prosecdef AND proconfig=ARRAY['search_path=""'] AND pg_get_userbyid(proowner)='postgres' AND prorettype='jsonb'::regtype AND provolatile='v' AND prolang=(SELECT oid FROM pg_language WHERE lanname='plpgsql')) THEN RAISE EXCEPTION 'STAFF_ORDER_ACTIVATION_RPC_METADATA_DRIFT'; END IF;
 IF to_regprocedure('cr_order_private.session_uid_bridge()') IS NULL THEN RAISE EXCEPTION 'STAFF_ORDER_ACTIVATION_BRIDGE_MISSING'; END IF;
 IF has_schema_privilege('cr_order_writer','auth','USAGE') THEN RAISE EXCEPTION 'STAFF_ORDER_ACTIVATION_WRITER_AUTH_USAGE_PRESENT'; END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='cr_order_writer' AND (rolcanlogin OR rolsuper OR rolbypassrls OR rolinherit)) THEN RAISE EXCEPTION 'STAFF_ORDER_ACTIVATION_WRITER_ROLE_DRIFT'; END IF;
 IF pg_has_role('authenticated','cr_order_writer','SET') OR pg_has_role('anon','cr_order_writer','SET') OR pg_has_role('service_role','cr_order_writer','SET') THEN RAISE EXCEPTION 'STAFF_ORDER_ACTIVATION_WRITER_MEMBERSHIP_DRIFT'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=to_regprocedure('cr_order_private.session_uid_bridge()') AND encode(sha256(convert_to(prosrc,'UTF8')),'hex')='c628b78ce1d2a3b15ddbaf7b0a5838fa26c925d332103e53f34ba73b9b227604' AND prosecdef=true AND proconfig=ARRAY['search_path=""'] AND pg_get_userbyid(proowner)='postgres' AND prorettype='uuid'::regtype AND provolatile='s' AND prolang=(SELECT oid FROM pg_language WHERE lanname='sql')) THEN RAISE EXCEPTION 'STAFF_ORDER_ACTIVATION_SESSION_UID_BRIDGE_DRIFT'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=to_regprocedure('cr_order_private.actor()') AND encode(sha256(convert_to(prosrc,'UTF8')),'hex')='9094c00b9605600a6e5329dc1d7c2ac7aced0ef57c08b3e83f3b9e02d477894c' AND prosecdef=false AND proconfig=ARRAY['search_path=""'] AND pg_get_userbyid(proowner)='postgres' AND provolatile='s' AND prolang=(SELECT oid FROM pg_language WHERE lanname='plpgsql')) THEN RAISE EXCEPTION 'STAFF_ORDER_ACTIVATION_ACTOR_DRIFT'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=to_regprocedure('cr_order_private.can_operate_custom_batch(uuid)') AND encode(sha256(convert_to(prosrc,'UTF8')),'hex')='9177bccac3e088123d5fc039fb5eedc3b2929be871fa761ebab4f207f9384860' AND prosecdef=false AND proconfig=ARRAY['search_path=""'] AND pg_get_userbyid(proowner)='postgres' AND provolatile='s' AND prolang=(SELECT oid FROM pg_language WHERE lanname='plpgsql')) THEN RAISE EXCEPTION 'STAFF_ORDER_ACTIVATION_CAN_OPERATE_CUSTOM_BATCH_DRIFT'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=to_regprocedure('cr_order_private.guard_legacy_offer()') AND encode(sha256(convert_to(prosrc,'UTF8')),'hex')='b4823445af4e684efd8cc8688038f08c7d011998a301df924d06671b35fa4c63' AND prosecdef=true AND proconfig=ARRAY['search_path=""'] AND pg_get_userbyid(proowner)='cr_order_writer') THEN RAISE EXCEPTION 'STAFF_ORDER_ACTIVATION_GUARD_LEGACY_OFFER_DRIFT'; END IF;
 IF NOT has_function_privilege('cr_order_writer','cr_order_private.session_uid_bridge()','EXECUTE')
 OR EXISTS(SELECT 1 FROM pg_proc p CROSS JOIN LATERAL aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a WHERE p.oid='cr_order_private.session_uid_bridge()'::regprocedure AND a.privilege_type='EXECUTE' AND ((a.is_grantable AND a.grantee<>p.proowner) OR a.grantee=0 OR a.grantee NOT IN (p.proowner,(SELECT oid FROM pg_roles WHERE rolname='cr_order_writer')))) THEN RAISE EXCEPTION 'STAFF_ORDER_ACTIVATION_BRIDGE_ACL_INVALID'; END IF;
 IF EXISTS(SELECT 1 FROM pg_namespace n CROSS JOIN LATERAL aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) a WHERE n.nspname='cr_order_private' AND a.grantee=0 AND a.privilege_type='USAGE') THEN RAISE EXCEPTION 'STAFF_ORDER_ACTIVATION_PRIVATE_SCHEMA_PUBLIC'; END IF;
 IF NOT (SELECT bool_and(relrowsecurity) FROM pg_class WHERE oid IN ('public.orders'::regclass,'public.order_items'::regclass,'public.audit_log'::regclass)) THEN RAISE EXCEPTION 'STAFF_ORDER_ACTIVATION_RLS_DISABLED'; END IF;

 IF (SELECT encode(sha256(convert_to(jsonb_build_object('policies',(SELECT coalesce(jsonb_agg(jsonb_build_object('schema',schemaname,'table',tablename,'name',policyname,'permissive',permissive,'roles',roles,'cmd',cmd,'qual',qual,'check',with_check) ORDER BY schemaname,tablename,policyname),'[]'::jsonb) FROM pg_policies WHERE schemaname='public' AND tablename IN ('orders','order_items','audit_log')),'triggers',(SELECT coalesce(jsonb_agg(jsonb_build_object('table',c.relname,'name',t.tgname,'enabled',t.tgenabled,'definition',pg_get_triggerdef(t.oid,true)) ORDER BY c.relname,t.tgname),'[]'::jsonb) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('orders','order_items','audit_log') AND NOT t.tgisinternal))::text,'UTF8')),'hex')) IS DISTINCT FROM '80c377b50e563141042c92631a999de87ad8468520fe103655a399409cd5e4c3' THEN RAISE EXCEPTION 'STAFF_ORDER_ACTIVATION_RLS_TRIGGER_DRIFT'; END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.capture_staff_existing_order(uuid,jsonb) TO authenticated;
DO $$ BEGIN
 IF NOT has_function_privilege('authenticated','public.capture_staff_existing_order(uuid,jsonb)','EXECUTE')
 OR has_function_privilege('anon','public.capture_staff_existing_order(uuid,jsonb)','EXECUTE')
 OR has_function_privilege('service_role','public.capture_staff_existing_order(uuid,jsonb)','EXECUTE') THEN
  RAISE EXCEPTION 'STAFF_ORDER_ACTIVATION_ACL_INVALID';
 END IF;
END $$;
COMMIT;
