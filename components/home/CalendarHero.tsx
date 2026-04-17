'use client'

import { useState } from 'react'
import type { CalView, HomeEvent } from '@/lib/home-types'
import CalendarDayView from './CalendarDayView'
import CalendarWeekView from './CalendarWeekView'
import CalendarMonthView from './CalendarMonthView'

type Props = { events: HomeEvent[] }

const TITLES: Record<CalView, string> = { day: 'Today', week: 'This Week', month: 'April 2026' }
const COUNTS: Record<CalView, string> = { day: '\u00B7 5 events', week: '\u00B7 9 events', month: '' }

export default function CalendarHero({ events }: Props) {
  const [view, setView] = useState<CalView>('day')
  const [dinnerExpanded, setDinnerExpanded] = useState(false)

  return (
    <div className="cal-hero">
      <div className="cal-hero-card">
        <div className="cal-hero-head">
          <div className="cal-hero-title">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
              <rect x="1" y="2.5" width="12" height="10" rx="2" stroke="#C4A050" strokeWidth="1.2" />
              <path d="M1 5.5h12" stroke="#C4A050" strokeWidth="1.2" />
              <path d="M4.5 1v3M9.5 1v3" stroke="#C4A050" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span className="cal-hero-title-text">{TITLES[view]}</span>
            <span className="cal-hero-count">{COUNTS[view]}</span>
          </div>
          <div className="cal-hero-toggle" role="tablist">
            {(['day', 'week', 'month'] as CalView[]).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                className={'cal-hero-tab' + (view === v ? ' cal-hero-tab-active' : '')}
                onClick={() => setView(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="cal-hero-divider" />
        {view === 'day' && (
          <CalendarDayView
            events={events}
            dinnerExpanded={dinnerExpanded}
            onToggleDinner={() => setDinnerExpanded((x) => !x)}
          />
        )}
        {view === 'week' && <CalendarWeekView />}
        {view === 'month' && <CalendarMonthView />}
      </div>
    </div>
  )
}
