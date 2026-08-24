-- INFRA-009 · Idempotent storage bucket for tenant branding
-- Required by branding repository + storage.objects policies (bucket_id = 'tenant-branding')

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-branding',
  'tenant-branding',
  false,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO NOTHING;
