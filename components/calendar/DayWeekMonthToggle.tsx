'use client';

import { useState } from 'react';

export type CalendarView = 'day' | 'week' | 'month';

const OPTIONS: { value: CalendarView; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

/**
 * 3-button segmented control. Visual-only — tabs are clickable-but-inert
 * (internal state updates for press feedback; does not wire view switching).
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
        background: 'rgba(255,255,255,0.08)',
        border: 'none',
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
              background: active ? '#FFFFFF' : 'transparent',
              color: active ? '#07090F' : 'rgba(255,255,255,0.6)',
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
