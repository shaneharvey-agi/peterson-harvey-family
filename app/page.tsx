import { TopStrip } from '@/components/layout/TopStrip';
import { FamilyAvatars } from '@/components/layout/FamilyAvatars';
import { BottomNav } from '@/components/layout/BottomNav';
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
        <FamilyAvatars />
        <CalendarHeader />
        <EventTimeline />
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
          background:
            'linear-gradient(to top, rgba(7,9,15,0.98) 0%, rgba(7,9,15,0.94) 65%, rgba(7,9,15,0) 100%)',
          paddingTop: 20,
          paddingBottom: 6,
          pointerEvents: 'auto',
        }}
      >
        <MessageCarousel />
      </div>

      <BottomNav active="home" />
    </main>
  );
}
