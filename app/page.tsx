'use client'

import { useState } from 'react'
import StatusBar from '@/components/home/StatusBar'
import WeatherDropdown from '@/components/home/WeatherDropdown'
import LogoRow from '@/components/home/LogoRow'
import FamilyAvatars from '@/components/home/FamilyAvatars'
import FamilyActionMenu from '@/components/home/FamilyActionMenu'
import CalendarHero from '@/components/home/CalendarHero'
import RequestsSection from '@/components/home/RequestsSection'
import MessagesPeek from '@/components/home/MessagesPeek'
import BottomNav from '@/components/nav/BottomNav'
import {
  DATE_LABEL,
  MESSAGES_PEEK,
  PENDING_REQUEST_COUNT,
  REQUESTS,
  TODAY_EVENTS,
  WEATHER_CURRENT,
  WEATHER_FORECAST,
} from '@/lib/home-data'
import type { FamilyId, HomeRequest, NavTab } from '@/lib/home-types'

export default function HomePage() {
  const [weatherOpen, setWeatherOpen] = useState(false)
  const [menuFor, setMenuFor] = useState<FamilyId | null>(null)
  const [tab, setTab] = useState<NavTab>('home')
  const [confirm, setConfirm] = useState<string | null>(null)
  const [mBadge, setMBadge] = useState(MESSAGES_PEEK.unreadCount)

  function showConfirm(msg: string) {
    setConfirm(msg)
    setTimeout(() => setConfirm(null), 6500)
  }

  function onFulfill(r: HomeRequest) {
    showConfirm(r.aiReplyTemplate)
    setMBadge((n) => Math.max(0, n - 1))
  }

  function onDecline(_r: HomeRequest) {
    setMBadge((n) => Math.max(0, n - 1))
  }

  return (
    <div className="phone-frame">
      <div className="hs4">
        <div className="ambient-glow" aria-hidden />
        <div
          className="confirm-strip"
          style={{
            maxHeight: confirm ? 48 : 0,
            padding: confirm ? '10px 20px' : '0 20px',
            borderBottomColor: confirm ? 'rgba(76,175,125,.2)' : 'rgba(76,175,125,0)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M2.5 7L5.5 10 11.5 4" stroke="#4CAF7D" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="confirm-text">{confirm}</span>
        </div>

        <header className="hs4-header">
          <StatusBar
            dateLabel={DATE_LABEL}
            currentWeather={WEATHER_CURRENT}
            weatherOpen={weatherOpen}
            onToggleWeather={() => setWeatherOpen((x) => !x)}
          />
          <WeatherDropdown open={weatherOpen} forecast={WEATHER_FORECAST} />
          <LogoRow />
          <FamilyAvatars onOpen={setMenuFor} />
        </header>

        <main className="hs4-body">
          <CalendarHero events={TODAY_EVENTS} />
          <RequestsSection
            requests={REQUESTS}
            pendingCount={PENDING_REQUEST_COUNT}
            onFulfill={onFulfill}
            onDecline={onDecline}
          />
          <div className="hs4-body-spacer" />
        </main>

        <MessagesPeek onOpen={() => { /* Phase 3: open messages screen */ }} />

        <FamilyActionMenu
          memberId={menuFor}
          onClose={() => setMenuFor(null)}
          onMessage={() => { /* Phase 3: open DM thread */ }}
        />

        <BottomNav
          active={tab}
          onTab={setTab}
          mBadge={mBadge}
          onOpenMessages={() => { /* Phase 3: open messages */ }}
        />
      </div>
    </div>
  )
}
