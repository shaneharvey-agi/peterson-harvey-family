// iOS Add-to-Home-Screen icon (180x180 PNG, full-bleed gold + bold black "M").
// iOS auto-applies its own rounded mask, so the PNG itself is a solid square.
// Without this file, iOS renders a blurry bookmark icon instead of the brand.

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
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
          fontSize: Math.round(size.width * 0.62),
          lineHeight: 1,
          color: '#000000',
          letterSpacing: '-0.04em',
        }}
      >
        M
      </div>
    ),
    { ...size },
  );
}
