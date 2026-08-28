-- Buka Supabase Dashboard -> SQL Editor, lalu jalankan script di bawah ini

-- 1. Buat Tabel Transaksi
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL, -- 'Tunai', 'QRIS', dll
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Buat Tabel Item Transaksi (Detail pesanan dalam satu transaksi)
CREATE TABLE transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL, -- Simpan nama produk saat itu agar tidak berubah jika produk dihapus
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL, -- Harga satuan saat itu
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Buat Tabel Inventaris (Stok Bahan Baku)
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Misal: 'Tepung Terigu 1kg'
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL, -- Misal: 'Pcs', 'Kg', 'Liter'
  low_stock_threshold INTEGER DEFAULT 5, -- Peringatan jika stok di bawah ini
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Buat Tabel Pergerakan Stok (Mencatat masuk/keluarnya barang)
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL, -- 'IN' (masuk), 'OUT' (keluar)
  quantity INTEGER NOT NULL,
  notes TEXT, -- Keterangan: 'Beli tepung baru', 'Terpakai', dll
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
