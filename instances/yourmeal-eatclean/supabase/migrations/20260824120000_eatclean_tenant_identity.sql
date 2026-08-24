-- Migration: 20260824120000_eatclean_tenant_identity.sql
-- Establishes the canonical single tenant identity for EatClean Tenerife

INSERT INTO public.tenants (
  id,
  slug,
  name,
  brand,
  locale_default,
  status,
  created_at
)
VALUES (
  gen_random_uuid(),
  'eatclean',
  'EatClean',
  '{"primaryColor": "#145B32", "secondaryColor": "#EDB32A"}'::jsonb,
  'es',
  'active',
  now()
)
ON CONFLICT (slug) DO NOTHING;

-- Primary Domain
INSERT INTO public.tenant_domains (
  tenant_id,
  domain,
  is_primary
)
SELECT id, 'eatclean.yourmealos.com', true
FROM public.tenants
WHERE slug = 'eatclean'
ON CONFLICT (domain) DO NOTHING;
