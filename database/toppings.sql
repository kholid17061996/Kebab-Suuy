-- =========================================================================
-- TABEL TOPPING KEBAB SUUY
-- =========================================================================

CREATE TABLE IF NOT EXISTS toppings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Nonaktifkan RLS agar bisa diakses langsung
ALTER TABLE toppings DISABLE ROW LEVEL SECURITY;

-- Kosongkan jika sudah ada (mencegah ganda)
DELETE FROM toppings;

-- Masukkan data Topping awal
INSERT INTO toppings (name, price) VALUES 
  ('Keju', 3000),
  ('Telur', 3000),
  ('Makaroni', 3000);
