'use client';

import { useEffect, useState } from 'react';
import { WeatherBadge } from './WeatherBadge';
import { WeatherOverlay } from './WeatherOverlay';
import { DayWeekMonthToggle } from './DayWeekMonthToggle';
import { getWeather, type WeatherCondition } from '@/lib/weather';

function formatToday(): string {
  const d = new Date();
  // e.g. "THU · APR 17"
  const dow = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const mon = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = d.getDate();
  return `${dow} · ${mon} ${day}`;
}

export function CalendarHeader() {
  const [temp, setTemp] = useState<number | null>(null);
  const [condition, setCondition] = useState<WeatherCondition | null>(null);
  const [dateStr, setDateStr] = useState<string>(() => formatToday());
  const [forecastOpen, setForecastOpen] = useState(false);

  useEffect(() => {
    // Refresh date label at mount in case SSR stamped a different day.
    setDateStr(formatToday());
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const snap = await getWeather();
      if (!alive || !snap) return;
      setTemp(snap.temp);
      setCondition(snap.condition);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="flex justify-between items-center py-[10px] pb-3">
      {/* Left zone: date */}
      <div className="flex-1 min-w-0">
        <span className="text-[14px] font-extrabold text-[#FFFFFF] tracking-[0.8px] whitespace-nowrap">
          {dateStr}
        </span>
      </div>
      {/* Middle zone: weather icon (centered) — tap to toggle 14-day overlay.
          Position relative so the overlay can absolutely-position beneath it. */}
      <div className="flex-1 flex justify-center" style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setForecastOpen((v) => !v)}
          aria-expanded={forecastOpen}
          aria-haspopup="dialog"
          aria-label={forecastOpen ? 'Close 14-day forecast' : 'Open 14-day forecast'}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          } as React.CSSProperties}
        >
          <WeatherBadge temp={temp} condition={condition} />
        </button>
        <WeatherOverlay open={forecastOpen} onClose={() => setForecastOpen(false)} />
      </div>
      {/* Right zone: toggle */}
      <div className="flex-1 flex justify-end">
        <DayWeekMonthToggle />
      </div>
    </div>
  );
}
