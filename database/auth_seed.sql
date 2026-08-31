-- =========================================================================
-- SEED DATA UNTUK AUTHENTIKASI (Password Admin & Kasir)
-- Jalankan script ini di SQL Editor Supabase Anda
-- =========================================================================

-- Buat tabel app_users jika belum ada
CREATE TABLE IF NOT EXISTS public.app_users (
  role text PRIMARY KEY,
  password text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Masukkan data default (jika belum ada)
INSERT INTO public.app_users (role, password)
VALUES 
  ('admin', '1811'),
  ('kasir', '1811')
ON CONFLICT (role) DO NOTHING;
