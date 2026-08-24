-- Diagnostic query to verify row counts on EatClean Supabase
DO $$
DECLARE
  v_tenant_count integer;
  v_customer_count integer;
  v_company_count integer;
  v_dish_count integer;
  v_order_count integer;
  v_exception_count integer;
BEGIN
  SELECT count(*) INTO v_tenant_count FROM public.tenants WHERE slug = 'eatclean';
  SELECT count(*) INTO v_customer_count FROM public.customers;
  SELECT count(*) INTO v_company_count FROM public.companies;
  SELECT count(*) INTO v_dish_count FROM public.dishes;
  SELECT count(*) INTO v_order_count FROM public.orders;
  SELECT count(*) INTO v_exception_count FROM public.operational_exceptions;

  RAISE NOTICE 'AUDIT_RESULT: tenants=%, customers=%, companies=%, dishes=%, orders=%, exceptions=%',
    v_tenant_count, v_customer_count, v_company_count, v_dish_count, v_order_count, v_exception_count;

  IF v_tenant_count <> 1 THEN
    RAISE EXCEPTION 'TENANT_IDENTITY_MISSING: Expected exactly 1 tenant record for eatclean';
  END IF;

  IF (v_customer_count + v_company_count + v_dish_count + v_order_count + v_exception_count) <> 0 THEN
    RAISE EXCEPTION 'DATABASE_NOT_EMPTY: Expected exactly 0 business records in empty instance foundation';
  END IF;
END $$;
