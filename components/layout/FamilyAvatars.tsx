'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { tokens, type FamilyMember, familyBg, familyColor, familyText } from '@/lib/design-tokens';
import { parseMemberFilter } from '@/lib/events/filter';
import { AvatarActionSheet, type AvatarAction } from '@/components/layout/AvatarActionSheet';
import { RequestSheet } from '@/components/layout/RequestSheet';
import { fetchPendingByRecipient } from '@/lib/queries/requests';
import { REQUEST_SENT_EVENT } from '@/lib/mutations/requests';
import { softBloom } from '@/lib/haptics';

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
// action sheet claims the gesture before the OS share sheet can fire.
const LONG_PRESS_MS = 260;
const MOVE_CANCEL_PX = 8;

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

  const openSheet = useCallback((member: FamilyMember) => {
    setSheetMember(member);
  }, []);

  const closeSheet = () => setSheetMember(null);

  const closeRequest = () => setRequestMember(null);

  const handleAction = (action: AvatarAction) => {
    const member = sheetMember;
    if (!member) return;
    closeSheet();
    switch (action) {
      case 'filter':
        setWho(active === member ? null : member);
        break;
      case 'chore':
        router.push(`/tasks?for=${member}&add=1`);
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
              onLongPress={() => openSheet(member)}
            />
          ))}
        </div>
      </div>

      <AvatarActionSheet
        member={sheetMember}
        onAction={handleAction}
        onClose={closeSheet}
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
  onLongPress,
}: {
  member: FamilyMember;
  letter: string;
  unread: number;
  pendingRequests: number;
  isActive: boolean;
  onTap: () => void;
  onLongPress: () => void;
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
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      /* old browsers */
    }
    timerRef.current = window.setTimeout(() => {
      // Confirmation haptic fires the millisecond the threshold is hit, ahead
      // of any iOS reaction or React state work.
      softBloom();
      isHolding.current = true;
      onLongPress();
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
      // Long-press already opened the sheet on threshold; nothing to do here.
    } else {
      onTap();
    }
  };

  const onPointerCancel = () => {
    clearTimer();
    isHolding.current = false;
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
