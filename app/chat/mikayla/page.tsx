'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BottomNav } from '@/components/layout/BottomNav';
import { tokens } from '@/lib/design-tokens';

// MOrb already fires impact('light') in its tap handler before routing here,
// so the haptic requirement from the brief is satisfied at the call site.

const TYPING_MS = 1800;

export default function MikaylaChatPage() {
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setText('');
    setIsTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setIsTyping(false), TYPING_MS);
  };

  return (
    <main
      className="relative mx-auto flex flex-col"
      style={{
        maxWidth: 393,
        minHeight: '100dvh',
        background: tokens.bg,
        color: '#FFFFFF',
        paddingBottom: 'calc(88px + env(safe-area-inset-bottom))',
      }}
    >
      <header
        className="flex items-center justify-between px-4"
        style={{
          paddingTop: `calc(12px + env(safe-area-inset-top))`,
          paddingBottom: 10,
        }}
      >
        <Link
          href="/"
          className="text-[13px] no-underline"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          ← Back
        </Link>
        <span style={{ width: 40 }} aria-hidden="true" />
      </header>

      <div
        className="flex justify-center"
        style={{ paddingTop: 18, paddingBottom: 14 }}
      >
        <MonolineM typing={isTyping} />
      </div>

      <div style={{ flex: 1 }} />

      <form
        onSubmit={onSubmit}
        className="fixed left-0 right-0 mx-auto"
        style={{
          maxWidth: 393,
          bottom: 'calc(76px + env(safe-area-inset-bottom))',
          padding: '14px 20px 16px',
          background: 'rgba(7, 9, 15, 0.45)',
          backdropFilter: 'blur(25px) saturate(1.1)',
          WebkitBackdropFilter: 'blur(25px) saturate(1.1)',
          zIndex: 8,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message Mikayla"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#EDEEF2',
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: 0.1,
            padding: '6px 2px 8px',
            borderBottom: `1px solid rgba(196, 160, 80, 0.65)`,
            caretColor: tokens.gold,
          }}
        />
      </form>

      <BottomNav active="home" />
    </main>
  );
}

/**
 * Small gold monoline M. Conditional `feTurbulence` flag-wave kicks in only
 * while Mikayla is "typing" — gentler than the bottom MOrb's hold-state wave
 * (3s cycle, lower max displacement) so it reads as a steady breathing ripple
 * rather than a gust.
 */
function MonolineM({ typing }: { typing: boolean }) {
  return (
    <svg
      width={44}
      height={44}
      viewBox="0 0 32 32"
      aria-hidden="true"
      style={{ overflow: 'visible', display: 'block' }}
    >
      <defs>
        {typing && (
          <filter
            id="mikayla-typing-wave"
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
      <path
        d="M 5 25 L 5 7 L 16 19 L 27 7 L 27 25"
        fill="none"
        stroke={tokens.gold}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={typing ? 'url(#mikayla-typing-wave)' : undefined}
      />
    </svg>
  );
}
