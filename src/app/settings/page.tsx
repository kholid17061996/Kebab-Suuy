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
  category_id?: string;
};

type Category = {
  id: string;
  name: string;
};

export default function MenuManagementPage() {
  const [activeTab, setActiveTab] = useState<'menu' | 'topping' | 'kategori'>('menu');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states for Product
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  
  // Modal states for Topping
  const [isToppingModalOpen, setIsToppingModalOpen] = useState(false);
  const [editingTopping, setEditingTopping] = useState<Partial<Topping> | null>(null);

  // Modal states for Category
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [prodRes, topRes, catRes] = await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('toppings').select('*').order('name'),
      supabase.from('categories').select('*').order('name')
    ]);
    
    if (prodRes.data) setProducts(prodRes.data);
    if (topRes.data) setToppings(topRes.data);
    if (catRes.data) setCategories(catRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('settings-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'toppings' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- Product Actions ---
  const handleOpenProductModal = (product: Product | null = null) => {
    setEditingProduct(product || { name: '', base_price: 0, category_id: categories[0]?.id || '', image_url: '🥙' });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    if (editingProduct.id) {
      // Update
      const { error } = await supabase.from('products').update({
        name: editingProduct.name,
        base_price: editingProduct.base_price,
        category_id: editingProduct.category_id,
        image_url: editingProduct.image_url
      }).eq('id', editingProduct.id);
      
      if (error) alert('Gagal update menu: ' + error.message);
    } else {
      // Insert
      const { error } = await supabase.from('products').insert([{
        name: editingProduct.name,
        base_price: editingProduct.base_price,
        category_id: editingProduct.category_id,
        image_url: editingProduct.image_url
      }]);
      
      if (error) alert('Gagal tambah menu: ' + error.message);
    }
    
    setIsProductModalOpen(false);
    fetchData();
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Yakin ingin menghapus menu ini?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) alert('Gagal hapus menu: ' + error.message);
    else fetchData();
  };

  // --- Topping Actions ---
  const handleOpenToppingModal = (topping: Topping | null = null) => {
    setEditingTopping(topping || { name: '', price: 0, category_id: categories[0]?.id || '' });
    setIsToppingModalOpen(true);
  };

  const handleSaveTopping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopping) return;
    
    if (editingTopping.id) {
      // Update
      const { error } = await supabase.from('toppings').update({
        name: editingTopping.name,
        price: editingTopping.price,
        category_id: editingTopping.category_id || null
      }).eq('id', editingTopping.id);
      
      if (error) alert('Gagal update topping: ' + error.message);
    } else {
      // Insert
      const { error } = await supabase.from('toppings').insert([{
        name: editingTopping.name,
        price: editingTopping.price,
        category_id: editingTopping.category_id || null
      }]);
      
      if (error) alert('Gagal tambah topping: ' + error.message);
    }
    
    setIsToppingModalOpen(false);
    fetchData();
  };

  const handleDeleteTopping = async (id: string) => {
    if (!confirm('Yakin ingin menghapus topping ini?')) return;
    const { error } = await supabase.from('toppings').delete().eq('id', id);
    if (error) alert('Gagal hapus topping: ' + error.message);
    else fetchData();
  };

  // --- Category Actions ---
  const handleOpenCategoryModal = (category: Category | null = null) => {
    setEditingCategory(category || { name: '' });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    
    if (editingCategory.id) {
      // Update
      const { error } = await supabase.from('categories').update({
        name: editingCategory.name
      }).eq('id', editingCategory.id);
      
      if (error) alert('Gagal update kategori: ' + error.message);
    } else {
      // Insert
      const { error } = await supabase.from('categories').insert([{
        name: editingCategory.name
      }]);
      
      if (error) alert('Gagal tambah kategori: ' + error.message);
    }
    
    setIsCategoryModalOpen(false);
    fetchData();
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kategori ini? Pastikan tidak ada menu yang terikat dengan kategori ini!')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) alert('Gagal hapus kategori: ' + error.message);
    else fetchData();
  };

  return (
    <div className="main-area" style={{ flex: 1, padding: '24px', position: 'relative' }}>
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Manajemen Menu & Harga</h1>
          <p style={{ color: 'var(--text-muted)' }}>Atur master data menu Kebab Suuy</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => {
            if (activeTab === 'menu') handleOpenProductModal();
            else if (activeTab === 'topping') handleOpenToppingModal();
            else handleOpenCategoryModal();
          }}
        >
          + Tambah {activeTab === 'menu' ? 'Menu' : activeTab === 'topping' ? 'Topping' : 'Kategori'}
        </button>
      </div>
      
      {/* Navigasi Tab */}
      <div className="settings-nav" style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '2px solid var(--border-color)', paddingBottom: '16px' }}>
        <button 
          onClick={() => setActiveTab('menu')}
          className={`btn ${activeTab === 'menu' ? 'btn-primary' : 'btn-outline'}`}
        >
          Daftar Menu Utama
        </button>
        <button 
          onClick={() => setActiveTab('topping')}
          className={`btn ${activeTab === 'topping' ? 'btn-primary' : 'btn-outline'}`}
        >
          Daftar Topping
        </button>
        <button 
          onClick={() => setActiveTab('kategori')}
          className={`btn ${activeTab === 'kategori' ? 'btn-primary' : 'btn-outline'}`}
        >
          Daftar Kategori
        </button>
      </div>

      {loading ? (
        <p>Memuat data...</p>
      ) : activeTab === 'menu' ? (
        /* TAB: MENU */
        products.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Belum ada produk di database.</p>
        ) : (
          <div className="table-responsive" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', overflowX: 'auto', boxShadow: 'var(--shadow-sm)' }}>
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
                      Rp {p.base_price.toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleOpenProductModal(p)} className="btn btn-outline" style={{ padding: '6px 12px' }}><span className="btn-icon">✏️</span><span className="btn-text">Edit</span></button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="btn" style={{ padding: '6px 12px', background: 'var(--danger)', color: 'white' }}><span className="btn-icon">🗑️</span><span className="btn-text">Hapus</span></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : activeTab === 'topping' ? (
        /* TAB: TOPPING */
        toppings.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Belum ada topping di database.</p>
        ) : (
          <div className="table-responsive" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', overflowX: 'auto', boxShadow: 'var(--shadow-sm)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '16px', width: '60px' }}>Ikon</th>
                  <th style={{ padding: '16px' }}>Nama Topping</th>
                  <th style={{ padding: '16px' }}>Untuk Kategori</th>
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
                      <span style={{ background: 'var(--bg-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                        {categories.find(c => c.id === t.category_id)?.name || 'Semua'}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      Rp {t.price.toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleOpenToppingModal(t)} className="btn btn-outline" style={{ padding: '6px 12px' }}><span className="btn-icon">✏️</span><span className="btn-text">Edit</span></button>
                        <button onClick={() => handleDeleteTopping(t.id)} className="btn" style={{ padding: '6px 12px', background: 'var(--danger)', color: 'white' }}><span className="btn-icon">🗑️</span><span className="btn-text">Hapus</span></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* TAB: KATEGORI */
        categories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', background: 'var(--surface)', borderRadius: 'var(--radius-lg)' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Belum ada kategori di database.</p>
            <button onClick={() => handleOpenCategoryModal()} className="btn btn-primary">
              + Tambah Kategori Pertama
            </button>
          </div>
        ) : (
          <div className="table-responsive" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', overflowX: 'auto', boxShadow: 'var(--shadow-sm)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '16px', width: '60px' }}>Ikon</th>
                  <th style={{ padding: '16px' }}>Nama Kategori</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px', fontSize: '28px', textAlign: 'center' }}>📂</td>
                    <td style={{ padding: '16px', fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleOpenCategoryModal(c)} className="btn btn-outline" style={{ padding: '6px 12px' }}><span className="btn-icon">✏️</span><span className="btn-text">Edit</span></button>
                        <button onClick={() => handleDeleteCategory(c.id)} className="btn" style={{ padding: '6px 12px', background: 'var(--danger)', color: 'white' }}><span className="btn-icon">🗑️</span><span className="btn-text">Hapus</span></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* PRODUCT MODAL */}
      {isProductModalOpen && editingProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius-lg)', width: '400px', maxWidth: '90%' }}>
            <h2>{editingProduct.id ? 'Edit Menu' : 'Tambah Menu Baru'}</h2>
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Nama Menu</label>
                <input required type="text" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Harga Dasar (Rp)</label>
                <input required type="text" value={editingProduct.base_price !== undefined ? `Rp. ${editingProduct.base_price.toLocaleString('id-ID')}` : ''} onChange={e => {
                  const rawValue = e.target.value.replace(/[^0-9]/g, '');
                  setEditingProduct({...editingProduct, base_price: parseInt(rawValue, 10) || 0})
                }} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Kategori</label>
                <select required value={editingProduct.category_id} onChange={e => setEditingProduct({...editingProduct, category_id: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <option value="" disabled>Pilih Kategori</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Ikon / Emoji</label>
                <input type="text" value={editingProduct.image_url || ''} onChange={e => setEditingProduct({...editingProduct, image_url: e.target.value})} placeholder="Ketik atau pilih dari daftar..." style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '8px' }} />
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', maxHeight: '100px', overflowY: 'auto', padding: '4px' }}>
                  {['🌯', '🥙', '🌮', '🍔', '🌭', '🍟', '🍕', '🥪', '🥩', '🍗', '🍖', '🥓', '🍜', '🍝', '🍚', '🥘', '🍲', '🥤', '🧋', '☕', '🍵', '🧊', '🍹', '🍺', '🥛', '🌶️', '🧀', '🧅', '🍅', '🍄', '🥐', '🍞'].map(emoji => (
                    <button 
                      type="button" 
                      key={emoji} 
                      onClick={() => setEditingProduct({...editingProduct, image_url: emoji})} 
                      style={{ background: editingProduct.image_url === emoji ? 'var(--primary)' : 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', fontSize: '20px', transition: '0.2s' }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="btn btn-outline">Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOPPING MODAL */}
      {isToppingModalOpen && editingTopping && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius-lg)', width: '400px', maxWidth: '90%' }}>
            <h2>{editingTopping.id ? 'Edit Topping' : 'Tambah Topping Baru'}</h2>
            <form onSubmit={handleSaveTopping} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Nama Topping</label>
                <input required type="text" value={editingTopping.name} onChange={e => setEditingTopping({...editingTopping, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Harga (Rp)</label>
                <input required type="text" value={editingTopping.price !== undefined ? `Rp. ${editingTopping.price.toLocaleString('id-ID')}` : ''} onChange={e => {
                  const rawValue = e.target.value.replace(/[^0-9]/g, '');
                  setEditingTopping({...editingTopping, price: parseInt(rawValue, 10) || 0})
                }} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Untuk Kategori</label>
                <select value={editingTopping.category_id || ''} onChange={e => setEditingTopping({...editingTopping, category_id: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <option value="">-- Semua Kategori (Global) --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <small style={{ color: 'var(--text-muted)' }}>Pilih Semua Kategori jika topping ini berlaku untuk semua menu.</small>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsToppingModalOpen(false)} className="btn btn-outline">Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {isCategoryModalOpen && editingCategory && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius-lg)', width: '400px', maxWidth: '90%' }}>
            <h2>{editingCategory.id ? 'Edit Kategori' : 'Tambah Kategori Baru'}</h2>
            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Nama Kategori</label>
                <input required type="text" value={editingCategory.name} onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="btn btn-outline">Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
