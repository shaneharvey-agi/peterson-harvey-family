import type { Metadata, Viewport } from 'next';
import { BottomNav } from '@/components/layout/BottomNav';
import { ColdBootGate } from '@/components/loading/ColdBootGate';
import './globals.css';

// iOS PWA launch splash images. Without these, iOS shows its default
// white screen for ~1-2 seconds between tapping the home-screen icon
// and our HTML rendering. Each entry must match a specific iPhone's
// portrait dimensions exactly; covers the modern fleet (12-series and
// up) plus a few common older sizes as fallback.
const APPLE_STARTUP_IMAGES = [
  // iPhone 16 Pro Max (440×956 @3x)
  { d: '440', h: '956', r: '3', w: 1320, hpx: 2868 },
  // iPhone 16 Pro (402×874 @3x)
  { d: '402', h: '874', r: '3', w: 1206, hpx: 2622 },
  // iPhone 14 Pro Max / 15 Pro Max / 14 Plus / 15 Plus / 16 Plus (430×932 @3x)
  { d: '430', h: '932', r: '3', w: 1290, hpx: 2796 },
  // iPhone 14 Pro / 15 Pro / 15 / 16 (393×852 @3x)
  { d: '393', h: '852', r: '3', w: 1179, hpx: 2556 },
  // iPhone 12 / 12 Pro / 13 / 13 Pro / 14 (390×844 @3x)
  { d: '390', h: '844', r: '3', w: 1170, hpx: 2532 },
  // iPhone 12/13 mini (360×780 @3x)
  { d: '360', h: '780', r: '3', w: 1080, hpx: 2340 },
  // iPhone X / XS / 11 Pro (375×812 @3x)
  { d: '375', h: '812', r: '3', w: 1125, hpx: 2436 },
  // iPhone XS Max / 11 Pro Max (414×896 @3x)
  { d: '414', h: '896', r: '3', w: 1242, hpx: 2688 },
  // iPhone XR / 11 (414×896 @2x)
  { d: '414', h: '896', r: '2', w: 828, hpx: 1792 },
  // iPhone 6+/7+/8+ (414×736 @3x)
  { d: '414', h: '736', r: '3', w: 1242, hpx: 2208 },
  // iPhone SE 2/3 / 6 / 7 / 8 (375×667 @2x)
  { d: '375', h: '667', r: '2', w: 750, hpx: 1334 },
] as const;

export const metadata: Metadata = {
  title: 'Mikayla',
  description: 'Your family, handled.',
  // Manifest comes from app/manifest.ts; icons from app/icon.tsx + app/apple-icon.tsx.
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Mikayla',
    startupImage: APPLE_STARTUP_IMAGES.map(({ d, h, r, w, hpx }) => ({
      url: `/apple-startup-image/${w}/${hpx}`,
      media:
        `(device-width: ${d}px) and (device-height: ${h}px) ` +
        `and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)`,
    })),
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
