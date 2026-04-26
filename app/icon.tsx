// PWA + favicon icons. Generated at build time via next/og's ImageResponse
// — no extra deps, no static asset to keep in sync. Mirrors the gold-M brand
// mark in the upper-left of TopStrip (28x28 gold square + bold black "M").
//
// Two sizes are emitted for the manifest:
//   /icon/192 → Android Chrome standard
//   /icon/512 → Android Chrome large + splash hint
// iOS uses app/apple-icon.tsx (180) instead.

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export function generateImageMetadata() {
  return [
    { contentType: 'image/png', size: { width: 192, height: 192 }, id: '192' },
    { contentType: 'image/png', size: { width: 512, height: 512 }, id: '512' },
  ];
}

export default function Icon({ id }: { id: string }) {
  const size = id === '512' ? 512 : 192;
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#C4A050',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          fontWeight: 800,
          fontSize: Math.round(size * 0.62),
          lineHeight: 1,
          color: '#000000',
          letterSpacing: '-0.04em',
        }}
      >
        M
      </div>
    ),
    { width: size, height: size },
  );
}
