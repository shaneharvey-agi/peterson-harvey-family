'use client'

import { FAMILY } from '@/lib/home-data'
import type { FamilyId } from '@/lib/home-types'

type Props = {
  memberId: FamilyId | null
  onClose: () => void
  onMessage: () => void
}

export default function FamilyActionMenu({ memberId, onClose, onMessage }: Props) {
  if (!memberId) return null
  const m = FAMILY[memberId]

  return (
    <div className="fam-menu" role="dialog" aria-label={`${m.name} actions`}>
      <div className="fam-menu-head">
        <div className="fam-menu-avatar" style={{ borderColor: m.borderColor }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.photo} alt={m.name} className="fam-photo" />
        </div>
        <div className="fam-menu-name" style={{ color: m.color }}>
          {m.name}
        </div>
        <button className="fam-menu-close" onClick={onClose} aria-label="Close menu">
          <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
            <path d="M3 3l8 8M11 3l-8 8" stroke="#8899AA" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="fam-menu-grid">
        <button className="fam-action" onClick={() => { onClose(); onMessage() }}>
          <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
            <path d="M2 2h10a1 1 0 011 1v6a1 1 0 01-1 1H5L2 12V3a1 1 0 011-1z" stroke="#4A90E2" strokeWidth="1.2" />
          </svg>
          <span>Message</span>
        </button>
        <button className="fam-action" onClick={onClose}>
          <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
            <path d="M2 4h10M2 7h7M2 10h5" stroke="#4CAF7D" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <span>Add chore</span>
        </button>
        <button className="fam-action" onClick={onClose}>
          <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="2.5" width="12" height="10" rx="2" stroke="#C4A050" strokeWidth="1.2" />
            <path d="M1 5.5h12M7 8v2" stroke="#C4A050" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span>Add event</span>
        </button>
        <button className="fam-action" onClick={onClose}>
          <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
            <path d="M7 1.5C5 1.5 3.5 3 3.5 5c0 3 3.5 7.5 3.5 7.5S10.5 8 10.5 5c0-2-1.5-3.5-3.5-3.5Z" stroke="#B57BFF" strokeWidth="1.2" />
            <circle cx="7" cy="5" r="1.2" stroke="#B57BFF" strokeWidth="1.2" />
          </svg>
          <span>Send request</span>
        </button>
      </div>
    </div>
  )
}
