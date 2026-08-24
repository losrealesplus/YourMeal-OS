-- INFRA-011 · Idempotent storage bucket for tenant branding
-- Safe to re-run: ON CONFLICT DO NOTHING
-- Required by branding code + storage.objects policies (bucket_id = 'tenant-branding')

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-branding',
  'tenant-branding',
  false,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO NOTHING;
