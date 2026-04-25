'use client';

import { useEffect, useState } from 'react';
import {
  tokens,
  familyColor,
  familyBg,
  familyText,
  type FamilyMember,
} from '@/lib/design-tokens';

export type AvatarAction = 'message' | 'request' | 'chore' | 'filter';

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

export function AvatarActionSheet({
  member,
  onAction,
  onClose,
  recording = false,
  transcript = '',
}: {
  member: FamilyMember | null;
  onAction: (action: AvatarAction) => void;
  onClose: () => void;
  /** Phase C — true while the user is still holding and the mic is live. */
  recording?: boolean;
  /** Phase C — interim+final transcript to render as a ghosted line. */
  transcript?: string;
}) {
  // Trigger slide-up animation by toggling mounted state after paint.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (member) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
    return undefined;
  }, [member]);

  if (!member) return null;

  const accent = familyColor(member);

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={`Actions for ${NAMES[member]}`}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0"
        style={{
          background: visible ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0)',
          border: 'none',
          padding: 0,
          transition: 'background 180ms ease',
        }}
      />

      <div
        className="absolute left-1/2 bottom-0 mx-auto"
        style={{
          transform: `translate(-50%, ${visible ? '0' : '100%'})`,
          transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
          width: '100%',
          maxWidth: 393,
          background: '#0D1119',
          borderTop: `1px solid ${accent}40`,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
          boxShadow: `0 -12px 40px rgba(0,0,0,0.5)`,
        }}
      >
        <div
          className="mx-auto"
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.2)',
            marginTop: 8,
            marginBottom: 10,
          }}
        />

        {/* Header — circular profile photo (0.5px gold) anchored top-left,
            name to the right in the gold-shimmer wordmark treatment. */}
        <div className="flex items-center gap-3 px-5 pb-3">
          <HeaderAvatar member={member} />
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
                color: 'rgba(196,160,80,0.55)',
                letterSpacing: '1.4px',
                marginTop: 2,
              }}
            >
              Quick actions
            </div>
          </div>
        </div>

        <div className="flex flex-col" style={{ padding: '4px 8px 8px' }}>
          <ActionRow
            label="Message"
            hint={`Thread with ${NAMES[member]}`}
            icon={<MessageIcon color={accent} />}
            onClick={() => onAction('message')}
          />
          <ActionRow
            label="Request"
            hint={`Ask ${NAMES[member]} for something`}
            icon={<RequestIcon color={tokens.gold} />}
            onClick={() => onAction('request')}
          />
          <ActionRow
            label="Add chore"
            hint={`Assign to ${NAMES[member]}`}
            icon={<ChoreIcon color={accent} />}
            onClick={() => onAction('chore')}
          />
          <ActionRow
            label="Filter calendar"
            hint={`Only show ${NAMES[member]}'s day`}
            icon={<FilterIcon color={accent} />}
            onClick={() => onAction('filter')}
          />
        </div>

        {/* Active Bloom transcript — only mounts while recording. Ghosted
            italic so it reads as live caption, not as a chat bubble. */}
        {recording && (
          <div
            className="px-5 pb-3"
            aria-live="polite"
            style={{
              minHeight: 28,
              fontSize: 13,
              fontStyle: 'italic',
              lineHeight: 1.35,
              color: transcript
                ? 'rgba(196,160,80,0.85)'
                : 'rgba(196,160,80,0.45)',
              transition: 'color 200ms ease',
              textAlign: 'center',
              letterSpacing: '0.2px',
            }}
          >
            {transcript || 'Listening\u2026'}
          </div>
        )}

        <div className="px-4 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full text-[13px] font-semibold"
            style={{
              padding: '12px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionRow({
  label,
  hint,
  icon,
  onClick,
  disabled,
  disabledHint,
}: {
  label: string;
  hint: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  disabledHint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-3 w-full text-left"
      style={{
        padding: '12px 12px',
        background: 'transparent',
        border: 'none',
        color: disabled ? 'rgba(255,255,255,0.3)' : '#FFFFFF',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <span
        className="flex items-center justify-center shrink-0"
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[14px] font-semibold">{label}</span>
        <span
          className="block text-[11px]"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          {disabled && disabledHint ? disabledHint : hint}
        </span>
      </span>
      {!disabled && (
        <span
          aria-hidden
          style={{ color: 'rgba(255,255,255,0.25)', fontSize: 16 }}
        >
          ›
        </span>
      )}
    </button>
  );
}

function HeaderAvatar({ member }: { member: FamilyMember }) {
  const [photoOk, setPhotoOk] = useState(true);
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
        boxShadow: `0 0 12px rgba(196,160,80,0.22)`,
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
          }}
          draggable={false}
        />
      ) : (
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: familyText(member),
          }}
        >
          {LETTERS[member]}
        </span>
      )}
    </span>
  );
}

function RequestIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 7l7-4 7 4v10l-7 4-7-4V7z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 12.2l2.2 2L15 10.5"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MessageIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 4v-4H6a2 2 0 0 1-2-2V6z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChoreIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="2"
        stroke={color}
        strokeWidth="1.8"
      />
      <path d="M9 3v4M15 3v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M8 13l2.5 2.5L16 10"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FilterIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 5h16M7 12h10M10 19h4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default AvatarActionSheet;
