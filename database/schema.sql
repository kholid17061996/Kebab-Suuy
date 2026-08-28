-- Buka Supabase Dashboard -> SQL Editor, lalu jalankan script di bawah ini

-- 1. Buat Tabel Kategori (Terangbulan, Martabak Telur, Minuman)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Buat Tabel Produk Utama
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  base_price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Buat Tabel Grup Varian (Contoh: "Pilihan Adonan", "Topping", "Jumlah Telur")
CREATE TABLE variant_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_required BOOLEAN DEFAULT false, -- Apakah wajib dipilih kasir?
  is_multiple BOOLEAN DEFAULT false -- Apakah kasir bisa pilih lebih dari 1? (misal: mix topping)
);

-- 4. Buat Tabel Opsi Varian (Contoh: "Pandan (+2000)", "Keju (+5000)", "Ayam")
CREATE TABLE variant_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES variant_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  additional_price NUMERIC DEFAULT 0
);

-- (Opsional) Insert Data Dummy
INSERT INTO categories (name) VALUES ('Terangbulan'), ('Martabak Telur');
