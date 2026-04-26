// Shared JSX renderer for the M Orb icon used by app/icon.tsx (192/512)
// and app/apple-icon.tsx (180). Reproduces the bottom-nav orb's idle
// state at any size: full-bleed gold, bold black "M" centered in the
// upper region, dark bottom strip with six static waveform bars (no
// animation in icons).
//
// Proportions taken from the live MOrb component:
//   container         56x56
//   bottom strip      14 tall          → 25% of height
//   M fontSize        26               → ~62% of the M-area height
//   M marginTop       4                → ~7% of size
//   bar width         1.5              → ~2.7% of size
//   bar gap           1.5              → ~2.7% of size
//   bar heights       3,6,9,5,8,4      → 5.4-16% of size

import * as React from 'react';

const BAR_HEIGHT_RATIOS = [3, 6, 9, 5, 8, 4].map((h) => h / 56);

export function renderOrbIcon(size: number): React.ReactElement {
  const stripHeight = Math.round(size * 0.25);
  const mAreaHeight = size - stripHeight;
  const mFontSize = Math.round(mAreaHeight * 0.78);
  const mMarginTop = Math.round(size * 0.04);
  const barWidth = Math.max(2, Math.round(size * 0.03));
  const barGap = Math.max(2, Math.round(size * 0.027));
  const barRadius = Math.max(1, Math.round(barWidth * 0.3));
  const barHeights = BAR_HEIGHT_RATIOS.map((r) =>
    Math.max(2, Math.round(size * r)),
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#C4A050',
      }}
    >
      <div
        style={{
          width: '100%',
          height: mAreaHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: mMarginTop,
          fontFamily: 'sans-serif',
          fontWeight: 800,
          fontSize: mFontSize,
          lineHeight: 1,
          color: '#000000',
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
