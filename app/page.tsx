import { TopStrip } from '@/components/layout/TopStrip';
import { FamilyAvatars } from '@/components/layout/FamilyAvatars';
import { BottomNav } from '@/components/layout/BottomNav';

export default function HomePage() {
  return (
    <main
      className="relative mx-auto"
      style={{
        maxWidth: 393,
        minHeight: '100dvh',
        background: '#07090F',
        paddingBottom: 110, // bottom nav clearance
      }}
    >
      <TopStrip unreadMessages={7} />

      <section className="px-4">
        <FamilyAvatars />

        {/* TODO-AGENT-B: <CalendarHeader /> */}
        <div className="p-4 text-white/40 text-xs border border-dashed border-white/10 rounded">
          Agent B: CalendarHeader
        </div>

        {/* TODO-AGENT-B: <EventTimeline /> */}
        <div className="mt-3 p-4 text-white/40 text-xs border border-dashed border-white/10 rounded">
          Agent B: EventTimeline
        </div>

        {/* TODO-AGENT-B: <DinnerCard /> */}
        <div className="mt-3 p-4 text-white/40 text-xs border border-dashed border-white/10 rounded h-[120px] flex items-center justify-center">
          Agent B: DinnerCard
        </div>

        {/* TODO-AGENT-B: <MessageCarousel /> */}
        <div className="mt-3 p-4 text-white/40 text-xs border border-dashed border-white/10 rounded">
          Agent B: MessageCarousel
        </div>
      </section>

      <BottomNav active="home" />
    </main>
  );
}
