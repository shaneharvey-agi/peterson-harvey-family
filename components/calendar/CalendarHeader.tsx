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
    <div
      className="flex justify-between items-center py-[10px] pb-3"
      style={{ position: 'relative' }}
    >
      {/* Left zone: date */}
      <div className="flex-1 min-w-0">
        <span className="text-[14px] font-extrabold text-[#FFFFFF] tracking-[0.8px] whitespace-nowrap">
          {dateStr}
        </span>
      </div>
      {/* Middle zone: weather icon (centered) — tap to toggle the bento forecast. */}
      <div className="flex-1 flex justify-center">
        <button
          type="button"
          onClick={() => setForecastOpen((v) => !v)}
          aria-expanded={forecastOpen}
          aria-haspopup="dialog"
          aria-label={forecastOpen ? 'Close weather forecast' : 'Open weather forecast'}
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
      </div>
      {/* Right zone: toggle */}
      <div className="flex-1 flex justify-end">
        <DayWeekMonthToggle />
      </div>
      {/* Forecast bento — anchored to the right edge of the header row so it
          drops in under the sun and skews toward the top-right of the screen. */}
      <WeatherOverlay
        open={forecastOpen}
        onClose={() => setForecastOpen(false)}
        currentTemp={temp}
        currentCondition={condition}
      />
    </div>
  );
}
