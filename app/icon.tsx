// PWA + favicon icons. Generated at build time via next/og's ImageResponse
// — no extra deps, no static asset to keep in sync. Mirrors the M Orb
// in the bottom nav, sitting on a #07090F navy canvas so the icon
// blends seamlessly with the PWA launch splash.

import { ImageResponse } from 'next/og';
import { loadOrbIconFonts, renderBrandIcon } from '@/lib/orb-icon';

export const runtime = 'edge';

export function generateImageMetadata() {
  return [
    { contentType: 'image/png', size: { width: 192, height: 192 }, id: '192' },
    { contentType: 'image/png', size: { width: 512, height: 512 }, id: '512' },
  ];
}

export default async function Icon({ id }: { id: string }) {
  const size = id === '512' ? 512 : 192;
  const fonts = await loadOrbIconFonts();
  return new ImageResponse(renderBrandIcon(size), {
    width: size,
    height: size,
    fonts,
  });
}
