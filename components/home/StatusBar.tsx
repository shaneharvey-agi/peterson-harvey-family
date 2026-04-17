'use client'

import { useEffect, useState } from 'react'

type Props = {
  dateLabel: string
  currentWeather: { icon: string; temp: number }
  weatherOpen: boolean
  onToggleWeather: () => void
}

export default function StatusBar({ dateLabel, currentWeather, weatherOpen, onToggleWeather }: Props) {
  const [clock, setClock] = useState('')

  useEffect(() => {
    const tick = () => {
      const n = new Date()
      setClock(n.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="status-bar">
      <div className="sb-left">
        <div className="sb-active-dot" aria-hidden />
        <span className="sb-active-label">Active</span>
        <div className="sb-divider" aria-hidden />
        <span className="sb-date">{dateLabel}</span>
      </div>
      <div className="sb-right">
        <button
          className="sb-weather-chip"
          onClick={onToggleWeather}
          aria-expanded={weatherOpen}
          aria-label="Toggle weather forecast"
        >
          <span className="sb-weather-icon">{currentWeather.icon}</span>
          <span className="sb-weather-temp">{currentWeather.temp}&deg;</span>
          <span className="sb-weather-arrow">{weatherOpen ? '\u25B2' : '\u25BC'}</span>
        </button>
        <div className="sb-divider" aria-hidden />
        <span className="sb-clock">{clock}</span>
      </div>
    </div>
  )
}
