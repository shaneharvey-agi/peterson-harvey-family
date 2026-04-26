'use client';

import { useEffect, useRef, useState } from 'react';
import { tokens } from '@/lib/design-tokens';
import { getForecast, type WeatherCondition, type WeatherDay } from '@/lib/weather';

interface Props {
  open: boolean;
  onClose: () => void;
  currentTemp: number | null;
  currentCondition: WeatherCondition | null;
}

/**
 * Horizontally-scrollable bento forecast. Anchors to the right of the
 * CalendarHeader row (parent container is the positioning context) so the
 * panel skews toward the top-right under the sun badge. The first tile —
 * "Today" — is sized larger and bolder; the rest of the week scrolls
 * left-to-right with scroll-snap, Reels-style.
 */
export function WeatherOverlay({ open, onClose, currentTemp, currentCondition }: Props) {
  const [days, setDays] = useState<WeatherDay[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

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

  const today = days?.[0] ?? null;
  const rest = days?.slice(1) ?? [];

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label="Weekly weather forecast"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: 'min(340px, calc(100vw - 24px))',
        background: 'rgba(13, 24, 42, 0.92)',
        border: `0.5px solid ${tokens.gold}`,
        borderRadius: 16,
        backdropFilter: 'blur(35px) saturate(1.1)',
        WebkitBackdropFilter: 'blur(35px) saturate(1.1)',
        boxShadow: `0 16px 40px rgba(0,0,0,0.55), 0 0 18px rgba(196,160,80,0.25)`,
        zIndex: 30,
        animation: 'wo-slide 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        overflow: 'hidden',
      }}
    >
      {days === null && !loadFailed && (
        <div style={{ padding: 22, textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
          Loading…
        </div>
      )}

      {loadFailed && (
        <div style={{ padding: 22, textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
          Couldn&apos;t load forecast.
        </div>
      )}

      {today && (
        <div
          className="wo-scroller"
          style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 8,
            padding: 10,
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <TodayTile day={today} liveTemp={currentTemp} liveCondition={currentCondition} />
          {rest.map((d) => (
            <DayTile key={d.date} day={d} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes wo-slide {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .wo-scroller::-webkit-scrollbar { display: none; }
        .wo-scroller { scrollbar-width: none; }
      `}</style>
    </div>
  );
}

function TodayTile({
  day,
  liveTemp,
  liveCondition,
}: {
  day: WeatherDay;
  liveTemp: number | null;
  liveCondition: WeatherCondition | null;
}) {
  const condition = liveCondition ?? day.condition;
  const temp = liveTemp ?? Math.round((day.high + day.low) / 2);

  return (
    <div
      style={{
        flex: '0 0 auto',
        scrollSnapAlign: 'start',
        width: 154,
        minHeight: 192,
        padding: 14,
        borderRadius: 14,
        background: 'linear-gradient(155deg, rgba(196,160,80,0.18) 0%, rgba(196,160,80,0.04) 60%, rgba(255,255,255,0.02) 100%)',
        border: `0.5px solid ${tokens.gold}`,
        boxShadow: `inset 0 0 0 0.5px rgba(196,160,80,0.25), 0 0 14px rgba(196,160,80,0.18)`,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        color: '#FFFFFF',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '1.6px',
          textTransform: 'uppercase',
          color: tokens.gold,
        }}
      >
        Today
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
        <ConditionGlyph condition={condition} size={32} />
        <div
          style={{
            fontSize: 40,
            fontWeight: 800,
            letterSpacing: '-1.2px',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {temp}°
        </div>
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Stat label="High" value={`${day.high}°`} />
        <Stat label="Low" value={`${day.low}°`} valueDim />
        <Stat label="Precip" value={`${day.precipChance}%`} valueColor="#6FB0E6" emphasized />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  valueDim = false,
  valueColor,
  emphasized = false,
}: {
  label: string;
  value: string;
  valueDim?: boolean;
  valueColor?: string;
  emphasized?: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '1.2px',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.55)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: emphasized ? 13 : 13,
          fontWeight: emphasized ? 800 : 700,
          color: valueColor ?? (valueDim ? 'rgba(255,255,255,0.6)' : '#FFFFFF'),
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function DayTile({ day }: { day: WeatherDay }) {
  const d = new Date(`${day.date}T12:00:00`);
  const dow = d.toLocaleDateString('en-US', { weekday: 'short' });
  const dnum = d.getDate();

  return (
    <div
      style={{
        flex: '0 0 auto',
        scrollSnapAlign: 'start',
        width: 76,
        minHeight: 192,
        padding: '12px 8px',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.04)',
        border: '0.5px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        color: '#FFFFFF',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.4px' }}>
        {dow}
      </div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', marginTop: -3 }}>{dnum}</div>

      <div style={{ marginTop: 6 }}>
        <ConditionGlyph condition={day.condition} size={26} />
      </div>

      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{day.high}°</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
          {day.low}°
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: day.precipChance > 0 ? '#6FB0E6' : 'rgba(255,255,255,0.3)',
            marginTop: 3,
          }}
        >
          {day.precipChance}%
        </span>
      </div>
    </div>
  );
}

function ConditionGlyph({
  condition,
  size = 18,
}: {
  condition: WeatherCondition;
  size?: number;
}) {
  if (condition === 'clear') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
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
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M6 14a4 4 0 1 1 1.5-7.7A5 5 0 0 1 17 9a3 3 0 0 1 0 6H6z" fill="#C8CED7" />
        <line x1="8" y1="17" x2="7" y2="20" stroke="#6FB0E6" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="12" y1="17" x2="11" y2="20" stroke="#6FB0E6" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="16" y1="17" x2="15" y2="20" stroke="#6FB0E6" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (condition === 'snowy') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M6 14a4 4 0 1 1 1.5-7.7A5 5 0 0 1 17 9a3 3 0 0 1 0 6H6z" fill="#C8CED7" />
        <circle cx="8" cy="19" r="1" fill="#F3F7FC" />
        <circle cx="12" cy="19" r="1" fill="#F3F7FC" />
        <circle cx="16" cy="19" r="1" fill="#F3F7FC" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 16a4 4 0 1 1 1.5-7.7A5 5 0 0 1 17 11a3 3 0 0 1 0 6H6z" fill="#D8DDE5" />
    </svg>
  );
}

export default WeatherOverlay;
