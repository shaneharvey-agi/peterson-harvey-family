'use client';

/**
 * Mikayla's signature — a thin cursive M drawn as architectural segments
 * with a gold metallic-thread gradient stroke.
 *
 * Top-left starts sharp (no entry hook); bottom-right finishes with a
 * standard cursive trailing hook. The path is split into segments with
 * 0.5-unit cutouts at each peak/valley intersection so the glyph reads as
 * built from architectural strokes rather than a single flowing line.
 *
 * On `active`, an feTurbulence + feDisplacementMap filter animates a
 * left-to-right wave through the body — like a flag in a light wind —
 * over a 3-second cubic-bezier loop.
 *
 * Path ids are exposed so the same gradient + filter can later light up
 * the ".ikayla.ai" wordmark in the header (logo continuity).
 */

interface LiquidSignatureMProps {
  width?: number;
  height?: number;
  /** Trigger the flag-wave filter. */
  active?: boolean;
  /** Override the SVG/element id namespace. */
  idPrefix?: string;
  /** Override stroke width (defaults to 2 — the spec's "2pt Gold"). */
  strokeWidth?: number;
}

// Shared constants — exported so the wordmark component can re-use them later.
export const MIKAYLA_GRADIENT_ID = 'mikayla-gold-thread';
export const MIKAYLA_FILTER_ID = 'mikayla-flag-wave';
export const MIKAYLA_GOLD = '#C5A059';

// Cursive M segments. ViewBox 0 0 70 44.
//   - Segment 1 (left leg): sharp pen-down at upper-left (6,8), no hook,
//     curves down to baseline (10, 38), rises to first peak (28, 8).
//   - Segment 2 (centre valley): falls into the centre valley (35, 32) and
//     rises to the second peak (42, 8).
//   - Segment 3 (right leg + tail): falls to baseline (60, 38), trails up
//     and right into a small cursive hook ending at (~64, 32).
// The 0.5-unit visual gap between segments creates the architectural cutouts
// at each peak / right-leg intersection.
const SEGMENTS: ReadonlyArray<{ key: string; d: string }> = [
  {
    key: 'leg',
    d: 'M 6 8 C 6 22, 8 34, 10 38 C 14 34, 21 16, 27.4 8.4',
  },
  {
    key: 'valley',
    d: 'M 28.6 8.4 C 32 16, 33 26, 35 32 C 37 26, 38 16, 41.4 8.4',
  },
  {
    key: 'tail',
    d: 'M 42.6 8.4 C 48 14, 56 32, 60 38 C 62 38, 66 36, 66 32 C 66 28, 62 30, 64 32',
  },
];

export function LiquidSignatureM({
  width = 50,
  height = 32,
  active = false,
  idPrefix = 'mikayla-signature',
  strokeWidth = 2,
}: LiquidSignatureMProps) {
  const gradientId = `${idPrefix}-${MIKAYLA_GRADIENT_ID}`;
  const filterId = `${idPrefix}-${MIKAYLA_FILTER_ID}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 70 44"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        {/* Metallic gold thread — five-stop linear gradient L→R */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9C7E3A" />
          <stop offset="28%" stopColor="#C5A059" />
          <stop offset="50%" stopColor="#F2DC9A" />
          <stop offset="72%" stopColor="#C5A059" />
          <stop offset="100%" stopColor="#8B6E30" />
        </linearGradient>

        {/* Flag-wave filter — only mounted when active so the M stays crisp
            otherwise and we don't pay the SMIL tick cost. */}
        {active && (
          <filter
            id={filterId}
            x="-15%"
            y="-30%"
            width="130%"
            height="160%"
            filterUnits="objectBoundingBox"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.025 0.06"
              numOctaves="2"
              seed="3"
              stitchTiles="stitch"
              result="turb"
            >
              <animate
                attributeName="baseFrequency"
                dur="3s"
                values="0.022 0.060; 0.034 0.045; 0.022 0.060"
                keyTimes="0; 0.5; 1"
                calcMode="spline"
                keySplines="0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="turb"
              scale="0"
              xChannelSelector="R"
              yChannelSelector="G"
            >
              {/* Staggered amplitude — peaks twice in the loop, each with a
                  cubic-bezier ease so the wave breathes in/out like a flag in
                  a light wind. */}
              <animate
                attributeName="scale"
                dur="3s"
                values="0; 2.4; 0.6; 2.6; 0"
                keyTimes="0; 0.28; 0.5; 0.78; 1"
                calcMode="spline"
                keySplines="0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95"
                repeatCount="indefinite"
              />
            </feDisplacementMap>
          </filter>
        )}
      </defs>

      <g
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter={active ? `url(#${filterId})` : undefined}
        style={{ vectorEffect: 'non-scaling-stroke' }}
      >
        {SEGMENTS.map((s) => (
          <path key={s.key} id={`${idPrefix}-${s.key}`} d={s.d} />
        ))}
      </g>
    </svg>
  );
}

export default LiquidSignatureM;
