'use client';

import { useEffect, useState } from 'react';
import { tokens } from '@/lib/design-tokens';
import { impact } from '@/lib/haptics';
import { MMark } from '@/components/icons/MMark';

const STATUS_TEXT = 'Waking…';

// Choreography budget — slow heavy-silk reveal, then idle until `ready`.
const SLIDE_MS = 1200;
const SLIDE_DELAY_MS = 200;
const STATUS_DELAY_MS = 720;
const STATUS_MS = 900;
const EXIT_MS = 700;
// "Heavy Silk" — slow ease-out the wordmark settles into; same curve as
// the M Orb's flag-wave so the brand language stays coherent across
// surfaces.
const HEAVY_SILK = 'cubic-bezier(0.16, 1, 0.4, 1)';
const EXIT_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

interface Props {
  /** Flip to true once the app's ready signal has resolved. Triggers
   *  the step-through exit. */
  ready: boolean;
  /** Fired after the exit animation completes; gate uses this to
   *  unmount the splash. */
  onDone: () => void;
}

/**
 * Cold Boot splash. The M-Orb (the SAME MMark asset used in the
 * TopStrip and chat header — never a parallel SVG, never a font M)
 * lands at screen center at static scale 1.0. The "ikayla" wordmark
 * emerges from behind the orb on a heavy-silk horizontal slide, then
 * "Waking…" fades in below. There is no swap, no re-mount: the orb
 * is a single continuous element from first paint through the exit
 * zoom-out. When `ready` flips, the whole cluster zooms out softly to
 * hand off to the live app.
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
        transition: `opacity ${EXIT_MS}ms ${EXIT_EASE}`,
        pointerEvents: exiting ? 'none' : 'auto',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        overflow: 'hidden',
      }}
    >
      {/* Cluster zoom-out only fires on exit; entry holds the orb at
          static scale 1.0 so the M lands like a stamped seal. */}
      <div
        style={{
          transform: exiting ? 'scale(3.4)' : 'scale(1)',
          transition: `transform ${EXIT_MS}ms ${EXIT_EASE}`,
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
    </div>
  );
}

/**
 * One continuous element: the orb sits at the cluster's left edge,
 * pinned at scale 1.0, while "ikayla" — absolutely positioned at
 * left:100% (i.e. flush right of the orb) and z-indexed below the orb —
 * starts translated fully behind the orb and slides right on heavy
 * silk, emerging cleanly from behind the M. No remount, no opacity
 * fade-in for the orb; it is the same node from first paint through
 * exit.
 */
function BrandCluster() {
  // Splash sizing — orb at size=64; wordmark at fontSize=40 (the same
  // 0.625 ratio as the TopStrip lockup at size=32 / fontSize=20).
  // marginTop=11 on the orb + paddingTop=16 on the wordmark land the
  // M's bottom edge on the wordmark baseline (≈ fontSize * 0.78 from
  // wordmark top), so the orb and "ikayla" sit on a single shelf
  // rather than the orb floating above the lowercase x-line.
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
        <MMark size={64} waving marginTop={11} />
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
          paddingTop: 16,
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
          /* Start fully tucked behind the orb — translateX(-100%) lifts
             the wordmark's left edge to the cluster's left edge (where
             the orb sits), so the M completely covers it. The slide
             reveal then settles it back to translateX(0). */
          transform: translateX(-100%);
          animation: cb-ikayla-slide ${SLIDE_MS}ms ${HEAVY_SILK}
            ${SLIDE_DELAY_MS}ms both;
        }
        @keyframes cb-ikayla-slide {
          from {
            transform: translateX(-100%);
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
