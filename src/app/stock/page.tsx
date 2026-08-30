"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  low_stock_threshold: number;
};

export default function StockPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', quantity: 0, unit: 'Kg', low_stock_threshold: 5 });

  const fetchInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('inventory').select('*').order('name');
    if (error) {
      console.error('Error fetching inventory:', error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();

    const channel = supabase
      .channel('stock-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
        fetchInventory();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('inventory').insert([newItem]);
    if (error) {
      alert('Gagal menambah stok: ' + error.message);
    } else {
      setNewItem({ name: '', quantity: 0, unit: 'Kg', low_stock_threshold: 5 });
      setShowForm(false);
      fetchInventory();
    }
  };

  const updateQuantity = async (id: string, delta: number, currentQty: number) => {
    const newQty = Math.max(0, currentQty + delta);
    const { error } = await supabase.from('inventory').update({ quantity: newQty }).eq('id', id);
    if (!error) {
      fetchInventory();
      // Opsional: Catat di stock_movements
    }
  };

  const deleteItem = async (id: string) => {
    if (confirm('Yakin ingin menghapus item ini?')) {
      await supabase.from('inventory').delete().eq('id', id);
      fetchInventory();
    }
  };

  return (
    <div className="main-area" style={{ flex: 1, padding: '24px' }}>
      <div className="header">
        <div>
          <h1>Manajemen Stok Bahan Baku</h1>
          <p style={{ color: 'var(--text-muted)' }}>Pantau ketersediaan bahan Kebab Suuy</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Batal' : '+ Tambah Barang'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddItem} style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius-lg)', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
          <h3>Tambah Bahan Baku Baru</h3>
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
            <input required placeholder="Nama Barang (misal: Tepung Segitiga)" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} style={{ padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', flex: 1 }} />
            <input required type="number" placeholder="Jumlah Stok Awal" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value)})} style={{ padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', width: '150px' }} />
            <select value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} style={{ padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', width: '120px' }}>
              <option value="Kg">Kg</option>
              <option value="Gram">Gram</option>
              <option value="Liter">Liter</option>
              <option value="Pcs">Pcs</option>
              <option value="Tray">Tray (Telur)</option>
            </select>
            <input required type="number" placeholder="Batas Menipis" value={newItem.low_stock_threshold} onChange={e => setNewItem({...newItem, low_stock_threshold: parseInt(e.target.value)})} style={{ padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', width: '150px' }} title="Peringatan jika stok di bawah batas ini" />
            <button type="submit" className="btn btn-primary">Simpan</button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Memuat data stok...</p>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-muted)' }}>
          <span style={{ fontSize: '48px' }}>📭</span>
          <p>Belum ada data stok bahan baku.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '16px' }}>Nama Barang</th>
                <th style={{ padding: '16px' }}>Sisa Stok</th>
                <th style={{ padding: '16px' }}>Batas Menipis</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px', fontWeight: 500 }}>{item.name}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: item.quantity <= item.low_stock_threshold ? 'var(--danger)' : 'var(--success)', fontWeight: 'bold' }}>
                        {item.quantity} {item.unit}
                      </span>
                      {item.quantity <= item.low_stock_threshold && <span style={{ fontSize: '12px', background: 'var(--danger)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>Stok Tipis!</span>}
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{item.low_stock_threshold} {item.unit}</td>
                  <td style={{ padding: '16px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => updateQuantity(item.id, -1, item.quantity)} className="btn btn-outline" style={{ padding: '6px 12px' }}>Kurangi</button>
                    <button onClick={() => updateQuantity(item.id, 1, item.quantity)} className="btn btn-outline" style={{ padding: '6px 12px' }}>Tambah</button>
                    <button onClick={() => deleteItem(item.id)} className="btn btn-outline" style={{ padding: '6px 12px', color: 'var(--danger)', borderColor: 'var(--danger)' }}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
