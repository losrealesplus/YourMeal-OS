-- MVP-01.6 — Remove confirmed recursive RLS policies (42P17).
--
-- Forensic MVP-01.5 demonstrated:
--   cemp_read / cemp_write SELECT company_employees under RLS → infinite recursion
--   companies_read / companies_write EXISTS company_employees → same cycle
--     (blocks GET /companies and INVOKER generate_company_code)
--
-- Intentional residual cleanup only. Safe staff policies remain:
--   company_employees: cemp_all
--   companies: companies_select_staff, companies_write_staff, companies_insert_staff
--
-- Does NOT disable RLS, widen USING/WITH CHECK, or alter generate_company_code.

DROP POLICY IF EXISTS cemp_read ON public.company_employees;
DROP POLICY IF EXISTS cemp_write ON public.company_employees;

DROP POLICY IF EXISTS companies_read ON public.companies;
DROP POLICY IF EXISTS companies_write ON public.companies;
