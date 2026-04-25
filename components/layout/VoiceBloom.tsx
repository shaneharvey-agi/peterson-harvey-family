'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { HeavySilkOrb } from '@/components/icons/HeavySilkOrb';

interface VoiceBloomProps {
  active: boolean;
  /** Tint of the orb. Defaults to gold. */
  color?: string;
}

/**
 * Full-screen portal that mounts the HeavySilkOrb behind the AvatarActionSheet
 * during Active Bloom voice capture. Z-index 45 sits below the sheet (50)
 * but above the home content, so the bloom reads as ambient warmth around
 * the conversation, not as a foreground element.
 */
export function VoiceBloom({ active, color = '#C4A050' }: VoiceBloomProps) {
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => setPortalReady(true), []);

  if (!portalReady || typeof document === 'undefined') return null;
  if (!active) return null;

  return createPortal(
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 45,
        pointerEvents: 'none',
        background:
          'radial-gradient(circle at 50% 65%, rgba(196,160,80,0.10) 0%, rgba(7,9,15,0) 55%)',
        opacity: 1,
        transition: 'opacity 240ms ease-out',
      }}
    >
      <div
        style={{
          width: 360,
          height: 360,
          // Sit a bit lower than vertical center so the orb pools behind
          // the action sheet's top edge instead of the screen midpoint.
          transform: 'translateY(40px)',
          filter: 'blur(0.5px)',
        }}
      >
        <HeavySilkOrb size={360} color={color} active />
      </div>
    </div>,
    document.body,
  );
}

export default VoiceBloom;
