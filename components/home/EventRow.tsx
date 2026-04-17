'use client'

import { FAMILY } from '@/lib/home-data'
import type { HomeEvent } from '@/lib/home-types'

export default function EventRow({ event }: { event: HomeEvent }) {
  const owner = FAMILY[event.owner]
  const hex = owner.color
  const bg = hexToRgba(hex, 0.1)
  const border = hexToRgba(hex, 0.22)
  const dotGlow = hexToRgba(hex, 0.6)
  const avatarBorder = hexToRgba(hex, 0.5)

  return (
    <div className="event-row" style={{ background: bg, borderColor: border }}>
      <div className="event-dot" style={{ background: hex, boxShadow: `0 0 5px ${dotGlow}` }} />
      <div className="event-body">
        <div className="event-title">{event.title}</div>
        <div className="event-meta">
          {event.timeLabel}
          {event.location ? ` \u00B7 ${event.location}` : ''}
        </div>
      </div>
      <div className="event-avatar" style={{ borderColor: avatarBorder }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={owner.photo} alt={owner.name} className="fam-photo" />
      </div>
    </div>
  )
}

function hexToRgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}
