-- B3.7E H-1: Relative Menu Scheduling
-- Adds relative_week, menu_type, go-live date columns to weekly_menus.
-- Template menus (menu_type = 'template') have week_start = NULL, relative_week = 1..N.
-- Scheduled menus (menu_type = 'scheduled') retain week_start = real Monday date.
--
-- NOTE: Tenant data migration (converting placeholder dates to relative weeks)
-- is performed separately as a targeted data patch, not in this Core migration.
-- Core migrations must be tenant-agnostic.

-- 1. Extend weekly_menus
ALTER TABLE public.weekly_menus
  ADD COLUMN IF NOT EXISTS relative_week smallint CHECK (relative_week BETWEEN 1 AND 52),
  ADD COLUMN IF NOT EXISTS menu_type text NOT NULL DEFAULT 'scheduled'
    CHECK (menu_type IN ('template', 'scheduled')),
  ADD COLUMN IF NOT EXISTS internal_go_live_date date,
  ADD COLUMN IF NOT EXISTS customer_go_live_date date;

-- 2. Make week_start nullable (template menus have no real calendar date)
ALTER TABLE public.weekly_menus ALTER COLUMN week_start DROP NOT NULL;

-- 3. Replace the unique constraint on (tenant_id, week_start) with a partial index
--    so NULL week_start rows are excluded from uniqueness enforcement.
ALTER TABLE public.weekly_menus
  DROP CONSTRAINT IF EXISTS weekly_menus_tenant_id_week_start_key;

CREATE UNIQUE INDEX IF NOT EXISTS weekly_menus_tenant_week_start_ux
  ON public.weekly_menus (tenant_id, week_start)
  WHERE week_start IS NOT NULL AND deleted_at IS NULL;

-- 4. Unique constraint for template menus by (tenant_id, relative_week)
CREATE UNIQUE INDEX IF NOT EXISTS weekly_menus_tenant_relative_week_ux
  ON public.weekly_menus (tenant_id, relative_week)
  WHERE menu_type = 'template' AND deleted_at IS NULL;

-- 5. Extend weekly_menu_slots with day_of_week for template menus
ALTER TABLE public.weekly_menu_slots
  ADD COLUMN IF NOT EXISTS day_of_week smallint CHECK (day_of_week BETWEEN 1 AND 7);

-- 6. Make day_date nullable (template slots use day_of_week instead of a real date)
ALTER TABLE public.weekly_menu_slots ALTER COLUMN day_date DROP NOT NULL;
