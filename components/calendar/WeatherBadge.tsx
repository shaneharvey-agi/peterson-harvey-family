'use client';

import type { WeatherCondition } from '@/lib/weather';

interface Props {
  temp: number | null;
  condition: WeatherCondition | null;
}

/**
 * 30x30 gold sun badge with temperature inside.
 * Conditional overlays:
 *   clear  - none
 *   cloudy - drifting 3-ellipse cloud
 *   rainy  - cloud + raindrops
 *   snowy  - cloud + snowflakes
 */
export function WeatherBadge({ temp, condition }: Props) {
  const displayTemp = temp == null ? '--' : `${temp}`;
  const cond = condition ?? 'clear';

  return (
    <div
      className="weather-badge"
      aria-label={`${displayTemp} degrees, ${cond}`}
      style={{
        position: 'relative',
        width: 30,
        height: 30,
        borderRadius: '50%',
        background:
          'radial-gradient(circle at 35% 30%, #E8C574 0%, #C4A050 60%, #8C7338 100%)',
        boxShadow: '0 0 10px rgba(196,160,80,0.55)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        animation: 'wbSunGlow 3.5s ease-in-out infinite',
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: '#07090F',
          lineHeight: 1,
          letterSpacing: '-0.2px',
        }}
      >
        {displayTemp}
      </span>

      {cond !== 'clear' && <CloudOverlay />}
      {cond === 'rainy' && <RainOverlay />}
      {cond === 'snowy' && <SnowOverlay />}

      <style jsx>{`
        @keyframes wbSunGlow {
          0%,
          100% {
            box-shadow: 0 0 10px rgba(196, 160, 80, 0.55);
          }
          50% {
            box-shadow: 0 0 14px rgba(196, 160, 80, 0.8);
          }
        }
        @keyframes wbCloudDrift {
          0%,
          100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(3px);
          }
        }
        @keyframes wbRainFall {
          0% {
            transform: translateY(-4px);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          100% {
            transform: translateY(10px);
            opacity: 0;
          }
        }
        @keyframes wbSnowFall {
          0% {
            transform: translateY(-3px);
            opacity: 0;
          }
          30% {
            opacity: 1;
          }
          100% {
            transform: translateY(10px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

function CloudOverlay() {
  return (
    <svg
      width="24"
      height="14"
      viewBox="0 0 24 14"
      style={{
        position: 'absolute',
        top: 10,
        left: -4,
        pointerEvents: 'none',
        animation: 'wbCloudDrift 6s ease-in-out infinite',
      }}
      aria-hidden
    >
      <ellipse cx="8" cy="9" rx="6" ry="4" fill="#D8DDE5" />
      <ellipse cx="15" cy="7" rx="7" ry="4.5" fill="#E8ECF1" />
      <ellipse cx="19" cy="10" rx="5" ry="3.5" fill="#C8CED7" />
    </svg>
  );
}

function RainOverlay() {
  return (
    <svg
      width="20"
      height="12"
      viewBox="0 0 20 12"
      style={{
        position: 'absolute',
        top: 20,
        left: 4,
        pointerEvents: 'none',
      }}
      aria-hidden
    >
      <line
        x1="4"
        y1="0"
        x2="3"
        y2="4"
        stroke="#6FB0E6"
        strokeWidth="1.2"
        strokeLinecap="round"
        style={{ animation: 'wbRainFall 1.1s linear infinite', animationDelay: '0s' }}
      />
      <line
        x1="10"
        y1="0"
        x2="9"
        y2="4"
        stroke="#6FB0E6"
        strokeWidth="1.2"
        strokeLinecap="round"
        style={{ animation: 'wbRainFall 1.1s linear infinite', animationDelay: '0.35s' }}
      />
      <line
        x1="15"
        y1="0"
        x2="14"
        y2="4"
        stroke="#6FB0E6"
        strokeWidth="1.2"
        strokeLinecap="round"
        style={{ animation: 'wbRainFall 1.1s linear infinite', animationDelay: '0.7s' }}
      />
    </svg>
  );
}

function SnowOverlay() {
  return (
    <svg
      width="20"
      height="12"
      viewBox="0 0 20 12"
      style={{
        position: 'absolute',
        top: 20,
        left: 4,
        pointerEvents: 'none',
      }}
      aria-hidden
    >
      <circle
        cx="4"
        cy="2"
        r="1.1"
        fill="#F3F7FC"
        style={{ animation: 'wbSnowFall 1.6s linear infinite', animationDelay: '0s' }}
      />
      <circle
        cx="10"
        cy="2"
        r="1.1"
        fill="#F3F7FC"
        style={{ animation: 'wbSnowFall 1.6s linear infinite', animationDelay: '0.55s' }}
      />
      <circle
        cx="15"
        cy="2"
        r="1.1"
        fill="#F3F7FC"
        style={{ animation: 'wbSnowFall 1.6s linear infinite', animationDelay: '1.1s' }}
      />
    </svg>
  );
}
