// PWA + favicon icons. Generated at build time via next/og's ImageResponse
// — no extra deps, no static asset to keep in sync. Mirrors the M Orb in
// the bottom nav (gold rounded body, bold black "M", dark bottom strip
// with the static waveform bars).
//
// iOS auto-applies its own rounded mask, so we don't bake in borderRadius
// here — the design is full-bleed gold + bottom dark strip, and iOS rounds
// the corners cleanly. Android uses the icon as-is or applies adaptive
// masking depending on the device.
//
// Two sizes are emitted for the manifest:
//   /icon/192 → Android Chrome standard
//   /icon/512 → Android Chrome large + splash hint
// iOS uses app/apple-icon.tsx (180) instead.

import { ImageResponse } from 'next/og';
import { renderOrbIcon } from '@/lib/orb-icon';

export const runtime = 'edge';

export function generateImageMetadata() {
  return [
    { contentType: 'image/png', size: { width: 192, height: 192 }, id: '192' },
    { contentType: 'image/png', size: { width: 512, height: 512 }, id: '512' },
  ];
}

export default function Icon({ id }: { id: string }) {
  const size = id === '512' ? 512 : 192;
  return new ImageResponse(renderOrbIcon(size), { width: size, height: size });
}
