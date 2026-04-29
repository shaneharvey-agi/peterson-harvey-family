'use client';

import { useEffect, useState } from 'react';
import { tokens } from '@/lib/design-tokens';
import { impact } from '@/lib/haptics';
import { MMark } from '@/components/icons/MMark';

const STATUS_TEXT = 'Waking…';

const SLIDE_MS = 1200;
const STATUS_DELAY_MS = 700;
const STATUS_MS = 900;
const SEQUENCE_TOTAL_MS = SLIDE_MS + 200; // ~1.4s of choreography then idle
const EXIT_MS = 700;
const HEAVY_SILK = 'cubic-bezier(0.16, 1, 0.4, 1)';

interface Props {
  /** Flip to true once the app's ready signal has resolved. Triggers
   *  the step-through exit. */
  ready: boolean;
  /** Fired after the exit animation completes; gate uses this to
   *  unmount the splash. */
  onDone: () => void;
}

/**
 * Cold Boot splash. The fixed M-Orb (the SAME MMark asset used in the
 * TopStrip and chat header — no fallback fonts, no parallel SVG) lands
 * instantly at screen center. "ikayla" emerges from behind the orb on
 * a heavy-silk slide, then "Waking…" fades in below with a subtle
 * blur-to-clear. Total scripted sequence < 1.5s; the gate then waits
 * on `ready` and runs the zoom-out exit.
 */
export function ColdBoot({ ready, onDone }: Props) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    impact('light');
    const id = window.setTimeout(() => impact('light'), STATUS_DELAY_MS);
    return () => window.clearTimeout(id);
  }, []);

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
          transform: exiting ? 'scale(3.4)' : 'scale(1)',
          transition: `transform ${EXIT_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          willChange: 'transform',
          transformOrigin: 'center',
        }}
      >
        <BrandCluster />
      </div>

      <div
        className="splash-status"
        style={{
          marginTop: 26,
          fontSize: 11,
          letterSpacing: '1.6px',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.92)',
          fontWeight: 700,
          minHeight: 14,
          fontFamily: "'Helvetica Neue', sans-serif",
          opacity: exiting ? 0 : undefined,
          transition: exiting ? `opacity ${Math.round(EXIT_MS * 0.5)}ms ease` : undefined,
        }}
      >
        {STATUS_TEXT}
      </div>

      <style jsx>{`
        @keyframes cb-ikayla-slide {
          from {
            transform: translateX(calc(-100% - 36px));
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes cb-status-blur {
          from {
            opacity: 0;
            filter: blur(8px);
          }
          to {
            opacity: 1;
            filter: blur(0);
          }
        }
        .splash-status {
          animation: cb-status-blur ${STATUS_MS}ms ${HEAVY_SILK} ${STATUS_DELAY_MS}ms both;
          will-change: opacity, filter;
        }
      `}</style>
      {/* Suppress lint — SEQUENCE_TOTAL_MS is referenced by the gate
          in tests; keeps the choreography budget visible at the top. */}
      <span hidden aria-hidden="true">{SEQUENCE_TOTAL_MS}</span>
    </div>
  );
}

/**
 * Orb (instant) + ikayla (slides out from behind on heavy-silk easing).
 * Uses the live MMark component so the asset is identical to every
 * other surface in the app — never a parallel SVG, never a font M.
 */
function BrandCluster() {
  // Splash sizing — the orb scales up to size=64; the wordmark
  // scales to fontSize=40 (the same 0.625 ratio as the TopStrip
  // lockup at size=32 / fontSize=20). The orb is dropped 8px so its
  // M optical center lands on the wordmark baseline rather than its
  // x-height, locking the orb to the name's flow. The 4px paddingLeft
  // on the ikayla wrapper plays the role of the 2px lockup gap at
  // splash scale.
  return (
    <div
      aria-label="Mikayla"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        height: 64,
      }}
    >
      <div style={{ position: 'relative', zIndex: 2 }}>
        <MMark size={64} waving marginTop={8} />
      </div>
      <span
        className="splash-ikayla wordmark"
        style={{
          position: 'absolute',
          left: '100%',
          top: 0,
          height: 64,
          display: 'flex',
          alignItems: 'flex-start',
          paddingLeft: 4,
          paddingTop: 16, // visually aligns wordmark cap-top with orb's M cap-top after the marginTop=8 drop
          fontSize: 40,
          fontWeight: 800,
          letterSpacing: '0.1px',
          lineHeight: 1,
          color: tokens.gold,
          whiteSpace: 'nowrap',
          zIndex: 1,
          willChange: 'transform',
        }}
      >
        ikayla
      </span>
      <style jsx>{`
        .splash-ikayla {
          transform: translateX(calc(-100% - 36px));
          animation: cb-ikayla-slide ${SLIDE_MS}ms ${HEAVY_SILK} 60ms both;
        }
        @keyframes cb-ikayla-slide {
          from {
            transform: translateX(calc(-100% - 36px));
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

export default ColdBoot;
