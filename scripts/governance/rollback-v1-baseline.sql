SELECT jsonb_build_object(
 'schemaSha256',encode(sha256(convert_to(jsonb_build_object(
  'columns',(SELECT jsonb_agg(row_to_json(c) ORDER BY table_name,ordinal_position) FROM (SELECT table_name,column_name,ordinal_position,data_type,udt_name,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('orders','order_items','delivery_services','audit_log')) c),
  'constraints',(SELECT jsonb_agg(pg_get_constraintdef(oid) ORDER BY conrelid::regclass::text,conname) FROM pg_constraint WHERE conrelid IN ('public.orders'::regclass,'public.order_items'::regclass,'public.delivery_services'::regclass,'public.audit_log'::regclass)),
  'triggers',(SELECT jsonb_agg(pg_get_triggerdef(oid) ORDER BY tgrelid::regclass::text,tgname) FROM pg_trigger WHERE tgrelid IN ('public.orders'::regclass,'public.order_items'::regclass,'public.delivery_services'::regclass,'public.audit_log'::regclass) AND NOT tgisinternal),
  'guards',(SELECT jsonb_agg(pg_get_functiondef(p.oid) ORDER BY n.nspname,p.proname,pg_get_function_identity_arguments(p.oid)) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('has_role','is_saas_admin') OR n.nspname='cr_order_private' AND p.proname IN ('guard_v2','guard_lifecycle_service','guard_order_cutoff') OR p.oid IN (SELECT tgfoid FROM pg_trigger WHERE tgrelid IN ('public.orders'::regclass,'public.order_items'::regclass,'public.delivery_services'::regclass,'public.audit_log'::regclass) AND NOT tgisinternal)),
  'enums',(SELECT jsonb_agg(jsonb_build_object('type',t.typname,'value',e.enumlabel) ORDER BY t.typname,e.enumsortorder) FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid WHERE t.typnamespace='public'::regnamespace AND t.typname IN ('app_role','order_status','delivery_service_status'))
 )::text,'UTF8')),'hex'),
 'ledgerVersions',(SELECT jsonb_agg(version ORDER BY version) FROM supabase_migrations.schema_migrations),
 'rpcAbsent',NOT EXISTS(SELECT FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.proname='rollback_order_status_v1'),
 'tenantVerified',EXISTS(SELECT FROM public.tenants WHERE id='8bba00ba-331b-42c8-9283-4e3836ffb870' AND slug='eatclean'),
 'ledgerColumns',(SELECT jsonb_agg(column_name ORDER BY ordinal_position) FROM information_schema.columns WHERE table_schema='supabase_migrations' AND table_name='schema_migrations')
);
