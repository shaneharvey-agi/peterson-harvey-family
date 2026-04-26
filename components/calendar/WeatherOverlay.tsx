'use client';

import { useEffect, useRef, useState } from 'react';
import { tokens } from '@/lib/design-tokens';
import { getForecast, type WeatherDay } from '@/lib/weather';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * 14-day forecast dropdown. Anchors to the WeatherBadge in CalendarHeader
 * (the parent positions this component as a sibling beneath that row),
 * fades + slides in on open, dismisses on outside-tap or Escape.
 *
 * Visuals follow the v5.1 Gold/Navy "liquid glass" theme: 0.5px gold border,
 * 35px backdrop blur, navy fill at ~92% opacity, gold-tinted day labels.
 */
export function WeatherOverlay({ open, onClose }: Props) {
  const [days, setDays] = useState<WeatherDay[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Fetch lazily on first open so we don't pay for the API call until the
  // user shows interest. Cached for 1h via lib/weather, so re-opens are free.
  useEffect(() => {
    if (!open || days !== null) return;
    let alive = true;
    (async () => {
      const forecast = await getForecast(14);
      if (!alive) return;
      if (forecast) setDays(forecast.days);
      else setLoadFailed(true);
    })();
    return () => {
      alive = false;
    };
  }, [open, days]);

  // Outside-tap + Escape dismissal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onPointerDown = (e: PointerEvent) => {
      const node = panelRef.current;
      if (!node) return;
      if (e.target instanceof Node && !node.contains(e.target)) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    // Defer outside-tap binding by one frame so the toggle press itself
    // doesn't immediately dismiss the panel it just opened.
    const id = window.requestAnimationFrame(() => {
      window.addEventListener('pointerdown', onPointerDown);
    });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.cancelAnimationFrame(id);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label="14-day weather forecast"
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(360px, calc(100vw - 24px))',
        maxHeight: 'min(60vh, 540px)',
        overflowY: 'auto',
        background: 'rgba(13, 24, 42, 0.92)',
        border: `0.5px solid ${tokens.gold}`,
        borderRadius: 14,
        backdropFilter: 'blur(35px) saturate(1.1)',
        WebkitBackdropFilter: 'blur(35px) saturate(1.1)',
        boxShadow: `0 16px 40px rgba(0,0,0,0.55), 0 0 18px rgba(196,160,80,0.25)`,
        zIndex: 30,
        animation: 'wo-slide 220ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '0.5px solid rgba(196,160,80,0.25)',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: tokens.gold,
        }}
      >
        14-day forecast
      </div>

      {days === null && !loadFailed && (
        <div style={{ padding: 18, textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
          Loading…
        </div>
      )}

      {loadFailed && (
        <div style={{ padding: 18, textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
          Couldn&apos;t load forecast.
        </div>
      )}

      {days !== null && days.length > 0 && (
        <ul style={{ listStyle: 'none', padding: '4px 0', margin: 0 }}>
          {days.map((d, i) => (
            <DayRow key={d.date} day={d} isToday={i === 0} />
          ))}
        </ul>
      )}

      <style>{`
        @keyframes wo-slide {
          from { opacity: 0; transform: translate(-50%, -6px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}

function DayRow({ day, isToday }: { day: WeatherDay; isToday: boolean }) {
  const d = new Date(`${day.date}T12:00:00`);
  const dow = isToday ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
  const md = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <li
      style={{
        display: 'grid',
        gridTemplateColumns: '64px 1fr 64px 56px',
        alignItems: 'center',
        gap: 10,
        padding: '9px 14px',
        borderBottom: '0.5px solid rgba(255,255,255,0.04)',
        color: '#FFFFFF',
        fontSize: 13,
      }}
    >
      <span style={{ fontWeight: 700, color: isToday ? tokens.gold : '#FFFFFF' }}>
        {dow}
      </span>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
        {md}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <ConditionGlyph condition={day.condition} />
        {day.precipChance > 0 && (
          <span style={{ fontSize: 10, color: '#6FB0E6', fontWeight: 600 }}>
            {day.precipChance}%
          </span>
        )}
      </span>
      <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.2px' }}>
        <span style={{ fontWeight: 700 }}>{day.high}°</span>
        <span style={{ color: 'rgba(255,255,255,0.45)', marginLeft: 6 }}>{day.low}°</span>
      </span>
    </li>
  );
}

function ConditionGlyph({ condition }: { condition: WeatherDay['condition'] }) {
  if (condition === 'clear') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="4.5" fill="#FFD52E" />
        <g stroke="#FFD52E" strokeWidth="1.6" strokeLinecap="round">
          <line x1="12" y1="2" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="22" />
          <line x1="2" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="22" y2="12" />
          <line x1="4.6" y1="4.6" x2="6" y2="6" />
          <line x1="18" y1="18" x2="19.4" y2="19.4" />
          <line x1="4.6" y1="19.4" x2="6" y2="18" />
          <line x1="18" y1="6" x2="19.4" y2="4.6" />
        </g>
      </svg>
    );
  }
  if (condition === 'rainy') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M6 14a4 4 0 1 1 1.5-7.7A5 5 0 0 1 17 9a3 3 0 0 1 0 6H6z" fill="#C8CED7" />
        <line x1="8" y1="17" x2="7" y2="20" stroke="#6FB0E6" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="12" y1="17" x2="11" y2="20" stroke="#6FB0E6" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="16" y1="17" x2="15" y2="20" stroke="#6FB0E6" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (condition === 'snowy') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M6 14a4 4 0 1 1 1.5-7.7A5 5 0 0 1 17 9a3 3 0 0 1 0 6H6z" fill="#C8CED7" />
        <circle cx="8" cy="19" r="1" fill="#F3F7FC" />
        <circle cx="12" cy="19" r="1" fill="#F3F7FC" />
        <circle cx="16" cy="19" r="1" fill="#F3F7FC" />
      </svg>
    );
  }
  // cloudy
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 16a4 4 0 1 1 1.5-7.7A5 5 0 0 1 17 11a3 3 0 0 1 0 6H6z" fill="#D8DDE5" />
    </svg>
  );
}

export default WeatherOverlay;
