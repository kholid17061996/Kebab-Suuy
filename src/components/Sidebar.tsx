"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };
    setRole(getCookie('pos_role') || null);
  }, [pathname]);

  const handleLogout = () => {
    document.cookie = 'pos_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/login');
    router.refresh();
  };

  if (pathname === '/login') return null;

  const isAdmin = role === 'admin';

  return (
    <div className="sidebar">
      {!isAdmin && (
        <>
          <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '24px' }}>🏠</span>
            Kasir
          </Link>
          <Link href="/history" className={`nav-item ${pathname === '/history' ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '24px' }}>📜</span>
            Riwayat
          </Link>
        </>
      )}
      
      {isAdmin && (
        <>
          <Link href="/reports" className={`nav-item ${pathname === '/reports' ? 'active' : ''}`} style={{ textDecoration: 'none', marginTop: isAdmin ? '24px' : '0' }}>
            <span style={{ fontSize: '24px' }}>📊</span>
            Laporan
          </Link>
          <Link href="/stock" className={`nav-item ${pathname === '/stock' ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '24px' }}>📦</span>
            Stok
          </Link>
          <Link href="/settings" className={`nav-item ${pathname === '/settings' ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '24px' }}>⚙️</span>
            Menu
          </Link>
        </>
      )}

      <div onClick={handleLogout} className="nav-item" style={{ marginTop: 'auto', marginBottom: '24px', color: 'var(--danger)', cursor: 'pointer' }}>
        <span style={{ fontSize: '24px' }}>🚪</span>
        Keluar
      </div>
    </div>
  );
}
