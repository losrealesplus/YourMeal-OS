-- Migration: 20260824174800_remove_legacy_eatclean_tenerife_tenant.sql
-- Description: Saneamiento de identidad de tenant para la instancia EatClean.
-- Elimina el residuo del baseline legado 'eatclean-tenerife' (e4bd3ac8-8cd3-4499-b065-744d7c2594b4),
-- dejando como único tenant canónico en la base de datos de producción 'eatclean' (8bba00ba-331b-42c8-9283-4e3836ffb870).

DELETE FROM public.tenants
WHERE id = 'e4bd3ac8-8cd3-4499-b065-744d7c2594b4'
  AND slug = 'eatclean-tenerife';
