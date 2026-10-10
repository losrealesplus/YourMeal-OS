-- Qualification-only prototype. NOT a production migration or approved runbook.
-- Deliberately broad business pause. Auth remains available; operational writes stop.
BEGIN;
CREATE SCHEMA qualification_pause;
REVOKE ALL ON SCHEMA qualification_pause FROM PUBLIC;
CREATE FUNCTION qualification_pause.reject_write() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  -- Only the disposable lab's migrator can backfill while the pause is installed.
  -- session_user, rather than current_user, prevents SECURITY DEFINER bypass.
  IF session_user <> 'supabase_admin' THEN
    RAISE EXCEPTION 'QUALIFICATION_WRITE_PAUSED' USING ERRCODE='55000';
  END IF;
  RETURN NULL; -- statement trigger, no row payload
END $$;
REVOKE ALL ON FUNCTION qualification_pause.reject_write() FROM PUBLIC;
DO $$ DECLARE r record;
BEGIN
  FOR r IN SELECT n.nspname,c.relname FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname IN ('public','p34_private','cr_order_private','cr_menu_private')
      AND c.relkind IN ('r','p') ORDER BY n.nspname,c.relname
  LOOP
    EXECUTE format('LOCK TABLE %I.%I IN SHARE ROW EXCLUSIVE MODE',r.nspname,r.relname);
    EXECUTE format('CREATE TRIGGER qualification_write_pause BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON %I.%I FOR EACH STATEMENT EXECUTE FUNCTION qualification_pause.reject_write()',r.nspname,r.relname);
    EXECUTE format('ALTER TABLE %I.%I ENABLE ALWAYS TRIGGER qualification_write_pause',r.nspname,r.relname);
  END LOOP;
END $$;
COMMIT;
