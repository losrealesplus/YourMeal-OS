
REVOKE EXECUTE ON FUNCTION public.ensure_individual_customer(uuid, uuid, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.resolve_delivery_group(uuid, uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_individual_customer(uuid, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_delivery_group(uuid, uuid, uuid, uuid) TO authenticated;
