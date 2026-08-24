
-- 1. Extend tenants with brand columns
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS brand_logo_path text,
  ADD COLUMN IF NOT EXISTS brand_primary text,
  ADD COLUMN IF NOT EXISTS brand_primary_foreground text,
  ADD COLUMN IF NOT EXISTS brand_accent text,
  ADD COLUMN IF NOT EXISTS brand_updated_at timestamptz;

-- 2. Validation trigger: colors HEX, logo path scoped to tenant id
CREATE OR REPLACE FUNCTION public.validate_tenant_branding()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  IF NEW.brand_primary IS NOT NULL
     AND NEW.brand_primary !~ '^#[0-9A-Fa-f]{6}$' THEN
    RAISE EXCEPTION 'brand_primary must be a 6-digit HEX color';
  END IF;
  IF NEW.brand_primary_foreground IS NOT NULL
     AND NEW.brand_primary_foreground !~ '^#[0-9A-Fa-f]{6}$' THEN
    RAISE EXCEPTION 'brand_primary_foreground must be a 6-digit HEX color';
  END IF;
  IF NEW.brand_accent IS NOT NULL
     AND NEW.brand_accent !~ '^#[0-9A-Fa-f]{6}$' THEN
    RAISE EXCEPTION 'brand_accent must be a 6-digit HEX color';
  END IF;
  IF NEW.brand_logo_path IS NOT NULL
     AND position(NEW.id::text || '/' in NEW.brand_logo_path) <> 1 THEN
    RAISE EXCEPTION 'brand_logo_path must live under {tenant_id}/';
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS tenants_validate_branding ON public.tenants;
CREATE TRIGGER tenants_validate_branding
  BEFORE INSERT OR UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.validate_tenant_branding();

-- 3. Storage policies on tenant-branding bucket
--    Path convention: {tenant_id}/logo.<ext>
--    Read: any member of the tenant
--    Write: company_admin of that tenant, or saas_admin

DROP POLICY IF EXISTS "tenant_branding_read"          ON storage.objects;
DROP POLICY IF EXISTS "tenant_branding_write_insert"  ON storage.objects;
DROP POLICY IF EXISTS "tenant_branding_write_update"  ON storage.objects;
DROP POLICY IF EXISTS "tenant_branding_write_delete"  ON storage.objects;

CREATE POLICY "tenant_branding_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'tenant-branding'
  AND public.is_tenant_member(
    NULLIF(split_part(name, '/', 1), '')::uuid
  )
);

CREATE POLICY "tenant_branding_write_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-branding'
  AND (
    public.is_saas_admin(auth.uid())
    OR public.has_role(
      auth.uid(),
      NULLIF(split_part(name, '/', 1), '')::uuid,
      'company_admin'
    )
  )
);

CREATE POLICY "tenant_branding_write_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tenant-branding'
  AND (
    public.is_saas_admin(auth.uid())
    OR public.has_role(
      auth.uid(),
      NULLIF(split_part(name, '/', 1), '')::uuid,
      'company_admin'
    )
  )
)
WITH CHECK (
  bucket_id = 'tenant-branding'
  AND (
    public.is_saas_admin(auth.uid())
    OR public.has_role(
      auth.uid(),
      NULLIF(split_part(name, '/', 1), '')::uuid,
      'company_admin'
    )
  )
);

CREATE POLICY "tenant_branding_write_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'tenant-branding'
  AND (
    public.is_saas_admin(auth.uid())
    OR public.has_role(
      auth.uid(),
      NULLIF(split_part(name, '/', 1), '')::uuid,
      'company_admin'
    )
  )
);
