'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { tokens } from '@/lib/design-tokens';
import { flutter, impact } from '@/lib/haptics';
import { handleIntent } from '@/lib/intent';

const HOLD_MS = 260;
const WAVE_CYCLE_MS = 4000;
const BAR_HEIGHTS = [3, 6, 9, 5, 8, 4];
const BAR_DELAYS = ['0s', '0.1s', '0.2s', '0.15s', '0.05s', '0.25s'];

export type MOrbAction = 'message' | 'voice';

interface MOrbProps {
  /** Override the dual-input behavior. Defaults to routing tap → /chat/mikayla
   *  and routing voice via handleIntent(). */
  onAction?: (kind: MOrbAction) => void;
}

export function MOrb({ onAction }: MOrbProps = {}) {
  const router = useRouter();
  const [holding, setHolding] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heldRef = useRef(false);

  // Portal target only available after hydration.
  useEffect(() => setPortalReady(true), []);

  // Flutter loop synced to the wave cadence — kicks off the first flutter
  // after a brief delay so the medium-impact tap reads as a distinct beat,
  // then loops once per wave cycle (heavy-silk rustle).
  useEffect(() => {
    if (!holding) return;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const kickoff = setTimeout(() => {
      flutter();
      intervalId = setInterval(flutter, WAVE_CYCLE_MS);
    }, 380);
    return () => {
      clearTimeout(kickoff);
      if (intervalId) clearInterval(intervalId);
    };
  }, [holding]);

  const beginListen = useCallback(() => {
    heldRef.current = true;
    setHolding(true);
    impact('medium');
  }, []);

  const clearTimer = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const fireAction = useCallback(
    (kind: MOrbAction) => {
      if (onAction) {
        onAction(kind);
        return;
      }
      // Default behavior — tap routes to chat, voice runs the intent stub.
      if (kind === 'message') {
        router.push('/chat/mikayla');
      } else {
        const intent = handleIntent('');
        if (intent.route) router.push(intent.route);
      }
    },
    [onAction, router]
  );

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
        fireAction('voice');
      }
    },
    [fireAction]
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
    impact('light');
    fireAction('message');
  }, [fireAction]);

  // 20% dim overlay portaled to <body> so it sits below BottomNav (z-10) and
  // dims everything else without dimming the orb cluster itself.
  const dimOverlay =
    portalReady && holding
      ? createPortal(
          <div
            aria-hidden="true"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(7, 9, 15, 0.20)',
              pointerEvents: 'none',
              zIndex: 9,
              transition: 'opacity 240ms ease-out',
              opacity: 1,
            }}
          />,
          document.body
        )
      : null;

  return (
    <>
      {dimOverlay}

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
        {/* Gold Intent Orb — frosted disc behind the button with a 40px
            backdrop blur and a slow 2.4s gold pulse. Only mounted while
            holding so idle stays zero-cost and crisp. */}
        {holding && (
          <span
            aria-hidden="true"
            className="morb-halo-pulse"
            style={{
              position: 'absolute',
              top: -28,
              left: '50%',
              width: 132,
              height: 132,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(196,160,80,0.50) 0%, rgba(196,160,80,0.22) 45%, rgba(196,160,80,0.05) 75%, rgba(196,160,80,0) 100%)',
              backdropFilter: 'blur(40px) saturate(1.15)',
              WebkitBackdropFilter: 'blur(40px) saturate(1.15)',
              boxShadow: '0 0 28px rgba(196,160,80,0.35)',
              pointerEvents: 'none',
              transform: 'translateX(-50%) scale(0.92)',
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
              ? `0 0 0 1.5px ${tokens.gold}, 0 16px 40px rgba(196,160,80,0.55), 0 8px 18px rgba(0,0,0,0.45)`
              : `0 0 0 1.5px ${tokens.gold}, 0 4px 12px rgba(196,160,80,0.30)`,
            // Physical elevation = scale 1.1× per spec. Spring-eased.
            transform: holding ? 'scale(1.1)' : 'scale(1)',
            transformOrigin: 'center',
            transition:
              'transform 260ms cubic-bezier(0.2, 0.9, 0.3, 1.05), box-shadow 260ms ease-out',
            touchAction: 'manipulation',
            WebkitUserSelect: 'none',
            userSelect: 'none',
            zIndex: 1,
          }}
        >
          {/* Bold M as inline SVG <text> so the flag-wave filter can apply.
              Sine-wave-flavored displacement via feTurbulence + animated
              baseFrequency (stitched), tuned slow + gentle for "heavy silk
              in a light breeze." */}
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
                  x="-20%"
                  y="-25%"
                  width="140%"
                  height="150%"
                  filterUnits="objectBoundingBox"
                >
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.026 0.072"
                    numOctaves="2"
                    seed="3"
                    stitchTiles="stitch"
                    result="turb"
                  >
                    {/* Drift the noise field slowly L→R by oscillating the
                        x-component of baseFrequency — the visible ripple
                        appears to travel through the M. */}
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
                    {/* Two amplitude peaks per 4s cycle, asymmetric, eased
                        with cubic-bezier so it reads as wind gusting through
                        silk rather than a sine pulse. */}
                    <animate
                      attributeName="scale"
                      dur="4s"
                      values="0; 1.4; 0.5; 1.6; 0"
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

          {/* Bottom strip — cross-fades from the waveform bars (idle, the
              "speak to Mikayla" affordance) to the "Mikayla" wordmark
              (listening, identity confirmation). */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{ height: 14, background: tokens.bg }}
          >
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
    </>
  );
}

export default MOrb;
