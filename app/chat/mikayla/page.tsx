'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BottomNav } from '@/components/layout/BottomNav';
import { tokens } from '@/lib/design-tokens';
import { impact } from '@/lib/haptics';

const NAV_HEIGHT = 76;
const COMPOSER_HEIGHT = 62;
const TYPING_MS = 1800;

interface LocalMessage {
  id: string;
  sender: 'shane' | 'mikayla';
  body: string;
  createdAt: string;
}

export default function MikaylaChatPage() {
  // useSearchParams() forces a CSR bailout in Next 14 — wrap in Suspense so
  // the static shell can still prerender while the dynamic param resolves.
  return (
    <Suspense fallback={null}>
      <MikaylaChatPageInner />
    </Suspense>
  );
}

function MikaylaChatPageInner() {
  const searchParams = useSearchParams();
  // M Orb fallback path lands here with ?prefill=<transcript> when intent
  // routing can't dispatch directly — seed the composer so the captured
  // words are visible and one tap from being sent.
  const prefill = searchParams?.get('prefill') ?? '';
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [draft, setDraft] = useState(prefill);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Slide-in haptic per brief. MOrb already fires impact('light') on tap so
  // this stacks one more pulse at mount, mirroring the slide-up motion.
  useEffect(() => {
    impact('light');
  }, []);

  // Delay focus a touch so the route transition settles before the keyboard rises.
  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, []);

  // Snap to the latest bubble whenever the list grows.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, isTyping]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;

    const now = Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: `u-${now}`,
        sender: 'shane',
        body: text,
        createdAt: new Date(now).toISOString(),
      },
    ]);
    setDraft('');
    setIsTyping(true);

    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setIsTyping(false);
      // Placeholder reply until LLM streaming is wired up.
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          sender: 'mikayla',
          body: 'Got it — I\u2019ll get back to you on this in a sec.',
          createdAt: new Date().toISOString(),
        },
      ]);
    }, TYPING_MS);
  };

  return (
    <main
      className="relative mx-auto"
      style={{
        maxWidth: 393,
        minHeight: '100dvh',
        background: tokens.bg,
        color: '#FFFFFF',
        paddingBottom: `calc(${COMPOSER_HEIGHT + NAV_HEIGHT}px + env(safe-area-inset-bottom))`,
      }}
    >
      {/* Sticky header — mirrors /messages/[who] structure but the brand
          cluster (gold 28px M + wordmark) is anchored top-left exactly as
          it appears in the home-screen TopStrip. The M waves during typing. */}
      <header
        className="flex items-center gap-3 px-4"
        style={{
          paddingTop: `calc(12px + env(safe-area-inset-top))`,
          paddingBottom: 12,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(7,9,15,0.92)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        <Link
          href="/"
          className="text-[14px] no-underline shrink-0"
          aria-label="Back home"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          ←
        </Link>
        <BrandCluster typing={isTyping} />
      </header>

      {/* Message list */}
      <div className="px-3 py-3 flex flex-col gap-1">
        {messages.length === 0 && !isTyping ? (
          <EmptyThread />
        ) : (
          messages.map((m, idx) => {
            const prev = idx > 0 ? messages[idx - 1] : null;
            const sameSenderAsPrev = prev?.sender === m.sender;
            return (
              <Bubble
                key={m.id}
                message={m}
                showAvatar={!sameSenderAsPrev && m.sender !== 'shane'}
                tightTop={sameSenderAsPrev}
              />
            );
          })
        )}
        {isTyping && <TypingBubble />}
        <div ref={bottomRef} />
      </div>

      {/* Composer — pill matches family-chat shell (radius 999, 34px send
          button, same padding) with the Liquid Glass treatment layered on:
          35px backdrop blur on the pill itself, 0.5px gold border. The outer
          fixed container is fully transparent so there's no second border or
          competing background where the bubble meets the BottomNav. */}
      <form
        onSubmit={onSubmit}
        className="fixed left-1/2"
        style={{
          transform: 'translateX(-50%)',
          bottom: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom))`,
          width: '100%',
          maxWidth: 393,
          padding: '8px 12px',
          background: 'transparent',
          zIndex: 9,
        }}
      >
        <div
          className="flex items-center"
          style={{
            gap: 8,
            background: 'rgba(7, 9, 15, 0.45)',
            backdropFilter: 'blur(35px) saturate(1.15)',
            WebkitBackdropFilter: 'blur(35px) saturate(1.15)',
            border: '0.5px solid rgba(196, 160, 80, 0.55)',
            borderRadius: 999,
            padding: '6px 6px 6px 14px',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
            placeholder={'Ask Mikayla anything\u2026'}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="send"
            className="flex-1 min-w-0"
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#FFFFFF',
              fontSize: 14,
              padding: '6px 0',
              caretColor: tokens.gold,
            }}
          />
          <button
            type="submit"
            disabled={draft.trim().length === 0}
            aria-label="Send"
            className="shrink-0 flex items-center justify-center"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: 'none',
              background:
                draft.trim().length > 0 ? tokens.gold : 'rgba(255,255,255,0.1)',
              color:
                draft.trim().length > 0
                  ? '#07090F'
                  : 'rgba(255,255,255,0.35)',
              cursor: draft.trim().length > 0 ? 'pointer' : 'default',
              transition: 'background 120ms ease, color 120ms ease',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 12l16-8-6 16-2-7-8-1z" fill="currentColor" />
            </svg>
          </button>
        </div>
      </form>

      <BottomNav active="home" />
    </main>
  );
}

/* ─────────── brand cluster ─────────── */

function BrandCluster({ typing }: { typing: boolean }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: tokens.gold,
        }}
      >
        <BrandM typing={typing} />
      </div>
      <span
        className="wordmark"
        style={{
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: '0.3px',
          lineHeight: 1,
        }}
      >
        Mikayla
      </span>
    </div>
  );
}

/**
 * The bold black "M" inside the gold square. Conditional `feTurbulence`
 * flag-wave activates only while Mikayla is typing — a subtle 3s breathing
 * ripple, lighter than the bottom MOrb's hold-state wave (4s/1.6 max).
 */
function BrandM({ typing }: { typing: boolean }) {
  return (
    <svg
      width={20}
      height={22}
      viewBox="0 0 20 22"
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        {typing && (
          <filter
            id="brand-m-typing-wave"
            x="-25%"
            y="-30%"
            width="150%"
            height="160%"
            filterUnits="objectBoundingBox"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.022 0.060"
              numOctaves="2"
              seed="5"
              stitchTiles="stitch"
              result="turb"
            >
              <animate
                attributeName="baseFrequency"
                dur="3s"
                values="0.018 0.060; 0.030 0.048; 0.018 0.060"
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
                dur="3s"
                values="0; 1.0; 0.3; 1.2; 0"
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
        x="10"
        y="17"
        textAnchor="middle"
        fontFamily="'Helvetica Neue', sans-serif"
        fontSize="18"
        fontWeight={800}
        fill="#000"
        filter={typing ? 'url(#brand-m-typing-wave)' : undefined}
      >
        M
      </text>
    </svg>
  );
}

/* ─────────── bubble ─────────── */

function Bubble({
  message,
  showAvatar,
  tightTop,
}: {
  message: LocalMessage;
  showAvatar: boolean;
  tightTop: boolean;
}) {
  const mine = message.sender === 'shane';
  const isMikayla = message.sender === 'mikayla';

  const bg = mine ? tokens.shane : `${tokens.gold}22`;
  const borderCol = mine ? 'transparent' : `${tokens.gold}66`;
  const textCol = mine ? '#FFFFFF' : '#F0E0B5';

  const time = new Date(message.createdAt).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div
      className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
      style={{
        gap: 6,
        marginTop: tightTop ? 2 : 6,
      }}
    >
      {!mine && (
        <div className="shrink-0" style={{ width: 28 }}>
          {showAvatar && isMikayla && <MikaylaBubbleAvatar />}
        </div>
      )}
      <div
        className="flex flex-col"
        style={{
          maxWidth: '78%',
          alignItems: mine ? 'flex-end' : 'flex-start',
        }}
      >
        <div
          style={{
            background: bg,
            border: `1px solid ${borderCol}`,
            color: textCol,
            fontSize: 14,
            lineHeight: 1.35,
            padding: '8px 12px',
            borderRadius: 16,
            borderTopLeftRadius: mine || tightTop ? 16 : 4,
            borderTopRightRadius: mine && tightTop ? 4 : 16,
            borderBottomRightRadius: mine ? 4 : 16,
            borderBottomLeftRadius: !mine ? 4 : 16,
            wordBreak: 'break-word',
          }}
        >
          {message.body}
        </div>
        <span
          className="mt-0.5"
          style={{
            fontSize: 9,
            color: 'rgba(255,255,255,0.3)',
            paddingLeft: mine ? 0 : 4,
            paddingRight: mine ? 4 : 0,
          }}
        >
          {time}
        </span>
      </div>
    </div>
  );
}

function MikaylaBubbleAvatar() {
  return (
    <span
      className="flex items-center justify-center"
      style={{
        width: 28,
        height: 28,
        borderRadius: 7,
        background: tokens.gold,
        fontSize: 14,
        fontWeight: 800,
        color: '#07090F',
      }}
    >
      M
    </span>
  );
}

/* ─────────── typing indicator ─────────── */

function TypingBubble() {
  return (
    <div className="flex justify-start" style={{ gap: 6, marginTop: 6 }}>
      <div className="shrink-0" style={{ width: 28 }}>
        <MikaylaBubbleAvatar />
      </div>
      <div
        style={{
          background: `${tokens.gold}22`,
          border: `1px solid ${tokens.gold}66`,
          padding: '10px 14px',
          borderRadius: 16,
          borderBottomLeftRadius: 4,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}
        aria-label="Mikayla is typing"
      >
        <Dot delay="0s" />
        <Dot delay="0.18s" />
        <Dot delay="0.36s" />
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="waveform-bar"
      style={{
        width: 5,
        height: 5,
        borderRadius: '50%',
        background: tokens.gold,
        animationDelay: delay,
        transformOrigin: 'center',
      }}
    />
  );
}

/* ─────────── empty state ─────────── */

function EmptyThread() {
  return (
    <div className="pt-16 text-center">
      <div className="text-[13px] text-white/50">No messages yet.</div>
      <div className="text-[11px] text-white/30 mt-1">
        Ask her anything. She&rsquo;ll remember.
      </div>
    </div>
  );
}
