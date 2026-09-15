-- =============================================================
-- PAKET PER PROVIDER — jalankan sekali di Supabase SQL Editor
-- =============================================================

CREATE TABLE IF NOT EXISTS public.pb_provider_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.pb_providers(id) ON DELETE CASCADE,
  name text NOT NULL,
  duration_days int NOT NULL CHECK (duration_days > 0),
  price int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pb_provider_packages_provider_idx
  ON public.pb_provider_packages(provider_id);

-- Paket awal untuk nova-v1
INSERT INTO public.pb_provider_packages (provider_id, name, duration_days, price)
SELECT p.id, v.name, v.days, v.price
FROM public.pb_providers p,
     (VALUES ('Harian', 1, 15000), ('Mingguan', 7, 80000), ('Bulanan', 30, 250000)) AS v(name, days, price)
WHERE p.code = 'nova-v1'
  AND NOT EXISTS (SELECT 1 FROM public.pb_provider_packages WHERE provider_id = p.id);
