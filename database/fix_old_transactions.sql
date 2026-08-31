-- =========================================================================
-- PERBAIKAN DATA LAMA (SINKRONISASI KASIR 1)
-- Jalankan script ini di SQL Editor Supabase Anda
-- =========================================================================

-- Ubah semua transaksi lama yang bernama 'Kasir Utama' atau tidak bernama menjadi milik 'kasir1'
UPDATE public.transactions 
SET cashier_name = 'kasir1' 
WHERE cashier_name = 'Kasir Utama' OR cashier_name IS NULL;

-- Lakukan hal yang sama untuk pengeluaran (expenses)
UPDATE public.expenses 
SET cashier_name = 'kasir1' 
WHERE cashier_name = 'Kasir Utama' OR cashier_name IS NULL;
