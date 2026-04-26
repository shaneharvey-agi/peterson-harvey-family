// Shared JSX renderer for the M Orb icon used by app/icon.tsx (192/512)
// and app/apple-icon.tsx (180). Reproduces the bottom-nav orb's idle
// state at any size: full-bleed gold, bold black "M" centered in the
// upper region, dark bottom strip with six static waveform bars.
//
// Font note: Satori (the next/og rasterizer) ships only 400/700 weights
// of Noto Sans by default, so a CSS fontWeight of 800/900 falls back to
// 700 — making the icon's M visibly thinner than the live MOrb's
// Helvetica Neue 800. We fix that by fetching Inter 900 from Google
// Fonts at edge runtime, subset to just the "M" glyph (sub-1KB), and
// passing it to ImageResponse via the `fonts` option.
//
// Proportions taken from the live MOrb component:
//   container         56x56
//   bottom strip      14 tall          → 25% of height
//   M fontSize        26               → ~62% of M-area height
//   bar width         1.5              → ~2.7% of size
//   bar gap           1.5              → ~2.7% of size
//   bar heights       3,6,9,5,8,4      → 5.4-16% of size

import * as React from 'react';

const BAR_HEIGHT_RATIOS = [3, 6, 9, 5, 8, 4].map((h) => h / 56);

/**
 * Load Inter 900 subset to just the "M" glyph from Google Fonts.
 * Returns an empty array if the fetch fails so the icon route can still
 * fall back to Satori's bundled font (better thin M than no icon).
 */
export async function loadOrbIconFonts(): Promise<
  Array<{ name: string; data: ArrayBuffer; weight: 900; style: 'normal' }>
> {
  try {
    const cssUrl =
      'https://fonts.googleapis.com/css2?family=Inter:wght@900&text=M&display=swap';
    // Modern UA so Google returns a woff2 link Satori can read.
    const cssRes = await fetch(cssUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    if (!cssRes.ok) return [];
    const css = await cssRes.text();
    const match = css.match(/src:\s*url\(([^)]+)\)\s*format\(/);
    if (!match) return [];
    const fontRes = await fetch(match[1]);
    if (!fontRes.ok) return [];
    const data = await fontRes.arrayBuffer();
    return [{ name: 'Inter', data, weight: 900, style: 'normal' }];
  } catch {
    return [];
  }
}

export function renderOrbIcon(size: number): React.ReactElement {
  // Match the orb's `border: 3px solid tokens.bg` on a 56x56 button
  // (3/56 ≈ 5.4%). Bumped to ~7% here for icon-grid visibility — the home
  // screen renders the icon at ~60px, so a literal 3px-equivalent border
  // (≈3.4px) reads as a hairline. 7% lands at ~13px on a 192 PNG → ~4px
  // on the home screen, matches the orb's visual weight.
  const borderW = Math.max(4, Math.round(size * 0.07));
  const innerSize = size - 2 * borderW;
  const radius = Math.round(size * 0.26);
  const stripHeight = Math.round(innerSize * 0.25);
  const mAreaHeight = innerSize - stripHeight;
  const mFontSize = Math.round(mAreaHeight * 0.92);
  const barWidth = Math.max(2, Math.round(innerSize * 0.03));
  const barGap = Math.max(2, Math.round(innerSize * 0.027));
  const barRadius = Math.max(1, Math.round(barWidth * 0.3));
  const barHeights = BAR_HEIGHT_RATIOS.map((r) =>
    Math.max(2, Math.round(innerSize * r)),
  );

  // Single container with CSS border — more reliable in Satori than a
  // padding-based frame approach. overflow:hidden + borderRadius clips
  // the strip's bottom corners to the rounded shape.
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        background: '#C4A050',
        border: `${borderW}px solid #07090F`,
        borderRadius: radius,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '100%',
          height: mAreaHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter',
          fontWeight: 900,
          fontSize: mFontSize,
          lineHeight: 1,
          color: '#000000',
          letterSpacing: '-0.04em',
        }}
      >
        M
      </div>
      <div
        style={{
          width: '100%',
          height: stripHeight,
          background: '#07090F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: barGap,
        }}
      >
        {barHeights.map((h, i) => (
          <div
            key={i}
            style={{
              width: barWidth,
              height: h,
              background: '#C4A050',
              borderRadius: barRadius,
            }}
          />
        ))}
      </div>
    </div>
  );
}
