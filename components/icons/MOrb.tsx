'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { tokens } from '@/lib/design-tokens';
import { LiquidSignatureM } from '@/components/icons/LiquidSignatureM';
import { flutter, tick as tickHaptic } from '@/lib/haptics';
import { handleIntent } from '@/lib/intent';

const HOLD_MS = 260;

export function MOrb() {
  const router = useRouter();
  const [holding, setHolding] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heldRef = useRef(false);

  const beginWave = useCallback(() => {
    heldRef.current = true;
    setHolding(true);
    tickHaptic();
    // Slight delay so the threshold tick + flutter read as two distinct beats.
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
      holdTimer.current = setTimeout(beginWave, HOLD_MS);
    },
    [beginWave]
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
    <button
      type="button"
      onClick={handleClick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onContextMenu={(e) => e.preventDefault()}
      aria-label="Mikayla — tap to chat, hold to speak"
      className="relative flex items-center justify-center overflow-visible p-0"
      style={{
        width: 56,
        height: 56,
        borderRadius: 16,
        background: tokens.bg,
        marginTop: -20,
        border: `1.5px solid ${tokens.gold}`,
        boxShadow: holding
          ? `0 0 18px rgba(196,160,80,0.55), 0 4px 12px rgba(196,160,80,0.25)`
          : `0 0 8px rgba(196,160,80,0.18), 0 4px 12px rgba(196,160,80,0.18)`,
        transform: holding ? 'scale(0.96)' : 'scale(1)',
        transition: 'transform 160ms ease-out, box-shadow 220ms ease-out',
        touchAction: 'manipulation',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      <LiquidSignatureM
        width={46}
        height={28}
        active={holding}
        idPrefix="morb"
        strokeWidth={2}
      />
    </button>
  );
}

export default MOrb;
