import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const role = request.cookies.get('pos_role')?.value;

  const isPublicPath = path === '/login';

  // Jika belum login dan mencoba masuk ke halaman selain login
  if (!role && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Jika sudah login dan mencoba masuk ke halaman login
  if (role && isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Jika Kasir mencoba masuk ke halaman terlarang (Laporan, Stok, Pengaturan)
  // Kasir BOLEH masuk ke / dan /history
  if (role === 'kasir') {
    const restrictedPaths = ['/stock', '/reports', '/settings'];
    if (restrictedPaths.some(p => path.startsWith(p))) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Jika Admin masuk, arahkan ke laporan (tidak boleh ke kasir)
  if (role === 'admin' && path === '/') {
    return NextResponse.redirect(new URL('/reports', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
