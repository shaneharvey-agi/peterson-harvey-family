'use client'

import MButton from './MButton'
import type { NavTab } from '@/lib/home-types'

type Props = {
  active: NavTab
  onTab: (t: NavTab) => void
  mBadge: number
  onOpenMessages: () => void
}

export default function BottomNav({ active, onTab, mBadge, onOpenMessages }: Props) {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      <div className="bottom-nav-row">
        <NavItem label="Home" active={active === 'home'} onClick={() => onTab('home')}>
          <HomeIcon active={active === 'home'} />
        </NavItem>
        <NavItem label="To Do" active={active === 'todo'} onClick={() => onTab('todo')}>
          <TodoIcon active={active === 'todo'} />
        </NavItem>
        <div className="nav-m-slot">
          <MButton badge={mBadge} onOpenMessages={onOpenMessages} />
        </div>
        <NavItem label="Kitchen" active={active === 'kitchen'} onClick={() => onTab('kitchen')}>
          <KitchenIcon active={active === 'kitchen'} />
        </NavItem>
        <NavItem label="Collabs" active={active === 'collabs'} onClick={() => onTab('collabs')}>
          <CollabsIcon active={active === 'collabs'} />
        </NavItem>
      </div>
    </nav>
  )
}

function NavItem({ label, active, onClick, children }: { label: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button className="nav-item" onClick={onClick} aria-pressed={active}>
      {children}
      <span className={'nav-label' + (active ? ' nav-label-active' : '')}>{label}</span>
      {active && <div className="nav-dot" />}
    </button>
  )
}

function HomeIcon({ active }: { active: boolean }) {
  const stroke = active ? '#C4A050' : 'rgba(196,160,80,.32)'
  const fill = active ? 'rgba(196,160,80,.18)' : 'none'
  return (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" fill={fill} />
      <path d="M7.5 18v-5h5v5" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function TodoIcon({ active }: { active: boolean }) {
  const stroke = active ? '#C4A050' : 'rgba(196,160,80,.32)'
  const fill = active ? 'rgba(196,160,80,.3)' : 'rgba(196,160,80,.1)'
  return (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M4 5h3M4 10h3M4 15h3" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8 5l1.5 1.5L13 3" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="8" y="8.5" width="5" height="3" rx="1" fill={fill} />
      <path d="M8 15l1.5 1.5L13 13" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function KitchenIcon({ active }: { active: boolean }) {
  const stroke = active ? '#C4A050' : 'rgba(196,160,80,.32)'
  return (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M6 3v5a3 3 0 006 0V3" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M9 8v9" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M14 3c0 0 1 1.5 1 3.5S14 10 14 10v7" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function CollabsIcon({ active }: { active: boolean }) {
  const dot = active ? '#C4A050' : 'rgba(196,160,80,.32)'
  const link = active ? 'rgba(196,160,80,.55)' : 'rgba(196,160,80,.22)'
  return (
    <svg width="24" height="22" viewBox="0 0 28 26" fill="none" aria-hidden>
      <circle cx="14" cy="3.5" r="2.8" fill={dot} />
      <circle cx="24.5" cy="9" r="2.8" fill={dot} />
      <circle cx="25" cy="20" r="2.8" fill={dot} />
      <circle cx="15.5" cy="25" r="2.8" fill={dot} />
      <circle cx="4.5" cy="23" r="2.8" fill={dot} />
      <circle cx="3" cy="12" r="2.8" fill={dot} />
      <line x1="14" y1="6.3" x2="14" y2="10" stroke={link} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="22.2" y1="10.8" x2="19.2" y2="12.2" stroke={link} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="22.5" y1="18.5" x2="19.5" y2="17" stroke={link} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="15" y1="22.2" x2="15" y2="19" stroke={link} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="7.2" y1="21.8" x2="10.2" y2="19.2" stroke={link} strokeWidth="1.3" strokeLinecap="round" />
      <line x1="5.8" y1="13.5" x2="9" y2="14" stroke={link} strokeWidth="1.3" strokeLinecap="round" />
      <rect x="9" y="9.5" width="10" height="9" rx="2.5" fill={active ? '#C4A050' : 'rgba(196,160,80,.28)'} stroke={link} strokeWidth="1" />
      <text x="14" y="17" textAnchor="middle" fontFamily="'Helvetica Neue',Helvetica,Arial,sans-serif" fontWeight="900" fontSize="7.5" fill={active ? '#07090F' : 'rgba(196,160,80,.45)'}>C</text>
    </svg>
  )
}
