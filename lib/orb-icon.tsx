// Shared JSX renderer for the M Orb icon used by app/icon.tsx (192/512)
// and app/apple-icon.tsx (180). Reproduces the bottom-nav orb's exact
// layered structure at any size: outer gold ring → navy band → gold
// body with a bold black "M" centered above a navy waveform strip.
//
// PNG icons can't paint outside their own bounds, so the bottom-nav
// orb's box-shadow gold ring is rendered here as the outermost layer
// of three concentric rounded rects:
//   1. outer container — gold ring (the outermost halo)
//   2. middle layer    — navy band  (matches the orb's `border: 3px navy`)
//   3. inner layer     — gold body  (M glyph + waveform strip)
//
// Font note: Satori (the next/og rasterizer) ships only 400/700 weights
// of Noto Sans by default, so a CSS fontWeight of 800/900 falls back to
// 700 — making the icon's M visibly thinner than the live MOrb's
// Helvetica Neue 800. We fix that by fetching Inter 900 from Google
// Fonts at edge runtime, subset to just the "M" glyph (sub-1KB), and
// passing it to ImageResponse via the `fonts` option.
//
// Proportions taken from the live MOrb (56x56):
//   gold ring     1.5 / 56 = 2.68%   outer halo
//   navy band     3   / 56 = 5.36%   inset frame
//   bottom strip 14   / 56 = 25%     waveform footer (of inner body)
//   M font       26   / 56 = 46.4%   bold M centered above the strip
//   radius       16   / 56 = 28.6%   soft squircle

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
  // Bumped slightly above literal proportions so the ring + band stay
  // legible on the home-screen grid (where icons render at ~60px).
  const ringW = Math.max(2, Math.round(size * 0.032));
  const bandW = Math.max(4, Math.round(size * 0.058));
  const innerSize = size - 2 * ringW - 2 * bandW;
  const outerRadius = Math.round(size * 0.26);
  const middleRadius = Math.max(0, outerRadius - ringW);
  const innerRadius = Math.max(0, middleRadius - bandW);
  const stripHeight = Math.round(innerSize * 0.25);
  const mAreaHeight = innerSize - stripHeight;
  const mFontSize = Math.round(mAreaHeight * 0.92);
  const barWidth = Math.max(2, Math.round(innerSize * 0.03));
  const barGap = Math.max(2, Math.round(innerSize * 0.027));
  const barRadius = Math.max(1, Math.round(barWidth * 0.3));
  const barHeights = BAR_HEIGHT_RATIOS.map((r) =>
    Math.max(2, Math.round(innerSize * r)),
  );

  return (
    // Outer: gold ring (the orb's halo).
    <div
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        background: '#C4A050',
        borderRadius: outerRadius,
        padding: ringW,
        display: 'flex',
      }}
    >
      {/* Middle: navy band. */}
      <div
        style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          background: '#07090F',
          borderRadius: middleRadius,
          padding: bandW,
          display: 'flex',
        }}
      >
        {/* Inner: gold body with M + waveform strip. */}
        <div
          style={{
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
            background: '#C4A050',
            borderRadius: innerRadius,
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
      </div>
    </div>
  );
}
