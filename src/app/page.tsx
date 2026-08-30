"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type Topping = { id: string; name: string; price: number; category_id?: string; };

type Category = { id: string; name: string };
type Product = { id: string; name: string; base_price: number; category_id: string; image_url: string };

type CartItem = {
  cartId: string;
  productId: string;
  name: string;
  basePrice: number;
  qty: number;
  toppings: Topping[];
};

export default function POSPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [availableToppings, setAvailableToppings] = useState<Topping[]>([]);
  const [activeCatId, setActiveCatId] = useState<string>('Semua');
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modals state
  const [toppingProduct, setToppingProduct] = useState<Product | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);

  // Expense states
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseNote, setExpenseNote] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, prodRes, topRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('products').select('*').order('name'),
        supabase.from('toppings').select('*').order('name')
      ]);
      
      if (catRes.data) setCategories(catRes.data);
      if (prodRes.data) setProducts(prodRes.data);
      if (topRes.data) setAvailableToppings(topRes.data);
      
      setLoading(false);
    };

    fetchData();

    // Setup Realtime Subscriptions
    const channel = supabase
      .channel('pos-sync')
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

  const fetchData = async () => {
    setLoading(true);
    const [catRes, prodRes, topRes] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('products').select('*').order('name'),
      supabase.from('toppings').select('*').order('name')
    ]);
    
    if (catRes.data) setCategories(catRes.data);
    if (prodRes.data) setProducts(prodRes.data);
    if (topRes.data) setAvailableToppings(topRes.data);
    
    setLoading(false);
  };

  const handleExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmount <= 0) return alert('Nominal harus lebih dari 0');
    if (!expenseNote) return alert('Keterangan harus diisi');

    setIsProcessing(true);
    try {
      const { error } = await supabase.from('expenses').insert([{
        amount: expenseAmount,
        note: expenseNote,
      }]);
      if (error) throw error;
      alert('Pengeluaran berhasil dicatat!');
      setShowExpenseModal(false);
      setExpenseAmount(0);
      setExpenseNote('');
    } catch (error: any) {
      alert('Gagal mencatat pengeluaran: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.currentTarget as HTMLDivElement;
    if (target.scrollTop <= 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY > 0) {
      const currentY = e.touches[0].clientY;
      const dist = currentY - startY;
      if (dist > 0 && dist < 150) {
        setPullDistance(dist);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      setIsRefreshing(true);
      await fetchData();
      setIsRefreshing(false);
    }
    setStartY(0);
    setPullDistance(0);
  };

  const filteredProducts = activeCatId === 'Semua' 
    ? products 
    : products.filter(p => p.category_id === activeCatId);

  const handleProductClick = (product: Product) => {
    const productToppings = availableToppings.filter(
      t => t.category_id === product.category_id || !t.category_id
    );
    
    if (productToppings.length > 0) {
      setToppingProduct(product);
      setSelectedToppings([]);
    } else {
      addDirectToCart(product, []);
    }
  };

  const toggleTopping = (topping: Topping) => {
    setSelectedToppings(prev => 
      prev.find(t => t.name === topping.name) 
        ? prev.filter(t => t.name !== topping.name)
        : [...prev, topping]
    );
  };

  const confirmToppings = () => {
    if (toppingProduct) {
      addDirectToCart(toppingProduct, selectedToppings);
      setToppingProduct(null);
      setSelectedToppings([]);
    }
  };

  const addDirectToCart = (product: Product, toppings: Topping[]) => {
    const toppingString = toppings.map(t => t.name).sort().join(',');
    const cartId = `${product.id}-${toppingString}`;

    setCart(prev => {
      const existing = prev.find(item => item.cartId === cartId);
      if (existing) {
        return prev.map(item => item.cartId === cartId ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { cartId, productId: product.id, name: product.name, basePrice: product.base_price, qty: 1, toppings }];
    });
  };

  const updateQty = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        return { ...item, qty: Math.max(0, item.qty + delta) };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const getItemTotalPrice = (item: CartItem) => {
    const toppingTotal = item.toppings.reduce((sum, t) => sum + t.price, 0);
    return (item.basePrice + toppingTotal) * item.qty;
  };

  const total = cart.reduce((sum, item) => sum + getItemTotalPrice(item), 0);

  const handleCheckout = async (paymentMethod: string) => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    setShowPaymentModal(false);

    try {
      const { data: trxData, error: trxError } = await supabase
        .from('transactions')
        .insert([{ total_amount: total, payment_method: paymentMethod }])
        .select()
        .single();

      if (trxError) throw trxError;

      const itemsToInsert = cart.map(item => {
        const toppingText = item.toppings.length > 0 ? ` (+${item.toppings.map(t => t.name).join(', ')})` : '';
        const unitPrice = item.basePrice + item.toppings.reduce((sum, t) => sum + t.price, 0);
        return {
          transaction_id: trxData.id,
          product_name: `${item.name}${toppingText}`,
          quantity: item.qty,
          price: unitPrice
        };
      });

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // --- AUTO-DEDUCT INVENTORY (Opsi A) ---
      const deductionMap: Record<string, number> = {};
      cart.forEach(item => {
        deductionMap[item.name] = (deductionMap[item.name] || 0) + item.qty;
        item.toppings.forEach(t => {
           deductionMap[t.name] = (deductionMap[t.name] || 0) + item.qty;
        });
      });

      const ObjectKeys = Object.keys(deductionMap);
      if (ObjectKeys.length > 0) {
        const { data: invData } = await supabase.from('inventory').select('id, name, quantity').in('name', ObjectKeys);
        if (invData && invData.length > 0) {
          const updatePromises = invData.map(invItem => {
            const deductQty = deductionMap[invItem.name];
            return supabase.from('inventory').update({ quantity: invItem.quantity - deductQty }).eq('id', invItem.id);
          });
          await Promise.all(updatePromises);
        }
      }
      // ---------------------------------------

      alert(`Transaksi Berhasil disimpan! Total: Rp ${total.toLocaleString('id-ID')} via ${paymentMethod}`);
      setCart([]); 
    } catch (error: any) {
      alert('Gagal memproses transaksi: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div 
        className="main-area"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="header">
          <div>
            <h1>Kebab Suuy</h1>
            <p style={{ color: 'var(--text-muted)' }}>Sistem Kasir Pintar</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              className="btn btn-outline" 
              style={{ padding: '8px 16px', borderColor: 'var(--danger)', color: 'var(--danger)' }}
              onClick={() => setShowExpenseModal(true)}
            >
              💸 Kas Keluar
            </button>
            <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {pullDistance > 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '16px', height: `${pullDistance}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: pullDistance === 0 ? '0.3s' : 'none', overflow: 'hidden' }}>
            <span style={{ fontSize: '24px', transform: `rotate(${pullDistance * 2}deg)` }}>🔄</span>
          </div>
        )}
        
        {isRefreshing && (
          <div style={{ textAlign: 'center', color: 'var(--primary)', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>🔄</span>
            <p>Menyegarkan menu...</p>
          </div>
        )}

        {(loading && !isRefreshing) ? (
          <p>Memuat menu dari database...</p>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '48px' }}>📭</span>
            <p>Database kosong. Minta Admin menjalankan script seed.sql</p>
          </div>
        ) : (
          <>
            <div className="categories-pills">
              <div 
                className={`pill ${activeCatId === 'Semua' ? 'active' : ''}`}
                onClick={() => setActiveCatId('Semua')}
              >
                Semua
              </div>
              {categories.map(cat => (
                <div 
                  key={cat.id} 
                  className={`pill ${activeCatId === cat.id ? 'active' : ''}`}
                  onClick={() => setActiveCatId(cat.id)}
                >
                  {cat.name}
                </div>
              ))}
            </div>

            <div className="product-grid">
              {filteredProducts.map(p => (
                <div key={p.id} className="product-card" onClick={() => handleProductClick(p)}>
                  <div className="product-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px' }}>
                    {p.image_url || '🥙'}
                  </div>
                  <div className="product-title">{p.name}</div>
                  <div className="product-price">Rp {p.base_price.toLocaleString('id-ID')}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Cart Panel */}
      <div className={`cart-panel ${showMobileCart ? 'mobile-active' : ''}`}>
        <div className="cart-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {showMobileCart && (
              <button 
                onClick={() => setShowMobileCart(false)} 
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-main)', padding: '0 8px 0 0' }}
              >
                ✕
              </button>
            )}
            <span>Pesanan Saat Ini</span>
          </div>
          <span style={{ color: 'var(--primary)' }}>{cart.reduce((sum, item) => sum + item.qty, 0)} item</span>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '48px', opacity: 0.5 }}>🛒</span>
              <p>Belum ada pesanan<br/>Silakan pilih menu di samping</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.cartId} className="cart-item">
                <div className="cart-item-info">
                  <h4>{item.name}</h4>
                  {item.toppings.length > 0 && (
                    <p style={{ color: 'var(--primary)', marginBottom: '4px' }}>
                      + {item.toppings.map(t => t.name).join(', ')}
                    </p>
                  )}
                  <p>Rp {(item.basePrice + item.toppings.reduce((s,t) => s + t.price, 0)).toLocaleString('id-ID')}</p>
                </div>
                <div className="qty-control">
                  <button className="qty-btn" onClick={() => updateQty(item.cartId, -1)}>-</button>
                  <span style={{ fontWeight: 600, width: '20px', textAlign: 'center' }}>{item.qty}</span>
                  <button className="qty-btn" onClick={() => updateQty(item.cartId, 1)}>+</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-summary">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>Rp {total.toLocaleString('id-ID')}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>Rp {total.toLocaleString('id-ID')}</span>
          </div>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '16px', fontSize: '16px', borderRadius: 'var(--radius-lg)' }} 
            disabled={cart.length === 0 || isProcessing}
            onClick={() => setShowPaymentModal(true)}
          >
            Bayar Pesanan
          </button>
        </div>
      </div>

      {/* Modal Topping */}
      {toppingProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', padding: '32px', borderRadius: 'var(--radius-lg)', width: '400px', boxShadow: 'var(--shadow-lg)' }}>
            <h2 style={{ marginBottom: '8px' }}>Tambahkan Topping</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Untuk {toppingProduct.name}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              {availableToppings.filter(t => t.category_id === toppingProduct.category_id || !t.category_id).map(topping => {
                const isSelected = selectedToppings.some(t => t.name === topping.name);
                return (
                  <div 
                    key={topping.name} 
                    onClick={() => toggleTopping(topping)}
                    style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: '0.2s', background: isSelected ? '#fff0ea' : 'transparent' }}
                  >
                    <span style={{ fontWeight: 600 }}>{topping.name}</span>
                    <span style={{ color: 'var(--primary)' }}>+Rp {topping.price.toLocaleString('id-ID')}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setToppingProduct(null)}>Batal</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={confirmToppings}>Tambahkan</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pembayaran */}
      {showPaymentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', padding: '40px', borderRadius: 'var(--radius-lg)', width: '500px', boxShadow: 'var(--shadow-lg)', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '8px' }}>Pilih Metode Pembayaran</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Total Tagihan: <strong>Rp {total.toLocaleString('id-ID')}</strong></p>
            
            <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
              <div 
                onClick={() => handleCheckout('Tunai')}
                style={{ flex: 1, padding: '32px', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: '0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>💵</div>
                <h3 style={{ fontSize: '20px' }}>Uang Tunai</h3>
              </div>

              <div 
                onClick={() => handleCheckout('QRIS')}
                style={{ flex: 1, padding: '32px', border: '2px solid var(--border-color)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: '0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>📱</div>
                <h3 style={{ fontSize: '20px' }}>QRIS</h3>
              </div>
            </div>

            <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => setShowPaymentModal(false)}>
              Batal & Kembali
            </button>
          </div>
        </div>
      )}

      {/* Modal Pengeluaran (Cash Out) */}
      {showExpenseModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', padding: '32px', borderRadius: 'var(--radius-lg)', width: '400px', boxShadow: 'var(--shadow-lg)' }}>
            <h2 style={{ marginBottom: '8px' }}>Kas Keluar (Petty Cash)</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Catat pengeluaran mendadak di kasir.</p>
            
            <form onSubmit={handleExpense} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Nominal Pengeluaran (Rp)</label>
                <input required type="text" value={expenseAmount !== undefined ? `Rp. ${expenseAmount.toLocaleString('id-ID')}` : ''} onChange={e => {
                  const rawValue = e.target.value.replace(/[^0-9]/g, '');
                  setExpenseAmount(parseInt(rawValue, 10) || 0);
                }} style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Keterangan / Tujuan</label>
                <input required type="text" placeholder="Contoh: Beli Galon, Kembalian" value={expenseNote} onChange={e => setExpenseNote(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowExpenseModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, background: 'var(--danger)', border: 'none' }} disabled={isProcessing}>
                  {isProcessing ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button for Mobile Cart */}
      <div className="fab-cart" onClick={() => setShowMobileCart(true)}>
        🛒
        {cart.reduce((sum, item) => sum + item.qty, 0) > 0 && (
          <div className="fab-badge">
            {cart.reduce((sum, item) => sum + item.qty, 0)}
          </div>
        )}
      </div>
    </>
  );
}
