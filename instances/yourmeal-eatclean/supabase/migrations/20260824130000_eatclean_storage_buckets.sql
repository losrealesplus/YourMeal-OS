-- Migration: 20260824130000_eatclean_storage_buckets.sql
-- Initializes dedicated storage buckets for EatClean instance

INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('eatclean-branding', 'eatclean-branding', true),
  ('eatclean-onboarding', 'eatclean-onboarding', false),
  ('eatclean-attachments', 'eatclean-attachments', false)
ON CONFLICT (id) DO NOTHING;
