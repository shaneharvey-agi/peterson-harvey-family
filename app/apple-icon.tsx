// iOS Add-to-Home-Screen icon (180x180 PNG). Mirrors the M Orb in the
// bottom nav — same renderer + same Inter 900 font subset as app/icon.tsx.

import { ImageResponse } from 'next/og';
import { loadOrbIconFonts, renderOrbIcon } from '@/lib/orb-icon';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default async function AppleIcon() {
  const fonts = await loadOrbIconFonts();
  return new ImageResponse(renderOrbIcon(size.width), { ...size, fonts });
}
