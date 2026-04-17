'use client'

import type { HomeEvent } from '@/lib/home-types'
import EventRow from './EventRow'
import DinnerCard from './DinnerCard'

type Props = {
  events: HomeEvent[]
  dinnerExpanded: boolean
  onToggleDinner: () => void
}

export default function CalendarDayView({ events, dinnerExpanded, onToggleDinner }: Props) {
  return (
    <div className="cal-day">
      {events.map((ev) =>
        ev.kind === 'dinner' ? (
          <DinnerCard key={ev.id} event={ev} expanded={dinnerExpanded} onToggle={onToggleDinner} />
        ) : (
          <EventRow key={ev.id} event={ev} />
        ),
      )}
    </div>
  )
}
