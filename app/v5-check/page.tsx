// app/v5-check/page.tsx
// Expendable smoke-test page that forces Agent B's V5 components to be
// bundled and exercised by `next build`. Steve may delete this before
// merging, or keep it as a preview surface during V5 rollout.

import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { EventTimeline } from '@/components/calendar/EventTimeline';
import { DinnerCard } from '@/components/calendar/DinnerCard';
import { MessageCarousel } from '@/components/messages/MessageCarousel';

export const dynamic = 'force-dynamic';

export default function V5CheckPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#07090F',
        color: 'white',
        fontFamily: "'Helvetica Neue', -apple-system, BlinkMacSystemFont, sans-serif",
        padding: '16px',
        maxWidth: 393,
        margin: '0 auto',
      }}
    >
      <CalendarHeader />
      <div style={{ marginBottom: 16 }}>
        <EventTimeline />
      </div>
      <div style={{ marginBottom: 16 }}>
        <DinnerCard />
      </div>
      <MessageCarousel />
    </main>
  );
}
