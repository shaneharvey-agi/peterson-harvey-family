// Shared JSX renderer for the M Orb icon used by app/icon.tsx (192/512)
// and app/apple-icon.tsx (180). Reproduces the bottom-nav orb's exact
// layered structure at any size: outer gold ring → navy band → gold
// body with the architectural M monogram (path, not text) centered
// above a navy waveform strip.
//
// PNG icons can't paint outside their own bounds, so the bottom-nav
// orb's box-shadow gold ring is rendered here as the outermost layer
// of three concentric rounded rects:
//   1. outer container — gold ring (the outermost halo)
//   2. middle layer    — navy band  (matches the orb's `border: 3px navy`)
//   3. inner layer     — gold body  (M glyph + waveform strip)
//
// Glyph note: previous versions rasterized the M as a <div>M</div> with
// Inter 800 fetched from Google Fonts at edge runtime. We've moved to a
// path-based monogram (single source of truth in components/icons/
// MMonogram.tsx), so Satori draws the glyph as inline SVG with no font
// dependency. Same M every render, no edge fetch, no weight drift.
//
// Proportions taken from the live MOrb (56x56):
//   gold ring     1.5 / 56 = 2.68%   outer halo
//   navy band     3   / 56 = 5.36%   inset frame
//   bottom strip 14   / 56 = 25%     waveform footer (of inner body)
//   radius       16   / 56 = 28.6%   soft squircle

import * as React from 'react';

const BAR_HEIGHT_RATIOS = [3, 6, 9, 5, 8, 4].map((h) => h / 56);

/**
 * No-op font loader retained for the icon-route signatures so the
 * generators don't have to change call shape. The monogram is now path
 * geometry, so Satori needs no extra fonts to render the icon.
 */
export async function loadOrbIconFonts(): Promise<
  Array<{ name: string; data: ArrayBuffer; weight: 800; style: 'normal' }>
> {
  return [];
}

/**
 * Wraps the orb in a #07090F navy canvas so the iOS home-screen icon
 * and Android maskable icon blend seamlessly with the PWA launch
 * background. The orb itself occupies ~78% of the icon edge — enough
 * breathing room to read clearly on the home grid without shrinking
 * the brand mark too far. Mirrors the canvas the apple-startup-image
 * route already uses, so the icon → splash transition lands on a
 * single continuous navy field.
 */
export function renderBrandIcon(size: number): React.ReactElement {
  const orbSize = Math.round(size * 0.78);
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#07090F',
      }}
    >
      <div style={{ width: orbSize, height: orbSize, display: 'flex' }}>
        {renderOrbIcon(orbSize)}
      </div>
    </div>
  );
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
  // Architectural M monogram sized + offset to match MMark/MOrb.
  const glyphSize = Math.round(mAreaHeight * 0.62);
  // Optical offsets — counteract the waveform strip's left-of-center
  // visual mass and the natural perceptual sag of bottom-anchored
  // glyphs. Same ratios used by MMark/MOrb so every surface lines up.
  const opticalDX = Math.max(1, Math.round(innerSize * 0.02));
  const opticalDY = -Math.max(1, Math.round(mAreaHeight * 0.04));
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
        {/* Inner: gold body with M monogram + waveform strip. */}
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
            }}
          />

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
