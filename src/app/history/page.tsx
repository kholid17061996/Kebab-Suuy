"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type Transaction = {
  id: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
};

type Expense = {
  id: string;
  amount: number;
  note: string;
  created_at: string;
};

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<'penjualan' | 'pengeluaran'>('penjualan');
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Default bulan sesuai device
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const fetchHistory = async () => {
    setLoading(true);
    const startOfYear = new Date(selectedYear, 0, 1);
    const endOfYear = new Date(selectedYear, 11, 31, 23, 59, 59);

    const [trxRes, expRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .gte('created_at', startOfYear.toISOString())
        .lte('created_at', endOfYear.toISOString())
        .order('created_at', { ascending: false }),
      supabase
        .from('expenses')
        .select('*')
        .gte('created_at', startOfYear.toISOString())
        .lte('created_at', endOfYear.toISOString())
        .order('created_at', { ascending: false })
    ]);

    if (trxRes.data) setTransactions(trxRes.data);
    if (expRes.data) setExpenses(expRes.data);
    setLoading(false);
  };


  // States for Transaction Details Modal
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [transactionItems, setTransactionItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    fetchHistory();

    const channel = supabase
      .channel('history-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchHistory();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
        fetchHistory();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedYear]);

  const handleTransactionClick = async (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    setLoadingItems(true);
    const { data, error } = await supabase
      .from('transaction_items')
      .select('*')
      .eq('transaction_id', transactionId);
    
    if (!error && data) {
      setTransactionItems(data);
    }
    setLoadingItems(false);
  };

  // Filter HANYA untuk bulan dan tahun yang dipilih
  const monthlyTransactions = transactions.filter(t => {
    const date = new Date(t.created_at);
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
  });

  const monthlyExpenses = expenses.filter(e => {
    const date = new Date(e.created_at);
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
  });

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
      await fetchHistory();
      setIsRefreshing(false);
    }
    setStartY(0);
    setPullDistance(0);
  };

  const today = new Date();
  const todayOmzet = transactions
    .filter(t => {
      const d = new Date(t.created_at);
      return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    })
    .reduce((sum, t) => sum + t.total_amount, 0);

  const todayExpTotal = expenses
    .filter(e => {
      const d = new Date(e.created_at);
      return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const monthlyOmzet = monthlyTransactions.reduce((sum, t) => sum + t.total_amount, 0);
  const monthlyExpTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

  const [showMonthly, setShowMonthly] = useState(false);
  const [isHoveredOrTouched, setIsHoveredOrTouched] = useState(false);
  const [selectedCard, setSelectedCard] = useState<'omzet' | 'pengeluaran' | null>(null);

  useEffect(() => {
    if (isHoveredOrTouched) return;
    const timer = setInterval(() => {
      setShowMonthly(prev => !prev);
    }, 3000);
    return () => clearInterval(timer);
  }, [isHoveredOrTouched]);

  return (
    <div 
      className="main-area" 
      style={{ flex: 1, padding: '24px', position: 'relative' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="header" style={{ marginBottom: '16px' }}>
        <div>
          <h1>Riwayat & Laporan Harian</h1>
          <p style={{ color: 'var(--text-muted)' }}>Pantau transaksi dan pengeluaran kasir</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            className="btn btn-outline"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            style={{ appearance: 'auto', paddingRight: '32px' }}
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
          <select 
            className="btn btn-outline"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{ appearance: 'auto', paddingRight: '32px' }}
          >
            {Array.from({ length: 50 }, (_, i) => 2020 + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Live Omzet Display (Animated Rolling Window Effect) */}
      <div 
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}
        onMouseEnter={() => setIsHoveredOrTouched(true)}
        onMouseLeave={() => setIsHoveredOrTouched(false)}
        onTouchStart={() => setIsHoveredOrTouched(true)}
        onTouchEnd={() => {
           // Provide a slight delay before resuming animation so the user can finish reading
           setTimeout(() => setIsHoveredOrTouched(false), 2000);
        }}
      >
        {/* Omzet Card */}
        <div 
          onClick={() => setSelectedCard('omzet')}
          style={{ position: 'relative', height: '84px', perspective: '1000px', cursor: 'pointer' }}
        >
          {/* Bulanan (Underneath) */}
          <div style={{ 
            position: 'absolute', inset: 0, borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', color: 'white', padding: '16px',
            transform: showMonthly ? 'scale(1)' : 'scale(0.95)',
            opacity: showMonthly ? 1 : 0,
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s'
          }}>
            <h3 style={{ margin: 0, fontSize: '11px', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Omzet Bulanan</h3>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>Rp {monthlyOmzet.toLocaleString('id-ID')}</div>
          </div>

          {/* Harian (Front Window Flap) */}
          <div style={{ 
            position: 'absolute', inset: 0, borderRadius: 'var(--radius-md)', transformOrigin: 'top',
            background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '16px',
            transform: showMonthly ? 'rotateX(90deg)' : 'rotateX(0deg)',
            opacity: showMonthly ? 0 : 1,
            boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)',
            transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s'
          }}>
            <h3 style={{ margin: 0, fontSize: '11px', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Omzet Harian</h3>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>Rp {todayOmzet.toLocaleString('id-ID')}</div>
          </div>
        </div>

        {/* Pengeluaran Card */}
        <div 
          onClick={() => setSelectedCard('pengeluaran')}
          style={{ position: 'relative', height: '84px', perspective: '1000px', cursor: 'pointer' }}
        >
          {/* Bulanan (Underneath) */}
          <div style={{ 
            position: 'absolute', inset: 0, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
            background: 'var(--surface)', padding: '16px',
            transform: showMonthly ? 'scale(1)' : 'scale(0.95)',
            opacity: showMonthly ? 1 : 0,
            boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
            transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s'
          }}>
            <h3 style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pengeluaran Bulanan</h3>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--danger)', marginTop: '4px' }}>Rp {monthlyExpTotal.toLocaleString('id-ID')}</div>
          </div>

          {/* Harian (Front Window Flap) */}
          <div style={{ 
            position: 'absolute', inset: 0, borderRadius: 'var(--radius-md)', transformOrigin: 'top', border: '1px solid var(--border-color)',
            background: 'var(--surface)', padding: '16px',
            transform: showMonthly ? 'rotateX(90deg)' : 'rotateX(0deg)',
            opacity: showMonthly ? 0 : 1,
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s'
          }}>
            <h3 style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pengeluaran Harian</h3>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--danger)', marginTop: '4px' }}>Rp {todayExpTotal.toLocaleString('id-ID')}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '2px solid var(--border-color)', paddingBottom: '16px' }}>
        <button 
          onClick={() => setActiveTab('penjualan')}
          className={`btn ${activeTab === 'penjualan' ? 'btn-primary' : 'btn-outline'}`}
        >
          Riwayat Penjualan
        </button>
        <button 
          onClick={() => setActiveTab('pengeluaran')}
          className={`btn ${activeTab === 'pengeluaran' ? 'btn-primary' : 'btn-outline'}`}
          style={{ borderColor: activeTab === 'pengeluaran' ? 'transparent' : 'var(--border-color)', background: activeTab === 'pengeluaran' ? 'var(--danger)' : 'transparent', color: activeTab === 'pengeluaran' ? 'white' : 'var(--text-main)' }}
        >
          Pengeluaran Kasir
        </button>
      </div>

      {pullDistance > 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '16px', height: `${pullDistance}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: pullDistance === 0 ? '0.3s' : 'none', overflow: 'hidden' }}>
          <span style={{ fontSize: '24px', transform: `rotate(${pullDistance * 2}deg)` }}>🔄</span>
        </div>
      )}
      
      {isRefreshing && (
        <div style={{ textAlign: 'center', color: 'var(--primary)', marginBottom: '16px' }}>
          <span style={{ fontSize: '24px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>🔄</span>
          <p>Menyegarkan data...</p>
        </div>
      )}

      {loading && !isRefreshing ? (
        <p>Memuat riwayat...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '80px' }}>
          {activeTab === 'penjualan' ? (
            monthlyTransactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)' }}>
                <span style={{ fontSize: '48px', color: 'var(--text-muted)' }}>📭</span>
                <p style={{ color: 'var(--text-muted)', marginTop: '16px' }}>Belum ada transaksi di bulan ini</p>
              </div>
            ) : (
              monthlyTransactions.map(t => (
                <div key={t.id} style={{ 
                  background: 'var(--surface)', 
                  borderRadius: 'var(--radius-lg)', 
                  padding: '20px', 
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'transform 0.2s',
                  cursor: 'pointer'
                }}
                onClick={() => handleTransactionClick(t.id)}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ 
                      width: '48px', height: '48px', borderRadius: '50%', 
                      background: t.payment_method === 'QRIS' ? '#e0f2fe' : '#dcfce7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'
                    }}>
                      {t.payment_method === 'QRIS' ? '📱' : '💵'}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Struk #{t.id.split('-')[0]}</h4>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        {new Date(t.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '18px' }}>
                      Rp {t.total_amount.toLocaleString('id-ID')}
                    </div>
                    <span style={{ 
                      display: 'inline-block', marginTop: '4px', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                      background: t.payment_method === 'QRIS' ? '#0284c7' : '#166534',
                      color: 'white'
                    }}>
                      {t.payment_method}
                    </span>
                  </div>
                </div>
              ))
            )
          ) : (
            monthlyExpenses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)' }}>
                <span style={{ fontSize: '48px', color: 'var(--text-muted)' }}>📭</span>
                <p style={{ color: 'var(--text-muted)', marginTop: '16px' }}>Belum ada pengeluaran di bulan ini</p>
              </div>
            ) : (
              monthlyExpenses.map(e => (
                <div key={e.id} style={{ 
                  background: 'var(--surface)', 
                  borderRadius: 'var(--radius-lg)', 
                  padding: '20px', 
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ 
                      width: '48px', height: '48px', borderRadius: '50%', 
                      background: '#fee2e2',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'
                    }}>
                      💸
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{e.note}</h4>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        {new Date(e.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '18px' }}>
                      -Rp {e.amount.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      )}

      {selectedCard && (
        <div 
          onClick={() => setSelectedCard(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              padding: '24px',
              borderRadius: 'var(--radius-lg)',
              width: '90%',
              maxWidth: '400px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', borderBottom: '2px solid var(--border-color)', paddingBottom: '12px' }}>
              {selectedCard === 'omzet' ? 'Detail Omzet' : 'Detail Pengeluaran'}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: selectedCard === 'omzet' ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--surface)', color: selectedCard === 'omzet' ? 'white' : 'inherit', border: selectedCard === 'omzet' ? 'none' : '1px solid var(--border-color)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <h3 style={{ margin: 0, fontSize: '13px', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{selectedCard === 'omzet' ? 'Omzet Harian' : 'Pengeluaran Harian'}</h3>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px', color: selectedCard === 'omzet' ? 'white' : 'var(--danger)' }}>
                  Rp {selectedCard === 'omzet' ? todayOmzet.toLocaleString('id-ID') : todayExpTotal.toLocaleString('id-ID')}
                </div>
              </div>
              
              <div style={{ background: selectedCard === 'omzet' ? 'linear-gradient(135deg, var(--primary), var(--primary-hover))' : 'var(--surface)', color: selectedCard === 'omzet' ? 'white' : 'inherit', border: selectedCard === 'omzet' ? 'none' : '1px solid var(--border-color)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <h3 style={{ margin: 0, fontSize: '13px', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{selectedCard === 'omzet' ? `Omzet Bulanan (${MONTHS[selectedMonth]})` : `Pengeluaran Bulanan (${MONTHS[selectedMonth]})`}</h3>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px', color: selectedCard === 'omzet' ? 'white' : 'var(--danger)' }}>
                  Rp {selectedCard === 'omzet' ? monthlyOmzet.toLocaleString('id-ID') : monthlyExpTotal.toLocaleString('id-ID')}
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setSelectedCard(null)}
              className="btn btn-outline"
              style={{ width: '100%', marginTop: '24px' }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {selectedTransactionId && (
        <div 
          onClick={() => setSelectedTransactionId(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius-lg)',
              width: '90%', maxWidth: '450px', maxHeight: '80vh', overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid var(--border-color)', paddingBottom: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>
                Detail Struk #{selectedTransactionId.split('-')[0]}
              </h2>
              <button 
                onClick={() => setSelectedTransactionId(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>
            
            {loadingItems ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Memuat detail...</div>
            ) : transactionItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Detail tidak ditemukan</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {transactionItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-color)', paddingBottom: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{item.product_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.quantity}x @ Rp {(item.price / item.quantity).toLocaleString('id-ID')}</div>
                    </div>
                    <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                      Rp {item.price.toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid var(--border-color)', fontWeight: 'bold', fontSize: '18px' }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--primary)' }}>
                    Rp {transactionItems.reduce((sum, item) => sum + item.price, 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => setSelectedTransactionId(null)}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '24px' }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
