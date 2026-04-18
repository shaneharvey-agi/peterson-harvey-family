'use client';

import { tokens } from '@/lib/design-tokens';

export function TopStrip({ unreadMessages = 7 }: { unreadMessages?: number }) {
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
        {/* Left cluster */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center"
            style={{
              width: 20,
              height: 20,
              borderRadius: 5,
              background: tokens.gold,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: '#000',
                lineHeight: 1,
              }}
            >
              M
            </span>
          </div>
          <span
            className="wordmark-breathe"
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: tokens.gold,
              letterSpacing: '0.3px',
              lineHeight: 1,
            }}
          >
            Mikayla
          </span>
        </div>

        {/* Right cluster */}
        <div className="flex items-center" style={{ gap: 11 }}>
          {/* + button */}
          <button
            type="button"
            aria-label="Quick add"
            className="flex items-center justify-center"
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              background: 'rgba(196, 160, 80, 0.18)',
              border: `1px solid rgba(196, 160, 80, 0.35)`,
              color: tokens.gold,
              fontSize: 18,
              fontWeight: 600,
              lineHeight: 1,
              padding: 0,
            }}
          >
            +
          </button>

          {/* Message icon */}
          <button
            type="button"
            aria-label="Messages"
            className="relative flex items-center justify-center"
            style={{
              width: 28,
              height: 28,
              padding: 0,
              background: 'transparent',
              border: 'none',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v10c0 .83-.67 1.5-1.5 1.5H9l-3.5 3v-3H5.5C4.67 17 4 16.33 4 15.5v-10z"
                fill={tokens.gold}
              />
            </svg>
            {unreadMessages > 0 && (
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
                {unreadMessages}
              </span>
            )}
          </button>

          {/* Avatar + gear badge */}
          <button
            type="button"
            aria-label="Settings"
            className="relative flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              background: `linear-gradient(135deg, ${tokens.shane}, ${tokens.molly})`,
              padding: 0,
              border: 'none',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            S
            <span
              className="absolute flex items-center justify-center"
              style={{
                bottom: -2,
                right: -2,
                width: 14,
                height: 14,
                borderRadius: 999,
                background: tokens.bg,
                border: `1.5px solid ${tokens.bg}`,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" fill={tokens.gold} />
                <path
                  d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"
                  stroke={tokens.gold}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default TopStrip;
