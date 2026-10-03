-- Migration: 20260928213500_cr_ops_04_tenant_media_bucket.sql
-- CR-OPS-04: Idempotent Supabase Storage bucket and RLS policies for tenant media (Dish Catalog)
-- Intentional public read for commercial catalog assets; tenant-isolated write/update/delete.

-- 1. Create or update tenant-media bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-media',
  'tenant-media',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage policies on storage.objects for tenant-media bucket
-- Path convention: {tenant_id}/dishes/{dish_id}/photo-{timestamp}.{ext}

DROP POLICY IF EXISTS "tenant_media_public_read" ON storage.objects;
DROP POLICY IF EXISTS "tenant_media_tenant_insert" ON storage.objects;
DROP POLICY IF EXISTS "tenant_media_tenant_update" ON storage.objects;
DROP POLICY IF EXISTS "tenant_media_tenant_delete" ON storage.objects;

-- Policy A: Intentional public read for catalog assets
CREATE POLICY "tenant_media_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'tenant-media');

-- Policy B: Insert restricted to authenticated tenant company_admin, staff or saas_admin
CREATE POLICY "tenant_media_tenant_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-media'
  AND (
    public.is_saas_admin(auth.uid())
    OR public.has_role(
      auth.uid(),
      NULLIF(split_part(name, '/', 1), '')::uuid,
      'company_admin'
    )
    OR public.has_role(
      auth.uid(),
      NULLIF(split_part(name, '/', 1), '')::uuid,
      'operations_manager'
    )
  )
);

-- Policy C: Update restricted to authenticated tenant company_admin, staff or saas_admin
CREATE POLICY "tenant_media_tenant_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tenant-media'
  AND (
    public.is_saas_admin(auth.uid())
    OR public.has_role(
      auth.uid(),
      NULLIF(split_part(name, '/', 1), '')::uuid,
      'company_admin'
    )
    OR public.has_role(
      auth.uid(),
      NULLIF(split_part(name, '/', 1), '')::uuid,
      'operations_manager'
    )
  )
)
WITH CHECK (
  bucket_id = 'tenant-media'
  AND (
    public.is_saas_admin(auth.uid())
    OR public.has_role(
      auth.uid(),
      NULLIF(split_part(name, '/', 1), '')::uuid,
      'company_admin'
    )
    OR public.has_role(
      auth.uid(),
      NULLIF(split_part(name, '/', 1), '')::uuid,
      'operations_manager'
    )
  )
);

-- Policy D: Delete restricted to authenticated tenant company_admin or saas_admin
CREATE POLICY "tenant_media_tenant_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tenant-media'
  AND (
    public.is_saas_admin(auth.uid())
    OR public.has_role(
      auth.uid(),
      NULLIF(split_part(name, '/', 1), '')::uuid,
      'company_admin'
    )
  )
);
