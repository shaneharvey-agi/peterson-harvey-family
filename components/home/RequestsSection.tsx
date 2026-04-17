'use client'

import SlideToFulfill from './SlideToFulfill'
import type { HomeRequest } from '@/lib/home-types'

type Props = {
  requests: HomeRequest[]
  pendingCount: number
  onFulfill: (r: HomeRequest) => void
  onDecline: (r: HomeRequest) => void
}

export default function RequestsSection({ requests, pendingCount, onFulfill, onDecline }: Props) {
  const top = requests[0]
  return (
    <div className="requests-section">
      <div className="requests-head">
        <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M7 1.5C5 1.5 3.5 3 3.5 5c0 3 3.5 7.5 3.5 7.5S10.5 8 10.5 5c0-2-1.5-3.5-3.5-3.5Z" stroke="#B57BFF" strokeWidth="1.2" />
          <circle cx="7" cy="5" r="1.2" stroke="#B57BFF" strokeWidth="1.2" />
        </svg>
        <span className="requests-label">Requests</span>
        <span className="requests-count">{pendingCount} pending</span>
      </div>
      {top && (
        <SlideToFulfill
          request={top}
          pendingCount={pendingCount}
          onFulfill={onFulfill}
          onDecline={onDecline}
        />
      )}
    </div>
  )
}
