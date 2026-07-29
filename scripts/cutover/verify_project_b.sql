-- =====================================================================
-- INFRA-011 · verify_project_b.sql
-- Project: djangucecsphnejplvic
-- READ-ONLY — no INSERT / UPDATE / DELETE / DDL
-- Run in SQL Editor after schema + bucket + seed steps.
-- =====================================================================

-- 1) Bucket tenant-branding
SELECT
  'bucket:tenant-branding' AS check_id,
  CASE WHEN EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'tenant-branding'
  ) THEN 'EXISTS' ELSE 'MISSING' END AS result;

-- 2) platform_owners (table + at least one active row)
SELECT
  'table:platform_owners' AS check_id,
  CASE WHEN to_regclass('public.platform_owners') IS NOT NULL
    THEN 'EXISTS' ELSE 'MISSING' END AS result;

SELECT
  'seed:platform_owners_rows' AS check_id,
  CASE
    WHEN to_regclass('public.platform_owners') IS NULL THEN 'MISSING'
    WHEN EXISTS (
      SELECT 1 FROM public.platform_owners WHERE active IS TRUE
    ) THEN 'EXISTS'
    ELSE 'MISSING'
  END AS result;

-- 3) Tenant EatClean
SELECT
  'seed:tenant_eatclean' AS check_id,
  CASE
    WHEN to_regclass('public.tenants') IS NULL THEN 'MISSING'
    WHEN EXISTS (
      SELECT 1 FROM public.tenants
      WHERE slug = 'eatclean-tenerife' AND status = 'active'
    ) THEN 'EXISTS'
    ELSE 'MISSING'
  END AS result;

-- 4) Weekly menu (published)
SELECT
  'seed:weekly_menu_published' AS check_id,
  CASE
    WHEN to_regclass('public.weekly_menus') IS NULL THEN 'MISSING'
    WHEN EXISTS (
      SELECT 1 FROM public.weekly_menus WHERE status = 'published'
    ) THEN 'EXISTS'
    ELSE 'MISSING'
  END AS result;

-- Optional detail (still read-only)
SELECT id, slug, name, status
FROM public.tenants
WHERE slug = 'eatclean-tenerife';

SELECT id, week_start, status, tenant_id
FROM public.weekly_menus
WHERE status = 'published'
ORDER BY week_start DESC
LIMIT 5;
