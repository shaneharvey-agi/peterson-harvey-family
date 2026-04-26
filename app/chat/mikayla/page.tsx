'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { tokens } from '@/lib/design-tokens';
import { impact } from '@/lib/haptics';
import { MMark } from '@/components/icons/MMark';
import { MessageBubble } from '@/components/messages/MessageBubble';

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
          competing background where the bubble meets the BottomNav.

          Bottom-padding is set asymmetrically (25px) so the pill sits the
          same distance above the BottomNav as it does on /messages/[who],
          where the "Press & hold M" tip line provides that lift naturally.
          The M orb pokes ~20px above the nav, so the pill needs the extra
          clearance — without it the orb covers the bottom of the pill. */}
      <form
        onSubmit={onSubmit}
        className="fixed left-1/2"
        style={{
          transform: 'translateX(-50%)',
          bottom: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom))`,
          width: '100%',
          maxWidth: 393,
          padding: '8px 12px 25px',
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
    </main>
  );
}

/* ─────────── brand cluster ─────────── */

function BrandCluster({ typing }: { typing: boolean }) {
  return (
    <div
      className="flex min-w-0"
      aria-label="Mikayla"
      style={{ gap: 4, alignItems: 'flex-start' }}
    >
      <MMark size={32} waving={typing} />
      <span
        className="wordmark"
        style={{
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: '0.3px',
          lineHeight: 1,
          // Aligns the wordmark's cap-top with the M's cap-top inside
          // the icon (M cap-top ≈ 5px below icon top; wordmark cap-top
          // ≈ 1px below its line-box top).
          marginTop: 4,
        }}
      >
        ikayla
      </span>
    </div>
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
  const time = new Date(message.createdAt).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  return (
    <MessageBubble
      mine={mine}
      tightTop={tightTop}
      body={message.body}
      timestamp={time}
      avatar={showAvatar && message.sender === 'mikayla' ? <MMark size={28} /> : null}
    />
  );
}

/* ─────────── typing indicator ─────────── */

function TypingBubble() {
  return (
    <MessageBubble
      mine={false}
      avatar={<MMark size={28} />}
      ariaLabel="Mikayla is typing"
      body={
        <span
          className="inline-flex items-center"
          style={{ gap: 4, padding: '2px 0' }}
        >
          <Dot delay="0s" />
          <Dot delay="0.18s" />
          <Dot delay="0.36s" />
        </span>
      }
    />
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
