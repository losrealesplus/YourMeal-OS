-- A5.2 / A5.4: bounded authenticated actions, never caller-selected authority.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
GRANT CREATE ON SCHEMA cr_order_private TO cr_order_writer;

CREATE TABLE cr_order_private.operational_evidence (
  tenant_id uuid NOT NULL,
  order_id uuid NOT NULL,
  production_started_at timestamptz,
  production_completed_at timestamptz,
  packing_started_at timestamptz,
  packing_completed_at timestamptz,
  assigned_at timestamptz,
  PRIMARY KEY (tenant_id, order_id),
  FOREIGN KEY (tenant_id, order_id) REFERENCES public.orders(tenant_id, id)
);
ALTER TABLE cr_order_private.operational_evidence ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON cr_order_private.operational_evidence FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON cr_order_private.operational_evidence TO cr_order_writer;

CREATE FUNCTION cr_order_private.lifecycle_member(_tenant uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = _tenant AND user_id = auth.uid()
      AND status = 'approved' AND deleted_at IS NULL
  )
$$;
CREATE FUNCTION cr_order_private.lifecycle_staff(_tenant uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT cr_order_private.lifecycle_member(_tenant) AND (
    public.has_role(auth.uid(), _tenant, 'company_admin')
    OR public.has_role(auth.uid(), _tenant, 'operations_manager')
    OR public.is_saas_admin(auth.uid())
  )
$$;
CREATE FUNCTION cr_order_private.lifecycle_operator(_tenant uuid, _domain text) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT cr_order_private.lifecycle_member(_tenant) AND (
    cr_order_private.lifecycle_staff(_tenant)
    OR CASE _domain
      WHEN 'kitchen' THEN public.has_role(auth.uid(), _tenant, 'kitchen')
      WHEN 'production' THEN public.has_role(auth.uid(), _tenant, 'production')
      WHEN 'logistics' THEN public.has_role(auth.uid(), _tenant, 'logistics')
        OR public.has_role(auth.uid(), _tenant, 'delivery')
        OR public.has_role(auth.uid(), _tenant, 'driver')
      ELSE false END
  )
$$;
CREATE FUNCTION cr_order_private.lifecycle_reader(_tenant uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT cr_order_private.lifecycle_operator(_tenant, 'kitchen')
    OR cr_order_private.lifecycle_operator(_tenant, 'production')
    OR cr_order_private.lifecycle_operator(_tenant, 'logistics')
$$;

ALTER FUNCTION cr_order_private.lifecycle_member(uuid) OWNER TO cr_order_writer;
ALTER FUNCTION cr_order_private.lifecycle_staff(uuid) OWNER TO cr_order_writer;
ALTER FUNCTION cr_order_private.lifecycle_operator(uuid,text) OWNER TO cr_order_writer;
ALTER FUNCTION cr_order_private.lifecycle_reader(uuid) OWNER TO cr_order_writer;
REVOKE ALL ON FUNCTION cr_order_private.lifecycle_member(uuid),
  cr_order_private.lifecycle_staff(uuid), cr_order_private.lifecycle_operator(uuid,text),
  cr_order_private.lifecycle_reader(uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION cr_order_private.lifecycle_member(uuid),
  cr_order_private.lifecycle_staff(uuid), cr_order_private.lifecycle_operator(uuid,text),
  cr_order_private.lifecycle_reader(uuid) TO cr_order_writer;

CREATE POLICY lifecycle_evidence ON cr_order_private.operational_evidence TO cr_order_writer
  USING (cr_order_private.lifecycle_reader(tenant_id))
  WITH CHECK (cr_order_private.lifecycle_reader(tenant_id));
-- Narrow private-role policies. Public callers receive no table privilege.
CREATE POLICY lifecycle_order ON public.orders TO cr_order_writer
  USING (cr_order_private.lifecycle_reader(tenant_id))
  WITH CHECK (cr_order_private.lifecycle_reader(tenant_id));
CREATE POLICY lifecycle_item_read ON public.order_items FOR SELECT TO cr_order_writer
  USING (cr_order_private.lifecycle_reader(tenant_id));
CREATE POLICY lifecycle_service ON public.delivery_services TO cr_order_writer
  USING (cr_order_private.lifecycle_reader(tenant_id))
  WITH CHECK (cr_order_private.lifecycle_reader(tenant_id));
CREATE POLICY lifecycle_batch_read ON public.kitchen_production_batches FOR SELECT TO cr_order_writer
  USING (cr_order_private.lifecycle_reader(tenant_id));
CREATE POLICY lifecycle_ledger ON public.order_write_requests TO cr_order_writer
  USING (cr_order_private.lifecycle_reader(tenant_id))
  WITH CHECK (cr_order_private.lifecycle_reader(tenant_id));
CREATE POLICY lifecycle_audit ON public.audit_log FOR INSERT TO cr_order_writer
  WITH CHECK (cr_order_private.lifecycle_reader(tenant_id));

CREATE FUNCTION cr_order_private.lifecycle_v2(_tenant uuid, _request uuid, _command jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  actor uuid := auth.uid();
  action text := _command->>'action';
  domain text;
  authority text;
  target text;
  original text;
  h text;
  field text;
  oid uuid;
  o public.orders;
  req public.order_write_requests;
  evidence cr_order_private.operational_evidence;
  service public.delivery_services;
  service_target text;
  result jsonb;
  dependent_before jsonb;
  dependent_after jsonb;
  stamp timestamptz := statement_timestamp();
BEGIN
  IF current_setting('role', true) IS DISTINCT FROM 'authenticated'
    OR NOT cr_order_private.lifecycle_reader(_tenant) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED';
  END IF;
  IF _request IS NULL OR jsonb_typeof(_command) IS DISTINCT FROM 'object'
    OR _command->'schemaVersion' IS DISTINCT FROM '1'::jsonb
    OR jsonb_typeof(_command->'expectedRevision') IS DISTINCT FROM 'number'
    OR coalesce(_command->>'expectedRevision','') !~ '^(0|[1-9][0-9]*)$'
    OR coalesce(_command->>'orderId','') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    OR jsonb_typeof(_command->'fromState') IS DISTINCT FROM 'string' THEN
    RAISE EXCEPTION 'INPUT_INVALID';
  END IF;
  FOR field IN SELECT jsonb_object_keys(_command) LOOP
    IF NOT field = ANY(ARRAY['schemaVersion','orderId','action','fromState','expectedRevision','reason','serviceId']) THEN
      RAISE EXCEPTION 'UNTRUSTED_AUTHORITY_FIELD';
    END IF;
  END LOOP;
  domain := CASE action
    WHEN 'start_production' THEN 'kitchen'
    WHEN 'complete_production' THEN 'production'
    WHEN 'start_packing' THEN 'kitchen'
    WHEN 'complete_packing' THEN 'kitchen'
    WHEN 'assign_delivery' THEN 'kitchen'
    WHEN 'dispatch' THEN 'logistics'
    WHEN 'delivery_issue' THEN 'logistics'
    WHEN 'retry_delivery' THEN 'logistics'
    WHEN 'complete_delivery' THEN 'logistics'
    WHEN 'service_start' THEN 'kitchen'
    WHEN 'service_prepare' THEN 'production'
    WHEN 'service_ready' THEN 'kitchen'
    WHEN 'service_dispatch' THEN 'logistics'
    WHEN 'service_deliver' THEN 'logistics'
    WHEN 'service_issue' THEN 'logistics'
    WHEN 'service_retry' THEN 'logistics'
  END;
  IF action IN ('confirm','cancel') THEN
    IF NOT cr_order_private.lifecycle_staff(_tenant) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
  ELSIF domain IS NULL OR NOT (cr_order_private.lifecycle_operator(_tenant, domain)
    OR action IN ('complete_production','service_prepare') AND cr_order_private.lifecycle_operator(_tenant,'kitchen')) THEN
    RAISE EXCEPTION 'PERMISSION_DENIED';
  END IF;
  IF _command ? 'reason' AND (jsonb_typeof(_command->'reason') IS DISTINCT FROM 'string'
    OR length(_command->>'reason') > 2000) THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
  IF action='cancel' AND coalesce(length(btrim(_command->>'reason')),0)=0 THEN
    RAISE EXCEPTION 'INPUT_INVALID';
  END IF;
  oid := (_command->>'orderId')::uuid;
  authority := CASE WHEN action IN ('confirm','cancel') THEN 'orders.write:staff' ELSE 'domain:'||domain END;
  PERFORM pg_advisory_xact_lock(hashtextextended(_tenant::text||':'||_request::text,0));
  SELECT * INTO req FROM public.order_write_requests WHERE tenant_id=_tenant AND request_id=_request;
  IF FOUND THEN
    h := encode(sha256(convert_to(jsonb_build_object('tenant',_tenant,'request',_request,
      'actor',actor,'authority',authority,'command',_command,'targetState',req.lifecycle_result->>'toState')::text,'UTF8')),'hex');
    IF req.operation<>'lifecycle' OR req.input_hash<>h THEN RAISE EXCEPTION 'REQUEST_ID_CONFLICT'; END IF;
    RETURN req.lifecycle_result;
  END IF;
  -- Match A3/A4a lock order: day keys before parent, then dependent rows.
  PERFORM pg_advisory_xact_lock(hashtextextended(key,0)) FROM (
    SELECT DISTINCT 'cr-order-day:'||_tenant||':'||to_char(day_date,'YYYY-MM-DD')||':'||
      CASE WHEN item_kind='custom' THEN 'custom:'||id ELSE 'dish:'||dish_id END AS key
    FROM public.order_items WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL
  ) keys ORDER BY key;
  SELECT * INTO o FROM public.orders WHERE tenant_id=_tenant AND id=oid AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF o.write_contract_version<>2 THEN RAISE EXCEPTION 'V2_REQUIRED'; END IF;
  IF action='cancel' AND o.status::text='cancelled' THEN
    RETURN jsonb_build_object('outcome','ALREADY_CANCELLED','tenantId',_tenant,'orderId',oid,
      'committedRevision',o.revision,'toState','cancelled');
  END IF;
  IF o.revision IS DISTINCT FROM (_command->>'expectedRevision')::integer THEN
    RAISE EXCEPTION 'REVISION_CONFLICT';
  END IF;
  IF o.status::text IS DISTINCT FROM _command->>'fromState' THEN RAISE EXCEPTION 'INVALID_STATE'; END IF;
  IF o.status::text IN ('delivered','cancelled') THEN RAISE EXCEPTION 'ORDER_CLOSED'; END IF;
  original := o.status::text;
  IF action LIKE 'service_%' THEN
    SELECT * INTO service FROM public.delivery_services WHERE tenant_id=_tenant AND order_id=oid
      AND id=(_command->>'serviceId')::uuid AND deleted_at IS NULL;
    IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
    service_target := CASE
      WHEN action='service_start' AND service.status::text='pending' THEN 'in_production'
      WHEN action='service_prepare' AND service.status::text='in_production' THEN 'prepared'
      WHEN action='service_ready' AND service.status::text='prepared' THEN 'ready_for_delivery'
      WHEN action='service_dispatch' AND service.status::text='ready_for_delivery' THEN 'out_for_delivery'
      WHEN action='service_deliver' AND service.status::text='out_for_delivery' THEN 'delivered'
      WHEN action='service_issue' AND service.status::text='out_for_delivery' THEN 'delivery_issue'
      WHEN action='service_retry' AND service.status::text='delivery_issue' THEN 'out_for_delivery'
    END;
    IF service_target IS NULL THEN RAISE EXCEPTION 'INVALID_STATE'; END IF;
  ELSIF _command ? 'serviceId' THEN RAISE EXCEPTION 'INPUT_INVALID'; END IF;
  target := CASE action
    WHEN 'confirm' THEN 'confirmed'
    WHEN 'start_production' THEN 'in_production'
    WHEN 'complete_production' THEN 'prepared'
    WHEN 'start_packing' THEN original
    WHEN 'complete_packing' THEN original
    WHEN 'assign_delivery' THEN 'ready_for_delivery'
    WHEN 'dispatch' THEN 'out_for_delivery'
    WHEN 'delivery_issue' THEN 'delivery_issue'
    WHEN 'retry_delivery' THEN 'out_for_delivery'
    WHEN 'complete_delivery' THEN 'delivered'
    WHEN 'cancel' THEN 'cancelled'
    ELSE original
  END;
  IF NOT (
    action='confirm' AND original='draft'
    OR action='start_production' AND original='confirmed'
    OR action='complete_production' AND original='in_production'
    OR action IN ('start_packing','complete_packing','assign_delivery') AND original='prepared'
    OR action='dispatch' AND original='ready_for_delivery'
    OR action='delivery_issue' AND original='out_for_delivery'
    OR action='retry_delivery' AND original='delivery_issue'
    OR action='complete_delivery' AND original='out_for_delivery'
    OR action='cancel' AND original IN ('draft','confirmed','in_production','prepared','ready_for_delivery')
    OR service_target IS NOT NULL AND original<>'draft'
  ) THEN RAISE EXCEPTION 'INVALID_STATE'; END IF;
  PERFORM id FROM public.delivery_services WHERE tenant_id=_tenant AND order_id=oid ORDER BY id FOR UPDATE;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'status',status) ORDER BY id),'[]'::jsonb)
    INTO dependent_before FROM public.delivery_services WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL;
  INSERT INTO cr_order_private.operational_evidence(tenant_id,order_id) VALUES(_tenant,oid)
    ON CONFLICT DO NOTHING;
  SELECT * INTO evidence FROM cr_order_private.operational_evidence
    WHERE tenant_id=_tenant AND order_id=oid FOR UPDATE;
  IF service_target IS NOT NULL THEN
    UPDATE public.delivery_services SET status=service_target::public.delivery_service_status,
      packed_at=CASE WHEN service_target='ready_for_delivery' THEN coalesce(packed_at,stamp) ELSE packed_at END,
      packed_by=CASE WHEN service_target='ready_for_delivery' THEN coalesce(packed_by,actor) ELSE packed_by END,
      dispatched_at=CASE WHEN service_target='out_for_delivery' THEN coalesce(dispatched_at,stamp) ELSE dispatched_at END,
      delivered_at=CASE WHEN service_target='delivered' THEN coalesce(delivered_at,stamp) ELSE delivered_at END,
      delivered_by=CASE WHEN service_target='delivered' THEN coalesce(delivered_by,actor) ELSE delivered_by END
      WHERE tenant_id=_tenant AND id=service.id RETURNING * INTO service;
    IF original='confirmed' AND service_target='in_production' THEN target:='in_production';
    ELSIF original='in_production' AND service_target='prepared' AND NOT EXISTS(
      SELECT 1 FROM public.delivery_services WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL
        AND status::text NOT IN ('prepared','ready_for_delivery','out_for_delivery','delivered')
    ) THEN target:='prepared';
    ELSIF original='prepared' AND service_target='ready_for_delivery' AND NOT EXISTS(
      SELECT 1 FROM public.delivery_services WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL
        AND (status::text NOT IN ('ready_for_delivery','out_for_delivery','delivered') OR packed_at IS NULL OR packed_by IS NULL)
    ) THEN target:='ready_for_delivery';
    ELSIF original='ready_for_delivery' AND service_target='out_for_delivery' THEN target:='out_for_delivery';
    ELSIF original='out_for_delivery' AND service_target='delivery_issue' THEN target:='delivery_issue';
    ELSIF original='delivery_issue' AND action='service_retry' THEN target:='out_for_delivery'; END IF;
    IF original='out_for_delivery' AND NOT EXISTS(
      SELECT 1 FROM public.delivery_services WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL
        AND (status::text<>'delivered' OR delivered_at IS NULL OR delivered_by IS NULL)
    ) THEN target:='delivered'; END IF;
    IF target='in_production' AND original='confirmed' THEN
      UPDATE cr_order_private.operational_evidence SET production_started_at=coalesce(production_started_at,stamp)
        WHERE tenant_id=_tenant AND order_id=oid;
    ELSIF target='prepared' AND original='in_production' THEN
      UPDATE cr_order_private.operational_evidence SET production_completed_at=stamp
        WHERE tenant_id=_tenant AND order_id=oid;
    ELSIF target='ready_for_delivery' AND original='prepared' THEN
      UPDATE cr_order_private.operational_evidence SET packing_completed_at=stamp
        WHERE tenant_id=_tenant AND order_id=oid;
    END IF;
  ELSIF action='cancel' THEN
    IF (original='in_production' AND evidence.production_completed_at IS NULL)
      OR (original IN ('prepared','ready_for_delivery') AND evidence.production_completed_at IS NULL)
      OR (evidence.production_started_at IS NOT NULL AND evidence.production_completed_at IS NULL)
      OR (evidence.packing_started_at IS NOT NULL AND evidence.packing_completed_at IS NULL)
      OR EXISTS(SELECT 1 FROM public.delivery_services WHERE tenant_id=_tenant AND order_id=oid
        AND deleted_at IS NULL AND (status::text NOT IN ('pending','in_production','prepared','ready_for_delivery','cancelled')
          OR dispatched_at IS NOT NULL OR delivered_at IS NOT NULL))
      OR EXISTS(SELECT 1 FROM public.kitchen_production_batches b JOIN public.order_items i
        ON i.tenant_id=b.tenant_id AND i.day_date=b.delivery_date
        AND (b.custom_order_item_id=i.id OR b.item_kind='dish' AND b.dish_id=i.dish_id)
        WHERE i.tenant_id=_tenant AND i.order_id=oid AND i.deleted_at IS NULL
          AND b.status::text IN ('preparing','plating')) THEN
      RAISE EXCEPTION 'OPERATIONAL_WORK_STARTED';
    END IF;
    UPDATE public.delivery_services SET status='cancelled'
      WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL AND status::text<>'cancelled';
  ELSIF action='start_production' THEN
    UPDATE cr_order_private.operational_evidence SET production_started_at=stamp WHERE tenant_id=_tenant AND order_id=oid;
    UPDATE public.delivery_services SET status='in_production'
      WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL AND status::text='pending';
  ELSIF action='complete_production' THEN
    IF evidence.production_started_at IS NULL THEN RAISE EXCEPTION 'OPERATIONAL_EVIDENCE_REQUIRED'; END IF;
    UPDATE cr_order_private.operational_evidence SET production_completed_at=stamp WHERE tenant_id=_tenant AND order_id=oid;
    UPDATE public.delivery_services SET status='prepared'
      WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL AND status::text='in_production';
  ELSIF action='start_packing' THEN
    IF evidence.production_completed_at IS NULL OR evidence.packing_started_at IS NOT NULL THEN
      RAISE EXCEPTION 'OPERATIONAL_EVIDENCE_REQUIRED'; END IF;
    UPDATE cr_order_private.operational_evidence SET packing_started_at=stamp WHERE tenant_id=_tenant AND order_id=oid;
  ELSIF action='complete_packing' THEN
    IF evidence.packing_started_at IS NULL OR evidence.packing_completed_at IS NOT NULL THEN
      RAISE EXCEPTION 'OPERATIONAL_EVIDENCE_REQUIRED'; END IF;
    UPDATE cr_order_private.operational_evidence SET packing_completed_at=stamp WHERE tenant_id=_tenant AND order_id=oid;
  ELSIF action='assign_delivery' THEN
    IF evidence.packing_completed_at IS NULL THEN RAISE EXCEPTION 'OPERATIONAL_EVIDENCE_REQUIRED'; END IF;
    UPDATE cr_order_private.operational_evidence SET assigned_at=stamp WHERE tenant_id=_tenant AND order_id=oid;
    UPDATE public.delivery_services SET status='ready_for_delivery',packed_at=coalesce(packed_at,stamp),packed_by=coalesce(packed_by,actor)
      WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL AND status::text='prepared';
  ELSIF action='dispatch' THEN
    IF evidence.assigned_at IS NULL OR NOT EXISTS(SELECT 1 FROM public.delivery_services WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL)
      OR EXISTS(SELECT 1 FROM public.delivery_services WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL
        AND status::text NOT IN ('ready_for_delivery','delivered'))
      THEN RAISE EXCEPTION 'OPERATIONAL_EVIDENCE_REQUIRED'; END IF;
    UPDATE public.delivery_services SET status='out_for_delivery',dispatched_at=coalesce(dispatched_at,stamp)
      WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL
        AND status::text='ready_for_delivery';
  ELSIF action='complete_delivery' THEN
    -- Positive evidence, nonempty required set, no cancelled-as-delivered shortcut.
    IF NOT EXISTS(SELECT 1 FROM public.delivery_services WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL)
      OR EXISTS(SELECT 1 FROM public.delivery_services WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL
        AND (status::text<>'delivered' OR delivered_at IS NULL OR delivered_by IS NULL)) THEN
      RAISE EXCEPTION 'DELIVERY_RESOLUTION_REQUIRED';
    END IF;
  END IF;
  -- Evidence-only operations also serialize edits and cancellation using revision.
  UPDATE public.orders SET status=target::public.order_status,revision=revision+1
    WHERE tenant_id=_tenant AND id=oid RETURNING * INTO o;
  result := jsonb_build_object('tenantId',_tenant,'orderId',oid,'requestId',_request,'actorId',actor,
    'schemaVersion',1,'fromState',original,'toState',target,'committedRevision',o.revision,'outcome','COMMITTED','authority',authority);
  h := encode(sha256(convert_to(jsonb_build_object('tenant',_tenant,'request',_request,
    'actor',actor,'authority',authority,'command',_command,'targetState',target)::text,'UTF8')),'hex');
  IF service_target IS NOT NULL THEN
    result:=result||jsonb_build_object('serviceId',service.id,'serviceStatus',service_target,
      'resolutionRequired',service_target='delivered' AND target<>'delivered');
  END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'status',status) ORDER BY id),'[]'::jsonb)
    INTO dependent_after FROM public.delivery_services WHERE tenant_id=_tenant AND order_id=oid AND deleted_at IS NULL;
  INSERT INTO public.audit_log(tenant_id,actor_id,entity_type,entity_id,action,old_data,new_data)
    VALUES(_tenant,actor,'order',oid,'order.v2.lifecycle',jsonb_build_object('status',original,'revision',o.revision-1,'deliveryServices',dependent_before),
      result||jsonb_build_object('action',action,'reason',_command->>'reason','inputHash',h,'deliveryServices',dependent_after));
  INSERT INTO public.order_write_requests(tenant_id,request_id,operation,input_hash,order_id,committed_revision,lifecycle_result)
    VALUES(_tenant,_request,'lifecycle',h,oid,o.revision,result);
  RETURN result;
END $$;
ALTER FUNCTION cr_order_private.lifecycle_v2(uuid,uuid,jsonb) OWNER TO cr_order_writer;
REVOKE ALL ON FUNCTION cr_order_private.lifecycle_v2(uuid,uuid,jsonb) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION cr_order_private.lifecycle_v2(uuid,uuid,jsonb) TO authenticated;
CREATE FUNCTION public.cr_order_lifecycle_v2(_tenant_id uuid,_request_id uuid,_command jsonb)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT cr_order_private.lifecycle_v2(_tenant_id,_request_id,_command)
$$;
REVOKE ALL ON FUNCTION public.cr_order_lifecycle_v2(uuid,uuid,jsonb) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.cr_order_lifecycle_v2(uuid,uuid,jsonb) TO authenticated;
CREATE FUNCTION cr_order_private.guard_lifecycle_service() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE row_data public.delivery_services; v2 boolean;
BEGIN
  IF TG_OP='DELETE' THEN row_data:=OLD; ELSE row_data:=NEW; END IF;
  SELECT write_contract_version=2 INTO v2 FROM public.orders
    WHERE tenant_id=row_data.tenant_id AND id=row_data.order_id;
  IF coalesce(v2,false) AND current_user<>'cr_order_writer' THEN
    RAISE EXCEPTION 'V2_CANONICAL_WRITER_REQUIRED'; END IF;
  IF TG_OP='UPDATE' AND (OLD.tenant_id IS DISTINCT FROM NEW.tenant_id
    OR OLD.order_id IS DISTINCT FROM NEW.order_id OR OLD.id IS DISTINCT FROM NEW.id) THEN
    RAISE EXCEPTION 'DELIVERY_SERVICE_IDENTITY_IMMUTABLE'; END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER cr_order_v2_service_guard BEFORE INSERT OR UPDATE OR DELETE ON public.delivery_services
  FOR EACH ROW EXECUTE FUNCTION cr_order_private.guard_lifecycle_service();

CREATE FUNCTION cr_order_private.guard_lifecycle_history() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    IF TG_TABLE_NAME='order_write_requests' THEN
      IF NEW.operation='lifecycle' AND current_user<>'cr_order_writer' THEN RAISE EXCEPTION 'V2_CANONICAL_WRITER_REQUIRED'; END IF;
    ELSE
      IF NEW.action='order.v2.lifecycle' AND current_user<>'cr_order_writer' THEN RAISE EXCEPTION 'V2_CANONICAL_WRITER_REQUIRED'; END IF;
    END IF;
    RETURN NEW;
  END IF;
  IF TG_TABLE_NAME='order_write_requests' THEN
    IF OLD.operation='lifecycle' THEN RAISE EXCEPTION 'LIFECYCLE_HISTORY_IMMUTABLE'; END IF;
  ELSE
    IF OLD.action='order.v2.lifecycle' THEN RAISE EXCEPTION 'LIFECYCLE_HISTORY_IMMUTABLE'; END IF;
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER lifecycle_ledger_immutable BEFORE INSERT OR UPDATE OR DELETE ON public.order_write_requests
  FOR EACH ROW EXECUTE FUNCTION cr_order_private.guard_lifecycle_history();
CREATE TRIGGER lifecycle_audit_immutable BEFORE INSERT OR UPDATE OR DELETE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION cr_order_private.guard_lifecycle_history();

CREATE FUNCTION cr_order_private.fence_cancelled_batch_work() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE k text;
BEGIN
  k:='cr-order-day:'||NEW.tenant_id||':'||to_char(NEW.delivery_date,'YYYY-MM-DD')||':'||
    CASE WHEN NEW.item_kind='custom' THEN 'custom:'||NEW.custom_order_item_id ELSE 'dish:'||NEW.dish_id END;
  PERFORM pg_advisory_xact_lock(hashtextextended(k,0));
  IF NEW.status::text IN ('preparing','plating','finished')
    AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM NEW.status)
    AND EXISTS(SELECT 1 FROM public.order_items i JOIN public.orders o ON o.tenant_id=i.tenant_id AND o.id=i.order_id
      WHERE i.tenant_id=NEW.tenant_id AND i.day_date=NEW.delivery_date AND o.write_contract_version=2
        AND (NEW.item_kind='custom' AND i.id=NEW.custom_order_item_id OR NEW.item_kind='dish' AND i.dish_id=NEW.dish_id))
    AND NOT EXISTS(SELECT 1 FROM public.order_items i JOIN public.orders o ON o.tenant_id=i.tenant_id AND o.id=i.order_id
      WHERE i.tenant_id=NEW.tenant_id AND i.day_date=NEW.delivery_date AND i.deleted_at IS NULL AND o.deleted_at IS NULL
        AND o.status::text NOT IN ('cancelled','delivered')
        AND (NEW.item_kind='custom' AND i.id=NEW.custom_order_item_id OR NEW.item_kind='dish' AND i.dish_id=NEW.dish_id)) THEN
    RAISE EXCEPTION 'ORDER_CLOSED';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER cr_order_a5_batch_fence BEFORE INSERT OR UPDATE ON public.kitchen_production_batches
  FOR EACH ROW EXECUTE FUNCTION cr_order_private.fence_cancelled_batch_work();

CREATE FUNCTION cr_order_private.lifecycle_context(_tenant uuid,_order uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o public.orders; e cr_order_private.operational_evidence;
BEGIN
  IF current_setting('role',true) IS DISTINCT FROM 'authenticated'
    OR NOT cr_order_private.lifecycle_reader(_tenant) THEN RAISE EXCEPTION 'PERMISSION_DENIED'; END IF;
  SELECT * INTO o FROM public.orders WHERE tenant_id=_tenant AND id=_order AND deleted_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  SELECT * INTO e FROM cr_order_private.operational_evidence WHERE tenant_id=_tenant AND order_id=_order;
  RETURN jsonb_build_object('orderId',o.id,'status',o.status,'revision',o.revision,
    'writeContractVersion',o.write_contract_version,'evidence',to_jsonb(e));
END $$;
ALTER FUNCTION cr_order_private.lifecycle_context(uuid,uuid) OWNER TO cr_order_writer;
REVOKE ALL ON FUNCTION cr_order_private.lifecycle_context(uuid,uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION cr_order_private.lifecycle_context(uuid,uuid) TO authenticated;
CREATE FUNCTION public.cr_order_lifecycle_context(_tenant_id uuid,_order_id uuid) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
  SELECT cr_order_private.lifecycle_context(_tenant_id,_order_id)
$$;
REVOKE ALL ON FUNCTION public.cr_order_lifecycle_context(uuid,uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.cr_order_lifecycle_context(uuid,uuid) TO authenticated;
REVOKE CREATE ON SCHEMA cr_order_private FROM cr_order_writer;
COMMIT;
