-- ADR 0102 / CR-ORDER r1: compatible expand only. No custom or writer-v2 activation.
-- Apply only through a separately authorized migration gate after current preflight.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- Validated constraints deliberately fail on pre-existing cross-tenant references.
-- Replace single-column FK under the same name, avoiding ambiguous PostgREST embeds.
-- No repair/backfill of historical knowledge or financial snapshots is performed.
ALTER TABLE public.orders
  ADD COLUMN revision integer NOT NULL DEFAULT 0,
  ADD COLUMN write_contract_version integer NOT NULL DEFAULT 1,
  ADD CONSTRAINT orders_revision_nonnegative CHECK (revision >= 0),
  ADD CONSTRAINT orders_expand_v1_only CHECK (write_contract_version = 1),
  ADD CONSTRAINT orders_tenant_id_id_unique UNIQUE (tenant_id, id);
ALTER TABLE public.dishes
  ADD CONSTRAINT dishes_tenant_id_id_unique UNIQUE (tenant_id, id);

ALTER TABLE public.order_items
  ADD COLUMN item_kind text NOT NULL DEFAULT 'dish',
  ADD COLUMN name_snapshot text NULL,
  ADD COLUMN description_snapshot text NULL,
  ADD COLUMN allergen_state text NOT NULL DEFAULT 'HISTORICAL_UNAVAILABLE',
  ADD COLUMN allergens_snapshot text[] NULL,
  ADD COLUMN snapshot_captured_at timestamptz NULL,
  ADD COLUMN snapshot_author_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT order_items_tenant_id_id_unique UNIQUE (tenant_id, id),
  DROP CONSTRAINT order_items_order_id_fkey,
  DROP CONSTRAINT order_items_dish_id_fkey,
  ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (tenant_id, order_id)
    REFERENCES public.orders(tenant_id, id) ON DELETE CASCADE,
  ADD CONSTRAINT order_items_dish_id_fkey FOREIGN KEY (tenant_id, dish_id)
    REFERENCES public.dishes(tenant_id, id),
  -- Closed foundation: legacy callers cannot manufacture snapshots/custom before writer v2.
  ADD CONSTRAINT order_items_expand_dish_only CHECK (
    item_kind = 'dish' AND dish_id IS NOT NULL
    AND name_snapshot IS NULL AND description_snapshot IS NULL
    AND allergen_state = 'HISTORICAL_UNAVAILABLE' AND allergens_snapshot IS NULL
    AND snapshot_captured_at IS NULL AND snapshot_author_id IS NULL
  );
CREATE INDEX order_items_tenant_order_idx ON public.order_items(tenant_id, order_id);
CREATE INDEX order_items_tenant_dish_idx ON public.order_items(tenant_id, dish_id);

ALTER TABLE public.kitchen_production_batches
  ADD COLUMN item_kind text NOT NULL DEFAULT 'dish',
  ADD COLUMN custom_order_item_id uuid NULL,
  ADD CONSTRAINT kitchen_batches_expand_dish_only CHECK (
    item_kind = 'dish' AND dish_id IS NOT NULL AND custom_order_item_id IS NULL
  ),
  DROP CONSTRAINT kitchen_production_batches_dish_id_fkey,
  ADD CONSTRAINT kitchen_production_batches_dish_id_fkey FOREIGN KEY (tenant_id, dish_id)
    REFERENCES public.dishes(tenant_id, id) ON DELETE CASCADE,
  ADD CONSTRAINT kitchen_batches_tenant_custom_item_fk FOREIGN KEY (tenant_id, custom_order_item_id)
    REFERENCES public.order_items(tenant_id, id);
-- Existing dish uniqueness, state machine, policies and NOT NULL stay unchanged.

CREATE TABLE public.order_write_requests (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  request_id uuid NOT NULL,
  operation text NOT NULL CHECK (operation IN ('capture', 'modify')),
  input_hash text NOT NULL CHECK (input_hash ~ '^[0-9a-f]{64}$'),
  order_id uuid NOT NULL,
  committed_revision integer NOT NULL CHECK (committed_revision >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, request_id),
  CONSTRAINT order_write_requests_tenant_order_fk FOREIGN KEY (tenant_id, order_id)
    REFERENCES public.orders(tenant_id, id)
);
CREATE INDEX order_write_requests_tenant_order_idx
  ON public.order_write_requests(tenant_id, order_id);
ALTER TABLE public.order_write_requests ENABLE ROW LEVEL SECURITY;
-- No policies, grants or callable RPC yet. Includes inherited Data API default grants.
REVOKE ALL ON public.order_write_requests FROM PUBLIC, anon, authenticated, service_role;
COMMENT ON TABLE public.order_write_requests IS
  'CR-ORDER expand: closed idempotency foundation; writer-v2 authorization is a separate gate.';
COMMIT;
