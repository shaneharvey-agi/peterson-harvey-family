'use client'

type WeekItem = { label: string; color: string; title: string; image?: string }
type WeekDay = { dow: string; today?: boolean; items: WeekItem[] }

const FAKE_WEEK: WeekDay[] = [
  {
    dow: 'Wed',
    today: true,
    items: [
      { label: 'shane', color: '#4A90E2', title: 'SmartBuild 9a' },
      { label: 'molly', color: '#B57BFF', title: 'Lunch w/ Molly 12:30p' },
      { label: 'dinner', color: '#C4A050', title: 'Chicken Tikka Masala' },
    ],
  },
  { dow: 'Thu', items: [{ label: 'shane', color: '#4A90E2', title: 'Team standup 9a' }] },
  { dow: 'Fri', items: [{ label: 'evey', color: '#FF6B9D', title: 'Evey piano 4p' }] },
  { dow: 'Sat', items: [{ label: 'jax', color: '#4CAF7D', title: 'Jax game 10a' }] },
  { dow: 'Sun', items: [] },
]

export default function CalendarWeekView() {
  return (
    <div className="cal-week">
      {FAKE_WEEK.map((day) => (
        <div key={day.dow} className="cal-week-day">
          <div className="cal-week-head">
            <span className={'cal-week-dow' + (day.today ? ' cal-week-today-dow' : '')}>{day.dow}</span>
            {day.today && <span className="cal-week-today-pill">TODAY</span>}
            <div className="cal-week-line" />
          </div>
          {day.items.length === 0 ? (
            <div className="cal-week-empty">Clear</div>
          ) : (
            <div className="cal-week-items">
              {day.items.map((it, i) => (
                <div
                  key={i}
                  className="cal-week-item"
                  style={{ background: hexToRgba(it.color, 0.08), borderColor: hexToRgba(it.color, 0.2) }}
                >
                  <div className="cal-week-dot" style={{ background: it.color }} />
                  <span className="cal-week-title">{it.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function hexToRgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}
