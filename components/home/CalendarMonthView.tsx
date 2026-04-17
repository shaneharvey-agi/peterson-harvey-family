'use client'

import { MONTH_EVENTS, MONTH_TODAY } from '@/lib/home-data'

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function CalendarMonthView() {
  const cells: Array<{ day: number | null; today: boolean; dots: string[] }> = []

  for (let i = 0; i < 3; i++) cells.push({ day: null, today: false, dots: [] })
  for (let d = 1; d <= 30; d++) {
    cells.push({
      day: d,
      today: d === MONTH_TODAY,
      dots: (MONTH_EVENTS[d] || []).slice(0, 3),
    })
  }

  return (
    <div className="cal-month">
      <div className="cal-month-dow">
        {DOW.map((d, i) => (
          <div key={i} className="cal-month-dow-cell">
            {d}
          </div>
        ))}
      </div>
      <div className="cal-month-grid">
        {cells.map((c, i) => (
          <div key={i} className={'cal-month-cell' + (c.today ? ' cal-month-today' : '')}>
            {c.day !== null && (
              <>
                <span className={'cal-month-num' + (c.today ? ' cal-month-num-today' : '')}>{c.day}</span>
                <div className="cal-month-dots">
                  {c.dots.map((color, di) => (
                    <div key={di} className="cal-month-dot" style={{ background: color }} />
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="cal-month-legend">
        <div className="cal-month-legend-item"><div className="cal-month-dot" style={{ background: '#4A90E2' }} />Shane</div>
        <div className="cal-month-legend-item"><div className="cal-month-dot" style={{ background: '#B57BFF' }} />Molly</div>
        <div className="cal-month-legend-item"><div className="cal-month-dot" style={{ background: '#FF6B9D' }} />Evey</div>
        <div className="cal-month-legend-item"><div className="cal-month-dot" style={{ background: '#4CAF7D' }} />Jax</div>
      </div>
    </div>
  )
}
