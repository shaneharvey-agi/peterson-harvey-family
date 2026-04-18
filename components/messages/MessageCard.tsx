'use client';

import { tokens, familyColor, familyBg, familyText, type FamilyMember } from '@/lib/design-tokens';
import type { Message } from '@/lib/queries/messages';

interface Props {
  message: Message;
}

const LABEL_BY_TYPE: Record<Message['type'], string> = {
  brief: 'BRIEF',
  urgent: 'URGENT',
  dm: 'DM',
  meal: 'TONIGHT',
};

export function MessageCard({ message }: Props) {
  const { type } = message;

  const labelColor =
    type === 'brief' || type === 'meal'
      ? tokens.gold
      : type === 'urgent'
      ? tokens.red
      : 'rgba(255,255,255,0.55)';

  const pulseClass =
    type === 'brief' ? 'mc-pulse-gold' : type === 'urgent' ? 'mc-pulse-red' : '';

  const borderColor =
    type === 'brief'
      ? 'rgba(196,160,80,0.55)'
      : type === 'urgent'
      ? 'rgba(226,75,74,0.7)'
      : 'rgba(255,255,255,0.08)';

  return (
    <div
      className={`mc-card ${pulseClass}`}
      style={{
        width: 150,
        minWidth: 150,
        height: 110,
        padding: 10,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${borderColor}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
        scrollSnapAlign: 'start',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header row: avatar + label */}
      <div className="flex items-center gap-1.5">
        <Avatar message={message} />
        <span
          className="text-[9px] font-extrabold tracking-[1px] uppercase"
          style={{ color: labelColor }}
        >
          {LABEL_BY_TYPE[type]}
        </span>
      </div>

      {/* Body */}
      <div className="min-w-0">
        <div className="text-[12px] font-bold text-white leading-tight truncate">
          {message.title}
        </div>
        <div
          className="text-[10px] mt-0.5 leading-snug"
          style={{
            color: 'rgba(255,255,255,0.6)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {message.preview}
        </div>
      </div>

      <style jsx>{`
        .mc-pulse-gold {
          animation: mcPulseGold 3s ease-in-out infinite;
        }
        .mc-pulse-red {
          animation: mcPulseRed 1.8s ease-in-out infinite;
        }
        @keyframes mcPulseGold {
          0%,
          100% {
            border-color: rgba(196, 160, 80, 0.4);
          }
          50% {
            border-color: rgba(196, 160, 80, 0.75);
          }
        }
        @keyframes mcPulseRed {
          0%,
          100% {
            border-color: rgba(226, 75, 74, 0.5);
            box-shadow: 0 0 0 0 rgba(226, 75, 74, 0);
          }
          50% {
            border-color: rgba(226, 75, 74, 0.9);
            box-shadow: 0 0 0 3px rgba(226, 75, 74, 0);
          }
        }
      `}</style>
    </div>
  );
}

function Avatar({ message }: { message: Message }) {
  const { type, from, imageUrl } = message;

  // Gold M square for brief
  if (type === 'brief') {
    return (
      <span
        aria-hidden
        style={{
          width: 20,
          height: 20,
          borderRadius: 5,
          background: tokens.gold,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#07090F',
          fontSize: 11,
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        M
      </span>
    );
  }

  // Meal: recipe thumb
  if (type === 'meal' && imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        style={{
          width: 20,
          height: 20,
          borderRadius: 5,
          objectFit: 'cover',
          flexShrink: 0,
        }}
        draggable={false}
      />
    );
  }

  // Family circle for urgent / dm (or meal without image)
  const member: FamilyMember = from || 'molly';
  const letter = member.charAt(0).toUpperCase();
  return (
    <span
      aria-hidden
      style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: familyBg(member),
        border: `1.5px solid ${familyColor(member)}`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: familyText(member),
        fontSize: 9,
        fontWeight: 800,
        flexShrink: 0,
      }}
    >
      {letter}
    </span>
  );
}
