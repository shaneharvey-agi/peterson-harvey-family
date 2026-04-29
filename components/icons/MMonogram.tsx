'use client';

// Single source of truth for the architectural Mikayla "M". The path is
// path-based, NOT a text font, so the glyph is identical pixel-for-pixel
// at every size and on every render target — DOM SVG, next/og Satori
// PNGs, and the static public/M-Monogram.svg file. No font loading, no
// CSS fallback drift, no weight-mismatch on edge runtimes.
//
// Geometry (100x100 viewBox) — v3, Hard Design Lock bold cut:
//   - Vertical outer stems on x = 4..34 and 66..96. 30-unit stems vs the
//     v2 24-unit stems = +25% heavier verticals.
//   - Top edge locked at y = 4 (architectural cap-line); bottom edge
//     stretched from y = 96 to y = 100 so the M's foot reaches the
//     viewBox edge. The wordmark "ikayla" sits on this same physical
//     shelf in the lockup — locking M and ika to a shared baseline.
//   - Outer V apex (50, 50); inner V apex (50, 78). Inside corners at
//     (34, 32) and (66, 32). Outer and inner diagonals stay perfectly
//     parallel (slope 46/16) — Trajan / architectural Roman bones.
//
// Render target notes:
//   - DOM SVG components (MMark, MOrb, ColdBoot) import the React
//     <MMonogram> below.
//   - Satori (next/og) cannot import client components; the orb-icon
//     renderer inlines an <svg><path /></svg> using M_MONOGRAM_PATH +
//     M_MONOGRAM_VIEWBOX directly.
//   - public/M-Monogram.svg mirrors the same path verbatim.

export const M_MONOGRAM_VIEWBOX = '0 0 100 100';

export const M_MONOGRAM_PATH =
  'M 4 100 L 4 4 L 34 4 L 50 50 L 66 4 L 96 4 L 96 100 L 66 100 L 66 32 L 50 78 L 34 32 L 34 100 Z';

interface Props {
  /** Rendered width/height in px. Defaults to 32. */
  size?: number;
  /** Glyph fill. Defaults to black. */
  fill?: string;
  /** Optional SVG filter url (e.g. flag-wave). */
  filter?: string;
  /** Optional inline style for the host SVG element. */
  style?: React.CSSProperties;
  /** Optional className for the host SVG element. */
  className?: string;
}

/**
 * The Mikayla architectural M, rendered as an SVG <path>. Symmetric
 * by construction; pair with a parent that handles optical positioning
 * inside the gold ring (see MMark / MOrb).
 */
export function MMonogram({
  size = 32,
  fill = '#000',
  filter,
  style,
  className,
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={M_MONOGRAM_VIEWBOX}
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible', ...style }}
      className={className}
    >
      <path d={M_MONOGRAM_PATH} fill={fill} filter={filter} />
    </svg>
  );
}

export default MMonogram;
