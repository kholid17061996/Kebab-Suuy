"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [username, setUsername] = useState('');
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
        .select('password, role')
        .eq('username', username.toLowerCase())
        .single();
        
      if (dbError) {
        console.error('Supabase error:', dbError);
        // Fallback sementara jika tabel app_users belum diperbarui
        if (password === '1811' && (username.toLowerCase() === 'admin' || username.toLowerCase() === 'kasir')) {
          document.cookie = `pos_role=${username.toLowerCase()}; path=/; max-age=86400`;
          document.cookie = `pos_user=${username.toLowerCase()}; path=/; max-age=86400`;
          router.push('/');
          router.refresh();
        } else {
          setError('Username atau Password salah!');
        }
      } else if (data && data.password === password) {
        document.cookie = `pos_role=${data.role}; path=/; max-age=86400`;
        document.cookie = `pos_user=${username.toLowerCase()}; path=/; max-age=86400`;
        router.push('/');
        router.refresh();
      } else {
        setError('Username atau Password salah!');
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
          
          <div>
            <input 
              type="text" 
              placeholder="Username" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{ width: '100%', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '16px', textAlign: 'center', marginBottom: '8px' }}
              required
            />
          </div>

          <div>
            <input 
              type="password" 
              placeholder="Masukkan PIN / Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '16px', textAlign: 'center', letterSpacing: '4px' }}
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
