"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type Product = {
  id: string;
  name: string;
  base_price: number;
  category_id: string;
  image_url: string;
};

type Topping = {
  id: string;
  name: string;
  price: number;
};

export default function MenuManagementPage() {
  const [activeTab, setActiveTab] = useState<'menu' | 'topping'>('menu');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);

  const fetchData = async () => {
    setLoading(true);
    const [prodRes, topRes] = await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('toppings').select('*').order('name')
    ]);
    
    if (prodRes.data) setProducts(prodRes.data);
    if (topRes.data) setToppings(topRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (id: string, currentPrice: number) => {
    setEditingId(id);
    setEditPrice(currentPrice);
  };

  const handleSaveMenu = async (id: string) => {
    const { error } = await supabase.from('products').update({ base_price: editPrice }).eq('id', id);
    if (error) {
      alert('Gagal menyimpan harga: ' + error.message);
    } else {
      setEditingId(null);
      fetchData();
    }
  };

  const handleSaveTopping = async (id: string) => {
    const { error } = await supabase.from('toppings').update({ price: editPrice }).eq('id', id);
    if (error) {
      alert('Gagal menyimpan harga: ' + error.message);
    } else {
      setEditingId(null);
      fetchData();
    }
  };

  return (
    <div className="main-area" style={{ flex: 1, padding: '24px' }}>
      <div className="header">
        <div>
          <h1>Manajemen Menu & Harga</h1>
          <p style={{ color: 'var(--text-muted)' }}>Atur harga jual Kebab Suuy</p>
        </div>
      </div>
      
      {/* Navigasi Tab */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '2px solid var(--border-color)', paddingBottom: '16px' }}>
        <button 
          onClick={() => { setActiveTab('menu'); setEditingId(null); }}
          className={`btn ${activeTab === 'menu' ? 'btn-primary' : 'btn-outline'}`}
        >
          Daftar Menu Utama
        </button>
        <button 
          onClick={() => { setActiveTab('topping'); setEditingId(null); }}
          className={`btn ${activeTab === 'topping' ? 'btn-primary' : 'btn-outline'}`}
        >
          Daftar Topping
        </button>
      </div>

      {loading ? (
        <p>Memuat data...</p>
      ) : activeTab === 'menu' ? (
        /* TAB: MENU */
        products.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Belum ada produk di database.</p>
        ) : (
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '16px', width: '60px' }}>Ikon</th>
                  <th style={{ padding: '16px' }}>Nama Produk</th>
                  <th style={{ padding: '16px' }}>Harga Saat Ini</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px', fontSize: '28px', textAlign: 'center' }}>{p.image_url || '🥙'}</td>
                    <td style={{ padding: '16px', fontWeight: 500 }}>{p.name}</td>
                    <td style={{ padding: '16px' }}>
                      {editingId === p.id ? (
                        <input 
                          type="number" 
                          value={editPrice} 
                          onChange={e => setEditPrice(parseInt(e.target.value) || 0)}
                          style={{ padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary)', outline: 'none', width: '150px' }}
                        />
                      ) : (
                        `Rp ${p.base_price.toLocaleString('id-ID')}`
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      {editingId === p.id ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => setEditingId(null)} className="btn btn-outline" style={{ padding: '6px 12px' }}>Batal</button>
                          <button onClick={() => handleSaveMenu(p.id)} className="btn btn-primary" style={{ padding: '6px 12px' }}>Simpan</button>
                        </div>
                      ) : (
                        <button onClick={() => handleEditClick(p.id, p.base_price)} className="btn btn-outline" style={{ padding: '6px 12px' }}>Ubah Harga</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* TAB: TOPPING */
        toppings.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Belum ada topping di database. Silakan jalankan script toppings.sql</p>
        ) : (
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '16px', width: '60px' }}>Ikon</th>
                  <th style={{ padding: '16px' }}>Nama Topping</th>
                  <th style={{ padding: '16px' }}>Harga Saat Ini</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {toppings.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px', fontSize: '28px', textAlign: 'center' }}>✨</td>
                    <td style={{ padding: '16px', fontWeight: 500 }}>{t.name}</td>
                    <td style={{ padding: '16px' }}>
                      {editingId === t.id ? (
                        <input 
                          type="number" 
                          value={editPrice} 
                          onChange={e => setEditPrice(parseInt(e.target.value) || 0)}
                          style={{ padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary)', outline: 'none', width: '150px' }}
                        />
                      ) : (
                        `Rp ${t.price.toLocaleString('id-ID')}`
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      {editingId === t.id ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => setEditingId(null)} className="btn btn-outline" style={{ padding: '6px 12px' }}>Batal</button>
                          <button onClick={() => handleSaveTopping(t.id)} className="btn btn-primary" style={{ padding: '6px 12px' }}>Simpan</button>
                        </div>
                      ) : (
                        <button onClick={() => handleEditClick(t.id, t.price)} className="btn btn-outline" style={{ padding: '6px 12px' }}>Ubah Harga</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
