'use client';

import { useEffect, useRef, useState } from 'react';
import { tokens } from '@/lib/design-tokens';
import { MonolineM } from '@/components/icons/MonolineM';
import { useMicLevel } from '@/lib/hooks/useMicLevel';
import { pulseHaptic } from '@/lib/haptics';

interface VoiceOrbProps {
  /** When true, the orb is bloomed and listening to mic input. */
  active: boolean;
  /** The user just released — play the M confirm pulse. */
  confirming?: boolean;
  /** AI is processing a request — slow the breathing glow. */
  thinking?: boolean;
  /** Caption beneath the orb. */
  caption?: string;
}

/**
 * Branded voice orb. A fluid gold sphere blooms from the M button on press,
 * with the monoline M held sharp and static in its center (80% opacity). The
 * two ripple rings originate from behind the glyph so the M reads as the
 * source of the energy. A 0.5px inner gold stroke gives the sphere a
 * glass-marble edge. A breathing radial glow sits behind the M and slows
 * when `thinking` is true.
 */
export function VoiceOrb({
  active,
  confirming = false,
  thinking = false,
  caption = 'Listening',
}: VoiceOrbProps) {
  const level = useMicLevel(active);
  const lastPulseRef = useRef(0);

  // Mirror the speaker's rhythm with subtle pulse haptics, rate-limited.
  useEffect(() => {
    if (!active) return;
    const now = performance.now();
    if (level > 0.35 && now - lastPulseRef.current > 180) {
      lastPulseRef.current = now;
      pulseHaptic();
    }
  }, [active, level]);

  // Confirm pulse on release: M punches up to 1.1× then settles to 1.0×.
  const [mScale, setMScale] = useState(1);
  useEffect(() => {
    if (!confirming) return;
    setMScale(1.12);
    const t = setTimeout(() => setMScale(1), 140);
    return () => clearTimeout(t);
  }, [confirming]);

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
      {/* Aura — heavy blur to isolate the voice interaction zone */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backdropFilter: 'blur(40px) saturate(1.15)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.15)',
          background:
            'radial-gradient(ellipse at 50% 100%, rgba(7,9,15,0.55) 0%, rgba(7,9,15,0.35) 55%, rgba(7,9,15,0.15) 100%)',
        }}
      />

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
          {/* Halo wash */}
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

          {/* Outer ripple ring — behind the M */}
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

          {/* Inner ripple ring — behind the M */}
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

          {/* Core fluid sphere with 0.5px gold inner-stroke (glass marble) */}
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
                inset 8px 12px 28px rgba(255,240,200,0.4),
                inset 0 0 0 0.5px rgba(245,225,168,0.85)
              `,
            }}
          />

          {/* Specular highlight */}
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

          {/* Breathing glow — sits behind the M, slows when thinking */}
          <div
            aria-hidden="true"
            className={
              active
                ? thinking
                  ? 'orb-m-glow-thinking'
                  : 'orb-m-glow'
                : undefined
            }
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 104,
              height: 104,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(255,240,200,0.7) 0%, rgba(255,240,200,0.18) 55%, rgba(255,240,200,0) 80%)',
              filter: 'blur(10px)',
              pointerEvents: 'none',
              opacity: active ? 1 : 0,
              transform: 'translate(-50%, -50%)',
              transition: 'opacity 220ms ease-out',
            }}
          />

          {/* Monoline M glyph — sharp, static, on top of the sphere */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${active ? mScale : 0.4})`,
              opacity: active ? 0.8 : 0,
              transition:
                'transform 140ms cubic-bezier(0.2, 1.1, 0.35, 1.05), opacity 220ms ease-out',
              pointerEvents: 'none',
              // Crisp, non-blurred rendering — countered by GPU transforms.
              willChange: 'transform',
            }}
          >
            <MonolineM size={68} stroke={tokens.gold} strokeWidth={2.4} />
          </div>
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
            transition:
              'opacity 280ms ease-out 120ms, transform 280ms ease-out 120ms',
          }}
        >
          {thinking ? 'Thinking' : caption}
        </div>
      </div>
    </div>
  );
}

export default VoiceOrb;
