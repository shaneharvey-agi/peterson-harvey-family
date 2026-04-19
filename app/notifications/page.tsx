'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  fetchNotifications,
  type Notification,
  type NotificationSeverity,
} from '@/lib/queries/notifications';
import {
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
} from '@/lib/mutations/notifications';
import { tokens } from '@/lib/design-tokens';

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const list = await fetchNotifications();
      if (alive) setItems(list);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const unreadCount = items?.filter((n) => n.readAt === null).length ?? 0;

  async function handleMarkAllRead() {
    if (!items || busy) return;
    setBusy(true);
    await markAllNotificationsRead();
    setItems(
      items.map((n) => ({
        ...n,
        readAt: n.readAt ?? new Date().toISOString(),
      })),
    );
    setBusy(false);
  }

  async function handleOpen(n: Notification) {
    if (n.readAt === null) {
      await markNotificationRead(n.id);
      setItems((prev) =>
        prev
          ? prev.map((x) =>
              x.id === n.id
                ? { ...x, readAt: new Date().toISOString() }
                : x,
            )
          : prev,
      );
    }
    if (n.actionUrl) router.push(n.actionUrl);
  }

  async function handleDismiss(n: Notification) {
    if (busy) return;
    setBusy(true);
    await dismissNotification(n.id);
    setItems((prev) => (prev ? prev.filter((x) => x.id !== n.id) : prev));
    setBusy(false);
  }

  return (
    <main
      className="relative mx-auto"
      style={{
        maxWidth: 393,
        minHeight: '100dvh',
        background: tokens.bg,
        color: '#FFFFFF',
      }}
    >
      <header
        className="flex items-center justify-between px-4"
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
        <Link href="/" className="text-[13px] text-white/60 no-underline">
          ← Back
        </Link>
        <span className="text-[11px] uppercase tracking-[1px] text-white/40">
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        </span>
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={busy || unreadCount === 0}
          className="text-[11px] font-semibold"
          style={{
            color: unreadCount > 0 ? tokens.gold : 'rgba(255,255,255,0.25)',
            padding: 0,
            background: 'transparent',
            border: 'none',
          }}
        >
          Mark all
        </button>
      </header>

      <div className="px-4 pb-24 pt-2 flex flex-col gap-2">
        {items === null ? (
          <div className="pt-10 text-center text-white/40">Loading…</div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          items.map((n) => (
            <NotificationCard
              key={n.id}
              notif={n}
              onOpen={() => handleOpen(n)}
              onDismiss={() => handleDismiss(n)}
            />
          ))
        )}
      </div>
    </main>
  );
}

/* ─────────── Card ─────────── */

function NotificationCard({
  notif,
  onOpen,
  onDismiss,
}: {
  notif: Notification;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const unread = notif.readAt === null;
  const accent = severityColor(notif.severity);

  return (
    <div
      className="relative rounded-md"
      style={{
        background: unread
          ? `${accent}14`
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${unread ? `${accent}55` : 'rgba(255,255,255,0.06)'}`,
        padding: '12px 14px',
      }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="text-left w-full"
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          color: '#FFFFFF',
        }}
      >
        <div className="flex items-start gap-2.5">
          <SeverityIcon severity={notif.severity} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <div
                className="text-[13px] font-semibold truncate"
                style={{ color: unread ? '#FFFFFF' : 'rgba(255,255,255,0.7)' }}
              >
                {notif.title}
              </div>
              <span className="text-[10px] text-white/40 shrink-0">
                {formatAge(notif.createdAt)}
              </span>
            </div>
            {notif.body && (
              <div
                className="text-[11px] leading-snug mt-1"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                {notif.body}
              </div>
            )}
            {notif.actionLabel && (
              <div
                className="text-[11px] font-semibold mt-2"
                style={{ color: accent }}
              >
                {notif.actionLabel} →
              </div>
            )}
          </div>
        </div>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        aria-label="Dismiss"
        className="absolute"
        style={{
          top: 8,
          right: 8,
          width: 22,
          height: 22,
          borderRadius: 999,
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.3)',
          fontSize: 14,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="pt-16 text-center">
      <div className="text-[28px]" aria-hidden>✨</div>
      <div className="text-[13px] text-white/55 mt-2">
        Nothing for you right now.
      </div>
      <div className="text-[11px] text-white/35 mt-1">
        Mikayla will drop things here as she finds them.
      </div>
    </div>
  );
}

/* ─────────── helpers ─────────── */

function SeverityIcon({ severity }: { severity: NotificationSeverity }) {
  const color = severityColor(severity);
  return (
    <span
      aria-hidden
      className="flex items-center justify-center shrink-0"
      style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: `${color}2A`,
        border: `1px solid ${color}66`,
        color,
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {severity === 'urgent' ? '!' : severity === 'warning' ? '·' : 'i'}
    </span>
  );
}

function severityColor(s: NotificationSeverity): string {
  if (s === 'urgent') return tokens.red;
  if (s === 'warning') return tokens.gold;
  return tokens.shane;
}

function formatAge(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMin = Math.round((Date.now() - then) / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.round(diffH / 24);
  return `${diffD}d`;
}
