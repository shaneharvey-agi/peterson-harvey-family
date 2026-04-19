'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageCard } from './MessageCard';
import { fetchMessages, type Message } from '@/lib/queries/messages';

function destinationFor(m: Message): string | null {
  // Tap-through: each home-feed card lands in the right conversation.
  // Brief = Mikayla's thread. Urgent = family (or the named member).
  // DM = that member's thread. Meal has no thread yet.
  if (m.type === 'brief') return '/messages/mikayla';
  if (m.type === 'urgent') return `/messages/${m.from ?? 'family'}`;
  if (m.type === 'dm' && m.from) return `/messages/${m.from}`;
  return null;
}

export function MessageCarousel() {
  const [messages, setMessages] = useState<Message[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const list = await fetchMessages();
      if (!alive) return;
      setMessages(list);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (messages === null) {
    return <div className="h-[130px]" aria-hidden />;
  }

  return (
    <div>
      <div
        className="-mx-4 scroll-px-4"
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          touchAction: 'pan-x',
        }}
      >
        <div
          className="flex gap-2 px-4 pb-2"
          style={{ width: 'max-content', touchAction: 'pan-x' }}
        >
          {messages.map((m) => {
            const href = destinationFor(m);
            const card = <MessageCard message={m} />;
            return href ? (
              <Link
                key={m.id}
                href={href}
                prefetch={false}
                className="no-underline"
                style={{ color: 'inherit', flexShrink: 0 }}
                aria-label={`Open ${m.title}`}
              >
                {card}
              </Link>
            ) : (
              <div key={m.id} style={{ flexShrink: 0 }}>
                {card}
              </div>
            );
          })}
          {/* 80px peek card */}
          <div
            aria-hidden
            style={{
              width: 80,
              minWidth: 80,
              height: 110,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(255,255,255,0.08)',
              flexShrink: 0,
            }}
          />
        </div>
      </div>

      {/* Pagination dots */}
      <div className="flex justify-center items-center gap-1 mt-2">
        {messages.map((_, i) => {
          const active = i === 0;
          return (
            <span
              key={i}
              aria-hidden
              style={{
                width: active ? 14 : 4,
                height: 3,
                borderRadius: 2,
                background: active ? '#FFFFFF' : 'rgba(255,255,255,0.22)',
                transition: 'all 200ms ease',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
