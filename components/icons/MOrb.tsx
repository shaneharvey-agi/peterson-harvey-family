'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { tokens } from '@/lib/design-tokens';

const BAR_HEIGHTS = [3, 6, 9, 5, 8, 4];
const BAR_DELAYS = ['0s', '0.1s', '0.2s', '0.15s', '0.05s', '0.25s'];

export function MOrb() {
  const router = useRouter();
  const [holding, setHolding] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heldRef = useRef(false);

  const startHold = () => {
    heldRef.current = false;
    holdTimer.current = setTimeout(() => {
      heldRef.current = true;
      setHolding(true);
      // TODO: begin voice recording
    }, 200);
  };

  const cancelHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (heldRef.current) {
      // TODO: send voice recording
      setHolding(false);
    }
  };

  const handleClick = () => {
    if (heldRef.current) return; // it was a hold, not a tap
    router.push('/chat/mikayla');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={() => {
        if (holdTimer.current) {
          clearTimeout(holdTimer.current);
          holdTimer.current = null;
        }
        if (heldRef.current) {
          // cancel: finger slid off
          heldRef.current = false;
          setHolding(false);
        }
      }}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      onTouchCancel={() => {
        if (holdTimer.current) {
          clearTimeout(holdTimer.current);
          holdTimer.current = null;
        }
        heldRef.current = false;
        setHolding(false);
      }}
      aria-label="Mikayla"
      className="relative flex flex-col items-center justify-start overflow-hidden p-0"
      style={{
        width: 56,
        height: 56,
        borderRadius: 16,
        background: tokens.gold,
        marginTop: -20,
        border: `3px solid ${tokens.bg}`,
        boxShadow: `0 0 0 1.5px ${tokens.gold}, 0 4px 12px rgba(196,160,80,0.3)`,
      }}
    >
      <span
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: '#000',
          marginTop: 6,
          lineHeight: 1,
          fontFamily: "'Helvetica Neue', sans-serif",
        }}
      >
        M
      </span>

      {/* Waveform strip */}
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
  );
}

export default MOrb;
