'use client'

import { FAMILY } from '@/lib/home-data'
import type { FamilyId } from '@/lib/home-types'

const VISIBLE: FamilyId[] = ['molly', 'evey', 'jax']

export default function FamilyAvatars({ onOpen }: { onOpen: (id: FamilyId) => void }) {
  return (
    <div className="fam-avatars">
      <div className="fam-avatars-row">
        {VISIBLE.map((id) => {
          const m = FAMILY[id]
          return (
            <button key={id} className="fam-avatar-btn" onClick={() => onOpen(id)} aria-label={`Open ${m.name}`}>
              <div className="fam-avatar-wrap">
                <div
                  className="fam-avatar-frame"
                  style={{
                    borderColor: m.borderColor,
                    boxShadow: `0 0 14px ${m.color}33`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.photo} alt={m.name} className="fam-photo" />
                </div>
                {m.online && <div className="fam-online-dot" />}
                {m.unread > 0 && <div className="fam-unread-dot">{m.unread}</div>}
              </div>
              <span className="fam-label" style={{ color: m.color }}>
                {m.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
