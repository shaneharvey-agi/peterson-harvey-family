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
        // Reserve space for the persistent BottomNav (mounted in app/layout.tsx).
        paddingBottom: 'calc(96px + env(safe-area-inset-bottom))',
      }}
    >
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
        <div className="flex-1 min-w-0">
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.1px',
            }}
          >
            Alerts
          </div>
          <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {unreadCount > 0
              ? `${unreadCount} new ${unreadCount === 1 ? 'item' : 'items'}`
              : 'All caught up'}
          </div>
        </div>
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={busy || unreadCount === 0}
          className="text-[11px] font-semibold shrink-0"
          style={{
            color: unreadCount > 0 ? tokens.gold : 'rgba(255,255,255,0.25)',
            padding: '6px 10px',
            background: 'transparent',
            border: 'none',
            letterSpacing: '0.2px',
          }}
        >
          Mark all
        </button>
      </header>

      <div className="px-4 pb-24 pt-3 flex flex-col gap-2.5">
        {items === null ? (
          <div className="pt-10 text-center text-white/40 text-[13px]">Loading…</div>
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

  // Executive Shell tile: deep navy frosted glass, gold hairline, 18px
  // radius, soft gold glow on unread (matches user-bubble physics).
  // Severity reads as a 3px colored stripe down the leading edge — keeps
  // the surface on-spec while still flagging urgency at a glance.
  return (
    <div
      className="relative"
      style={{
        background: unread ? 'rgba(15, 31, 56, 0.55)' : 'rgba(255, 255, 255, 0.04)',
        border: `0.5px solid ${tokens.gold}`,
        backdropFilter: 'blur(35px) saturate(1.1)',
        WebkitBackdropFilter: 'blur(35px) saturate(1.1)',
        borderRadius: 18,
        padding: '12px 14px 12px 18px',
        boxShadow: unread ? '0 0 12px 2px rgba(196, 160, 80, 0.10)' : 'none',
        opacity: unread ? 1 : 0.72,
        overflow: 'hidden',
      }}
    >
      {/* Severity stripe on the leading edge */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 8,
          bottom: 8,
          left: 0,
          width: 3,
          borderRadius: '0 2px 2px 0',
          background: accent,
          opacity: unread ? 1 : 0.5,
        }}
      />
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
          <div className="flex-1 min-w-0" style={{ paddingRight: 18 }}>
            <div className="flex items-baseline justify-between gap-2">
              <div
                className="text-[13px] font-semibold truncate"
                style={{
                  color: unread ? '#FFFFFF' : 'rgba(255,255,255,0.65)',
                  letterSpacing: '-0.1px',
                }}
              >
                {notif.title}
              </div>
              <span
                className="shrink-0"
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.4)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatAge(notif.createdAt)}
              </span>
            </div>
            {notif.body && (
              <div
                className="text-[12px] leading-snug mt-1"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                {notif.body}
              </div>
            )}
            {notif.actionLabel && (
              <span
                className="inline-flex items-center mt-2.5"
                style={{
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: 'rgba(7, 9, 15, 0.55)',
                  border: `0.5px solid ${tokens.gold}`,
                  color: tokens.gold,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.2px',
                }}
              >
                {notif.actionLabel}
                <span aria-hidden style={{ fontSize: 10 }}>→</span>
              </span>
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
        className="absolute flex items-center justify-center"
        style={{
          top: 6,
          right: 6,
          width: 22,
          height: 22,
          borderRadius: 999,
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.35)',
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
    <div className="pt-20 text-center px-6">
      <div
        className="mx-auto"
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: `0.5px solid ${tokens.gold}`,
          background: 'rgba(15, 31, 56, 0.55)',
          backdropFilter: 'blur(35px) saturate(1.1)',
          WebkitBackdropFilter: 'blur(35px) saturate(1.1)',
          boxShadow: '0 0 12px 2px rgba(196, 160, 80, 0.10)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 12.5l4 4L19 7"
            stroke={tokens.gold}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div
        className="mt-4"
        style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.1px' }}
      >
        All caught up
      </div>
      <div
        className="mt-1.5"
        style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.45 }}
      >
        Mikayla will surface things here as they come up.
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
        background: `${color}26`,
        border: `0.5px solid ${color}88`,
        color,
        fontSize: 12,
        fontWeight: 800,
        lineHeight: 1,
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
