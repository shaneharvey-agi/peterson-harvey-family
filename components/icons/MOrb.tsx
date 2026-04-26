'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { tokens } from '@/lib/design-tokens';
import { flutter, impact } from '@/lib/haptics';
import { isSpeechSupported, startSpeech, type SpeechSession } from '@/lib/speech';
import { sendMessage } from '@/lib/mutations/chatMessages';

const HOLD_MS = 260;
const WAVE_CYCLE_MS = 4000;
const MIN_TRANSCRIPT_CHARS = 2; // ignore stray throat-clears
const BAR_HEIGHTS = [3, 6, 9, 5, 8, 4];
const BAR_DELAYS = ['0s', '0.1s', '0.2s', '0.15s', '0.05s', '0.25s'];

type Recipient = 'shane' | 'molly' | 'evey' | 'jax' | 'family';
type IntentKind = 'request' | 'message' | 'chore' | 'filter';

interface IntentResponse {
  kind: IntentKind;
  content: string;
  recipient?: Recipient;
  source: 'haiku' | 'fallback';
}

const CURRENT_USER = 'shane';

export function MOrb() {
  const router = useRouter();
  const [holding, setHolding] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [flashKey, setFlashKey] = useState(0);
  const [portalReady, setPortalReady] = useState(false);

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heldRef = useRef(false);
  const transcriptRef = useRef('');
  const speechSessionRef = useRef<SpeechSession | null>(null);

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

  const stopSpeechSession = useCallback((mode: 'capture' | 'discard') => {
    const session = speechSessionRef.current;
    speechSessionRef.current = null;
    if (!session) return;
    if (mode === 'capture') session.stop();
    else session.abort();
  }, []);

  const beginListen = useCallback(() => {
    heldRef.current = true;
    setHolding(true);
    impact('medium');
    transcriptRef.current = '';
    setTranscript('');
    if (!isSpeechSupported()) return;
    speechSessionRef.current = startSpeech({
      onInterim: (text) => {
        transcriptRef.current = text;
        setTranscript(text);
      },
      onFinal: (text) => {
        // iOS Safari finalises late: when the user releases mid-utterance,
        // session.stop() fires onFinal with only isFinal-marked chunks,
        // which is shorter than the live interim+final string we were
        // showing. Never let final shrink the buffer.
        if (text.trim().length > transcriptRef.current.trim().length) {
          transcriptRef.current = text;
        }
      },
      onError: () => {
        // mic permission denied / API hiccup — collapse silently. The user
        // can still tap the orb to navigate to /chat/mikayla as a fallback.
      },
    });
  }, []);

  const clearTimer = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const dispatchIntent = useCallback(
    async (captured: string) => {
      // Confirm-and-fly: halo + medium impact fire on the same animation
      // frame as the dispatch decision, so release feels like the message
      // physically leaves the device.
      setFlashKey((k) => k + 1);
      impact('medium');

      let resolved: IntentResponse;
      try {
        const resp = await fetch('/api/intent', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ transcript: captured }),
        });
        resolved = (await resp.json()) as IntentResponse;
      } catch {
        // Network blip — fall back to dropping the user into the Mikayla
        // chat with the transcript visible so words aren't lost.
        router.push(`/chat/mikayla?prefill=${encodeURIComponent(captured)}`);
        return;
      }

      const { kind, content, recipient } = resolved;
      const body = (content || captured).trim();

      // Message intent with a named recipient → write to chat_messages and
      // navigate to the thread immediately. Twilio fan-out is deferred per
      // Lean MVP; cross-device delivery rides on Supabase Realtime instead.
      if (kind === 'message' && recipient && recipient !== CURRENT_USER) {
        router.push(`/messages/${recipient}`);
        sendMessage({
          threadKey: recipient,
          sender: CURRENT_USER,
          body,
        }).catch(() => {
          /* Supabase write failed — message thread page will reflect on next fetch */
        });
        return;
      }

      // Other kinds fall back to the Mikayla chat with the transcript
      // pre-filled so Shane can finish what he meant in chat. Eventually
      // chore/filter/request will route to their own surfaces.
      router.push(`/chat/mikayla?prefill=${encodeURIComponent(body)}`);
    },
    [router],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture?.(e.pointerId);
      heldRef.current = false;
      clearTimer();
      holdTimer.current = setTimeout(beginListen, HOLD_MS);
    },
    [beginListen],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      try {
        e.currentTarget.releasePointerCapture?.(e.pointerId);
      } catch {
        /* already released */
      }
      clearTimer();
      if (!heldRef.current) return;

      // Snapshot the transcript synchronously BEFORE stopping the session,
      // because session.stop() may emit a shorter onFinal that the merge
      // logic in beginListen will discard — but we want today's value.
      stopSpeechSession('capture');
      const captured = transcriptRef.current.trim();
      transcriptRef.current = '';
      setTranscript('');
      setHolding(false);
      heldRef.current = false;

      if (captured.length < MIN_TRANSCRIPT_CHARS) {
        // No real speech — just collapse the bloom. Don't penalize the
        // user with a bogus toast or stray navigation.
        return;
      }

      void dispatchIntent(captured);
    },
    [dispatchIntent, stopSpeechSession],
  );

  const onPointerCancel = useCallback(() => {
    clearTimer();
    if (heldRef.current) {
      heldRef.current = false;
      setHolding(false);
      stopSpeechSession('discard');
      transcriptRef.current = '';
      setTranscript('');
    }
  }, [stopSpeechSession]);

  const handleClick = useCallback(() => {
    if (heldRef.current) return; // press-hold consumed the gesture
    impact('light');
    router.push('/chat/mikayla');
  }, [router]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      stopSpeechSession('discard');
      clearTimer();
    };
  }, [stopSpeechSession]);

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
          document.body,
        )
      : null;

  // Ghosted live transcript + post-release halo flash. Portaled to <body>
  // so they sit above the orb cluster and aren't clipped by the bottom-nav
  // container's overflow.
  const overlay =
    portalReady && (holding || flashKey > 0)
      ? createPortal(
          <div
            aria-hidden="true"
            style={{
              position: 'fixed',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 11,
            }}
          >
            {holding && (
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
                    : 'rgba(196, 160, 80, 0.55)',
                  textShadow: '0 1px 12px rgba(7,9,15,0.85)',
                  transition: 'color 200ms ease',
                }}
              >
                {transcript || 'Listening…'}
              </div>
            )}
            {flashKey > 0 && (
              <span
                key={flashKey}
                style={{
                  position: 'absolute',
                  bottom: 'calc(env(safe-area-inset-bottom) + 56px)',
                  left: '50%',
                  width: 200,
                  height: 200,
                  marginLeft: -100,
                  borderRadius: '50%',
                  border: `0.5px solid ${tokens.gold}`,
                  boxShadow: `0 0 24px ${tokens.gold}, 0 0 48px ${tokens.gold}66`,
                  animation: 'morb-halo-flash 400ms ease-out forwards',
                }}
              />
            )}
            <style>{`
              @keyframes morb-halo-flash {
                0%   { transform: scale(0.6); opacity: 1; }
                100% { transform: scale(1.4); opacity: 0; }
              }
            `}</style>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {dimOverlay}
      {overlay}

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
            backdrop blur. Only mounted while holding so idle stays
            zero-cost and crisp. */}
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
            transform: holding ? 'scale(1.1)' : 'scale(1)',
            transformOrigin: 'center',
            transition:
              'transform 260ms cubic-bezier(0.2, 0.9, 0.3, 1.05), box-shadow 260ms ease-out',
            touchAction: 'manipulation',
            WebkitUserSelect: 'none',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
            zIndex: 1,
          } as React.CSSProperties}
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

          {/* Bottom strip — cross-fades from waveform bars (idle, the
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
