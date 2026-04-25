'use client';

import { useId } from 'react';

interface HeavySilkOrbProps {
  size?: number;
  color?: string;
  active?: boolean;
}

/**
 * Inert "heavy silk" undulating orb. Same physics family as the MOrb hold-state
 * flag-wave (4s feTurbulence + animated baseFrequency + displacement bursts)
 * but applied to a circular gradient disc instead of an "M" glyph.
 *
 * Phase A: lives as a reusable component, ready for Phase C ("Active Bloom"
 * voice integration) to render it behind the AvatarActionSheet while STT is
 * capturing. Pass `active` from the long-hold gesture in Phase C.
 */
export function HeavySilkOrb({
  size = 200,
  color = '#C4A050',
  active = false,
}: HeavySilkOrbProps) {
  const id = useId();
  const filterId = `silk-${id}`;
  const gradId = `silk-grad-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.55" />
          <stop offset="45%" stopColor={color} stopOpacity="0.22" />
          <stop offset="80%" stopColor={color} stopOpacity="0.05" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        {active && (
          <filter
            id={filterId}
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
            filterUnits="objectBoundingBox"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.020 0.072"
              numOctaves="2"
              seed="7"
              stitchTiles="stitch"
              result="turb"
            >
              <animate
                attributeName="baseFrequency"
                dur="4s"
                values="0.020 0.072; 0.034 0.058; 0.020 0.072"
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
                dur="4s"
                values="0; 6; 2; 7; 0"
                keyTimes="0; 0.28; 0.5; 0.78; 1"
                calcMode="spline"
                keySplines="0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95"
                repeatCount="indefinite"
              />
            </feDisplacementMap>
          </filter>
        )}
      </defs>
      <circle
        cx="100"
        cy="100"
        r="90"
        fill={`url(#${gradId})`}
        filter={active ? `url(#${filterId})` : undefined}
      />
    </svg>
  );
}

export default HeavySilkOrb;
