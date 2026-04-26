import { Suspense } from 'react';
import { TopStrip } from '@/components/layout/TopStrip';
import { FamilyAvatars } from '@/components/layout/FamilyAvatars';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { EventTimeline } from '@/components/calendar/EventTimeline';
import { MessageCarousel } from '@/components/messages/MessageCarousel';

export default function HomePage() {
  return (
    <main
      className="relative mx-auto"
      style={{
        maxWidth: 393,
        minHeight: '100dvh',
        background: '#07090F',
        paddingBottom: 250,
      }}
    >
      <TopStrip unreadMessages={7} />

      <section className="px-4">
        {/* Suspense boundaries: FamilyAvatars + EventTimeline use
            useSearchParams(), which needs this wrapper so the page
            can still prerender statically. */}
        <Suspense fallback={<div style={{ height: 74 }} aria-hidden />}>
          <FamilyAvatars />
        </Suspense>
        <CalendarHeader />
        <Suspense fallback={<div style={{ height: 120 }} aria-hidden />}>
          <EventTimeline />
        </Suspense>
      </section>

      <div
        className="px-4"
        style={{
          position: 'fixed',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 'calc(76px + env(safe-area-inset-bottom))',
          width: '100%',
          maxWidth: 393,
          zIndex: 5,
          // Tighter fade zone (top 30% vs top 35%) + full-opacity body
          // so busy rows (dinner hero) don't bleed through.
          background:
            'linear-gradient(to top, rgba(7,9,15,1) 0%, rgba(7,9,15,1) 70%, rgba(7,9,15,0.7) 90%, rgba(7,9,15,0) 100%)',
          // Blur whatever is behind the strip so the dinner card's
          // recipe photo + gold pulse doesn't muddle the fade zone.
          backdropFilter: 'blur(14px) saturate(1.1)',
          WebkitBackdropFilter: 'blur(14px) saturate(1.1)',
          paddingTop: 16,
          paddingBottom: 6,
          pointerEvents: 'auto',
        }}
      >
        <MessageCarousel />
      </div>

    </main>
  );
}
