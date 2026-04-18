'use client';

import type { WeatherCondition } from '@/lib/weather';

interface Props {
  temp: number | null;
  condition: WeatherCondition | null;
}

/**
 * 40x40 sun icon with bright yellow radial gradient, 12 animated rays
 * (alternating long/short), soft halo glow, highlight hotspot, and a
 * brand-blue temperature overlay. Conditional cloud/rain/snow overlays
 * sit on the lower-right.
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
          <radialGradient id="wbSun" cx="38%" cy="32%" r="62%">
            <stop offset="0%" stopColor="#FFFDE4" />
            <stop offset="30%" stopColor="#FFF176" />
            <stop offset="65%" stopColor="#FFD52E" />
            <stop offset="100%" stopColor="#E6A800" />
          </radialGradient>
          <radialGradient id="wbHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFE066" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#FFD52E" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#FFD52E" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Soft halo glow */}
        <circle cx="20" cy="20" r="18" fill="url(#wbHalo)" />

        {/* Rays — 8 long (cardinal + ordinal) */}
        <g
          stroke="#FFD52E"
          strokeWidth="1.8"
          strokeLinecap="round"
          style={{ animation: 'wbRayPulse 2.8s ease-in-out infinite', transformOrigin: '20px 20px' }}
        >
          <line x1="20" y1="1"  x2="20" y2="6" />
          <line x1="20" y1="34" x2="20" y2="39" />
          <line x1="1"  y1="20" x2="6"  y2="20" />
          <line x1="34" y1="20" x2="39" y2="20" />
          <line x1="5"  y1="5"  x2="9"  y2="9" />
          <line x1="31" y1="31" x2="35" y2="35" />
          <line x1="5"  y1="35" x2="9"  y2="31" />
          <line x1="31" y1="9"  x2="35" y2="5" />
        </g>

        {/* Rays — 4 short in-between (offset-phase pulse for twinkle) */}
        <g
          stroke="#FFE99A"
          strokeWidth="1.3"
          strokeLinecap="round"
          style={{ animation: 'wbRayPulseAlt 2.8s ease-in-out infinite', transformOrigin: '20px 20px' }}
        >
          <line x1="10" y1="2"  x2="12" y2="5" />
          <line x1="30" y1="2"  x2="28" y2="5" />
          <line x1="10" y1="38" x2="12" y2="35" />
          <line x1="30" y1="38" x2="28" y2="35" />
        </g>

        {/* Sun body */}
        <circle cx="20" cy="20" r="11.5" fill="url(#wbSun)" />

        {/* Highlight hotspot */}
        <ellipse cx="16" cy="16" rx="4" ry="3" fill="#FFFDE4" opacity="0.7" />
      </svg>

      {/* Temperature overlay — brand blue with white halo for contrast */}
      <span
        style={{
          position: 'absolute',
          top: 9,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 12,
          fontWeight: 800,
          color: '#378ADD',
          textShadow:
            '0 0 2px rgba(255,255,255,0.9), 0 1px 1px rgba(255,255,255,0.8)',
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
          0%, 100% { box-shadow: 0 0 12px rgba(255, 213, 46, 0.55); }
          50%      { box-shadow: 0 0 18px rgba(255, 213, 46, 0.85); }
        }
        @keyframes wbRayPulse {
          0%, 100% { transform: scale(1);    opacity: 1;   }
          50%      { transform: scale(1.08); opacity: 0.9; }
        }
        @keyframes wbRayPulseAlt {
          0%, 100% { transform: scale(0.92); opacity: 0.7; }
          50%      { transform: scale(1.05); opacity: 1;   }
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
