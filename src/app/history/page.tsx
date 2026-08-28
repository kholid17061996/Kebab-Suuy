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

  useEffect(() => {
    fetchHistory();
  }, [selectedYear]);

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
    </div>
  );
}
