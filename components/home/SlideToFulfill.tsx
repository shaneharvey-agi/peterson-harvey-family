'use client'

import { useRef, useState } from 'react'
import { FAMILY } from '@/lib/home-data'
import type { HomeRequest } from '@/lib/home-types'

type Props = {
  request: HomeRequest
  pendingCount: number
  onFulfill: (r: HomeRequest) => void
  onDecline: (r: HomeRequest) => void
}

const THRESH_F = 0.55
const THRESH_D = 0.45

export default function SlideToFulfill({ request, pendingCount, onFulfill, onDecline }: Props) {
  const from = FAMILY[request.from]
  const cardRef = useRef<HTMLDivElement | null>(null)
  const startXRef = useRef(0)
  const dxRef = useRef(0)
  const widthRef = useRef(340)
  const [dragging, setDragging] = useState(false)
  const [done, setDone] = useState<null | 'fulfill' | 'decline'>(null)
  const [progress, setProgress] = useState(0)
  const [side, setSide] = useState<'none' | 'f' | 'd'>('none')

  function getX(e: React.PointerEvent): number {
    return e.clientX
  }

  function onDown(e: React.PointerEvent) {
    if (done) return
    widthRef.current = cardRef.current?.offsetWidth ?? 340
    setDragging(true)
    startXRef.current = getX(e)
    dxRef.current = 0
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }

  function onMove(e: React.PointerEvent) {
    if (!dragging) return
    const dx = getX(e) - startXRef.current
    dxRef.current = dx
    const w = widthRef.current
    if (dx > 0) {
      const p = Math.max(0, Math.min(1, dx / (w * THRESH_F)))
      setSide('f')
      setProgress(p)
    } else if (dx < 0) {
      const p = Math.max(0, Math.min(1, -dx / (w * THRESH_D)))
      setSide('d')
      setProgress(p)
    } else {
      setSide('none')
      setProgress(0)
    }
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${dx}px) rotate(${dx * 0.012}deg)`
    }
  }

  function onUp() {
    if (!dragging) return
    setDragging(false)
    const dx = dxRef.current
    const w = widthRef.current
    if (dx >= w * THRESH_F) {
      setDone('fulfill')
      onFulfill(request)
    } else if (dx <= -w * THRESH_D) {
      setDone('decline')
      onDecline(request)
    } else {
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform .35s cubic-bezier(.16,1,.3,1)'
        cardRef.current.style.transform = 'translateX(0) rotate(0)'
        setTimeout(() => {
          if (cardRef.current) cardRef.current.style.transition = 'none'
        }, 360)
      }
      setSide('none')
      setProgress(0)
    }
  }

  if (done === 'fulfill') {
    return <FulfillDone request={request} />
  }
  if (done === 'decline') {
    return <DeclineDone request={request} />
  }

  const bg =
    side === 'f'
      ? `rgba(76,175,125,${progress * 0.22})`
      : side === 'd'
        ? `rgba(255,90,90,${progress * 0.18})`
        : 'rgba(255,255,255,.03)'
  const borderColor =
    side === 'f'
      ? `rgba(76,175,125,${0.15 + progress * 0.35})`
      : side === 'd'
        ? `rgba(255,90,90,${0.15 + progress * 0.3})`
        : 'rgba(255,255,255,.08)'

  return (
    <div className="stf-wrap">
      <div className="stf-underlay">
        <div className="stf-side stf-fulfill" style={{ opacity: side === 'f' ? progress : 0 }}>
          <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
            <path d="M4 10L8 14 16 6" stroke="#4CAF7D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{progress > 0.9 ? 'DONE' : 'FULFILL'}</span>
        </div>
        <div className="stf-side stf-decline" style={{ opacity: side === 'd' ? progress : 0 }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M3 3l8 8M11 3l-8 8" stroke="#FF5A5A" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span>DECLINE</span>
        </div>
      </div>
      <div
        ref={cardRef}
        className="stf-card"
        style={{ background: bg, borderColor, cursor: dragging ? 'grabbing' : 'grab' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="button"
        aria-label="Slide right to fulfill or left to decline"
      >
        <div className="stf-head">
          <div className="stf-avatar" style={{ borderColor: from.borderColor }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={from.photo} alt={from.name} className="fam-photo" />
          </div>
          <div className="stf-from">
            <div className="stf-from-row">
              <span className="stf-from-name" style={{ color: from.color }}>{from.name}</span>
              <span className="stf-age">{request.ageLabel}</span>
            </div>
            <div className="stf-sent">sent a request</div>
          </div>
          {request.urgent && <div className="stf-urgent">Urgent</div>}
        </div>
        <div className="stf-body">
          <div className="stf-title">{request.title}</div>
          <div className="stf-detail">{request.detail}</div>
        </div>
        <div className="stf-hint-row">
          <div className="stf-hint-line" />
          <div className="stf-hint" style={{ opacity: dragging ? 0 : 0.45 }}>
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M8 4l3 3-3 3" stroke="#4CAF7D" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <span>Slide to fulfill</span>
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
              <path d="M11 7H3M6 4L3 7l3 3" stroke="#884040" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <div className="stf-hint-line" />
        </div>
        <div className="stf-progress">
          <div
            className="stf-progress-fill"
            style={{
              width: `${progress * 100}%`,
              background: side === 'd' ? '#FF5A5A' : '#4CAF7D',
            }}
          />
        </div>
      </div>
      <div className="stf-badge" aria-label={`${pendingCount} pending requests`}>
        {pendingCount}
      </div>
    </div>
  )
}

function FulfillDone({ request }: { request: HomeRequest }) {
  return (
    <div className="stf-done stf-done-fulfill">
      <div className="stf-done-head">
        <div className="stf-done-icon-wrap">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7L5.5 10 11.5 4" stroke="#4CAF7D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <div className="stf-done-title">Done {'\u2014 '}Molly notified {'\u2713'}</div>
          <div className="stf-done-sub">{request.title}</div>
        </div>
      </div>
      <div className="stf-done-ai">
        <div className="stf-done-m">M</div>
        <div className="stf-done-ai-text">&ldquo;{request.aiReplyTemplate}&rdquo;</div>
      </div>
    </div>
  )
}

function DeclineDone({ request }: { request: HomeRequest }) {
  return (
    <div className="stf-done stf-done-decline">
      <div className="stf-done-head">
        <div className="stf-done-icon-wrap stf-done-icon-decline">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M3 3l8 8M11 3l-8 8" stroke="#FF5A5A" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div className="stf-done-title stf-done-title-decline">Declined</div>
          <div className="stf-done-sub">{request.title}</div>
        </div>
      </div>
    </div>
  )
}
