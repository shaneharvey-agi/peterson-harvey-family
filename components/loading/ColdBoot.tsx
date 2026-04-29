'use client';

import { useEffect, useState } from 'react';
import { tokens } from '@/lib/design-tokens';
import { impact } from '@/lib/haptics';
import { M_MONOGRAM_PATH } from '@/components/icons/MMonogram';

const STATUS_MESSAGES = [
  'Awakening Mikayla...',
  'Syncing Family Command...',
  'Optimizing your day...',
];

const STATUS_INTERVAL_MS = 1400;
const WAVE_CYCLE_MS = 3500;
const EXIT_MS = 900;

interface Props {
  /** Flip to true once the app's ready signal has resolved. Triggers
   *  the step-through exit. */
  ready: boolean;
  /** Fired after the exit animation completes; gate uses this to
   *  unmount the splash. */
  onDone: () => void;
}

/**
 * The Cold Boot splash. Renders the unified Mikayla mark + "ikayla"
 * wordmark on a clean navy canvas, with the same minimal flag-wave the
 * home-screen MMark uses. No halos, no shimmer washes — just the brand
 * mark breathing in place above the awakening status text.
 */
export function ColdBoot({ ready, onDone }: Props) {
  const [statusIdx, setStatusIdx] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (exiting) return;
    const id = window.setInterval(
      () => setStatusIdx((i) => (i + 1) % STATUS_MESSAGES.length),
      STATUS_INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, [exiting]);

  useEffect(() => {
    if (exiting) return;
    impact('light');
    const id = window.setInterval(() => impact('light'), WAVE_CYCLE_MS);
    return () => window.clearInterval(id);
  }, [exiting]);

  useEffect(() => {
    if (!ready || exiting) return;
    setExiting(true);
    const id = window.setTimeout(onDone, EXIT_MS);
    return () => window.clearTimeout(id);
  }, [ready, exiting, onDone]);

  return (
    <div
      role="status"
      aria-label="Awakening Mikayla"
      style={{
        position: 'fixed',
        inset: 0,
        background: tokens.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        opacity: exiting ? 0 : 1,
        transition: `opacity ${EXIT_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        pointerEvents: exiting ? 'none' : 'auto',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          transform: exiting ? 'scale(4)' : 'scale(1)',
          transition: `transform ${EXIT_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          willChange: 'transform',
          transformOrigin: 'center',
        }}
      >
        <LivingSignature />
      </div>

      <div
        style={{
          marginTop: 22,
          fontSize: 11,
          letterSpacing: '1.6px',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.92)',
          fontWeight: 700,
          minHeight: 14,
          fontFamily: "'Helvetica Neue', sans-serif",
          opacity: exiting ? 0 : 1,
          transition: `opacity ${Math.round(EXIT_MS * 0.5)}ms ease`,
        }}
      >
        <span
          key={statusIdx}
          style={{
            animation: `cb-status-fade ${STATUS_INTERVAL_MS}ms ease both`,
            display: 'inline-block',
          }}
        >
          {STATUS_MESSAGES[statusIdx]}
        </span>
      </div>

      <style jsx>{`
        @keyframes cb-status-fade {
          0%   { opacity: 0; transform: translateY(2px); }
          18%  { opacity: 1; transform: translateY(0); }
          82%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-2px); }
        }
      `}</style>
    </div>
  );
}

/**
 * Mikayla mark + "ikayla" wordmark as one SVG. The orb mirrors the
 * bottom-nav M Orb's exact layered structure (outer gold ring → navy
 * band → gold body with bold M and waveform strip), so the splash →
 * dashboard handoff lands on the same asset the user sees throughout
 * the app — just larger. The flag-wave filter is the same minimal
 * feTurbulence/feDisplacementMap pair used by MMark.
 */
function LivingSignature() {
  // Outer footprint of the orb. Sized to read at the dashboard scale
  // before the exit-zoom kicks in.
  const M_SIZE = 64;
  // SVG canvas sized tight to the (orb + gap + wordmark) group so that
  // the parent flex column (alignItems:'center') horizontally centers
  // the visual content, not a sparse 320×100 box. textLength below
  // forces "ikayla" to a known width, so the math stays predictable
  // across browsers.
  //
  // The gap is intentionally tighter than the older M_SIZE * 0.125
  // ratio so the "i" reads as a natural continuation of the M asset
  // (not a separate logo + word). 2px between the orb's outer gold
  // ring and the i is enough to keep them legible without divorcing.
  const WORD_GAP = 2;
  const WORD_TEXT_LENGTH = 115;
  const W = M_SIZE + WORD_GAP + WORD_TEXT_LENGTH + 14; // 14px symmetric pad
  const H = 72;
  const M_X = 7;
  const M_Y = 4;

  // Match renderOrbIcon's proportions (and therefore the bottom-nav
  // orb): outer gold ring, navy band, inner gold body.
  const RING_W = Math.max(2, Math.round(M_SIZE * 0.032));
  const BAND_W = Math.max(4, Math.round(M_SIZE * 0.058));
  const INNER_SIZE = M_SIZE - 2 * RING_W - 2 * BAND_W;
  const INNER_X = M_X + RING_W + BAND_W;
  const INNER_Y = M_Y + RING_W + BAND_W;
  const STRIP = Math.round(INNER_SIZE * 0.25);
  const M_AREA = INNER_SIZE - STRIP;

  // Architectural M monogram (path-based, single source of truth in
  // MMonogram.tsx). Sized to roughly match the previous Helvetica M's
  // cap-height presence; positioned with a small optical right-nudge
  // and upward lift to compensate for the strip's left-of-center
  // visual mass and the natural perceptual "sag" of bottom-anchored
  // glyphs.
  const GLYPH_SIZE = Math.round(M_AREA * 0.62); // ~24 at M_SIZE=64
  const GLYPH_X =
    INNER_X +
    (INNER_SIZE - GLYPH_SIZE) / 2 +
    Math.max(0.5, +(INNER_SIZE * 0.02).toFixed(2));
  const GLYPH_Y =
    INNER_Y +
    (M_AREA - GLYPH_SIZE) / 2 -
    Math.max(0.5, +(M_AREA * 0.04).toFixed(2));
  const GLYPH_CAP_MID = GLYPH_Y + GLYPH_SIZE / 2;

  const OUTER_RX = Math.round(M_SIZE * 0.26);
  const MIDDLE_RX = Math.max(0, OUTER_RX - RING_W);
  const INNER_RX = Math.max(0, MIDDLE_RX - BAND_W);

  const WORD_X = M_X + M_SIZE + WORD_GAP;
  const WORD_FONT = Math.round(M_SIZE * 0.625); // 40 at M_SIZE=64
  // Optical alignment: the wordmark's x-height middle (~0.25·fontSize
  // above its baseline) aligns with the monogram's vertical mid so the
  // pair reads as one continuous typographic line.
  const WORD_Y = GLYPH_CAP_MID + Math.round(WORD_FONT * 0.25);

  const heights = [3, 6, 9, 5, 8, 4];
  const barW = Math.max(1.4, INNER_SIZE * 0.03);
  const gap = Math.max(1.4, INNER_SIZE * 0.027);
  const totalW = heights.length * barW + (heights.length - 1) * gap;
  const stripStartX = INNER_X + (INNER_SIZE - totalW) / 2;
  const stripBaseY = INNER_Y + INNER_SIZE - Math.round(STRIP / 2);

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ overflow: 'visible' }}
      aria-label="Mikayla"
    >
      <defs>
        {/* Same minimal flag-wave as MMark's `waving` mode — soft
            in-place breathing ripple at small amplitude. */}
        <filter
          id="cb-wave"
          x="-10%"
          y="-20%"
          width="120%"
          height="140%"
          filterUnits="objectBoundingBox"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.022 0.060"
            numOctaves="2"
            seed="5"
            stitchTiles="stitch"
            result="turb"
          >
            <animate
              attributeName="baseFrequency"
              dur="3.5s"
              values="0.018 0.060; 0.030 0.048; 0.018 0.060"
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
            <animate
              attributeName="scale"
              dur="3.5s"
              values="0; 1.6; 0.5; 2; 0"
              keyTimes="0; 0.28; 0.5; 0.72; 1"
              calcMode="spline"
              keySplines="0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95"
              repeatCount="indefinite"
            />
          </feDisplacementMap>
        </filter>
      </defs>

      <g filter="url(#cb-wave)">
        {/* Outer gold ring */}
        <rect
          x={M_X}
          y={M_Y}
          width={M_SIZE}
          height={M_SIZE}
          rx={OUTER_RX}
          fill={tokens.gold}
        />
        {/* Navy band */}
        <rect
          x={M_X + RING_W}
          y={M_Y + RING_W}
          width={M_SIZE - 2 * RING_W}
          height={M_SIZE - 2 * RING_W}
          rx={MIDDLE_RX}
          fill={tokens.bg}
        />
        {/* Inner gold body */}
        <rect
          x={INNER_X}
          y={INNER_Y}
          width={INNER_SIZE}
          height={INNER_SIZE}
          rx={INNER_RX}
          fill={tokens.gold}
        />
        {/* Architectural M monogram on the gold body. */}
        <g
          transform={`translate(${GLYPH_X}, ${GLYPH_Y}) scale(${GLYPH_SIZE / 100})`}
        >
          <path d={M_MONOGRAM_PATH} fill="#000" />
        </g>
        {/* Waveform strip — clipped to the inner body's bottom corners
            via overlapping rect on top of the gold inner. */}
        <rect
          x={INNER_X}
          y={INNER_Y + M_AREA}
          width={INNER_SIZE}
          height={STRIP}
          fill={tokens.bg}
        />
        {heights.map((h, i) => {
          const scaledH = Math.max(2, Math.round((h / 9) * (STRIP - 2)));
          const x = stripStartX + i * (barW + gap);
          const y = stripBaseY - scaledH / 2;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={scaledH}
              rx={0.6}
              fill={tokens.gold}
            />
          );
        })}

        <text
          x={WORD_X}
          y={WORD_Y}
          fontFamily="'Helvetica Neue', sans-serif"
          fontSize={WORD_FONT}
          fontWeight={800}
          letterSpacing="0.6"
          textLength={WORD_TEXT_LENGTH}
          lengthAdjust="spacingAndGlyphs"
          fill={tokens.gold}
        >
          ikayla
        </text>
      </g>
    </svg>
  );
}

export default ColdBoot;
