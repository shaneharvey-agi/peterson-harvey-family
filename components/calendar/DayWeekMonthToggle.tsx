'use client';

import { useState } from 'react';
import { tokens } from '@/lib/design-tokens';

export type CalendarView = 'day' | 'week' | 'month';

const OPTIONS: { value: CalendarView; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

/**
 * 3-button segmented control. State lives internally (per contract:
 * "lifted state stays internal (client state, no props)").
 */
export function DayWeekMonthToggle() {
  const [view, setView] = useState<CalendarView>('day');

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        padding: 2,
        borderRadius: 8,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(196,160,80,0.15)',
      }}
      role="tablist"
      aria-label="Calendar view"
    >
      {OPTIONS.map((opt) => {
        const active = view === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setView(opt.value)}
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.3px',
              padding: '4px 9px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              background: active ? tokens.gold : 'transparent',
              color: active ? '#07090F' : 'rgba(255,255,255,0.55)',
              transition: 'background 120ms ease, color 120ms ease',
              fontFamily: 'inherit',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
