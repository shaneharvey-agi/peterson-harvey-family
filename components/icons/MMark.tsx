'use client';

import { tokens } from '@/lib/design-tokens';

interface Props {
  /** Outer height in px. Width = height * (32/34). Default 32. */
  size?: number;
  /** When true, the M does the same flag-wave used in the chat header. */
  waving?: boolean;
}

const BAR_HEIGHTS = [3, 5, 7, 4, 6, 3];
const BAR_DELAYS = ['0s', '0.1s', '0.2s', '0.15s', '0.05s', '0.25s'];

/**
 * Unified brand mark — a header-sized version of the bottom-nav MOrb's
 * visual treatment (gold square, bold black "M", waveform strip, gold
 * outline). Visual only: no hold gestures, no portals, no haptics. Pair
 * with the "ikayla" wordmark to compose the unified header logo.
 */
export function MMark({ size = 32, waving = false }: Props) {
  const height = size;
  const width = Math.round(size * (32 / 34));
  const stripHeight = Math.max(7, Math.round(height * 0.24));
  const mFontSize = Math.round(height * 0.62);
  const mTextY = Math.round((height - stripHeight) * 0.78);
  const filterId = `mmark-wave-${size}`;

  return (
    <span
      aria-hidden="true"
      className="relative flex flex-col items-center justify-start overflow-hidden"
      style={{
        width,
        height,
        borderRadius: Math.round(height * 0.22),
        background: tokens.gold,
        border: `0.5px solid ${tokens.gold}`,
        boxShadow: `0 0 0 0.5px ${tokens.gold}, 0 1px 4px rgba(196,160,80,0.30)`,
        flexShrink: 0,
      }}
    >
      <svg
        width={width}
        height={height - stripHeight}
        viewBox={`0 0 ${width} ${height - stripHeight}`}
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          {waving && (
            <filter
              id={filterId}
              x="-20%"
              y="-25%"
              width="140%"
              height="150%"
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
                  values="0; 1.0; 0.3; 1.2; 0"
                  keyTimes="0; 0.28; 0.5; 0.78; 1"
                  calcMode="spline"
                  keySplines="0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95"
                  repeatCount="indefinite"
                />
              </feDisplacementMap>
            </filter>
          )}
        </defs>
        <text
          x={width / 2}
          y={mTextY}
          textAnchor="middle"
          fontFamily="'Helvetica Neue', sans-serif"
          fontSize={mFontSize}
          fontWeight={800}
          fill="#000"
          filter={waving ? `url(#${filterId})` : undefined}
        >
          M
        </text>
      </svg>

      {/* Waveform strip — same gold-on-navy treatment as the bottom MOrb. */}
      <span
        className="absolute left-0 right-0 bottom-0 flex items-center justify-center"
        style={{
          height: stripHeight,
          background: tokens.bg,
          gap: 1.2,
        }}
      >
        {BAR_HEIGHTS.map((h, i) => {
          const scaledH = Math.max(2, Math.round((h / 9) * (stripHeight - 2)));
          return (
            <span
              key={i}
              className={waving ? 'waveform-bar' : ''}
              style={{
                width: 1.2,
                height: scaledH,
                background: tokens.gold,
                borderRadius: 0.5,
                animationDelay: BAR_DELAYS[i],
                animationPlayState: waving ? 'running' : 'paused',
              }}
            />
          );
        })}
      </span>
    </span>
  );
}

export default MMark;
