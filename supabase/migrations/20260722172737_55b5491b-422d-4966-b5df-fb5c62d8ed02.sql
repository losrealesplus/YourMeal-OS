CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_tenant_created_idx ON public.audit_log (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON public.audit_log (entity_type, entity_id);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_log_read ON public.audit_log;
CREATE POLICY audit_log_read ON public.audit_log FOR SELECT TO authenticated
  USING (public.is_saas_admin(auth.uid()) OR (tenant_id IS NOT NULL AND public.has_role(auth.uid(), tenant_id, 'company_admin')));
DROP POLICY IF EXISTS audit_log_insert ON public.audit_log;
CREATE POLICY audit_log_insert ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() AND (public.is_saas_admin(auth.uid()) OR (tenant_id IS NOT NULL AND public.is_tenant_member(tenant_id))));

CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT false,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS feature_flags_global_key_uidx ON public.feature_flags (key) WHERE tenant_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS feature_flags_tenant_key_uidx ON public.feature_flags (tenant_id, key) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS feature_flags_tenant_idx ON public.feature_flags (tenant_id);
GRANT SELECT ON public.feature_flags TO authenticated;
GRANT ALL ON public.feature_flags TO service_role;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS feature_flags_read ON public.feature_flags;
CREATE POLICY feature_flags_read ON public.feature_flags FOR SELECT TO authenticated
  USING (tenant_id IS NULL OR public.is_tenant_member(tenant_id) OR public.is_saas_admin(auth.uid()));
DROP POLICY IF EXISTS feature_flags_admin_write ON public.feature_flags;
CREATE POLICY feature_flags_admin_write ON public.feature_flags FOR ALL TO authenticated
  USING (public.is_saas_admin(auth.uid())) WITH CHECK (public.is_saas_admin(auth.uid()));
DROP TRIGGER IF EXISTS feature_flags_touch_updated_at ON public.feature_flags;
CREATE TRIGGER feature_flags_touch_updated_at BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.feature_flags (key, description, enabled, tenant_id, metadata)
SELECT 'dish_library','Dish Library module',true,NULL,'{"module":"catalog","phase":"first"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.feature_flags WHERE key='dish_library' AND tenant_id IS NULL);