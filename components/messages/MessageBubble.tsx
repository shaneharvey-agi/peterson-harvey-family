'use client';

import type { ReactNode } from 'react';
import { tokens } from '@/lib/design-tokens';

interface Props {
  body: ReactNode;
  /** Pre-formatted display string. Pass empty string to omit the timestamp row. */
  timestamp?: string;
  /** True when the message was sent by the current user (Shane). Right-aligns + applies the navy/glow treatment. */
  mine: boolean;
  /** True when the previous bubble is from the same sender — sharpens the leading-top corner so a streak reads as a cluster. */
  tightTop?: boolean;
  /** Avatar slot (28px) shown to the left of recipient bubbles. Pass null to leave the gutter empty for stacked recipient messages. */
  avatar?: ReactNode;
  /** Soft-gold sender name above the bubble. Used in the family thread for non-self senders. */
  senderLabel?: string;
  /** Accessibility label, falls back to the body string. */
  ariaLabel?: string;
}

const RADIUS = 18;
const SHARP = 6;

const USER_BG = 'rgba(15, 31, 56, 0.55)';        // deep navy, partly translucent so 35px backdrop-blur reads as liquid glass
const RECIPIENT_BG = 'rgba(255, 255, 255, 0.06)'; // frosted white/navy mix
const USER_GLOW = '0 0 12px 2px rgba(196, 160, 80, 0.10)';
const GOLD_BORDER = `0.5px solid ${tokens.gold}`;
const BLUR = 'blur(35px) saturate(1.1)';

/**
 * Unified chat bubble for /chat/mikayla and /messages/[who]. Implements
 * the 2026 Executive Shell spec: navy/frosted-glass surfaces, 0.5px
 * gold border, 35px backdrop-blur, 18px radius with one sharpened
 * leading-bottom corner per direction, and a soft gold glow on the
 * user's bubbles only.
 */
export function MessageBubble({
  body,
  timestamp,
  mine,
  tightTop = false,
  avatar,
  senderLabel,
  ariaLabel,
}: Props) {
  const topLeftR = mine ? RADIUS : tightTop ? SHARP : RADIUS;
  const topRightR = mine ? (tightTop ? SHARP : RADIUS) : RADIUS;
  const bottomLeftR = mine ? RADIUS : SHARP;
  const bottomRightR = mine ? SHARP : RADIUS;

  return (
    <div
      className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
      style={{ gap: 6, marginTop: tightTop ? 2 : 6 }}
    >
      {!mine && (
        <div className="shrink-0" style={{ width: 28 }}>
          {avatar}
        </div>
      )}
      <div
        className="flex flex-col"
        style={{
          maxWidth: '78%',
          alignItems: mine ? 'flex-end' : 'flex-start',
        }}
      >
        {!mine && senderLabel && (
          <span
            className="mb-0.5"
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.4px',
              color: tokens.gold,
              paddingLeft: 4,
            }}
          >
            {senderLabel}
          </span>
        )}
        <div
          aria-label={ariaLabel}
          style={{
            background: mine ? USER_BG : RECIPIENT_BG,
            border: GOLD_BORDER,
            backdropFilter: BLUR,
            WebkitBackdropFilter: BLUR,
            color: '#FFFFFF',
            fontSize: 14,
            lineHeight: 1.4,
            padding: '8px 12px',
            borderTopLeftRadius: topLeftR,
            borderTopRightRadius: topRightR,
            borderBottomLeftRadius: bottomLeftR,
            borderBottomRightRadius: bottomRightR,
            boxShadow: mine ? USER_GLOW : 'none',
            wordBreak: 'break-word',
          }}
        >
          {body}
        </div>
        {timestamp && (
          <span
            className="mt-0.5"
            style={{
              fontSize: 9,
              color: 'rgba(255,255,255,0.3)',
              paddingLeft: mine ? 0 : 4,
              paddingRight: mine ? 4 : 0,
            }}
          >
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
