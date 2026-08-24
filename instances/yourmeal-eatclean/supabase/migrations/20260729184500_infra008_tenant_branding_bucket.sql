-- INFRA-008 · Ensure storage bucket required by branding policies/code
-- Policies in 20260723174724_* assume bucket_id = 'tenant-branding'
-- Live project B listed zero buckets; create idempotently.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-branding',
  'tenant-branding',
  false,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO NOTHING;
