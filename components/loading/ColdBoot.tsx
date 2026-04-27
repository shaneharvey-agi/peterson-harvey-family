'use client';

import { useEffect, useState } from 'react';
import { tokens } from '@/lib/design-tokens';
import { impact } from '@/lib/haptics';

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
          marginTop: 44,
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
 * Mikayla mark + "ikayla" wordmark as one SVG. The flag-wave filter is
 * the same minimal feTurbulence/feDisplacementMap pair used by the
 * home-screen MMark, so the cold boot reads as the same brand mark
 * the user sees throughout the app — just larger.
 */
function LivingSignature() {
  const M_SIZE = 64;
  const STRIP = Math.max(5, Math.round(M_SIZE * 0.24));
  const M_TEXT_Y = Math.round((M_SIZE - STRIP) * 0.78);
  const W = 320;
  const H = 100;
  const M_X = 18;
  const M_Y = (H - M_SIZE) / 2;
  const WORD_X = M_X + M_SIZE + 8;
  // Matches the home-screen brand cluster: cap-top of "ikayla" aligns
  // with the M's cap-top inside the gold square (the same flex-start +
  // marginTop:4 trick the TopStrip uses, just expressed via baseline
  // here since the wordmark is rendered as SVG <text>).
  const WORD_Y = M_Y + Math.round(M_SIZE * 0.74);
  const M_FONT = Math.round(M_SIZE * 0.62);
  const WORD_FONT = 50;
  const RX = Math.round(M_SIZE * 0.22);

  const heights = [3, 5, 7, 4, 6, 3];
  const barW = 1.6;
  const gap = 1.6;
  const totalW = heights.length * barW + (heights.length - 1) * gap;
  const stripStartX = M_X + (M_SIZE - totalW) / 2;
  const stripBaseY = M_Y + M_SIZE - 1;

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
        <rect
          x={M_X}
          y={M_Y}
          width={M_SIZE}
          height={M_SIZE}
          rx={RX}
          fill={tokens.gold}
        />
        <text
          x={M_X + M_SIZE / 2}
          y={M_Y + M_TEXT_Y}
          textAnchor="middle"
          fontFamily="'Helvetica Neue', sans-serif"
          fontSize={M_FONT}
          fontWeight={800}
          fill="#000"
        >
          M
        </text>
        <rect
          x={M_X}
          y={M_Y + M_SIZE - STRIP}
          width={M_SIZE}
          height={STRIP}
          fill={tokens.bg}
        />
        {heights.map((h, i) => {
          const scaledH = Math.max(2, Math.round((h / 9) * (STRIP - 2)));
          const x = stripStartX + i * (barW + gap);
          const y = stripBaseY - scaledH;
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
        {/* Inset black hairline — 1px inside the gold edge for visible
            depth. Reads as a recessed bevel on a metal plaque. */}
        <rect
          x={M_X + 1}
          y={M_Y + 1}
          width={M_SIZE - 2}
          height={M_SIZE - 2}
          rx={Math.max(0, RX - 1)}
          fill="none"
          stroke="rgba(0,0,0,0.55)"
          strokeWidth="0.6"
        />
        <rect
          x={M_X}
          y={M_Y}
          width={M_SIZE}
          height={M_SIZE}
          rx={RX}
          fill="none"
          stroke={tokens.gold}
          strokeWidth="0.5"
        />

        <text
          x={WORD_X}
          y={WORD_Y}
          fontFamily="'Helvetica Neue', sans-serif"
          fontSize={WORD_FONT}
          fontWeight={800}
          letterSpacing="0.6"
          fill={tokens.gold}
        >
          ikayla
        </text>
      </g>
    </svg>
  );
}

export default ColdBoot;
