-- ============================================================================
-- CR-OPS-06: DELIVERY SERVICES & MULTI-DAY FULFILLMENT FOUNDATION
-- Decouples commercial order contract (orders) from physical delivery days (delivery_services).
-- 100% additive, non-destructive, with safe idempotent historical backfill.
-- ============================================================================

-- 1. Enum for delivery service micro-state
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_service_status') THEN
    CREATE TYPE public.delivery_service_status AS ENUM (
      'pending',
      'in_production',
      'prepared',
      'ready_for_delivery',
      'out_for_delivery',
      'delivered',
      'delivery_issue',
      'cancelled'
    );
  END IF;
END $$;

-- 2. Delivery services table
CREATE TABLE IF NOT EXISTS public.delivery_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  delivery_date date NOT NULL,
  status public.delivery_service_status NOT NULL DEFAULT 'pending',

  -- Reference to current address record (nullable)
  delivery_address_id uuid REFERENCES public.customer_addresses(id) ON DELETE SET NULL,

  -- Immutable snapshots frozen at confirmation / intake
  delivery_address_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  customer_contact_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  dietary_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  delivery_instructions text,

  -- Operational fulfillment tracking
  packed_at timestamptz,
  packed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  delivered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Issue handling & driver communication
  issue_reason text,
  issue_notes text,
  driver_notes text,

  -- Historical migration flag
  legacy_backfill boolean NOT NULL DEFAULT false,

  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,

  -- Exactly one delivery service per order per calendar date
  CONSTRAINT uq_delivery_services_order_day UNIQUE (tenant_id, order_id, delivery_date)
);

-- 3. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_services TO authenticated;
GRANT ALL ON public.delivery_services TO service_role;

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_delivery_services_day_status
  ON public.delivery_services(tenant_id, delivery_date, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_delivery_services_order
  ON public.delivery_services(tenant_id, order_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_delivery_services_customer
  ON public.delivery_services(tenant_id, customer_id)
  WHERE deleted_at IS NULL;

-- 5. Row Level Security
ALTER TABLE public.delivery_services ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Staff policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'delivery_services' AND policyname = 'delivery_services_staff_all'
  ) THEN
    CREATE POLICY delivery_services_staff_all ON public.delivery_services
      FOR ALL TO authenticated
      USING (
        public.has_any_staff_role(auth.uid(), tenant_id)
        OR public.is_saas_admin(auth.uid())
      )
      WITH CHECK (
        public.has_any_staff_role(auth.uid(), tenant_id)
        OR public.is_saas_admin(auth.uid())
      );
  END IF;

  -- Driver read-only policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'delivery_services' AND policyname = 'delivery_services_driver_read'
  ) THEN
    CREATE POLICY delivery_services_driver_read ON public.delivery_services
      FOR SELECT TO authenticated
      USING (
        delivered_by = auth.uid()
      );
  END IF;

  -- Customer read-only policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'delivery_services' AND policyname = 'delivery_services_customer_read'
  ) THEN
    CREATE POLICY delivery_services_customer_read ON public.delivery_services
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.customers c
          WHERE c.id = customer_id AND c.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 6. RPC Function: transition_delivery_service_status
-- Atomic transition of a delivery service microstate with macro order state synchronization.
CREATE OR REPLACE FUNCTION public.transition_delivery_service_status(
  p_tenant_id uuid,
  p_service_id uuid,
  p_to_status public.delivery_service_status,
  p_actor_id uuid DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS public.delivery_services
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service public.delivery_services%ROWTYPE;
  v_order_id uuid;
  v_all_resolved boolean := false;
  v_unresolved_count integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT (
    public.has_any_staff_role(auth.uid(), p_tenant_id)
    OR public.is_saas_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  SELECT * INTO v_service
  FROM public.delivery_services
  WHERE id = p_service_id
    AND tenant_id = p_tenant_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'delivery service not found: %', p_service_id;
  END IF;

  v_order_id := v_service.order_id;

  -- Update service microstate and timestamps
  UPDATE public.delivery_services
  SET
    status = p_to_status,
    packed_at = CASE
      WHEN p_to_status = 'ready_for_delivery' AND packed_at IS NULL THEN now()
      ELSE packed_at
    END,
    packed_by = CASE
      WHEN p_to_status = 'ready_for_delivery' AND packed_by IS NULL THEN coalesce(p_actor_id, auth.uid())
      ELSE packed_by
    END,
    dispatched_at = CASE
      WHEN p_to_status = 'out_for_delivery' AND dispatched_at IS NULL THEN now()
      ELSE dispatched_at
    END,
    delivered_at = CASE
      WHEN p_to_status = 'delivered' AND delivered_at IS NULL THEN now()
      ELSE delivered_at
    END,
    delivered_by = CASE
      WHEN p_to_status = 'delivered' AND delivered_by IS NULL THEN coalesce(p_actor_id, auth.uid())
      ELSE delivered_by
    END,
    driver_notes = CASE
      WHEN p_notes IS NOT NULL THEN p_notes
      ELSE driver_notes
    END,
    updated_at = now()
  WHERE id = p_service_id
  RETURNING * INTO v_service;

  -- Synchronize parent order macrostate:
  -- Check if all delivery services for this order are in terminal states (delivered or cancelled)
  SELECT count(*) INTO v_unresolved_count
  FROM public.delivery_services
  WHERE order_id = v_order_id
    AND tenant_id = p_tenant_id
    AND deleted_at IS NULL
    AND status NOT IN ('delivered', 'cancelled');

  IF v_unresolved_count = 0 THEN
    -- All delivery services are completed/resolved -> Order macrostate is delivered
    UPDATE public.orders
    SET status = 'delivered'
    WHERE id = v_order_id
      AND tenant_id = p_tenant_id
      AND status != 'delivered';
  ELSE
    -- Order has ongoing fulfillment
    UPDATE public.orders
    SET status = 'in_production'
    WHERE id = v_order_id
      AND tenant_id = p_tenant_id
      AND status = 'confirmed';
  END IF;

  RETURN v_service;
END;
$$;

GRANT EXECUTE ON FUNCTION public.transition_delivery_service_status(uuid, uuid, public.delivery_service_status, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transition_delivery_service_status(uuid, uuid, public.delivery_service_status, uuid, text) TO service_role;

-- 7. Idempotent Safe Historical Backfill
-- Populates delivery_services for existing non-draft orders that have valid order_items.
-- NEVER modifies or deletes existing orders or order_items.
DO $$
DECLARE
  r RECORD;
  v_addr_snapshot jsonb;
  v_contact_snapshot jsonb;
  v_dietary_snapshot jsonb;
  v_service_status public.delivery_service_status;
BEGIN
  FOR r IN
    SELECT
      o.id AS order_id,
      o.tenant_id,
      o.customer_id,
      o.status AS order_status,
      o.delivery_address_id,
      o.dietary_snapshot,
      o.notes AS order_notes,
      o.created_at AS order_created_at,
      oi.day_date,
      c.display_name,
      c.email,
      ca.street,
      ca.city,
      ca.zip,
      ca.label AS address_label,
      ca.lat,
      ca.lng
    FROM public.orders o
    JOIN public.order_items oi ON oi.order_id = o.id AND oi.deleted_at IS NULL
    LEFT JOIN public.customers c ON c.id = o.customer_id
    LEFT JOIN public.customer_addresses ca ON ca.id = o.delivery_address_id
    WHERE o.status != 'draft'
      AND o.deleted_at IS NULL
    GROUP BY
      o.id, o.tenant_id, o.customer_id, o.status, o.delivery_address_id,
      o.dietary_snapshot, o.notes, o.created_at, oi.day_date,
      c.display_name, c.email, ca.street, ca.city, ca.zip, ca.label, ca.lat, ca.lng
  LOOP
    -- Build address snapshot
    IF r.street IS NOT NULL THEN
      v_addr_snapshot := jsonb_build_object(
        'addressId', r.delivery_address_id,
        'street', r.street,
        'city', r.city,
        'zip', r.zip,
        'label', r.address_label,
        'lat', r.lat,
        'lng', r.lng
      );
    ELSE
      v_addr_snapshot := jsonb_build_object('unresolved', true, 'reason', 'no_address_at_intake');
    END IF;

    -- Build contact snapshot
    v_contact_snapshot := jsonb_build_object(
      'customerId', r.customer_id,
      'displayName', coalesce(r.display_name, 'Cliente'),
      'email', r.email,
      'phone', null
    );

    -- Build dietary snapshot
    v_dietary_snapshot := coalesce(r.dietary_snapshot, '{}'::jsonb);

    -- Determine initial status from order status
    IF r.order_status = 'cancelled' THEN
      v_service_status := 'cancelled';
    ELSIF r.order_status = 'delivered' THEN
      v_service_status := 'delivered';
    ELSIF r.order_status = 'ready_for_delivery' THEN
      v_service_status := 'ready_for_delivery';
    ELSIF r.order_status = 'in_production' THEN
      v_service_status := 'in_production';
    ELSE
      v_service_status := 'pending';
    END IF;

    -- Idempotent insert with legacy_backfill = true
    INSERT INTO public.delivery_services (
      tenant_id,
      order_id,
      customer_id,
      delivery_date,
      status,
      delivery_address_id,
      delivery_address_snapshot,
      customer_contact_snapshot,
      dietary_snapshot,
      delivery_instructions,
      legacy_backfill,
      created_at,
      updated_at
    )
    VALUES (
      r.tenant_id,
      r.order_id,
      r.customer_id,
      r.day_date,
      v_service_status,
      r.delivery_address_id,
      v_addr_snapshot,
      v_contact_snapshot,
      v_dietary_snapshot,
      r.order_notes,
      true,
      r.order_created_at,
      now()
    )
    ON CONFLICT (tenant_id, order_id, delivery_date) DO NOTHING;
  END LOOP;
END $$;
