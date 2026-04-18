'use client';

import { useState } from 'react';
import { tokens } from '@/lib/design-tokens';

export function TopStrip({ unreadMessages = 7 }: { unreadMessages?: number }) {
  const [photoOk, setPhotoOk] = useState(true);

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
              width: 28,
              height: 28,
              borderRadius: 6,
              background: tokens.gold,
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: '#000',
                lineHeight: 1,
              }}
            >
              M
            </span>
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

        {/* Right cluster */}
        <div className="flex items-center" style={{ gap: 13 }}>
          {/* + button */}
          <button
            type="button"
            aria-label="Quick add"
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              background: 'rgba(255, 255, 255, 0.08)',
              border: `1px solid rgba(255, 255, 255, 0.25)`,
              color: '#FFFFFF',
              padding: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M7 1.5V12.5M1.5 7H12.5"
                stroke="#FFFFFF"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* Message icon */}
          <button
            type="button"
            aria-label="Messages"
            className="relative flex items-center justify-center"
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

          {/* Avatar + 3-dot chat-bubble badge */}
          <button
            type="button"
            aria-label="Settings"
            className="relative flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              padding: 0,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <span
              className="flex items-center justify-center"
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                overflow: 'hidden',
                background: photoOk
                  ? tokens.bg
                  : `linear-gradient(135deg, ${tokens.shane}, ${tokens.molly})`,
              }}
            >
              {photoOk ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/avatars/shane.jpg"
                  alt=""
                  onError={() => setPhotoOk(false)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  draggable={false}
                />
              ) : (
                <span>S</span>
              )}
            </span>
            <span
              aria-hidden
              className="absolute flex items-center justify-center"
              style={{
                bottom: -3,
                right: -3,
                width: 16,
                height: 12,
                borderRadius: 4,
                background: '#FFFFFF',
                border: `1.5px solid ${tokens.bg}`,
                gap: 1.5,
                padding: '0 2px',
              }}
            >
              <span style={{ width: 2, height: 2, borderRadius: 1, background: '#07090F' }} />
              <span style={{ width: 2, height: 2, borderRadius: 1, background: '#07090F' }} />
              <span style={{ width: 2, height: 2, borderRadius: 1, background: '#07090F' }} />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default TopStrip;
