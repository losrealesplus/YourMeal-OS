-- Tighten Company Account creation: only Tenant staff / SaaS (commercial event).
-- Employees join via membership; they must not INSERT companies.

DROP POLICY IF EXISTS companies_insert ON public.companies;

CREATE POLICY companies_insert_staff ON public.companies FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.is_saas_admin(auth.uid())
  );
