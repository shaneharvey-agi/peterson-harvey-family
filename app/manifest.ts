// Web App Manifest. Next 14 auto-detects this file and serves at
// /manifest.webmanifest, so no explicit `manifest:` field is needed in
// app/layout.tsx metadata.
//
// Icons reference the build-time PNGs from app/icon.tsx and
// app/apple-icon.tsx — keeping the brand mark in code, not as a static
// asset that can drift.

import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mikayla',
    short_name: 'Mikayla',
    description: 'Your family, handled.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#07090F',
    theme_color: '#07090F',
    icons: [
      { src: '/icon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
