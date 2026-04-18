import { TopStrip } from '@/components/layout/TopStrip';
import { FamilyAvatars } from '@/components/layout/FamilyAvatars';
import { BottomNav } from '@/components/layout/BottomNav';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { EventTimeline } from '@/components/calendar/EventTimeline';
import { DinnerCard } from '@/components/calendar/DinnerCard';
import { MessageCarousel } from '@/components/messages/MessageCarousel';

export default function HomePage() {
  return (
    <main
      className="relative mx-auto"
      style={{
        maxWidth: 393,
        minHeight: '100dvh',
        background: '#07090F',
        paddingBottom: 110,
      }}
    >
      <TopStrip unreadMessages={7} />

      <section className="px-4">
        <FamilyAvatars />
        <CalendarHeader />
        <EventTimeline />
        <DinnerCard />
        <MessageCarousel />
      </section>

      <BottomNav active="home" />
    </main>
  );
}
