// iOS Add-to-Home-Screen icon (180x180 PNG). Mirrors the M Orb in the
// bottom nav so the home-screen icon matches what the user sees when
// they open the app. iOS auto-applies its own rounded mask.

import { ImageResponse } from 'next/og';
import { renderOrbIcon } from '@/lib/orb-icon';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(renderOrbIcon(size.width), { ...size });
}
