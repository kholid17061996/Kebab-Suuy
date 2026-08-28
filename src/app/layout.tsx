import type { Metadata } from 'next';
import './globals.css';

import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Kebab Suuy - POS System',
  description: 'Premium POS system for Kebab Suuy',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="pos-layout">
          <Sidebar />
          {children}
        </div>
      </body>
    </html>
  );
}
