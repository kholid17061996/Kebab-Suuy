"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Transaction = {
  id: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  cashier_name?: string;
};

type Expense = {
  id: string;
  amount: number;
  note: string;
  created_at: string;
  cashier_name?: string;
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
  const [selectedCashier, setSelectedCashier] = useState<string>('Semua Kasir');

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

    const channel = supabase
      .channel('reports-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchTransactions();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
        fetchTransactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedYear]);

  // Filter HANYA untuk bulan dan tahun yang dipilih serta Kasir
  const monthlyTransactions = transactions.filter(t => {
    const date = new Date(t.created_at);
    const matchDate = date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    const matchCashier = selectedCashier === 'Semua Kasir' || t.cashier_name === selectedCashier;
    return matchDate && matchCashier;
  });

  const monthlyExpenses = expenses.filter(e => {
    const date = new Date(e.created_at);
    const matchDate = date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    const matchCashier = selectedCashier === 'Semua Kasir' || e.cashier_name === selectedCashier;
    return matchDate && matchCashier;
  });

  const cashiers = Array.from(new Set([
    ...transactions.map(t => t.cashier_name).filter(Boolean),
    ...expenses.map(e => e.cashier_name).filter(Boolean)
  ])) as string[];
  
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

  const handleDownloadReport = () => {
    const reportHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Rekapan Keuangan - ${MONTHS[selectedMonth]} ${selectedYear}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
            @page { size: A4; margin: 0; }
            body { 
              font-family: 'Inter', sans-serif; 
              color: #1e293b; 
              line-height: 1.6; 
              background: #f8fafc;
              margin: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .page-container {
              max-width: 210mm;
              margin: 0 auto;
              background: #ffffff;
              min-height: 297mm;
              box-sizing: border-box;
            }
            
            /* Banner Header */
            .header-banner {
              background: linear-gradient(135deg, #FF7E5F 0%, #FEB47B 100%);
              padding: 40px;
              color: white;
              border-radius: 0 0 30px 30px;
              margin-bottom: 40px;
              box-shadow: 0 10px 25px rgba(255, 126, 95, 0.2);
            }
            .header-banner h1 {
              font-family: 'Outfit', sans-serif;
              font-size: 42px;
              font-weight: 800;
              margin: 0;
              letter-spacing: -1px;
            }
            .header-banner p {
              font-size: 16px;
              margin: 10px 0 0 0;
              opacity: 0.9;
              font-weight: 500;
            }
            .header-banner .badge {
              display: inline-block;
              background: rgba(255,255,255,0.2);
              padding: 6px 16px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
              margin-top: 16px;
              backdrop-filter: blur(4px);
            }

            .content-wrapper {
              padding: 0 40px;
            }
            
            /* Summary Cards */
            .summary-grid { 
              display: grid; 
              grid-template-columns: repeat(3, 1fr); 
              gap: 24px; 
              margin-bottom: 40px; 
            }
            .summary-card { 
              padding: 24px; 
              border-radius: 20px; 
              background: #ffffff; 
              border: 1px solid #e2e8f0;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
              position: relative;
              overflow: hidden;
            }
            .summary-card::before {
              content: '';
              position: absolute;
              top: 0; left: 0; right: 0; height: 4px;
              background: #e2e8f0;
            }
            .summary-card.card-blue::before { background: #3b82f6; }
            .summary-card.card-red::before { background: #ef4444; }
            .summary-card.card-green {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              border: none;
              box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2);
            }
            .summary-card.card-green::before { display: none; }
            
            .summary-card h3 { 
              font-family: 'Outfit', sans-serif;
              margin: 0 0 8px 0; 
              font-size: 14px; 
              color: #64748b; 
              text-transform: uppercase; 
              letter-spacing: 1px; 
            }
            .summary-card.card-green h3 { color: rgba(255,255,255,0.8); }
            
            .summary-card .val { 
              font-family: 'Outfit', sans-serif;
              font-size: 28px; 
              font-weight: 700; 
            }
            .text-blue { color: #3b82f6; }
            .text-danger { color: #ef4444; }
            
            /* Table Styling */
            .section-title { 
              font-family: 'Outfit', sans-serif;
              font-size: 22px; 
              font-weight: 700; 
              margin-bottom: 20px; 
              color: #0f172a; 
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .section-title::before {
              content: '';
              display: inline-block;
              width: 12px;
              height: 12px;
              border-radius: 50%;
              background: #FF7E5F;
            }
            
            table { 
              width: 100%; 
              border-collapse: separate; 
              border-spacing: 0;
              margin-bottom: 40px; 
              font-size: 14px; 
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
              border: 1px solid #f1f5f9;
            }
            th, td { 
              padding: 16px; 
              text-align: right; 
              border-bottom: 1px solid #f1f5f9; 
            }
            th:first-child, td:first-child { text-align: left; }
            th { 
              background: #f8fafc; 
              font-family: 'Outfit', sans-serif;
              font-weight: 600; 
              color: #475569; 
              font-size: 15px;
            }
            tr:last-child td { border-bottom: none; }
            
            /* Footer */
            .footer-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 40px;
            }
            .payment-card {
              background: #f8fafc;
              padding: 20px;
              border-radius: 16px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              border: 1px dashed #cbd5e1;
            }
            .payment-card h4 {
              margin: 0;
              font-family: 'Outfit', sans-serif;
              font-size: 16px;
              color: #475569;
            }
            .payment-card .val {
              font-size: 20px;
              font-weight: 700;
              color: #0f172a;
            }

            .footer-note { 
              text-align: center; 
              margin-top: 60px; 
              padding-top: 30px; 
              border-top: 1px dashed #e2e8f0; 
              font-size: 13px; 
              color: #94a3b8; 
            }
          </style>
        </head>
        <body>
          <div class="page-container">
            <div class="header-banner">
              <h1>Kebab Suuy</h1>
              <p>Laporan Rekapitulasi Keuangan</p>
              <div class="badge">Periode: ${MONTHS[selectedMonth]} ${selectedYear} | Kasir: ${selectedCashier}</div>
            </div>

            <div class="content-wrapper">
              <div class="summary-grid">
                <div class="summary-card card-blue">
                  <h3>Pendapatan Kotor</h3>
                  <div class="val text-blue">Rp ${totalGrossRevenue.toLocaleString('id-ID')}</div>
                </div>
                <div class="summary-card card-red">
                  <h3>Pengeluaran Kas</h3>
                  <div class="val text-danger">- Rp ${totalExpense.toLocaleString('id-ID')}</div>
                </div>
                <div class="summary-card card-green">
                  <h3>Laba Bersih (Net)</h3>
                  <div class="val">Rp ${totalNetRevenue.toLocaleString('id-ID')}</div>
                </div>
              </div>

              <div class="section-title">Rincian Transaksi Harian</div>
              <table>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Pemasukan</th>
                    <th>Pengeluaran</th>
                    <th>Bersih Harian</th>
                  </tr>
                </thead>
                <tbody>
                  ${chartData.filter(d => d.Pendapatan > 0 || d.Pengeluaran > 0).map(d => `
                    <tr>
                      <td style="font-weight: 500; color: #334155;">${d.name}</td>
                      <td style="color: #3b82f6; font-weight: 500;">Rp ${d.Pendapatan.toLocaleString('id-ID')}</td>
                      <td style="color: #ef4444; font-weight: 500;">Rp ${d.Pengeluaran.toLocaleString('id-ID')}</td>
                      <td style="color: #10b981; font-weight: 600;">Rp ${d.Bersih.toLocaleString('id-ID')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="section-title">Metode Pembayaran</div>
              <div class="footer-grid">
                <div class="payment-card">
                  <h4>💵 Uang Tunai</h4>
                  <div class="val">${cashCount} Trx</div>
                </div>
                <div class="payment-card">
                  <h4>📱 QRIS</h4>
                  <div class="val">${qrisCount} Trx</div>
                </div>
              </div>

              <div class="footer-note">
                Dicetak pada: ${new Date().toLocaleString('id-ID')} <br>
                Dokumen ini dihasilkan secara otomatis oleh <strong>Sistem Kasir Pintar Kebab Suuy</strong>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="main-area" style={{ flex: 1, padding: '24px' }}>
      <div className="header" style={{ position: 'relative' }}>
        <div>
          <h1>Laporan Keuangan</h1>
          <p style={{ color: 'var(--text-muted)' }}>Analisis penjualan Kasir Kebab Suuy</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select 
            className="btn btn-outline"
            value={selectedCashier}
            onChange={(e) => setSelectedCashier(e.target.value)}
            style={{ appearance: 'auto', paddingRight: '32px' }}
          >
            <option value="Semua Kasir">Semua Kasir</option>
            {cashiers.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>
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
          <button className="btn btn-primary" onClick={handleDownloadReport} style={{ background: '#10b981', border: 'none' }}>📄 Download Rekapan</button>
        </div>
      </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '24px' }}>
            <div style={{ background: 'var(--surface)', padding: '10px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ color: 'var(--text-muted)', margin: '0 0 4px 0', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Omzet</h3>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--primary)' }}>
                Rp {totalGrossRevenue.toLocaleString('id-ID')}
              </div>
            </div>

            <div style={{ background: 'var(--surface)', padding: '10px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ color: 'var(--text-muted)', margin: '0 0 4px 0', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pengeluaran</h3>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--danger)' }}>
                - Rp {totalExpense.toLocaleString('id-ID')}
              </div>
            </div>

            <div style={{ background: 'var(--surface)', padding: '10px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--primary)' }}>
              <h3 style={{ color: 'var(--text-muted)', margin: '0 0 4px 0', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net Cash</h3>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                Rp {totalNetRevenue.toLocaleString('id-ID')}
              </div>
            </div>
            
            <div style={{ background: 'var(--surface)', padding: '10px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ color: 'var(--text-muted)', margin: '0 0 4px 0', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trx (Bulan Ini)</h3>
              <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                <div style={{ flex: 1, background: 'var(--bg-color)', padding: '4px', borderRadius: '4px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '12px' }}>💵</span>
                  <span style={{ fontWeight: 'bold', fontSize: '12px' }}>{cashCount}</span>
                </div>
                <div style={{ flex: 1, background: 'var(--bg-color)', padding: '4px', borderRadius: '4px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '12px' }}>📱</span>
                  <span style={{ fontWeight: 'bold', fontSize: '12px' }}>{qrisCount}</span>
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

    </div>
  );
}
