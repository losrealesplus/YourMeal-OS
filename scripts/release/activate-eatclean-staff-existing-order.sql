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
 IF NOT has_schema_privilege('cr_order_writer','auth','USAGE') THEN
  RAISE EXCEPTION 'STAFF_ORDER_ACTIVATION_AUTH_USAGE_REQUIRED';
 END IF;
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
