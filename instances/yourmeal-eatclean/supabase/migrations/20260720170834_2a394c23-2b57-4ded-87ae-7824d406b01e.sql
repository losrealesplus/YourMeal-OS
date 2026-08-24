-- Regional settings on tenants (company defaults)
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS country          text,
  ADD COLUMN IF NOT EXISTS currency         text,
  ADD COLUMN IF NOT EXISTS timezone         text,
  ADD COLUMN IF NOT EXISTS time_format      text,
  ADD COLUMN IF NOT EXISTS unit_weight      text,
  ADD COLUMN IF NOT EXISTS unit_volume      text,
  ADD COLUMN IF NOT EXISTS unit_distance    text,
  ADD COLUMN IF NOT EXISTS unit_temperature text;

-- Regional settings on profiles (per-user overrides; NULL = inherit tenant)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country          text,
  ADD COLUMN IF NOT EXISTS currency         text,
  ADD COLUMN IF NOT EXISTS timezone         text,
  ADD COLUMN IF NOT EXISTS time_format      text,
  ADD COLUMN IF NOT EXISTS unit_weight      text,
  ADD COLUMN IF NOT EXISTS unit_volume      text,
  ADD COLUMN IF NOT EXISTS unit_distance    text,
  ADD COLUMN IF NOT EXISTS unit_temperature text;

-- Validation triggers (values kept flexible so we can add locales without migrations)
CREATE OR REPLACE FUNCTION public.validate_regional_settings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.time_format IS NOT NULL AND NEW.time_format NOT IN ('12h','24h') THEN
    RAISE EXCEPTION 'time_format must be 12h or 24h';
  END IF;
  IF NEW.unit_weight IS NOT NULL AND NEW.unit_weight NOT IN ('metric','imperial') THEN
    RAISE EXCEPTION 'unit_weight must be metric or imperial';
  END IF;
  IF NEW.unit_volume IS NOT NULL AND NEW.unit_volume NOT IN ('metric','imperial') THEN
    RAISE EXCEPTION 'unit_volume must be metric or imperial';
  END IF;
  IF NEW.unit_distance IS NOT NULL AND NEW.unit_distance NOT IN ('metric','imperial') THEN
    RAISE EXCEPTION 'unit_distance must be metric or imperial';
  END IF;
  IF NEW.unit_temperature IS NOT NULL AND NEW.unit_temperature NOT IN ('C','F') THEN
    RAISE EXCEPTION 'unit_temperature must be C or F';
  END IF;
  IF NEW.country IS NOT NULL AND length(NEW.country) <> 2 THEN
    RAISE EXCEPTION 'country must be an ISO 3166-1 alpha-2 code';
  END IF;
  IF NEW.currency IS NOT NULL AND length(NEW.currency) <> 3 THEN
    RAISE EXCEPTION 'currency must be an ISO 4217 code';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tenants_validate_regional ON public.tenants;
CREATE TRIGGER tenants_validate_regional
  BEFORE INSERT OR UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.validate_regional_settings();

DROP TRIGGER IF EXISTS profiles_validate_regional ON public.profiles;
CREATE TRIGGER profiles_validate_regional
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_regional_settings();

-- Seed sensible defaults for the existing EatClean Tenerife tenant
UPDATE public.tenants
SET country          = COALESCE(country, 'ES'),
    currency         = COALESCE(currency, 'EUR'),
    timezone         = COALESCE(timezone, 'Atlantic/Canary'),
    time_format      = COALESCE(time_format, '24h'),
    unit_weight      = COALESCE(unit_weight, 'metric'),
    unit_volume      = COALESCE(unit_volume, 'metric'),
    unit_distance    = COALESCE(unit_distance, 'metric'),
    unit_temperature = COALESCE(unit_temperature, 'C');
