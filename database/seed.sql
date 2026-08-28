-- =========================================================================
-- SEED DATA KEBAB SUUY (Daftar Menu & Kategori)
-- Jalankan di SQL Editor Supabase HANYA SATU KALI
-- =========================================================================

-- 1. Kosongkan data lama agar tidak ada data ganda (menghindari nama kategori ganda)
DELETE FROM products;
DELETE FROM categories;

-- 2. Masukkan Kategori
INSERT INTO categories (id, name) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Kebab'),
  ('22222222-2222-2222-2222-222222222222', 'Burger'),
  ('33333333-3333-3333-3333-333333333333', 'Lainnya')
ON CONFLICT (id) DO NOTHING;

-- 3. Masukkan Produk
INSERT INTO products (category_id, name, base_price, image_url) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Kebab Smoke Beef', 20000, '🌯'),
  ('11111111-1111-1111-1111-111111111111', 'Kebab Chicken', 18000, '🌯'),
  ('11111111-1111-1111-1111-111111111111', 'Kebab Frozen', 45000, '❄️'),
  ('22222222-2222-2222-2222-222222222222', 'Burger Smoke Beef', 25000, '🍔'),
  ('22222222-2222-2222-2222-222222222222', 'Burger Chicken', 22000, '🍔'),
  ('33333333-3333-3333-3333-333333333333', 'Quesadilla', 30000, '🌮');
