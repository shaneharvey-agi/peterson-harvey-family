'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { BottomNav } from '@/components/layout/BottomNav';
import {
  chatMessageFromRow,
  fetchThreadMessages,
  parseThreadKey,
  threadTitle,
  type ChatMessage,
  type ThreadKey,
} from '@/lib/queries/chatMessages';
import { sendMessage, markThreadRead } from '@/lib/mutations/chatMessages';
import { supabase, type ChatMessageRow } from '@/lib/supabase';
import {
  tokens,
  familyColor,
  familyText,
  type FamilyMember,
} from '@/lib/design-tokens';

const COMPOSER_HEIGHT = 62;
const NAV_HEIGHT = 76; // approximate BottomNav height

export default function MessageThreadPage() {
  const params = useParams<{ who: string }>();
  const threadKey = parseThreadKey(params?.who ?? null);

  if (threadKey === null) notFound();

  return <ThreadView threadKey={threadKey} />;
}

function ThreadView({ threadKey }: { threadKey: ThreadKey }) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const list = await fetchThreadMessages(threadKey);
      if (alive) setMessages(list);
      // fire-and-forget — UI doesn't wait
      markThreadRead(threadKey);
    })();
    return () => {
      alive = false;
    };
  }, [threadKey]);

  // Supabase Realtime: subscribe to INSERTs on this thread so messages
  // written from another device (or by Mikayla / the M Orb voice flow)
  // appear instantly without polling. The supabase_realtime publication
  // includes chat_messages as of migration 2026-04-25.
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel(`chat:${threadKey}`)
        .on(
          'postgres_changes' as never,
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `thread_key=eq.${threadKey}`,
          },
          (payload: { new: ChatMessageRow }) => {
            const incoming = chatMessageFromRow(payload.new);
            setMessages((prev) => {
              if (!prev) return [incoming];
              // Already present (initial fetch or our own write echoed back)
              if (prev.some((m) => m.id === incoming.id)) return prev;
              // Replace any in-flight optimistic bubble that matches this
              // sender + body so the composer's optimistic append doesn't
              // double up when the realtime echo lands.
              const optimisticIdx = prev.findIndex(
                (m) =>
                  m.id.startsWith('local-') &&
                  m.sender === incoming.sender &&
                  m.body === incoming.body,
              );
              if (optimisticIdx >= 0) {
                const next = [...prev];
                next[optimisticIdx] = incoming;
                return next;
              }
              return [...prev, incoming];
            });
          },
        )
        .subscribe();
    } catch (err) {
      // Supabase env missing or realtime offline — fall back to no-live
      // mode silently. Initial fetch above still works via the mock path.
      console.warn('[realtime] subscription unavailable:', err);
    }
    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {
          /* noop */
        }
      }
    };
  }, [threadKey]);

  useEffect(() => {
    // Snap-scroll to bottom when messages arrive or update.
    if (messages && bottomRef.current) {
      bottomRef.current.scrollIntoView({ block: 'end' });
    }
  }, [messages]);

  const grouped = useMemo(() => groupByDay(messages ?? []), [messages]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);

    // Optimistic append so the bubble shows up immediately.
    const tempId = `local-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      threadKey,
      sender: 'shane',
      body: text,
      readAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...(prev ?? []), optimistic]);
    setDraft('');

    const res = await sendMessage({ threadKey, sender: 'shane', body: text });
    if (res.ok) {
      setMessages((prev) =>
        (prev ?? []).map((m) => (m.id === tempId ? res.data : m)),
      );
    }
    // If Supabase isn't configured (preview mode), leave the optimistic
    // message in place — it still looks correct.
    setSending(false);
  }

  const isMikayla = threadKey === 'mikayla';
  const isFamily = threadKey === 'family';

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
      {/* Header */}
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
        }}
      >
        <Link
          href="/messages"
          className="text-[14px] text-white/60 no-underline shrink-0"
          aria-label="Back to inbox"
        >
          ←
        </Link>
        <HeaderAvatar threadKey={threadKey} />
        <div className="flex-1 min-w-0">
          <div
            className="truncate"
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: isMikayla ? tokens.gold : '#FFFFFF',
              letterSpacing: '-0.1px',
            }}
          >
            {threadTitle(threadKey)}
          </div>
          <div
            className="text-[11px]"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            {isMikayla
              ? 'Your assistant'
              : isFamily
                ? 'Household group'
                : threadKey === 'shane'
                  ? 'Your own notes'
                  : 'Direct message'}
          </div>
        </div>
      </header>

      {/* Message list */}
      <div className="px-3 py-3 flex flex-col gap-1">
        {messages === null ? (
          <div className="pt-10 text-center text-white/40 text-[13px]">
            Loading…
          </div>
        ) : messages.length === 0 ? (
          <EmptyThread threadKey={threadKey} />
        ) : (
          grouped.map((group) => (
            <DayGroup
              key={group.dayKey}
              label={group.label}
              messages={group.messages}
              threadKey={threadKey}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <Composer
        draft={draft}
        onDraft={setDraft}
        onSend={handleSend}
        disabled={sending}
        threadKey={threadKey}
      />

      <BottomNav active="home" />
    </main>
  );
}

/* ─────────── day grouping ─────────── */

interface DayGroupData {
  dayKey: string;
  label: string;
  messages: ChatMessage[];
}

function groupByDay(messages: ChatMessage[]): DayGroupData[] {
  const out: DayGroupData[] = [];
  for (const m of messages) {
    const d = new Date(m.createdAt);
    const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const last = out[out.length - 1];
    if (last && last.dayKey === dayKey) {
      last.messages.push(m);
    } else {
      out.push({ dayKey, label: formatDayLabel(d), messages: [m] });
    }
  }
  return out;
}

function formatDayLabel(d: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today.getTime() - that.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: 'long' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function DayGroup({
  label,
  messages,
  threadKey,
}: {
  label: string;
  messages: ChatMessage[];
  threadKey: ThreadKey;
}) {
  return (
    <>
      <div
        className="text-center mt-2 mb-1"
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '1.5px',
          color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      {messages.map((m, idx) => {
        const prev = idx > 0 ? messages[idx - 1] : null;
        const sameSenderAsPrev = prev?.sender === m.sender;
        return (
          <Bubble
            key={m.id}
            message={m}
            showAvatar={!sameSenderAsPrev && m.sender !== 'shane'}
            tightTop={sameSenderAsPrev}
            threadKey={threadKey}
          />
        );
      })}
    </>
  );
}

/* ─────────── bubble ─────────── */

function Bubble({
  message,
  showAvatar,
  tightTop,
  threadKey,
}: {
  message: ChatMessage;
  showAvatar: boolean;
  tightTop: boolean;
  threadKey: ThreadKey;
}) {
  const mine = message.sender === 'shane';
  const isMikayla = message.sender === 'mikayla';
  const memberAccent = !isMikayla
    ? familyColor(message.sender as FamilyMember)
    : tokens.gold;

  const bg = mine
    ? tokens.shane
    : isMikayla
      ? `${tokens.gold}22`
      : `${memberAccent}22`;
  const borderCol = mine
    ? 'transparent'
    : isMikayla
      ? `${tokens.gold}66`
      : `${memberAccent}55`;
  const textCol = mine ? '#FFFFFF' : isMikayla ? '#F0E0B5' : '#FFFFFF';

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
          {showAvatar && (
            <BubbleAvatar sender={message.sender} />
          )}
        </div>
      )}
      <div
        className="flex flex-col"
        style={{
          maxWidth: '78%',
          alignItems: mine ? 'flex-end' : 'flex-start',
        }}
      >
        {!mine && showAvatar && threadKey === 'family' && (
          <span
            className="mb-0.5"
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.4px',
              color: isMikayla
                ? tokens.gold
                : familyText(message.sender as FamilyMember),
              paddingLeft: 4,
            }}
          >
            {capitalize(message.sender)}
          </span>
        )}
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

function BubbleAvatar({ sender }: { sender: ChatMessage['sender'] }) {
  const [photoOk, setPhotoOk] = useState(true);
  if (sender === 'mikayla') {
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
  const accent = familyColor(sender);
  return (
    <span
      className="flex items-center justify-center"
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: '#0D1119',
        border: `1.5px solid ${accent}`,
        overflow: 'hidden',
      }}
    >
      {photoOk ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/avatars/${sender}.jpg`}
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
        <span style={{ fontSize: 11, fontWeight: 700, color: accent }}>
          {sender.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}

/* ─────────── composer ─────────── */

function Composer({
  draft,
  onDraft,
  onSend,
  disabled,
  threadKey,
}: {
  draft: string;
  onDraft: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  threadKey: ThreadKey;
}) {
  const canSend = draft.trim().length > 0 && !disabled;
  return (
    <div
      className="fixed left-1/2"
      style={{
        transform: 'translateX(-50%)',
        bottom: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom))`,
        width: '100%',
        maxWidth: 393,
        padding: '8px 12px',
        background: 'rgba(7,9,15,0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '0.5px solid rgba(255,255,255,0.08)',
        zIndex: 9,
      }}
    >
      <div
        className="flex items-center"
        style={{
          gap: 8,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 999,
          padding: '6px 6px 6px 14px',
        }}
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => onDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={placeholderFor(threadKey)}
          className="flex-1 min-w-0"
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#FFFFFF',
            fontSize: 14,
            padding: '6px 0',
          }}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          aria-label="Send"
          className="shrink-0 flex items-center justify-center"
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            border: 'none',
            background: canSend ? tokens.gold : 'rgba(255,255,255,0.1)',
            color: canSend ? '#07090F' : 'rgba(255,255,255,0.35)',
            cursor: canSend ? 'pointer' : 'default',
            transition: 'background 120ms ease',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 12l16-8-6 16-2-7-8-1z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
      <div
        className="text-center"
        style={{
          fontSize: 9,
          color: 'rgba(255,255,255,0.3)',
          marginTop: 4,
          letterSpacing: '0.3px',
        }}
      >
        Press &amp; hold M to ask Mikayla
      </div>
    </div>
  );
}

function placeholderFor(key: ThreadKey): string {
  if (key === 'mikayla') return 'Ask Mikayla anything…';
  if (key === 'family') return 'Message family';
  if (key === 'shane') return 'Note to self…';
  return `Message ${capitalize(key)}`;
}

/* ─────────── header avatar ─────────── */

function HeaderAvatar({ threadKey }: { threadKey: ThreadKey }) {
  if (threadKey === 'mikayla') {
    return (
      <span
        className="shrink-0 flex items-center justify-center"
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: tokens.gold,
          boxShadow: `0 0 10px ${tokens.goldGlow}`,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 800, color: '#07090F' }}>
          M
        </span>
      </span>
    );
  }
  if (threadKey === 'family') {
    return (
      <span
        className="shrink-0 grid"
        style={{
          width: 32,
          height: 32,
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          borderRadius: 8,
          overflow: 'hidden',
          gap: 1,
        }}
      >
        {(['shane', 'molly', 'evey', 'jax'] as FamilyMember[]).map((m) => (
          <span
            key={m}
            style={{
              background: familyColor(m),
            }}
          />
        ))}
      </span>
    );
  }
  return <MemberHeadAvatar member={threadKey as FamilyMember} />;
}

function MemberHeadAvatar({ member }: { member: FamilyMember }) {
  const [photoOk, setPhotoOk] = useState(true);
  const accent = familyColor(member);
  return (
    <span
      className="shrink-0 flex items-center justify-center"
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: '#0D1119',
        border: `2px solid ${accent}`,
        overflow: 'hidden',
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
        <span style={{ fontSize: 12, fontWeight: 700, color: accent }}>
          {member.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}

/* ─────────── empty ─────────── */

function EmptyThread({ threadKey }: { threadKey: ThreadKey }) {
  const hint =
    threadKey === 'mikayla'
      ? 'Ask her anything. She\u2019ll remember.'
      : threadKey === 'family'
        ? 'Say good morning to the house.'
        : threadKey === 'shane'
          ? 'Jot anything — only you see this.'
          : `Start a note to ${capitalize(threadKey)}.`;
  return (
    <div className="pt-16 text-center">
      <div className="text-[13px] text-white/50">No messages yet.</div>
      <div className="text-[11px] text-white/30 mt-1">{hint}</div>
    </div>
  );
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}
