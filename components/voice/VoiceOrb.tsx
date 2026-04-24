'use client';

import { useEffect, useRef } from 'react';
import { tokens } from '@/lib/design-tokens';
import { useMicLevel } from '@/lib/hooks/useMicLevel';
import { pulseHaptic } from '@/lib/haptics';

interface VoiceOrbProps {
  /** When true, the orb blooms into view and starts listening. */
  active: boolean;
  /** Label rendered below the orb — e.g. "Listening…" or "Ask Mikayla". */
  caption?: string;
}

/**
 * Fluid gold sphere that rises from the M button on press-and-hold.
 * Occupies the bottom 30% of the viewport and isolates the voice interaction
 * area with a heavy backdrop blur. Scale + ripple intensity track mic decibel.
 */
export function VoiceOrb({ active, caption = 'Listening…' }: VoiceOrbProps) {
  const level = useMicLevel(active);
  const lastPulseRef = useRef(0);

  // Mirror the AI's speaking rhythm: when level crosses a threshold, fire a
  // subtle tick haptic. Rate-limited so we don't hammer the vibrator.
  useEffect(() => {
    if (!active) return;
    const now = performance.now();
    if (level > 0.35 && now - lastPulseRef.current > 180) {
      lastPulseRef.current = now;
      pulseHaptic();
    }
  }, [active, level]);

  // Voice-reactive geometry. Keep multipliers modest so the motion reads as
  // natural breathing, not a hyperactive equalizer.
  const coreScale = active ? 1 + level * 0.18 : 0.18;
  const ring1Scale = active ? 1.18 + level * 0.32 : 0.22;
  const ring2Scale = active ? 1.42 + level * 0.55 : 0.22;
  const ring1Opacity = active ? 0.45 + level * 0.35 : 0;
  const ring2Opacity = active ? 0.22 + level * 0.3 : 0;
  const haloOpacity = active ? 0.55 + level * 0.4 : 0;

  return (
    <div
      aria-hidden={!active}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        pointerEvents: active ? 'auto' : 'none',
        opacity: active ? 1 : 0,
        transition: 'opacity 260ms ease-out',
      }}
    >
      {/* Aura — heavy blur behind the orb to isolate the voice area. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backdropFilter: 'blur(40px) saturate(1.15)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.15)',
          background:
            'radial-gradient(ellipse at 50% 100%, rgba(7,9,15,0.55) 0%, rgba(7,9,15,0.35) 55%, rgba(7,9,15,0.15) 100%)',
          transition: 'opacity 320ms ease-out',
        }}
      />

      {/* Bottom 30% stage */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '30vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 220,
            height: 220,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Outer halo — soft gold wash behind the sphere */}
          <div
            style={{
              position: 'absolute',
              width: 320,
              height: 320,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(196,160,80,${haloOpacity * 0.35}) 0%, rgba(196,160,80,0) 65%)`,
              filter: 'blur(8px)',
              transition: 'background 160ms linear',
              pointerEvents: 'none',
            }}
          />

          {/* Outer ripple ring */}
          <div
            style={{
              position: 'absolute',
              width: 180,
              height: 180,
              borderRadius: '50%',
              border: `1px solid rgba(196,160,80,${ring2Opacity})`,
              transform: `scale(${ring2Scale})`,
              transition:
                'transform 220ms cubic-bezier(0.2, 0.8, 0.3, 1), border-color 160ms linear',
              pointerEvents: 'none',
            }}
          />

          {/* Inner ripple ring */}
          <div
            style={{
              position: 'absolute',
              width: 180,
              height: 180,
              borderRadius: '50%',
              border: `1px solid rgba(196,160,80,${ring1Opacity})`,
              transform: `scale(${ring1Scale})`,
              transition:
                'transform 180ms cubic-bezier(0.2, 0.8, 0.3, 1), border-color 140ms linear',
              pointerEvents: 'none',
            }}
          />

          {/* Core fluid sphere */}
          <div
            style={{
              width: 168,
              height: 168,
              borderRadius: '50%',
              transform: active
                ? `scale(${coreScale})`
                : 'scale(0.14) translateY(130px)',
              transformOrigin: 'center',
              transition: active
                ? 'transform 160ms cubic-bezier(0.18, 1.1, 0.35, 1.05)'
                : 'transform 300ms cubic-bezier(0.4, 0, 0.9, 0.3)',
              background: `radial-gradient(circle at 35% 28%,
                rgba(250,232,180,0.98) 0%,
                rgba(230,198,118,0.95) 22%,
                ${tokens.gold} 52%,
                rgba(150,118,54,0.9) 100%)`,
              boxShadow: `
                0 0 64px rgba(196,160,80,${0.45 + level * 0.4}),
                0 0 120px rgba(196,160,80,${0.2 + level * 0.3}),
                inset -10px -18px 38px rgba(90,62,18,0.55),
                inset 8px 12px 28px rgba(255,240,200,0.4)
              `,
            }}
          />

          {/* Specular highlight — sells the "fluid" read */}
          <div
            style={{
              position: 'absolute',
              width: 44,
              height: 28,
              borderRadius: '50%',
              top: 42,
              left: 60,
              background:
                'radial-gradient(ellipse, rgba(255,250,230,0.85) 0%, rgba(255,250,230,0) 70%)',
              filter: 'blur(2px)',
              transform: `scale(${coreScale})`,
              transition: 'transform 160ms cubic-bezier(0.18, 1.1, 0.35, 1.05)',
              opacity: active ? 1 : 0,
              pointerEvents: 'none',
            }}
          />
        </div>

        <div
          style={{
            color: 'rgba(245, 225, 168, 0.85)',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: 1.8,
            textTransform: 'uppercase',
            opacity: active ? 1 : 0,
            transform: active ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 280ms ease-out 120ms, transform 280ms ease-out 120ms',
          }}
        >
          {caption}
        </div>
      </div>
    </div>
  );
}

export default VoiceOrb;
