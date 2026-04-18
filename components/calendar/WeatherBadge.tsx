'use client';

import type { WeatherCondition } from '@/lib/weather';

interface Props {
  temp: number | null;
  condition: WeatherCondition | null;
}

/**
 * 40x40 sun icon with gold/amber radial gradient, 8 short rays,
 * temperature overlaid at the top of the sun, and conditional
 * cloud/rain/snow overlays on the lower-right.
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
        width: 40,
        height: 40,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        animation: 'wbCorona 3.5s ease-in-out infinite',
        borderRadius: '50%',
      }}
    >
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
        <defs>
          <radialGradient id="wbSun" cx="35%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#F5E1A8" />
            <stop offset="55%" stopColor="#E8C574" />
            <stop offset="100%" stopColor="#8C7338" />
          </radialGradient>
        </defs>
        {/* Rays */}
        <g stroke="#E8C574" strokeWidth="1.6" strokeLinecap="round">
          <line x1="20" y1="2"  x2="20" y2="6" />
          <line x1="20" y1="34" x2="20" y2="38" />
          <line x1="2"  y1="20" x2="6"  y2="20" />
          <line x1="34" y1="20" x2="38" y2="20" />
          <line x1="6"  y1="6"  x2="9"  y2="9" />
          <line x1="31" y1="31" x2="34" y2="34" />
          <line x1="6"  y1="34" x2="9"  y2="31" />
          <line x1="31" y1="9"  x2="34" y2="6" />
        </g>
        {/* Sun body */}
        <circle cx="20" cy="20" r="12" fill="url(#wbSun)" />
      </svg>

      {/* Temperature overlay — top of the sun, bold white with shadow */}
      <span
        style={{
          position: 'absolute',
          top: 9,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 12,
          fontWeight: 800,
          color: '#FFFFFF',
          textShadow: '0 1px 2px rgba(0,0,0,0.65)',
          lineHeight: 1,
          pointerEvents: 'none',
          letterSpacing: '-0.2px',
        }}
      >
        {displayTemp}
      </span>

      {cond !== 'clear' && <CloudOverlay />}
      {cond === 'rainy' && <RainOverlay />}
      {cond === 'snowy' && <SnowOverlay />}

      <style jsx>{`
        @keyframes wbCorona {
          0%, 100% { box-shadow: 0 0 10px rgba(196, 160, 80, 0.45); }
          50%      { box-shadow: 0 0 14px rgba(196, 160, 80, 0.65); }
        }
        @keyframes wbCloudDrift {
          0%, 100% { transform: translateX(0); }
          50%      { transform: translateX(2px); }
        }
        @keyframes wbRainFall {
          0%   { transform: translateY(-3px); opacity: 0; }
          30%  { opacity: 1; }
          100% { transform: translateY(8px); opacity: 0; }
        }
        @keyframes wbSnowFall {
          0%   { transform: translateY(-3px); opacity: 0; }
          30%  { opacity: 1; }
          100% { transform: translateY(8px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function CloudOverlay() {
  return (
    <svg
      width="22"
      height="12"
      viewBox="0 0 22 12"
      style={{
        position: 'absolute',
        bottom: 2,
        right: -4,
        pointerEvents: 'none',
        animation: 'wbCloudDrift 6s ease-in-out infinite',
      }}
      aria-hidden
    >
      <ellipse cx="7" cy="8" rx="5" ry="3.5" fill="#D8DDE5" />
      <ellipse cx="13" cy="6" rx="6" ry="4" fill="#E8ECF1" />
      <ellipse cx="17" cy="9" rx="4" ry="3" fill="#C8CED7" />
    </svg>
  );
}

function RainOverlay() {
  return (
    <svg
      width="16"
      height="10"
      viewBox="0 0 16 10"
      style={{
        position: 'absolute',
        bottom: -4,
        right: 0,
        pointerEvents: 'none',
      }}
      aria-hidden
    >
      <line x1="3" y1="0" x2="2" y2="4" stroke="#6FB0E6" strokeWidth="1.1" strokeLinecap="round"
        style={{ animation: 'wbRainFall 1.1s linear infinite', animationDelay: '0s' }} />
      <line x1="8" y1="0" x2="7" y2="4" stroke="#6FB0E6" strokeWidth="1.1" strokeLinecap="round"
        style={{ animation: 'wbRainFall 1.1s linear infinite', animationDelay: '0.35s' }} />
      <line x1="13" y1="0" x2="12" y2="4" stroke="#6FB0E6" strokeWidth="1.1" strokeLinecap="round"
        style={{ animation: 'wbRainFall 1.1s linear infinite', animationDelay: '0.7s' }} />
    </svg>
  );
}

function SnowOverlay() {
  return (
    <svg
      width="16"
      height="10"
      viewBox="0 0 16 10"
      style={{
        position: 'absolute',
        bottom: -4,
        right: 0,
        pointerEvents: 'none',
      }}
      aria-hidden
    >
      <circle cx="3" cy="2" r="1" fill="#F3F7FC"
        style={{ animation: 'wbSnowFall 1.6s linear infinite', animationDelay: '0s' }} />
      <circle cx="8" cy="2" r="1" fill="#F3F7FC"
        style={{ animation: 'wbSnowFall 1.6s linear infinite', animationDelay: '0.55s' }} />
      <circle cx="13" cy="2" r="1" fill="#F3F7FC"
        style={{ animation: 'wbSnowFall 1.6s linear infinite', animationDelay: '1.1s' }} />
    </svg>
  );
}
