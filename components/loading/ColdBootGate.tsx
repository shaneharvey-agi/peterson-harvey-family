'use client';

import { useEffect, useState } from 'react';
import { ColdBoot } from './ColdBoot';

const SESSION_KEY = 'mikayla.boot.shown';
const MIN_BOOT_MS = 4200;

/**
 * Mounts the Cold Boot splash exactly once per session (which equals
 * once per PWA launch / browser tab). The splash renders optimistically
 * on the first paint (matching SSR) so there's no JS-hydration delay
 * before the user sees the brand; if sessionStorage says it's already
 * been shown, the gate dismisses it immediately on mount.
 */
export function ColdBootGate() {
  const [show, setShow] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      /* private mode — assume not seen */
    }
    if (seen) {
      setShow(false);
      return;
    }

    let cancelled = false;
    const start = performance.now();

    const docReady = new Promise<void>((resolve) => {
      if (document.readyState === 'complete') return resolve();
      const handler = () => {
        if (document.readyState === 'complete') {
          document.removeEventListener('readystatechange', handler);
          resolve();
        }
      };
      document.addEventListener('readystatechange', handler);
    });

    const supabasePing = (async () => {
      try {
        const [chat, notif] = await Promise.all([
          import('@/lib/queries/chatMessages'),
          import('@/lib/queries/notifications'),
        ]);
        await Promise.allSettled([
          chat.fetchTotalUnreadMessages(),
          notif.fetchUnreadCount(),
        ]);
      } catch {
        /* mock fallback always resolves */
      }
    })();

    Promise.all([docReady, supabasePing]).then(() => {
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, MIN_BOOT_MS - elapsed);
      window.setTimeout(() => {
        if (!cancelled) setReady(true);
      }, remaining);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!show) return null;

  return (
    <ColdBoot
      ready={ready}
      onDone={() => {
        try {
          sessionStorage.setItem(SESSION_KEY, '1');
        } catch {
          /* private mode — fine, will replay next reload */
        }
        setShow(false);
      }}
    />
  );
}

export default ColdBootGate;
