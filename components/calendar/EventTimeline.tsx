'use client';

import { useEffect, useState } from 'react';
import { familyColor, familyText } from '@/lib/design-tokens';
import { fetchTodayEvents, type TimelineEvent } from '@/lib/queries/events';

export function EventTimeline() {
  const [events, setEvents] = useState<TimelineEvent[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const list = await fetchTodayEvents();
      if (!alive) return;
      setEvents(list);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (events === null) {
    return <div className="h-[120px]" aria-hidden />;
  }

  if (events.length === 0) {
    return (
      <div className="text-[11px] text-white/40 py-4 text-center">
        Nothing on the calendar today.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {events.map((ev) => {
        const color = familyColor(ev.member);
        const text = familyText(ev.member);
        return (
          <div key={ev.id} className="flex gap-2.5 items-start">
            <span className="text-[10px] text-white/45 font-semibold min-w-[36px] pt-2">
              {ev.time}
            </span>
            <div
              className="flex-1 rounded-md border-l-[2.5px] px-2.5 py-2"
              style={{
                background: `${color}1F`,
                borderColor: color,
              }}
            >
              <div
                className="text-[12px] font-semibold"
                style={{ color: text }}
              >
                {ev.title}
              </div>
              {ev.detail && (
                <div
                  className="text-[10px] mt-px"
                  style={{ color: `${text}B3` }}
                >
                  {ev.detail}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
