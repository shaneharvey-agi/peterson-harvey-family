'use client'

import { FAMILY, MESSAGES_PEEK } from '@/lib/home-data'

export default function MessagesPeek({ onOpen }: { onOpen: () => void }) {
  const m = MESSAGES_PEEK
  const dmFrom = FAMILY[m.latestDm.from]

  return (
    <div className="msg-peek" onClick={onOpen} role="button" aria-label="Open messages">
      <div className="msg-peek-inner">
        <div className="msg-peek-handle-wrap">
          <div className="msg-peek-handle" />
        </div>
        <div className="msg-peek-head">
          <div className="msg-peek-title-row">
            <span className="msg-peek-title">Messages</span>
            {m.unreadCount > 0 && (
              <div className="msg-peek-pill">
                <div className="msg-peek-pill-dot" />
                <span>{m.unreadCount} new</span>
              </div>
            )}
          </div>
          <span className="msg-peek-cta">Tap to open &uarr;</span>
        </div>
        <div className="msg-peek-rows">
          <div className="msg-peek-row">
            <svg width="28" height="28" viewBox="0 0 46 46" fill="none" aria-hidden>
              <rect width="46" height="46" rx="11" fill="url(#lgM)" />
              <path d="M11 32V14L23 26L35 14V32" stroke="#07090F" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="lgM" x1="0" y1="0" x2="46" y2="46">
                  <stop offset="0%" stopColor="#F0C840" />
                  <stop offset="45%" stopColor="#C4A050" />
                  <stop offset="100%" stopColor="#7A5510" />
                </linearGradient>
              </defs>
            </svg>
            <div className="msg-peek-body">
              <div className="msg-peek-row-title">{m.brief.title}</div>
              <div className="msg-peek-row-preview msg-peek-brief">{m.brief.preview}</div>
            </div>
            <span className="msg-peek-time">{m.brief.time}</span>
          </div>
          <div className="msg-peek-row">
            <div className="msg-peek-dm-wrap">
              <div className="msg-peek-dm-avatar" style={{ borderColor: dmFrom.borderColor }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={dmFrom.photo} alt={dmFrom.name} className="fam-photo" />
              </div>
              {m.latestDm.unread && <div className="msg-peek-dm-unread" />}
            </div>
            <div className="msg-peek-body">
              <div className="msg-peek-row-title" style={{ color: dmFrom.color }}>{dmFrom.name}</div>
              <div className="msg-peek-row-preview">{m.latestDm.preview}</div>
            </div>
            <span className="msg-peek-time">{m.latestDm.time}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
