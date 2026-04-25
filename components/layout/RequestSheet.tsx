'use client';

import { useEffect, useRef, useState } from 'react';
import {
  tokens,
  familyColor,
  familyBg,
  familyText,
  type FamilyMember,
} from '@/lib/design-tokens';
import { sendRequest } from '@/lib/mutations/requests';
import { impact } from '@/lib/haptics';

const NAMES: Record<FamilyMember, string> = {
  shane: 'Shane',
  molly: 'Molly',
  evey: 'Evey',
  jax: 'Jax',
};

const LETTERS: Record<FamilyMember, string> = {
  shane: 'S',
  molly: 'M',
  evey: 'E',
  jax: 'J',
};

interface RequestSheetProps {
  member: FamilyMember | null;
  fromMember: FamilyMember;
  onClose: () => void;
  onSent?: (memberSentTo: FamilyMember) => void;
}

export function RequestSheet({ member, fromMember, onClose, onSent }: RequestSheetProps) {
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (member) {
      const id = requestAnimationFrame(() => setVisible(true));
      const focusId = window.setTimeout(() => inputRef.current?.focus(), 160);
      impact('light');
      return () => {
        cancelAnimationFrame(id);
        window.clearTimeout(focusId);
      };
    }
    setVisible(false);
    setDraft('');
    setSending(false);
    return undefined;
  }, [member]);

  if (!member) return null;

  const accent = familyColor(member);

  async function handleSend() {
    if (!member || sending) return;
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    const res = await sendRequest({ fromId: fromMember, toId: member, content: text });
    setSending(false);
    if (res.ok) {
      onSent?.(member);
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={`Send a request to ${NAMES[member]}`}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0"
        style={{
          background: visible ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)',
          border: 'none',
          padding: 0,
          transition: 'background 200ms ease',
        }}
      />

      <div
        className="absolute left-1/2 bottom-0 mx-auto"
        style={{
          transform: `translate(-50%, ${visible ? '0' : '100%'})`,
          transition: 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1)',
          width: '100%',
          maxWidth: 393,
          background: 'rgba(7, 9, 15, 0.55)',
          backdropFilter: 'blur(35px) saturate(1.15)',
          WebkitBackdropFilter: 'blur(35px) saturate(1.15)',
          border: `0.5px solid ${tokens.gold}`,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
          boxShadow: '0 -16px 48px rgba(0,0,0,0.55), 0 0 24px rgba(196,160,80,0.18)',
        }}
      >
        <div
          className="mx-auto"
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            background: 'rgba(196,160,80,0.35)',
            marginTop: 8,
            marginBottom: 14,
          }}
        />

        {/* Header — circular profile, name in gold-tinted exec font */}
        <div className="flex items-center gap-3 px-5 pb-4">
          <RecipientAvatar member={member} accent={accent} />
          <div className="min-w-0">
            <div
              className="wordmark"
              style={{
                fontSize: 17,
                fontWeight: 800,
                letterSpacing: '0.4px',
                lineHeight: 1.1,
              }}
            >
              {NAMES[member]}
            </div>
            <div
              className="text-[10px] uppercase"
              style={{
                color: 'rgba(196,160,80,0.6)',
                letterSpacing: '1.4px',
                marginTop: 2,
              }}
            >
              New request
            </div>
          </div>
        </div>

        {/* Prompt */}
        <div
          className="px-5"
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.7)',
            paddingBottom: 10,
          }}
        >
          What do you need from {NAMES[member]}?
        </div>

        {/* Gold-bordered input card */}
        <div className="px-4">
          <div
            style={{
              background: 'rgba(13, 17, 25, 0.6)',
              border: `0.5px solid ${tokens.gold}`,
              borderRadius: 16,
              padding: 14,
              boxShadow: 'inset 0 0 18px rgba(196,160,80,0.05)',
            }}
          >
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Pick up the kids by 4? Grab milk on the way home?`}
              rows={3}
              spellCheck
              autoCapitalize="sentences"
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#FFFFFF',
                fontSize: 14,
                lineHeight: 1.45,
                resize: 'none',
                caretColor: tokens.gold,
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        {/* Send / Cancel */}
        <div className="px-4 pt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] font-semibold"
            style={{
              flex: '0 0 auto',
              padding: '12px 18px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.65)',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || draft.trim().length === 0}
            className="flex-1 text-[14px] font-bold"
            style={{
              padding: '12px',
              borderRadius: 12,
              background:
                sending || draft.trim().length === 0
                  ? 'rgba(196,160,80,0.25)'
                  : tokens.gold,
              border: 'none',
              color: sending || draft.trim().length === 0 ? 'rgba(7,9,15,0.55)' : '#07090F',
              boxShadow:
                sending || draft.trim().length === 0
                  ? 'none'
                  : '0 6px 18px rgba(196,160,80,0.4)',
              transition: 'background 140ms ease, box-shadow 140ms ease',
            }}
          >
            {sending ? 'Sending…' : `Send to ${NAMES[member]}`}
          </button>
        </div>
      </div>
    </div>
  );

  function RecipientAvatar({ member, accent }: { member: FamilyMember; accent: string }) {
    return (
      <span
        className="shrink-0 flex items-center justify-center"
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: familyBg(member),
          border: `0.5px solid ${tokens.gold}`,
          overflow: 'hidden',
          boxShadow: `0 0 14px rgba(196,160,80,0.25)`,
        }}
      >
        <AvatarPhotoOrLetter member={member} accent={accent} />
      </span>
    );
  }
}

function AvatarPhotoOrLetter({ member, accent }: { member: FamilyMember; accent: string }) {
  const [photoOk, setPhotoOk] = useState(true);
  if (photoOk) {
    return (
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
        }}
        draggable={false}
      />
    );
  }
  return (
    <span style={{ fontSize: 16, fontWeight: 700, color: familyText(member) }}>
      {LETTERS[member]}
    </span>
  );
}

export default RequestSheet;
