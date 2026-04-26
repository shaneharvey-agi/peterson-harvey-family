import type { Metadata, Viewport } from 'next';
import { BottomNav } from '@/components/layout/BottomNav';
import { ColdBootGate } from '@/components/loading/ColdBootGate';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mikayla',
  description: 'Your family, handled.',
  // Manifest comes from app/manifest.ts; icons from app/icon.tsx + app/apple-icon.tsx.
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Mikayla',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#07090F',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: '#07090F', color: '#EDEEF2' }}>
        {children}
        {/* Persistent shell: BottomNav (with the M Orb in the middle) sits on
            every route automatically. Each page's main content needs to leave
            room at the bottom — see paddingBottom on the page-level <main>s. */}
        <BottomNav />
        {/* Cold Boot — Living Signature splash, once per PWA launch. */}
        <ColdBootGate />
      </body>
    </html>
  );
}
