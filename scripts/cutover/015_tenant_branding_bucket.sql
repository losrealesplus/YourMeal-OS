-- INFRA-011 · Idempotent create of private bucket tenant-branding
-- Run in Supabase SQL Editor on project djangucecsphnejplvic
-- Safe to execute multiple times.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-branding',
  'tenant-branding',
  false,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO NOTHING;
