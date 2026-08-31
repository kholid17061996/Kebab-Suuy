"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [role, setRole] = useState<'admin' | 'kasir'>('kasir');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: dbError } = await supabase
        .from('app_users')
        .select('password')
        .eq('role', role)
        .single();
        
      if (dbError) {
        console.error('Supabase error:', dbError);
        // Fallback sementara jika tabel app_users belum dibuat di database
        if (password === '1811') {
          document.cookie = `pos_role=${role}; path=/; max-age=86400`;
          router.push('/');
          router.refresh();
        } else {
          setError('Password/PIN salah! (Atau tabel app_users belum dibuat)');
        }
      } else if (data && data.password === password) {
        document.cookie = `pos_role=${role}; path=/; max-age=86400`;
        router.push('/');
        router.refresh();
      } else {
        setError('Password/PIN salah!');
      }
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--bg-color), #ffeadd)' }}>
      <div style={{ background: 'var(--surface)', padding: '40px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', width: '400px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '8px', color: 'var(--primary)' }}>Kebab Suuy</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Silakan login untuk memulai kasir</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <div 
              onClick={() => setRole('kasir')}
              style={{ flex: 1, padding: '12px', border: `2px solid ${role === 'kasir' ? 'var(--primary)' : 'var(--border-color)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: '0.2s', fontWeight: role === 'kasir' ? 'bold' : 'normal', color: role === 'kasir' ? 'var(--primary)' : 'var(--text-muted)' }}
            >
              👩‍🍳 Kasir
            </div>
            <div 
              onClick={() => setRole('admin')}
              style={{ flex: 1, padding: '12px', border: `2px solid ${role === 'admin' ? 'var(--primary)' : 'var(--border-color)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: '0.2s', fontWeight: role === 'admin' ? 'bold' : 'normal', color: role === 'admin' ? 'var(--primary)' : 'var(--text-muted)' }}
            >
              👑 Admin
            </div>
          </div>

          <div>
            <input 
              type="password" 
              placeholder="Masukkan PIN / Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '18px', textAlign: 'center', letterSpacing: '4px' }}
              required
            />
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: '14px', margin: '-8px 0' }}>{error}</p>}

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '16px', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Memeriksa...' : 'Masuk ke Aplikasi'}
          </button>
        </form>
      </div>
    </div>
  );
}
