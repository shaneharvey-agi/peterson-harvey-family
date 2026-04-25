'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { HeavySilkOrb } from '@/components/icons/HeavySilkOrb';

interface VoiceBloomProps {
  active: boolean;
  /** Tint of the orb. Defaults to gold. */
  color?: string;
  /** Real-time STT string to render above the orb while holding. */
  transcript?: string;
  /**
   * Triggers the gold-halo confirmation flash (0.5px gold ring,
   * scale 0.6 → 1.4, opacity 1 → 0 over 400ms). Driven by a key bump
   * from the parent so the same prop can fire repeated flashes.
   */
  flashKey?: number;
}

/**
 * Full-screen portal that mounts the HeavySilkOrb behind the AvatarActionSheet
 * during Active Bloom voice capture. Z-index 45 sits below the sheet (50)
 * but above the home content, so the bloom reads as ambient warmth around
 * the conversation, not as a foreground element.
 *
 * Also renders the ghosted live transcript above the orb (well clear of
 * the action sheet's top edge) and the post-release gold-halo confirmation.
 */
export function VoiceBloom({
  active,
  color = '#C4A050',
  transcript = '',
  flashKey = 0,
}: VoiceBloomProps) {
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => setPortalReady(true), []);

  if (!portalReady || typeof document === 'undefined') return null;
  if (!active && flashKey === 0) return null;

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
        background: active
          ? 'radial-gradient(circle at 50% 65%, rgba(196,160,80,0.10) 0%, rgba(7,9,15,0) 55%)'
          : 'transparent',
        opacity: 1,
        transition: 'opacity 240ms ease-out',
      }}
    >
      {active && (
        <>
          {/* Large ghosted transcript — sits above the orb so it stays
              visible above the action sheet that rises over the lower half. */}
          <div
            aria-live="polite"
            style={{
              position: 'absolute',
              top: 'calc(env(safe-area-inset-top) + 96px)',
              left: '50%',
              transform: 'translateX(-50%)',
              maxWidth: 'min(360px, 86vw)',
              padding: '0 16px',
              fontSize: 18,
              fontStyle: 'italic',
              fontWeight: 500,
              lineHeight: 1.4,
              letterSpacing: '0.2px',
              textAlign: 'center',
              color: transcript
                ? 'rgba(240, 224, 181, 0.95)'
                : 'rgba(196, 160, 80, 0.5)',
              textShadow: '0 1px 12px rgba(7,9,15,0.85)',
              transition: 'color 200ms ease',
            }}
          >
            {transcript || 'Listening…'}
          </div>
          <div
            style={{
              width: 360,
              height: 360,
              transform: 'translateY(40px)',
              filter: 'blur(0.5px)',
            }}
          >
            <HeavySilkOrb size={360} color={color} active />
          </div>
        </>
      )}
      {/* Gold-halo confirmation flash — keyed so each release re-triggers
          the CSS animation. Sits on top of the orb area, fades over 400ms. */}
      {flashKey > 0 && (
        <span
          key={flashKey}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 200,
            height: 200,
            marginLeft: -100,
            marginTop: -60,
            borderRadius: '50%',
            border: `0.5px solid ${color}`,
            boxShadow: `0 0 24px ${color}, 0 0 48px ${color}66`,
            animation: 'voicebloom-halo 400ms ease-out forwards',
          }}
        />
      )}
      <style>{`
        @keyframes voicebloom-halo {
          0%   { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      `}</style>
    </div>,
    document.body,
  );
}

export default VoiceBloom;
