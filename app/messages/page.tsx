'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  fetchThreads,
  type ThreadSummary,
  type ThreadKey,
} from '@/lib/queries/chatMessages';
import {
  tokens,
  familyColor,
  type FamilyMember,
} from '@/lib/design-tokens';
import { MMark } from '@/components/icons/MMark';

export default function MessagesInboxPage() {
  const [threads, setThreads] = useState<ThreadSummary[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const list = await fetchThreads();
      if (alive) setThreads(list);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main
      className="relative mx-auto"
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
          paddingBottom: 14,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(7,9,15,0.92)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Link href="/" className="text-[13px] text-white/60 no-underline">
          ← Back
        </Link>
        <span className="text-[16px] font-bold tracking-[-0.1px]">
          Messages
        </span>
        <span className="text-[11px] uppercase tracking-[1px] text-white/0">
          &nbsp;
        </span>
      </header>

      <div className="flex flex-col">
        {threads === null ? (
          <div className="pt-10 text-center text-white/40">Loading…</div>
        ) : (
          threads.map((t, i) => (
            <ThreadRow
              key={t.key}
              thread={t}
              isFirst={i === 0}
              isLast={i === threads.length - 1}
            />
          ))
        )}
      </div>
    </main>
  );
}

function ThreadRow({
  thread,
  isFirst,
  isLast,
}: {
  thread: ThreadSummary;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { key, title, lastMessage, unreadCount } = thread;
  const isMikayla = key === 'mikayla';
  const isFamily = key === 'family';
  const unread = unreadCount > 0;

  return (
    <Link
      href={`/messages/${key}`}
      prefetch={false}
      className="flex items-center no-underline"
      style={{
        color: 'inherit',
        gap: 12,
        padding: '12px 16px',
        borderBottom: isLast ? 'none' : '0.5px solid rgba(255,255,255,0.06)',
        background: isMikayla
          ? `linear-gradient(90deg, ${tokens.gold}12 0%, transparent 60%)`
          : 'transparent',
        position: 'relative',
      }}
    >
      {isFamily ? (
        <FamilyCluster />
      ) : isMikayla ? (
        <MikaylaAvatar />
      ) : (
        <MemberAvatar member={key as FamilyMember} />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className="truncate"
            style={{
              fontSize: 15,
              fontWeight: unread ? 700 : 600,
              color: isMikayla ? tokens.gold : '#FFFFFF',
              letterSpacing: '-0.1px',
            }}
          >
            {title}
          </span>
          {lastMessage && (
            <span
              className="shrink-0"
              style={{
                fontSize: 11,
                color: unread ? tokens.gold : 'rgba(255,255,255,0.35)',
                fontWeight: unread ? 700 : 500,
              }}
            >
              {formatRelative(lastMessage.createdAt)}
            </span>
          )}
        </div>
        <div
          className="flex items-center justify-between gap-2 mt-0.5"
          style={{ minHeight: 16 }}
        >
          <span
            className="truncate"
            style={{
              fontSize: 13,
              color: unread ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)',
              lineHeight: 1.25,
            }}
          >
            {lastMessage ? previewText(lastMessage.sender, lastMessage.body, key) : 'No messages yet'}
          </span>
          {unread && (
            <span
              className="shrink-0 flex items-center justify-center"
              style={{
                minWidth: 18,
                height: 18,
                padding: '0 6px',
                borderRadius: 999,
                background: isMikayla ? tokens.gold : tokens.red,
                color: isMikayla ? '#07090F' : '#FFFFFF',
                fontSize: 10,
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ─────────── avatars ─────────── */

function MikaylaAvatar() {
  // MMark provides the gold square / M / waveform / inner gold ring; the
  // outer span layers the diffuse gold halo that highlights the Mikayla
  // row in the inbox.
  return (
    <span
      className="shrink-0 inline-flex"
      style={{
        borderRadius: 12,
        boxShadow: `0 0 16px ${tokens.goldGlow}`,
      }}
    >
      <MMark size={52} />
    </span>
  );
}

function MemberAvatar({ member }: { member: FamilyMember }) {
  const [photoOk, setPhotoOk] = useState(true);
  const accent = familyColor(member);
  return (
    <span
      className="shrink-0 flex items-center justify-center"
      style={{
        width: 52,
        height: 52,
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
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: accent,
            lineHeight: 1,
          }}
        >
          {member.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}

function FamilyCluster() {
  const members: FamilyMember[] = ['shane', 'molly', 'evey', 'jax'];
  return (
    <span
      className="shrink-0 grid"
      style={{
        width: 52,
        height: 52,
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: 2,
        borderRadius: 14,
        overflow: 'hidden',
        background: '#0D1119',
      }}
    >
      {members.map((m) => (
        <ClusterTile key={m} member={m} />
      ))}
    </span>
  );
}

function ClusterTile({ member }: { member: FamilyMember }) {
  const [photoOk, setPhotoOk] = useState(true);
  const accent = familyColor(member);
  return (
    <span
      className="flex items-center justify-center"
      style={{
        width: '100%',
        height: '100%',
        background: `${accent}33`,
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
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: accent,
            lineHeight: 1,
          }}
        >
          {member.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}

/* ─────────── helpers ─────────── */

function previewText(sender: string, body: string, threadKey: ThreadKey): string {
  // In 1:1 threads + mikayla thread, skip the "X: " prefix — redundant.
  if (threadKey !== 'family') return body;
  const name =
    sender === 'mikayla'
      ? 'Mikayla'
      : sender.charAt(0).toUpperCase() + sender.slice(1);
  return `${name}: ${body}`;
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMin = Math.round((Date.now() - then) / 60_000);
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `${diffD}d`;
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
