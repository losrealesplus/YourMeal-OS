-- P34 P2.3: terminal, explicit recovery; no identity transfer or renewed approval.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
ALTER TABLE p34_private.identity_requests DROP CONSTRAINT identity_requests_state_check;
ALTER TABLE p34_private.identity_requests ADD CONSTRAINT identity_requests_state_check CHECK(state IN('requested','approved','consumed','expired','closed'));
ALTER TABLE p34_private.identity_requests ADD COLUMN closed_by uuid REFERENCES auth.users(id), ADD COLUMN closed_at timestamptz, ADD COLUMN close_reason text;
ALTER TABLE p34_private.identity_requests ADD CONSTRAINT p34_closed_evidence CHECK ((state='closed' AND closed_by IS NOT NULL AND closed_at IS NOT NULL AND close_reason IS NOT DISTINCT FROM 'REVISION_CONFLICT') OR (state<>'closed' AND closed_by IS NULL AND closed_at IS NULL AND close_reason IS NULL));
GRANT CREATE ON SCHEMA p34_private TO p34_writer;
CREATE FUNCTION p34_private.close_conflicted_link(t uuid,r uuid,j jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=p34_private.actor(t); link p34_private.identity_requests%ROWTYPE; previous p34_private.requests%ROWTYPE; c public.customers%ROWTYPE; result jsonb;
BEGIN
 IF NOT p34_private.member(t) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 IF r IS NULL OR jsonb_typeof(j) IS DISTINCT FROM 'object' OR j->>'operation' IS DISTINCT FROM 'close_conflicted_link' OR j->>'reason' IS DISTINCT FROM 'REVISION_CONFLICT' OR jsonb_typeof(j->'linkRequestId') IS DISTINCT FROM 'string' OR EXISTS(SELECT 1 FROM jsonb_object_keys(j) k WHERE k NOT IN('operation','linkRequestId','reason')) THEN RAISE EXCEPTION 'INVALID_INPUT'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(t::text||actor::text,0));
 SELECT * INTO link FROM p34_private.identity_requests WHERE id=(j->>'linkRequestId')::uuid AND tenant_id=t FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'LINK_NOT_FOUND'; END IF;
 IF link.user_id<>actor THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
 SELECT * INTO previous FROM p34_private.requests WHERE tenant_id=t AND actor_id=actor AND request_id=r;
 IF FOUND THEN
  IF previous.fingerprint<>encode(sha256(convert_to(j::text,'UTF8')),'hex') THEN RAISE EXCEPTION 'REQUEST_PAYLOAD_MISMATCH'; END IF;
  RETURN previous.result||jsonb_build_object('replayed',true);
 END IF;
 IF link.state<>'closed' THEN
  IF link.state<>'approved' THEN RAISE EXCEPTION 'LINK_NOT_CONFLICTED'; END IF;
  -- Same link -> customer lock order as confirmation; stale confirmation cannot win afterward.
  SELECT * INTO c FROM public.customers WHERE id=link.customer_id AND tenant_id=t FOR UPDATE;
  IF NOT FOUND OR c.revision IS NOT DISTINCT FROM link.approved_revision THEN RAISE EXCEPTION 'LINK_NOT_CONFLICTED'; END IF;
  UPDATE p34_private.identity_requests SET state='closed',closed_by=actor,closed_at=now(),close_reason='REVISION_CONFLICT' WHERE id=link.id RETURNING * INTO link;
  INSERT INTO public.audit_log(tenant_id,actor_id,entity_type,entity_id,action,new_data) VALUES(t,actor,'customer_identity_request',link.id,'p34.close_conflicted_link',jsonb_build_object('requestId',r,'linkRequestId',link.id,'reason',link.close_reason,'closedAt',link.closed_at));
 END IF;
 result:=jsonb_build_object('linkRequestId',link.id,'state','closed','reason',link.close_reason,'closedAt',link.closed_at);
 INSERT INTO p34_private.requests(tenant_id,actor_id,request_id,fingerprint,result) VALUES(t,actor,r,encode(sha256(convert_to(j::text,'UTF8')),'hex'),result);
 RETURN result;
END $$;
ALTER FUNCTION p34_private.close_conflicted_link(uuid,uuid,jsonb) OWNER TO p34_writer;
REVOKE ALL ON FUNCTION p34_private.close_conflicted_link(uuid,uuid,jsonb) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION p34_private.close_conflicted_link(uuid,uuid,jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION public.p34_customer_command(_tenant uuid,_request uuid,_command jsonb) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT CASE WHEN _command->>'operation'='close_conflicted_link' THEN p34_private.close_conflicted_link(_tenant,_request,_command) ELSE p34_private.execute(_tenant,_request,_command) END
$$;
REVOKE CREATE ON SCHEMA p34_private FROM p34_writer;
COMMIT;
