"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Default bulan sesuai device
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const fetchTransactions = async () => {
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
      
    if (trxRes.error) {
      console.error('Error fetching transactions:', trxRes.error);
    } else {
      setTransactions(trxRes.data || []);
    }
    
    if (expRes.error) {
      console.error('Error fetching expenses:', expRes.error);
    } else {
      setExpenses(expRes.data || []);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
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
  
  const totalGrossRevenue = monthlyTransactions.reduce((sum, t) => sum + t.total_amount, 0);
  const totalExpense = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalNetRevenue = totalGrossRevenue - totalExpense;
  
  const qrisCount = monthlyTransactions.filter(t => t.payment_method === 'QRIS').length;
  const cashCount = monthlyTransactions.filter(t => t.payment_method === 'Tunai').length;

  // Proses data untuk grafik garis harian
  const processDailyData = () => {
    const dailyData: Record<string, { Pendapatan: number, Pengeluaran: number }> = {};
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    
    for(let i=1; i<=daysInMonth; i++) {
      dailyData[`Tgl ${i}`] = { Pendapatan: 0, Pengeluaran: 0 };
    }

    monthlyTransactions.forEach(t => {
      const date = new Date(t.created_at);
      const dayLabel = `Tgl ${date.getDate()}`;
      if (dailyData[dayLabel]) {
        dailyData[dayLabel].Pendapatan += t.total_amount;
      }
    });

    monthlyExpenses.forEach(e => {
      const date = new Date(e.created_at);
      const dayLabel = `Tgl ${date.getDate()}`;
      if (dailyData[dayLabel]) {
        dailyData[dayLabel].Pengeluaran += e.amount;
      }
    });

    return Object.keys(dailyData).map(key => ({
      name: key,
      Pendapatan: dailyData[key].Pendapatan,
      Pengeluaran: dailyData[key].Pengeluaran,
      Bersih: dailyData[key].Pendapatan - dailyData[key].Pengeluaran
    }));
  };

  const chartData = processDailyData();

  return (
    <div className="main-area" style={{ flex: 1, padding: '24px' }}>
      <div className="header">
        <div>
          <h1>Laporan Keuangan</h1>
          <p style={{ color: 'var(--text-muted)' }}>Analisis penjualan Kasir Kebab Suuy</p>
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
          <button className="btn btn-primary" onClick={fetchTransactions}>🔄 Refresh</button>
        </div>
      </div>

      {loading ? (
        <p>Memuat data laporan...</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <h3 style={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '14px' }}>Pendapatan Kotor (Omzet)</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary)' }}>
                Rp {totalGrossRevenue.toLocaleString('id-ID')}
              </div>
            </div>

            <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <h3 style={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '14px' }}>Total Pengeluaran Kasir</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--danger)' }}>
                - Rp {totalExpense.toLocaleString('id-ID')}
              </div>
            </div>

            <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s', cursor: 'pointer', border: '2px solid var(--primary)' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <h3 style={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '14px' }}>Pendapatan Bersih (Net Cash)</h3>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                Rp {totalNetRevenue.toLocaleString('id-ID')}
              </div>
            </div>
            
            <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <h3 style={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '14px' }}>Metode Pembayaran (Bulan Ini)</h3>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                <div style={{ flex: 1, background: '#f8fafc', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '20px' }}>💵</span>
                  <div style={{ fontWeight: 'bold', marginTop: '4px' }}>{cashCount}</div>
                </div>
                <div style={{ flex: 1, background: '#f8fafc', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '20px' }}>📱</span>
                  <div style={{ fontWeight: 'bold', marginTop: '4px' }}>{qrisCount}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Grafik Harian Admin */}
          <div style={{ background: 'var(--surface)', padding: '24px', borderRadius: 'var(--radius-lg)', marginBottom: '32px', boxShadow: 'var(--shadow-sm)', width: '100%', overflow: 'hidden' }}>
            <h3 style={{ marginBottom: '16px' }}>Grafik Pendapatan Harian ({MONTHS[selectedMonth]} {selectedYear})</h3>
            <div style={{ height: '350px', width: '100%', minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPendapatan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorBersih" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis 
                    stroke="var(--text-muted)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => `Rp ${(val/1000)}k`} 
                  />
                  <Tooltip 
                    formatter={(value: any, name: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, name]}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                  />
                  <Area type="monotone" dataKey="Pendapatan" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorPendapatan)" activeDot={{ r: 6 }} />
                  <Area type="monotone" dataKey="Bersih" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorBersih)" activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>


        </>
      )}
    </div>
  );
}
