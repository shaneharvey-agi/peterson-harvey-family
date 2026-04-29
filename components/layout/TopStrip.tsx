'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { tokens } from '@/lib/design-tokens';
import { fetchUnreadCount } from '@/lib/queries/notifications';
import { fetchTotalUnreadMessages } from '@/lib/queries/chatMessages';
import { impact } from '@/lib/haptics';
import { MMark } from '@/components/icons/MMark';
import { QuickAddMenu } from './QuickAddMenu';

export function TopStrip({ unreadMessages }: { unreadMessages?: number }) {
  const [unreadNotifs, setUnreadNotifs] = useState<number>(0);
  const [unreadMsgs, setUnreadMsgs] = useState<number>(unreadMessages ?? 0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [n, m] = await Promise.all([
        fetchUnreadCount(),
        unreadMessages === undefined ? fetchTotalUnreadMessages() : Promise.resolve(unreadMessages),
      ]);
      if (alive) {
        setUnreadNotifs(n);
        setUnreadMsgs(m);
      }
    })();
    return () => {
      alive = false;
    };
  }, [unreadMessages]);

  return (
    <header
      className="sticky top-0 z-10"
      style={{
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        background: 'rgba(7, 9, 15, 0.92)',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Left cluster — unified brand logo: orb-framed architectural M
            monogram acts as the leading "M" of "Mikayla", so the wordmark
            reads "ikayla" beside it. The 2px gap is intentionally tight
            so the i feels like a natural continuation of the M asset
            rather than a separate logo + word. */}
        <div
          className="flex"
          aria-label="Mikayla"
          style={{ gap: 2, alignItems: 'flex-start' }}
        >
          <MMark size={32} />
          <span
            className="wordmark"
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: '0.1px',
              lineHeight: 1,
              // Push the wordmark down so its cap-top aligns with the
              // monogram's optical cap-top inside the orb.
              marginTop: 3,
            }}
          >
            ikayla
          </span>
        </div>

        {/* Right cluster */}
        <div className="flex items-center" style={{ gap: 13 }}>
          {/* + button */}
          <button
            type="button"
            aria-label="Quick add"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              background: menuOpen
                ? 'rgba(196, 160, 80, 0.18)'
                : 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${menuOpen ? tokens.gold : 'rgba(255, 255, 255, 0.25)'}`,
              color: '#FFFFFF',
              padding: 0,
              transition: 'background 160ms ease, border-color 160ms ease, transform 200ms ease',
              transform: menuOpen ? 'rotate(45deg)' : 'rotate(0deg)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M7 1.5V12.5M1.5 7H12.5"
                stroke={menuOpen ? tokens.gold : '#FFFFFF'}
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* Messages — jumps to the inbox */}
          <Link
            href="/messages"
            prefetch={false}
            aria-label={
              unreadMsgs > 0
                ? `Messages, ${unreadMsgs} unread`
                : 'Messages'
            }
            className="relative flex items-center justify-center no-underline"
            style={{
              width: 32,
              height: 32,
              padding: 0,
              background: 'transparent',
              border: 'none',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v10c0 .83-.67 1.5-1.5 1.5H9l-3.5 3v-3H5.5C4.67 17 4 16.33 4 15.5v-10z"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
            {unreadMsgs > 0 && (
              <span
                className="pulse-red absolute flex items-center justify-center"
                style={{
                  top: -2,
                  right: -2,
                  minWidth: 16,
                  height: 16,
                  padding: '0 4px',
                  borderRadius: 999,
                  background: tokens.red,
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 700,
                  border: `1.5px solid ${tokens.bg}`,
                  lineHeight: 1,
                }}
              >
                {unreadMsgs}
              </span>
            )}
          </Link>

          {/* Notifications bell — Mikayla's proactive feed. Stroke turns
              gold when unread > 0 so the icon itself reads as "lit," and
              tap fires a light haptic to mark the transition into the
              feed. */}
          <Link
            href="/notifications"
            prefetch={false}
            onClick={() => impact('light')}
            aria-label={
              unreadNotifs > 0
                ? `Notifications, ${unreadNotifs} unread`
                : 'Notifications'
            }
            className="relative flex items-center justify-center no-underline"
            style={{
              width: 32,
              height: 32,
              padding: 0,
              background: 'transparent',
              border: 'none',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5z"
                stroke={unreadNotifs > 0 ? tokens.gold : '#FFFFFF'}
                strokeWidth="1.6"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M10 18a2 2 0 0 0 4 0"
                stroke={unreadNotifs > 0 ? tokens.gold : '#FFFFFF'}
                strokeWidth="1.6"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            {unreadNotifs > 0 && (
              <span
                className="pulse-gold absolute flex items-center justify-center"
                style={{
                  top: -2,
                  right: -4,
                  minWidth: 16,
                  height: 16,
                  padding: '0 4px',
                  borderRadius: 999,
                  background: tokens.gold,
                  color: '#07090F',
                  fontSize: 9,
                  fontWeight: 800,
                  border: `1.5px solid ${tokens.bg}`,
                  lineHeight: 1,
                }}
              >
                {unreadNotifs}
              </span>
            )}
          </Link>
        </div>
      </div>
      <QuickAddMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}

export default TopStrip;
