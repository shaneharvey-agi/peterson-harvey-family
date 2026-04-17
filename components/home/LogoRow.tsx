'use client'

import { FAMILY } from '@/lib/home-data'

export default function LogoRow() {
  const shane = FAMILY.shane
  return (
    <div className="logo-row">
      <div className="logo-left">
        <svg width="42" height="42" viewBox="0 0 46 46" fill="none" aria-hidden>
          <rect width="46" height="46" rx="13" fill="url(#lg1)" />
          <rect x=".5" y=".5" width="45" height="45" rx="12.5" stroke="rgba(255,255,255,.12)" fill="none" />
          <path d="M11 32V14L23 26L35 14V32" stroke="#07090F" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <ellipse cx="23" cy="8" rx="12" ry="5" fill="rgba(255,255,255,.08)" />
          <defs>
            <linearGradient id="lg1" x1="0" y1="0" x2="46" y2="46">
              <stop offset="0%" stopColor="#E0B840" />
              <stop offset="45%" stopColor="#C4A050" />
              <stop offset="100%" stopColor="#7A5510" />
            </linearGradient>
          </defs>
        </svg>
        <span className="logo-wordmark">Mikayla</span>
      </div>
      <div className="logo-right">
        <button className="gear-btn" aria-label="Settings">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2.2" stroke="#8899AA" strokeWidth="1.3" />
            <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M11.89 4.11l-1.06 1.06M4.11 11.89l-1.06 1.06" stroke="#8899AA" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
        <div className="me-avatar">
          <div className="me-avatar-frame" style={{ borderColor: shane.borderColor }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shane.photo} alt="Shane" className="fam-photo" style={{ objectPosition: 'center 20%' }} />
          </div>
          {shane.online && <div className="me-online-dot" />}
        </div>
      </div>
    </div>
  )
}
