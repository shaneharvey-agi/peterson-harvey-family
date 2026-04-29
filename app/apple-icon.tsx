// iOS Add-to-Home-Screen icon (180x180 PNG). Mirrors the M Orb in the
// bottom nav, sitting on a #07090F navy canvas so the icon blends
// seamlessly with the PWA launch splash (apple-startup-image uses the
// same navy background).

import { ImageResponse } from 'next/og';
import { loadOrbIconFonts, renderBrandIcon } from '@/lib/orb-icon';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default async function AppleIcon() {
  const fonts = await loadOrbIconFonts();
  return new ImageResponse(renderBrandIcon(size.width), { ...size, fonts });
}
