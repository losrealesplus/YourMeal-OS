-- Rollback Migration: 20260928213500_cr_ops_04_tenant_media_bucket.rollback.sql
-- CR-OPS-04 Rollback: Drop policies and revert tenant-media bucket changes

DROP POLICY IF EXISTS "tenant_media_delete_saas_admin" ON storage.objects;
DROP POLICY IF EXISTS "tenant_media_tenant_delete" ON storage.objects;
DROP POLICY IF EXISTS "tenant_media_tenant_update" ON storage.objects;
DROP POLICY IF EXISTS "tenant_media_tenant_insert" ON storage.objects;
DROP POLICY IF EXISTS "tenant_media_public_read" ON storage.objects;

-- Note: We retain the bucket to prevent data loss or delete if strictly required.
-- DELETE FROM storage.buckets WHERE id = 'tenant-media';
