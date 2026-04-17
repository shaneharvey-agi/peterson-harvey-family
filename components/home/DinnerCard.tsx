'use client'

import type { HomeEvent } from '@/lib/home-types'

type Props = {
  event: HomeEvent
  expanded: boolean
  onToggle: () => void
}

export default function DinnerCard({ event, expanded, onToggle }: Props) {
  if (event.kind !== 'dinner' || !event.dinner) return null
  const d = event.dinner

  return (
    <>
      <button className="dinner-card" onClick={onToggle} aria-expanded={expanded}>
        <div className="dinner-dot" />
        <div className="dinner-body">
          <div className="dinner-title">
            {d.recipe} <span aria-hidden>&#127869;&#65039;</span>
          </div>
          <div className="dinner-meta">
            {event.timeLabel} <span className="dinner-meta-missing">{'\u00B7 '}{d.missing.length} items needed</span>
          </div>
        </div>
        <div className="dinner-thumb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={d.thumbImage} alt="" />
        </div>
        <div className="dinner-chev" style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}>
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
            <path d="M3.5 5.5L7 9l3.5-3.5" stroke="#C4A050" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </div>
      </button>
      <div className="dinner-exp" style={{ maxHeight: expanded ? 340 : 0 }}>
        <div className="dinner-exp-inner">
          <div className="dinner-hero">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.heroImage} alt="" />
            <div className="dinner-hero-fade" />
            <div className="dinner-hero-title">
              <div className="dinner-hero-name">{d.recipe}</div>
              <div className="dinner-hero-sub">
                {d.prep}{' \u00B7 '}{d.cook}{' \u00B7 '}{d.servings} servings
              </div>
            </div>
          </div>
          <div className="dinner-exp-body">
            <div className="dinner-missing">
              <div className="dinner-missing-dot" />
              <div className="dinner-missing-text">
                {'Missing: '}{d.missing.join(', ')}{' \u2014 added to shopping list'}
              </div>
            </div>
            <button className="dinner-cook-btn">Start Cooking &rarr;</button>
          </div>
        </div>
      </div>
    </>
  )
}
