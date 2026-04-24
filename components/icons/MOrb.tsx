'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { tokens } from '@/lib/design-tokens';
import { flutter, tick as tickHaptic } from '@/lib/haptics';
import { handleIntent } from '@/lib/intent';

const HOLD_MS = 260;
const BAR_HEIGHTS = [3, 6, 9, 5, 8, 4];
const BAR_DELAYS = ['0s', '0.1s', '0.2s', '0.15s', '0.05s', '0.25s'];

export function MOrb() {
  const router = useRouter();
  const [holding, setHolding] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heldRef = useRef(false);

  const beginListen = useCallback(() => {
    heldRef.current = true;
    setHolding(true);
    tickHaptic();
    setTimeout(flutter, 50);
  }, []);

  const clearTimer = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture?.(e.pointerId);
      heldRef.current = false;
      clearTimer();
      holdTimer.current = setTimeout(beginListen, HOLD_MS);
    },
    [beginListen]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      try {
        e.currentTarget.releasePointerCapture?.(e.pointerId);
      } catch {
        /* already released */
      }
      clearTimer();
      if (heldRef.current) {
        setHolding(false);
        // Placeholder — wire to STT transcript when voice pipeline lands.
        const intent = handleIntent('');
        if (intent.route) router.push(intent.route);
      }
    },
    [router]
  );

  const onPointerCancel = useCallback(() => {
    clearTimer();
    if (heldRef.current) {
      heldRef.current = false;
      setHolding(false);
    }
  }, []);

  const handleClick = useCallback(() => {
    if (heldRef.current) return; // press-hold consumed the gesture
    router.push('/chat/mikayla');
  }, [router]);

  return (
    <div
      style={{
        position: 'relative',
        width: 56,
        height: 56,
        marginTop: -20,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
      }}
    >
      {/* Pulsing gold halo — only mounted while holding so the M button stays
          visually quiet at idle. The halo grows from behind/below the button. */}
      {holding && (
        <span
          aria-hidden="true"
          className="morb-halo-pulse"
          style={{
            position: 'absolute',
            top: -8,
            left: '50%',
            width: 96,
            height: 96,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(196,160,80,0.55) 0%, rgba(196,160,80,0.15) 50%, rgba(196,160,80,0) 75%)',
            filter: 'blur(6px)',
            pointerEvents: 'none',
            // initial transform set by the keyframe (translateX(-50%) scale(...))
            transform: 'translateX(-50%) scale(0.88)',
          }}
        />
      )}

      <button
        type="button"
        onClick={handleClick}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onContextMenu={(e) => e.preventDefault()}
        aria-label="Mikayla — tap to chat, hold to speak"
        className="relative flex flex-col items-center justify-start overflow-hidden p-0"
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: tokens.gold,
          border: `3px solid ${tokens.bg}`,
          boxShadow: holding
            ? `0 0 0 1.5px ${tokens.gold}, 0 10px 24px rgba(196,160,80,0.55), 0 4px 12px rgba(0,0,0,0.35)`
            : `0 0 0 1.5px ${tokens.gold}, 0 4px 12px rgba(196,160,80,0.30)`,
          // Elevate the badge when listening — lifts ~8px off the nav.
          transform: holding ? 'translateY(-8px)' : 'translateY(0)',
          transition:
            'transform 240ms cubic-bezier(0.2, 0.9, 0.3, 1.05), box-shadow 240ms ease-out',
          touchAction: 'manipulation',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
      >
        {/* Bold M — rendered as SVG <text> so we can apply the flag-wave
            filter on hold. Idle = sharp. Hold = waving. */}
        <svg
          width={32}
          height={36}
          viewBox="0 0 32 36"
          aria-hidden="true"
          style={{ marginTop: 4, display: 'block', overflow: 'visible' }}
        >
          <defs>
            {holding && (
              <filter
                id="morb-flag-wave"
                x="-15%"
                y="-25%"
                width="130%"
                height="150%"
                filterUnits="objectBoundingBox"
              >
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.04 0.09"
                  numOctaves="2"
                  seed="3"
                  stitchTiles="stitch"
                  result="turb"
                >
                  <animate
                    attributeName="baseFrequency"
                    dur="3s"
                    values="0.030 0.080; 0.046 0.060; 0.030 0.080"
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
                    dur="3s"
                    values="0; 1.8; 0.5; 2.0; 0"
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
            x="16"
            y="28"
            textAnchor="middle"
            fontFamily="'Helvetica Neue', sans-serif"
            fontSize="26"
            fontWeight={800}
            fill="#000"
            filter={holding ? 'url(#morb-flag-wave)' : undefined}
          >
            M
          </text>
        </svg>

        {/* Bottom strip — cross-fades from the waveform bars (idle) to the
            "Mikayla" wordmark (listening) so the strip doubles as identity
            confirmation while the user is speaking. */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: 14,
            background: tokens.bg,
            position: 'absolute',
          }}
        >
          {/* Waveform — visible at idle */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              gap: 1.5,
              opacity: holding ? 0 : 1,
              transition: 'opacity 200ms ease-out',
            }}
            aria-hidden="true"
          >
            {BAR_HEIGHTS.map((h, i) => (
              <span
                key={i}
                className={holding ? 'waveform-bar' : ''}
                style={{
                  width: 1.5,
                  height: h,
                  background: tokens.gold,
                  borderRadius: 0.5,
                  animationDelay: BAR_DELAYS[i],
                  animationPlayState: holding ? 'running' : 'paused',
                }}
              />
            ))}
          </div>

          {/* "Mikayla" wordmark — visible while listening, mirrors upper-left */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              opacity: holding ? 1 : 0,
              transition: 'opacity 220ms ease-out 80ms',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            <span
              className="wordmark"
              style={{
                fontSize: 8.5,
                fontWeight: 800,
                letterSpacing: 0.4,
                lineHeight: 1,
              }}
            >
              Mikayla
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}

export default MOrb;
