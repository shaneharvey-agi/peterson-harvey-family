'use client'

type Forecast = { label: string; icon: string; high: number; low: number; today?: boolean }

export default function WeatherDropdown({ open, forecast }: { open: boolean; forecast: Forecast[] }) {
  return (
    <div className="wx-drop" style={{ maxHeight: open ? 130 : 0 }}>
      <div className="wx-row">
        {forecast.map((d) => (
          <div key={d.label} className={'wx-day' + (d.today ? ' wx-today' : '')}>
            <span className="wx-label">{d.label}</span>
            <span className="wx-icon">{d.icon}</span>
            <span className="wx-high">{d.high}&deg;</span>
            <span className="wx-low">{d.low}&deg;</span>
          </div>
        ))}
      </div>
    </div>
  )
}
