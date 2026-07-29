-- =====================================================================
-- YourMeal OS · Semillas mínimas para el proyecto destino (INFRA-008 · B)
-- Ejecutar DESPUÉS de scripts/cutover/000_consolidated_schema.sql
-- Idempotente: usa ON CONFLICT DO NOTHING.
--
-- NO incluye datos ligados a auth.users (customers, orders, user_roles,
-- tenant_members, profiles). Esos se materializan al registrarse los
-- usuarios reales en el nuevo proyecto.
-- =====================================================================

BEGIN;

-- --- Tenant fundacional -------------------------------------------------
INSERT INTO public.tenants (
  id, slug, name, brand, locale_default, status,
  country, currency, timezone, time_format,
  unit_weight, unit_volume, unit_distance, unit_temperature
) VALUES (
  '2a597790-8d62-4580-8615-3acd728effcc',
  'eatclean-tenerife',
  'EatClean Tenerife',
  '{"country":"ES","logo_text":"EatClean Tenerife","primary":"#059669"}'::jsonb,
  'es',
  'active',
  'ES', 'EUR', 'Atlantic/Canary', '24h',
  'metric', 'metric', 'metric', 'C'
) ON CONFLICT (id) DO NOTHING;

-- --- Feature flags ------------------------------------------------------
INSERT INTO public.feature_flags (id, key, description, enabled, tenant_id, metadata)
VALUES (
  '7ae16cd8-bd6a-43f0-b47b-62a47ebc20be',
  'dish_library',
  'Dish Library module',
  true,
  NULL,
  '{"module":"catalog","phase":"first"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- --- Catálogo de platos -------------------------------------------------
INSERT INTO public.dishes (
  id, tenant_id, name, description, kcal, weight_g, macros,
  cost, price, prep_minutes, allergens, status, category_id, tags
) VALUES
(
  '0dd1a4e1-3c09-4c15-9621-13b124b3489f',
  '2a597790-8d62-4580-8615-3acd728effcc',
  'Pollo al limón con quinoa',
  'Pechuga marinada con quinoa y verduras',
  520, 380, '{"c":48,"f":14,"p":42}'::jsonb,
  3.20, 9.90, 15, ARRAY[]::text[], 'active', 'mains', ARRAY['high-protein']
),
(
  '5af11080-62ff-4b93-b9f6-98381f5d62a1',
  '2a597790-8d62-4580-8615-3acd728effcc',
  'Salmón con boniato',
  'Salmón al horno con boniato asado',
  610, 400, '{"c":52,"f":22,"p":38}'::jsonb,
  4.10, 11.50, 18, ARRAY['fish']::text[], 'active', 'mains', ARRAY['omega3']
),
(
  '1a5dce86-2203-4596-bbbd-bfd857a35679',
  '2a597790-8d62-4580-8615-3acd728effcc',
  'Bowl vegetal mediterráneo',
  'Garbanzos, cuscús, hummus y vegetales',
  480, 420, '{"c":68,"f":14,"p":18}'::jsonb,
  2.40, 8.90, 10, ARRAY['gluten']::text[], 'active', 'mains', ARRAY['vegan']
)
ON CONFLICT (id) DO NOTHING;

-- --- Menú semanal publicado --------------------------------------------
INSERT INTO public.weekly_menus (id, tenant_id, week_start, status, published_at)
VALUES (
  '27706b64-bcef-4673-b82f-8ada2b087943',
  '2a597790-8d62-4580-8615-3acd728effcc',
  DATE '2026-07-20',
  'published',
  now()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.weekly_menu_slots (id, weekly_menu_id, tenant_id, day_date, dish_id, sort_order)
VALUES
('ff68c5e5-ed12-47ff-80aa-71ea80039aa2','27706b64-bcef-4673-b82f-8ada2b087943','2a597790-8d62-4580-8615-3acd728effcc',DATE '2026-07-20','0dd1a4e1-3c09-4c15-9621-13b124b3489f',1),
('01082f32-23a9-47ee-b437-f4f242117f62','27706b64-bcef-4673-b82f-8ada2b087943','2a597790-8d62-4580-8615-3acd728effcc',DATE '2026-07-21','5af11080-62ff-4b93-b9f6-98381f5d62a1',2),
('e515a7c6-ab8c-4d99-9316-e7c42d9acdeb','27706b64-bcef-4673-b82f-8ada2b087943','2a597790-8d62-4580-8615-3acd728effcc',DATE '2026-07-22','1a5dce86-2203-4596-bbbd-bfd857a35679',3)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- --- POST-CHECK ---------------------------------------------------------
-- select slug, name, currency, timezone from public.tenants;
-- select name, price, status from public.dishes order by name;
-- select week_start, status from public.weekly_menus;
