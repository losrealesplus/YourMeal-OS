-- Release correction A. No production execution is authorized by this file.
-- Name resolution for existing auth.uid() usage; no Auth rows or RLS bypass.
BEGIN;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='cr_order_writer' AND NOT rolsuper AND NOT rolbypassrls AND NOT rolcanlogin)
 THEN RAISE EXCEPTION 'RELEASE_UNSAFE_OR_MISSING_ORDER_WRITER'; END IF;
 IF NOT has_function_privilege('cr_order_writer','auth.uid()','EXECUTE')
 THEN RAISE EXCEPTION 'RELEASE_MISSING_AUTH_UID_EXECUTE'; END IF;
END $$;
GRANT USAGE ON SCHEMA auth TO cr_order_writer;
DO $$ BEGIN
 IF NOT has_schema_privilege('cr_order_writer','auth','USAGE')
 THEN RAISE EXCEPTION 'RELEASE_AUTH_SCHEMA_GRANT_NOT_EFFECTIVE'; END IF;
END $$;
COMMIT;
