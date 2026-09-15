-- =============================================================
-- LOG REQUEST OBSERVER (client derass.my.id) — jalankan sekali
-- =============================================================

CREATE TABLE IF NOT EXISTS public.pb_request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  query text,
  user_agent text,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pb_request_logs_created_idx
  ON public.pb_request_logs(created_at DESC);

ALTER TABLE public.pb_request_logs ENABLE ROW LEVEL SECURITY;
-- Tanpa policy: hanya service role (server) yang bisa akses
