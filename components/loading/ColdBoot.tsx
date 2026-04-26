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
const WAVE_CYCLE_MS = 4000;
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
 * The Cold Boot splash — the user's first touchpoint with the brand.
 * Renders the unified Mikayla mark + "ikayla" wordmark as one SVG so a
 * single feTurbulence/feDisplacementMap silk-wave filter and a single
 * path-shimmer mask travel across the entire signature.
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
        aria-hidden
        style={{
          position: 'absolute',
          width: 520,
          height: 520,
          borderRadius: '50%',
          background:
            'radial-gradient(closest-side, rgba(196,160,80,0.18), rgba(196,160,80,0.06) 50%, rgba(196,160,80,0) 75%)',
          filter: 'blur(8px)',
          pointerEvents: 'none',
          opacity: exiting ? 0 : 1,
          transition: `opacity ${EXIT_MS}ms ease`,
        }}
      />

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
          color: 'rgba(255,255,255,0.55)',
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
 * The full Mikayla logo — gold M monogram + "ikayla" wordmark — rendered
 * as a single SVG so the silk-wave filter and shimmer mask treat the
 * signature as one cohesive piece of fabric.
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
  const WORD_Y = M_Y + M_SIZE - 7;
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
        <filter
          id="cb-wave"
          x="-15%"
          y="-30%"
          width="130%"
          height="160%"
          filterUnits="objectBoundingBox"
        >
          {/* Static fractal noise — feOffset will scroll it L→R so the
              wave actually travels across the fabric instead of just
              breathing in place. */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.014 0.055"
            numOctaves="2"
            seed="7"
            stitchTiles="stitch"
            result="silk"
          />
          {/* Scrolls the noise sample window from far-left to far-right
              over 4s. Each source pixel reads displacement from a noise
              location that drifts rightward, so the crests of the wave
              physically travel L→R across the logo. */}
          <feOffset in="silk" dx="0" dy="0" result="silkScroll">
            <animate
              attributeName="dx"
              dur="4s"
              values="-90; 90"
              keyTimes="0; 1"
              calcMode="linear"
              repeatCount="indefinite"
            />
          </feOffset>
          <feDisplacementMap
            in="SourceGraphic"
            in2="silkScroll"
            scale="6"
            xChannelSelector="R"
            yChannelSelector="G"
          >
            <animate
              attributeName="scale"
              dur="4s"
              values="5; 7; 5; 7; 5"
              keyTimes="0; 0.25; 0.5; 0.75; 1"
              calcMode="spline"
              keySplines="0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95"
              repeatCount="indefinite"
            />
          </feDisplacementMap>
        </filter>

        {/* Path shimmer — narrower, brighter highlight band that travels
            L→R. Sharper stripe reads as a true reflection sliding
            across gold silk rather than a soft wash. */}
        <linearGradient id="cb-shimmer" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="0.46" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="0.49" stopColor="#FFF8E1" stopOpacity="0.85" />
          <stop offset="0.50" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="0.51" stopColor="#FFF8E1" stopOpacity="0.85" />
          <stop offset="0.54" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          <animateTransform
            attributeName="gradientTransform"
            type="translate"
            values="-1 0; 1 0; 1 0"
            keyTimes="0; 0.7; 1"
            dur="4s"
            calcMode="spline"
            keySplines="0.4 0.05 0.5 1; 0 0 1 1"
            repeatCount="indefinite"
          />
        </linearGradient>

        <mask
          id="cb-shimmerMask"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width={W}
          height={H}
        >
          <rect x="0" y="0" width={W} height={H} fill="url(#cb-shimmer)" />
        </mask>
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
          letterSpacing="-0.4"
          fill={tokens.gold}
        >
          ikayla
        </text>

        <g
          mask="url(#cb-shimmerMask)"
          style={{ mixBlendMode: 'screen' }}
        >
          <text
            x={M_X + M_SIZE / 2}
            y={M_Y + M_TEXT_Y}
            textAnchor="middle"
            fontFamily="'Helvetica Neue', sans-serif"
            fontSize={M_FONT}
            fontWeight={800}
            fill="#FFE9B0"
          >
            M
          </text>
          {heights.map((h, i) => {
            const scaledH = Math.max(2, Math.round((h / 9) * (STRIP - 2)));
            const x = stripStartX + i * (barW + gap);
            const y = stripBaseY - scaledH;
            return (
              <rect
                key={`sh-${i}`}
                x={x}
                y={y}
                width={barW}
                height={scaledH}
                fill="#FFFFFF"
              />
            );
          })}
          <rect
            x={M_X}
            y={M_Y}
            width={M_SIZE}
            height={M_SIZE}
            rx={RX}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1"
          />
          <text
            x={WORD_X}
            y={WORD_Y}
            fontFamily="'Helvetica Neue', sans-serif"
            fontSize={WORD_FONT}
            fontWeight={800}
            letterSpacing="-0.4"
            fill="#FFFFFF"
          >
            ikayla
          </text>
        </g>
      </g>
    </svg>
  );
}

export default ColdBoot;
