'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { tokens } from '@/lib/design-tokens';
import { MonolineM } from '@/components/icons/MonolineM';
import { VoiceOrb } from '@/components/voice/VoiceOrb';
import { softBloom, tick as tickHaptic } from '@/lib/haptics';
import { handleIntent } from '@/lib/intent';

const HOLD_MS = 260;
const BAR_HEIGHTS = [3, 6, 9, 5, 8, 4];
const BAR_DELAYS = ['0s', '0.1s', '0.2s', '0.15s', '0.05s', '0.25s'];

export function MOrb() {
  const router = useRouter();
  const [holding, setHolding] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heldRef = useRef(false);

  const beginBloom = useCallback(() => {
    heldRef.current = true;
    setHolding(true);
    tickHaptic();
    setTimeout(softBloom, 40);
  }, []);

  const clearTimer = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      // Capture so pointerup fires here even if the finger drifts off
      // the button (likely, once the full-screen orb is bloomed).
      e.currentTarget.setPointerCapture?.(e.pointerId);
      heldRef.current = false;
      clearTimer();
      holdTimer.current = setTimeout(beginBloom, HOLD_MS);
    },
    [beginBloom]
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
        // Confirm pulse — M scales 1→1.1→1 before the orb dismisses.
        setConfirming(true);
        if (confirmTimer.current) clearTimeout(confirmTimer.current);
        confirmTimer.current = setTimeout(() => {
          setConfirming(false);
          setHolding(false);
          // Placeholder — later this receives the transcribed voice payload.
          const intent = handleIntent('');
          if (intent.route) router.push(intent.route);
        }, 240);
      }
    },
    [router]
  );

  const onPointerCancel = useCallback(() => {
    clearTimer();
    if (confirmTimer.current) {
      clearTimeout(confirmTimer.current);
      confirmTimer.current = null;
    }
    if (heldRef.current) {
      heldRef.current = false;
      setConfirming(false);
      setHolding(false);
    }
  }, []);

  const handleClick = useCallback(() => {
    if (heldRef.current) return; // press-hold consumed the gesture
    router.push('/chat/mikayla');
  }, [router]);

  return (
    <>
      <VoiceOrb active={holding} confirming={confirming} caption="Listening" />
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
          marginTop: -20,
          border: `3px solid ${tokens.bg}`,
          boxShadow: `0 0 0 1.5px ${tokens.gold}, 0 4px 12px rgba(196,160,80,0.3)`,
          transform: holding ? 'scale(0.94)' : 'scale(1)',
          transition: 'transform 160ms ease-out',
          touchAction: 'manipulation',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: 36,
            marginTop: 4,
          }}
        >
          <MonolineM size={28} stroke="#07090F" strokeWidth={1.9} />
        </span>

        {/* Waveform strip — animates while listening */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-center"
          style={{
            height: 14,
            background: tokens.bg,
            gap: 1.5,
          }}
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
      </button>
    </>
  );
}

export default MOrb;
