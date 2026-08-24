-- Infrastructure Validation: align dishes persistence with Dish domain aggregate.
-- Does NOT change domain or application — schema follows the Core.

-- 1) Domain status `inactive`
ALTER TYPE public.dish_status ADD VALUE IF NOT EXISTS 'inactive';

-- 2) Fields required / used by the Dish aggregate
ALTER TABLE public.dishes
  ADD COLUMN IF NOT EXISTS category_id text NOT NULL DEFAULT 'legacy-uncategorized',
  ADD COLUMN IF NOT EXISTS recipe_id text NULL,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN public.dishes.category_id IS 'Domain CategoryId — Category aggregate may arrive later';
COMMENT ON COLUMN public.dishes.recipe_id IS 'Domain RecipeId reference — nullable';
COMMENT ON COLUMN public.dishes.tags IS 'Domain dish tags';
