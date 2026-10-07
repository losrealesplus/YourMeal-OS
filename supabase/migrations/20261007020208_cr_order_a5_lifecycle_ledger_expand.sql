-- A5.1 expand only. No callable lifecycle API, activation or historical rewrite.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

ALTER TABLE public.order_write_requests
  DROP CONSTRAINT order_write_requests_operation_check,
  ADD CONSTRAINT order_write_requests_operation_check
    CHECK (operation IN ('capture', 'modify', 'lifecycle')),
  ADD COLUMN lifecycle_result jsonb;

-- Store the original minimal committed result, not a later order projection.
-- Names, notes, dietary data and commercial snapshots are not duplicated here.
ALTER TABLE public.order_write_requests
  ADD CONSTRAINT order_write_requests_lifecycle_result_check CHECK (
    coalesce(CASE WHEN operation = 'lifecycle' THEN
      lifecycle_result IS NOT NULL
      AND jsonb_typeof(lifecycle_result) = 'object'
      AND lifecycle_result ?& ARRAY[
        'tenantId', 'orderId', 'requestId', 'actorId', 'schemaVersion',
        'fromState', 'toState', 'committedRevision', 'outcome'
      ]
      AND lifecycle_result->>'tenantId' = tenant_id::text
      AND lifecycle_result->>'orderId' = order_id::text
      AND lifecycle_result->>'requestId' = request_id::text
      AND jsonb_typeof(lifecycle_result->'actorId') = 'string'
      AND lifecycle_result->>'actorId' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND lifecycle_result->'schemaVersion' = '1'::jsonb
      AND lifecycle_result->'committedRevision' = to_jsonb(committed_revision)
      AND lifecycle_result->>'outcome' = 'COMMITTED'
      AND lifecycle_result->>'fromState' IN (
        'draft', 'confirmed', 'in_production', 'prepared', 'ready_for_delivery',
        'out_for_delivery', 'delivery_issue', 'delivered', 'cancelled'
      )
      AND lifecycle_result->>'toState' IN (
        'draft', 'confirmed', 'in_production', 'prepared', 'ready_for_delivery',
        'out_for_delivery', 'delivery_issue', 'delivered', 'cancelled'
      )
    ELSE lifecycle_result IS NULL END, false)
  );

COMMENT ON COLUMN public.order_write_requests.lifecycle_result IS
  'A5: immutable minimal original lifecycle result for exact replay. NULL for capture/modify. Writer authorization and transition semantics are separate slices.';

-- Preserve existing ACL/RLS. No grant, policy, function, gate or provider write.
COMMIT;
