'use client'

import { useEffect, useRef, useState } from 'react'
import type { MState } from '@/lib/home-types'

type Props = {
  badge: number
  onOpenMessages: () => void
}

const HOLD_MS = 280
const SPEAK_MS = 2200
const LISTEN_TO_SPEAK_MS = 900

export default function MButton({ badge, onOpenMessages }: Props) {
  const [state, setState] = useState<MState>('idle')
  const [label, setLabel] = useState('Mikayla')
  const [pressed, setPressed] = useState(false)
  const holdingRef = useRef(false)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flowTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([])

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
      flowTimersRef.current.forEach(clearTimeout)
    }
  }, [])

  useEffect(() => {
    if (state === 'listening') setLabel('Listening\u2026')
    else if (state === 'speaking') setLabel('Mikayla\u2026')
    else setLabel('Mikayla')
  }, [state])

  function down() {
    holdingRef.current = true
    setPressed(true)
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    holdTimerRef.current = setTimeout(() => {
      if (holdingRef.current) setState('listening')
    }, HOLD_MS)
  }

  function up() {
    holdingRef.current = false
    setPressed(false)
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    // Capture current state (may still be 'listening' or still 'idle')
    setState((prev) => {
      if (prev === 'listening') {
        const t1 = setTimeout(() => {
          setState('speaking')
          const t2 = setTimeout(() => setState('idle'), SPEAK_MS)
          flowTimersRef.current.push(t2)
        }, LISTEN_TO_SPEAK_MS)
        flowTimersRef.current.push(t1)
        return prev
      }
      if (prev === 'idle') {
        onOpenMessages()
      }
      return prev
    })
  }

  return (
    <button
      className="m-btn"
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={up}
      onPointerLeave={(e) => {
        if (holdingRef.current) up()
      }}
      aria-label="Mikayla voice button"
    >
      <div className="m-btn-wrap">
        <div className={'m-ring m-ring-' + state} aria-hidden />
        <div className={'m-glow m-glow-' + state} aria-hidden />
        <div className="m-body" style={{ transform: pressed ? 'scale(.88)' : 'scale(1)' }}>
          <div className="m-body-highlight" aria-hidden />
          {state === 'idle' && (
            <div className="m-icon">
              <svg width="20" height="13" viewBox="0 0 22 14" fill="none">
                <path d="M1 13V1L11 10L21 1V13" stroke="#07090F" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
          {state === 'listening' && (
            <div className="m-listen">
              <div className="m-listen-r1" />
              <div className="m-listen-r2" />
              <div className="m-listen-core" />
            </div>
          )}
          {state === 'speaking' && (
            <div className="m-speak">
              <div className="m-wave m-w1" />
              <div className="m-wave m-w2" />
              <div className="m-wave m-w3" />
              <div className="m-wave m-w4" />
              <div className="m-wave m-w5" />
            </div>
          )}
        </div>
        {badge > 0 && <div className="m-badge">{badge}</div>}
      </div>
      <span className="m-label">{label}</span>
      <div className="m-active-dot" />
    </button>
  )
}
