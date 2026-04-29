'use client';

// Single source of truth for the architectural Mikayla "M". The path is
// path-based, NOT a text font, so the glyph is identical pixel-for-pixel
// at every size and on every render target — DOM SVG, next/og Satori
// PNGs, and the static public/M-Monogram.svg file. No font loading, no
// CSS fallback drift, no weight-mismatch on edge runtimes.
//
// Geometry (100x100 viewBox):
//   - Vertical outer stems (no Helvetica side-slope) on x = 4..22 and 78..96.
//   - Outer V apex at (50, 56); inner V apex at (50, 80).
//   - Inner-stem inside corners at (22, 28) and (78, 28).
//   - Inner and outer diagonals are parallel — perpendicular stroke
//     thickness ~21 units, slightly heavier than the 18-unit stems, in
//     the Trajan / architectural Roman tradition.
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
  'M 4 96 L 4 4 L 22 4 L 50 56 L 78 4 L 96 4 L 96 96 L 78 96 L 78 28 L 50 80 L 22 28 L 22 96 Z';

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
