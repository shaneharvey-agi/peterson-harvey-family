'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { tokens, type FamilyMember, familyBg, familyColor, familyText } from '@/lib/design-tokens';
import { parseMemberFilter } from '@/lib/events/filter';
import { AvatarActionSheet, type AvatarAction } from '@/components/layout/AvatarActionSheet';
import { RequestSheet } from '@/components/layout/RequestSheet';
import { VoiceBloom } from '@/components/layout/VoiceBloom';
import { fetchPendingByRecipient } from '@/lib/queries/requests';
import { REQUEST_SENT_EVENT } from '@/lib/mutations/requests';
import { sendMessage } from '@/lib/mutations/chatMessages';
import { isSpeechSupported, startSpeech, type SpeechSession } from '@/lib/speech';
import { impact, pulseHaptic, softBloom } from '@/lib/haptics';

const SUSTAINED_HAPTIC_MS = 700;
const ACTIVE_BLOOM_MIN_TRANSCRIPT = 2; // chars — ignore stray throat-clears

type AvatarMember = {
  member: FamilyMember;
  letter: string;
  unread?: number;
};

const DEFAULT_MEMBERS: AvatarMember[] = [
  { member: 'shane', letter: 'S', unread: 0 },
  { member: 'molly', letter: 'M', unread: 2 },
  { member: 'evey',  letter: 'E', unread: 1 },
  { member: 'jax',   letter: 'J', unread: 0 },
];

// 260ms beats iOS Safari's ~500ms long-press image-callout timer, so our
// Active Bloom claims the gesture before the OS share sheet can fire.
const LONG_PRESS_MS = 260;
const MOVE_CANCEL_PX = 8;

// Treat the current device as Shane for the from_id of any outbound request
// until auth lands.
const CURRENT_USER: FamilyMember = 'shane';

export function FamilyAvatars({ members = DEFAULT_MEMBERS }: { members?: AvatarMember[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = parseMemberFilter(searchParams?.get('who'));
  const [sheetMember, setSheetMember] = useState<FamilyMember | null>(null);
  const [requestMember, setRequestMember] = useState<FamilyMember | null>(null);
  const [requestPrefill, setRequestPrefill] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<FamilyMember, number>>({
    shane: 0, molly: 0, evey: 0, jax: 0,
  });

  // Active Bloom voice state. `recording` drives the bloom orb + ghosted
  // transcript line. The ref shadows the state so the release handler can
  // read the latest text synchronously without waiting for React.
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const transcriptRef = useRef('');
  const speechSessionRef = useRef<SpeechSession | null>(null);
  const hapticTimerRef = useRef<number | null>(null);

  // Bumping this re-keys the gold-halo flash inside VoiceBloom, replaying
  // the 400ms scale+fade animation each time a release lands a message.
  const [flashKey, setFlashKey] = useState(0);

  const stopSustainedHaptic = useCallback(() => {
    if (hapticTimerRef.current !== null) {
      window.clearInterval(hapticTimerRef.current);
      hapticTimerRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(
    (mode: 'capture' | 'discard') => {
      stopSustainedHaptic();
      const session = speechSessionRef.current;
      speechSessionRef.current = null;
      if (session) {
        if (mode === 'capture') session.stop();
        else session.abort();
      }
      setRecording(false);
    },
    [stopSustainedHaptic],
  );

  // Pull pending request counts for the gold "owe-them-an-answer" badge.
  // Re-fetches whenever a request is sent anywhere in the app.
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      const counts = await fetchPendingByRecipient();
      if (alive) setPending(counts);
    };
    refresh();
    const onSent = () => refresh();
    if (typeof window !== 'undefined') {
      window.addEventListener(REQUEST_SENT_EVENT, onSent);
    }
    return () => {
      alive = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener(REQUEST_SENT_EVENT, onSent);
      }
    };
  }, []);

  const setWho = (member: FamilyMember | null) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (member === null) params.delete('who');
    else params.set('who', member);
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : '/', { scroll: false });
  };

  const openSheet = (member: FamilyMember) => {
    setSheetMember(member);
    // softBloom() now fires inside AvatarButton at the exact long-press
    // threshold instant, before any React state work — keeps the haptic
    // tightly synced to the moment the app "takes" the gesture.
  };

  // Active Bloom — long-press fired. Open sheet, kick off Web Speech, start
  // the sustained "soft engine" haptic loop. If Web Speech isn't supported
  // (Firefox, some mobile browsers), we still open the sheet — we just don't
  // record anything.
  const startActiveBloom = (member: FamilyMember) => {
    openSheet(member);
    transcriptRef.current = '';
    setTranscript('');
    if (!isSpeechSupported()) return;
    setRecording(true);
    speechSessionRef.current = startSpeech({
      onInterim: (text) => {
        transcriptRef.current = text;
        setTranscript(text);
      },
      onFinal: (text) => {
        // iOS Safari finalises late: when the user releases mid-utterance,
        // session.stop() fires onFinal with only the isFinal-marked chunks,
        // which is often shorter than the live interim+final string we were
        // showing. Never let the final callback shrink what onInterim already
        // captured — otherwise `captured` ends up empty and the message
        // silently fails to send.
        if (text.trim().length > transcriptRef.current.trim().length) {
          transcriptRef.current = text;
        }
      },
      onError: () => {
        // mic permission denied / API hiccup — collapse silently to standard
        // tap-to-pick mode rather than crashing the gesture
        stopRecording('discard');
      },
    });
    if (speechSessionRef.current) {
      // Sustained "soft engine" pulse — gentle every 700ms while the user
      // keeps holding. Less aggressive than the MOrb 4s flutter so it reads
      // as ambient warmth, not a metronome.
      hapticTimerRef.current = window.setInterval(pulseHaptic, SUSTAINED_HAPTIC_MS);
    }
  };

  const closeSheet = () => {
    if (recording) stopRecording('discard');
    setSheetMember(null);
    setTranscript('');
    transcriptRef.current = '';
  };

  const closeRequest = () => setRequestMember(null);

  const openRequestPrefilled = (member: FamilyMember, content: string) => {
    setRequestPrefill(content);
    window.setTimeout(() => setRequestMember(member), 220);
  };

  // End-of-hold handler. Avatar long-press = "DM this person what I just
  // said." The target is already unambiguous (you long-pressed Molly, you
  // mean Molly), so we skip the intent classifier and send the transcript
  // straight into the chat thread. For Request / Chore / Filter, Shane
  // taps the in-sheet buttons during the hold instead of speaking.
  const endActiveBloom = (member: FamilyMember) => {
    stopRecording('capture');
    const captured = transcriptRef.current.trim();
    setTranscript('');
    transcriptRef.current = '';

    if (captured.length < ACTIVE_BLOOM_MIN_TRANSCRIPT) {
      // No real speech — leave the action sheet open for tap-to-pick.
      return;
    }

    setSheetMember(null);

    // Confirm-and-fly: halo + medium impact + immediate router push happen on
    // the same animation frame so the release feels like the message
    // physically leaves the device. Supabase + Twilio run in the background;
    // the destination thread page does its own fetch and will see the new
    // row by the time it mounts.
    setFlashKey((k) => k + 1);
    impact('medium');
    router.push(`/messages/${member}`);

    // Twilio SMS — fire-and-forget. /api/sms safely no-ops when Twilio
    // creds or the recipient's phone aren't configured.
    fetch('/api/sms', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ member, body: captured }),
    }).catch(() => {
      /* network blip; in-app message still lands via Supabase */
    });

    sendMessage({
      threadKey: member,
      sender: CURRENT_USER,
      body: captured,
    }).then((res) => {
      if (res.ok) {
        showToast(`Sent to ${capitalize(member)}.`);
      } else {
        // Supabase write failed — surface a tap-to-retry toast so the
        // captured words aren't lost on the floor. User is already on the
        // destination thread by now, so the Request-sheet fallback would
        // be jarring; toast on the new screen is the right surface.
        showToast(`Couldn't send: ${res.error}`);
      }
    });
  };

  // Make sure mic + haptic loop don't outlive the component (e.g. nav-away
  // mid-hold). Keeps Safari happy.
  useEffect(() => {
    return () => {
      stopRecording('discard');
    };
  }, [stopRecording]);

  const handleAction = (action: AvatarAction) => {
    const member = sheetMember;
    if (!member) return;
    closeSheet();
    switch (action) {
      case 'filter':
        setWho(active === member ? null : member);
        break;
      case 'chore':
        router.push(`/chores?for=${member}&add=1`);
        break;
      case 'message':
        router.push(`/messages/${member}`);
        break;
      case 'request':
        // Slight delay so the action sheet's slide-down clears the screen
        // before the request card slides up — feels like a hand-off, not a swap.
        window.setTimeout(() => setRequestMember(member), 220);
        break;
    }
  };

  const handleRequestSent = (sentTo: FamilyMember) => {
    showToast(`Sent to ${capitalize(sentTo)}.`);
  };

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }

  return (
    <>
      <div
        className="-mx-4"
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          touchAction: 'pan-x',
          padding: '8px 0 12px',
        }}
      >
        <div
          className="flex items-center px-4"
          style={{ gap: 14, width: 'max-content' }}
        >
          {members.map(({ member, letter, unread = 0 }) => (
            <AvatarButton
              key={member}
              member={member}
              letter={letter}
              unread={unread}
              pendingRequests={pending[member] ?? 0}
              isActive={active === member}
              onTap={() => router.push(`/messages/${member}`)}
              onLongPressStart={() => startActiveBloom(member)}
              onLongPressEnd={(cancelled) => {
                if (cancelled) {
                  stopRecording('discard');
                } else {
                  endActiveBloom(member);
                }
              }}
            />
          ))}
        </div>
      </div>

      <VoiceBloom active={recording} transcript={transcript} flashKey={flashKey} />

      <AvatarActionSheet
        member={sheetMember}
        onAction={handleAction}
        onClose={closeSheet}
        recording={recording}
        transcript={transcript}
      />

      <RequestSheet
        member={requestMember}
        fromMember={CURRENT_USER}
        onClose={closeRequest}
        onSent={handleRequestSent}
        prefill={requestPrefill}
      />

      {toast && (
        <div
          className="fixed left-1/2"
          style={{
            top: `calc(env(safe-area-inset-top) + 72px)`,
            transform: 'translateX(-50%)',
            background: 'rgba(13,17,25,0.95)',
            border: `1px solid ${tokens.gold}55`,
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 600,
            padding: '10px 16px',
            borderRadius: 999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            zIndex: 60,
          }}
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      )}
    </>
  );
}

function AvatarButton({
  member,
  letter,
  unread,
  pendingRequests,
  isActive,
  onTap,
  onLongPressStart,
  onLongPressEnd,
}: {
  member: FamilyMember;
  letter: string;
  unread: number;
  pendingRequests: number;
  isActive: boolean;
  onTap: () => void;
  onLongPressStart: () => void;
  onLongPressEnd: (cancelled: boolean) => void;
}) {
  const [photoOk, setPhotoOk] = useState(true);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const isHolding = useRef(false);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  // React 17+ delegates touch events at the document root with passive=true,
  // so calling preventDefault inside an onTouchStart React handler is a no-op
  // and iOS Safari still fires the long-press image/share callout. Attach the
  // native listener directly with passive:false so preventDefault actually
  // claims the gesture before iOS can react.
  useEffect(() => {
    const node = buttonRef.current;
    if (!node) return;
    const onTouchStartNative = (e: TouchEvent) => {
      e.preventDefault();
    };
    node.addEventListener('touchstart', onTouchStartNative, { passive: false });
    return () => {
      node.removeEventListener('touchstart', onTouchStartNative);
    };
  }, []);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    isHolding.current = false;
    startPos.current = { x: e.clientX, y: e.clientY };
    clearTimer();
    // Capture the pointer so the gesture survives the AvatarActionSheet
    // sliding up over the avatar — without this, pointerup fires on the
    // sheet and we'd never know the user released.
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      /* old browsers */
    }
    timerRef.current = window.setTimeout(() => {
      // Fire the confirmation haptic FIRST — before React state, before the
      // sheet mounts — so the user feels the app claim the gesture the
      // millisecond the threshold is hit, ahead of any iOS reaction.
      softBloom();
      isHolding.current = true;
      onLongPressStart();
    }, LONG_PRESS_MS);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!startPos.current || isHolding.current) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    if (dx * dx + dy * dy > MOVE_CANCEL_PX * MOVE_CANCEL_PX) {
      clearTimer();
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    clearTimer();
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      /* already released */
    }
    if (isHolding.current) {
      isHolding.current = false;
      onLongPressEnd(false);
    } else {
      onTap();
    }
  };

  const onPointerCancel = () => {
    clearTimer();
    if (isHolding.current) {
      isHolding.current = false;
      onLongPressEnd(true);
    }
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      aria-label={`Open messages with ${member}. Long-press for actions.`}
      className="relative flex items-center justify-center"
      style={{
        width: 50,
        height: 50,
        padding: 0,
        background: 'transparent',
        border: 'none',
        opacity: isActive ? 1 : 0.92,
        transform: isActive ? 'scale(1.06)' : 'scale(1)',
        transition: 'transform 180ms ease, opacity 180ms ease',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
      } as React.CSSProperties}
    >
      {pendingRequests > 0 && (
        <span
          aria-hidden
          className="pulse-gold absolute"
          style={{
            inset: -3,
            borderRadius: '50%',
            border: `1px solid ${tokens.gold}`,
            boxShadow: `0 0 12px rgba(196,160,80,0.55)`,
            pointerEvents: 'none',
          }}
        />
      )}
      <span
        className="flex items-center justify-center"
        style={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          background: familyBg(member),
          border: `${isActive ? 3.5 : 2.5}px solid ${familyColor(member)}`,
          overflow: 'hidden',
          boxShadow: isActive
            ? `0 0 0 2px ${tokens.bg}, 0 0 10px ${familyColor(member)}80`
            : 'none',
        }}
      >
        {photoOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/avatars/${member}.jpg`}
            alt=""
            onError={() => setPhotoOk(false)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              pointerEvents: 'none',
              // iOS reads these on the IMG element itself — without them the
              // OS share/copy callout fires regardless of parent styling.
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none',
              WebkitUserDrag: 'none',
            } as React.CSSProperties}
            draggable={false}
          />
        ) : (
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: familyText(member),
              lineHeight: 1,
              pointerEvents: 'none',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none',
            } as React.CSSProperties}
          >
            {letter}
          </span>
        )}
      </span>
      {unread > 0 && (
        <span
          className="pulse-red absolute flex items-center justify-center"
          style={{
            top: -2,
            right: -2,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: tokens.red,
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            border: `2px solid ${tokens.bg}`,
            lineHeight: 1,
          }}
        >
          {unread}
        </span>
      )}
      {pendingRequests > 0 && (
        <span
          className="absolute flex items-center justify-center"
          style={{
            bottom: -2,
            right: -2,
            minWidth: 18,
            height: 18,
            paddingLeft: 4,
            paddingRight: 4,
            borderRadius: 999,
            background: tokens.gold,
            color: '#07090F',
            fontSize: 10,
            fontWeight: 800,
            border: `2px solid ${tokens.bg}`,
            lineHeight: 1,
            boxShadow: '0 0 10px rgba(196,160,80,0.5)',
          }}
          aria-label={`${pendingRequests} pending request${pendingRequests > 1 ? 's' : ''}`}
        >
          {pendingRequests}
        </span>
      )}
    </button>
  );
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

export default FamilyAvatars;
