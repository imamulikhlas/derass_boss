-- =============================================================
-- MIGRASI PANEL ADMIN — jalankan sekali di Supabase SQL Editor
-- =============================================================

-- 1. PROVIDERS (pengganti provider hardcoded)
CREATE TABLE IF NOT EXISTS public.pb_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.pb_providers (code, name)
VALUES ('nova-v1', 'Nova Premium v1')
ON CONFLICT (code) DO NOTHING;

-- 2. USERS (role panel, terhubung ke Supabase Auth: id = auth.users.id)
CREATE TABLE IF NOT EXISTS public.pb_users (
  id uuid PRIMARY KEY, -- = auth.users.id
  email text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('superadmin','reseller','user')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. RESELLER <-> PROVIDER (reseller hanya boleh kelola provider yang ditugaskan)
CREATE TABLE IF NOT EXISTS public.pb_reseller_providers (
  reseller_id uuid NOT NULL REFERENCES public.pb_users(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.pb_providers(id) ON DELETE CASCADE,
  PRIMARY KEY (reseller_id, provider_id)
);

-- 4. LICENSES: relasi ke provider + pembuat + pemilik
ALTER TABLE public.pb_licenses
  ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES public.pb_providers(id),
  ADD COLUMN IF NOT EXISTS created_by text,
  ADD COLUMN IF NOT EXISTS owner_email text;

-- Lisensi lama otomatis dipetakan ke nova-v1
UPDATE public.pb_licenses
SET provider_id = (SELECT id FROM public.pb_providers WHERE code = 'nova-v1')
WHERE provider_id IS NULL;

ALTER TABLE public.pb_licenses
  DROP CONSTRAINT IF EXISTS pb_licenses_provider_id_not_null;
ALTER TABLE public.pb_licenses
  ALTER COLUMN provider_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS pb_licenses_provider_idx ON public.pb_licenses(provider_id);
CREATE INDEX IF NOT EXISTS pb_licenses_owner_email_idx ON public.pb_licenses(owner_email);
