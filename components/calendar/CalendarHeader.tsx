'use client';

import { useEffect, useState } from 'react';
import { WeatherBadge } from './WeatherBadge';
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
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-[14px] font-extrabold text-[#C4A050] tracking-[0.8px] whitespace-nowrap">
          {dateStr}
        </span>
        <WeatherBadge temp={temp} condition={condition} />
        {condition && (
          <span className="text-[10px] text-white/50 font-medium capitalize">
            {condition}
          </span>
        )}
      </div>
      <DayWeekMonthToggle />
    </div>
  );
}
