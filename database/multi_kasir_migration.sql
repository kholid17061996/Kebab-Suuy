-- =========================================================================
-- MIGRASI DATABASE: MULTI-KASIR
-- Jalankan script ini di SQL Editor Supabase Anda
-- =========================================================================

-- 1. Drop tabel app_users lama jika ada
DROP TABLE IF EXISTS public.app_users;

-- 2. Buat tabel app_users baru dengan struktur username
CREATE TABLE public.app_users (
  username text PRIMARY KEY,
  password text NOT NULL,
  role text NOT NULL, -- 'admin' atau 'kasir'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Masukkan data user default
INSERT INTO public.app_users (username, password, role)
VALUES 
  ('admin', '1811', 'admin'),
  ('kasir1', '1811', 'kasir'),
  ('kasir2', '1811', 'kasir');

-- 4. Tambahkan kolom cashier_name di tabel transactions
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS cashier_name text DEFAULT 'Kasir Utama';

-- 5. Tambahkan kolom cashier_name di tabel expenses
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS cashier_name text DEFAULT 'Kasir Utama';
