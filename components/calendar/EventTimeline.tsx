'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { tokens, familyColor, type FamilyMember } from '@/lib/design-tokens';
import { fetchTodayEvents, type TimelineEvent } from '@/lib/queries/events';
import { fetchTonightDinner, type DinnerPlan } from '@/lib/queries/dinner';
import {
  filterByMember,
  parseMemberFilter,
  type MemberFilter,
} from '@/lib/events/filter';

/**
 * Normalize various time strings to minutes-of-day for comparison.
 * Accepts: "6:30p", "6:30 PM", "18:30", "6p", "6:30A" etc.
 * Returns null if unparseable.
 */
function timeToMinutes(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase().replace(/\s+/g, '');
  // match: h[:mm][a|p|am|pm]
  const m = s.match(/^(\d{1,2})(?::(\d{2}))?(a|p|am|pm)?$/);
  if (!m) {
    // try "HH:MM" 24h already
    const m2 = s.match(/^(\d{1,2}):(\d{2})$/);
    if (m2) {
      const h24 = Number(m2[1]);
      const mm = Number(m2[2]);
      if (Number.isFinite(h24) && Number.isFinite(mm)) return h24 * 60 + mm;
    }
    return null;
  }
  let h = Number(m[1]);
  const mm = m[2] ? Number(m[2]) : 0;
  const suf = m[3];
  if (!Number.isFinite(h) || !Number.isFinite(mm)) return null;
  if (suf === 'p' || suf === 'pm') {
    if (h < 12) h += 12;
  } else if (suf === 'a' || suf === 'am') {
    if (h === 12) h = 0;
  }
  return h * 60 + mm;
}

/**
 * Events whose title mentions "family" (or an event member === multiple people)
 * render with a single white Family icon. For this pass we also treat any
 * event title matching /family/i as a family event.
 */
function isFamilyEvent(ev: TimelineEvent): boolean {
  return /family/i.test(ev.title);
}

export function EventTimeline() {
  const [events, setEvents] = useState<TimelineEvent[] | null>(null);
  const [dinner, setDinner] = useState<DinnerPlan | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const memberFilter: MemberFilter = parseMemberFilter(searchParams?.get('who'));

  useEffect(() => {
    let alive = true;
    (async () => {
      const [list, plan] = await Promise.all([fetchTodayEvents(), fetchTonightDinner()]);
      if (!alive) return;
      setEvents(list);
      setDinner(plan);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const memberFilteredEvents = useMemo(
    () => (events ? filterByMember(events, memberFilter) : null),
    [events, memberFilter],
  );

  if (events === null || memberFilteredEvents === null) {
    return <div className="h-[120px]" aria-hidden />;
  }

  // When a specific member is selected, suppress the Dinner row too —
  // it's a household plan, not personally owned.
  const dinnerVisible = memberFilter === 'family' ? dinner : null;

  // Dinner dedup: if an event matches /dinner/i in title AND time matches
  // dinner.scheduledTime, suppress it (the dinner row will replace it).
  const dinnerMinutes = dinnerVisible ? timeToMinutes(dinnerVisible.scheduledTime) : null;
  const filtered = memberFilteredEvents.filter((ev) => {
    if (!dinnerVisible || dinnerMinutes == null) return true;
    if (!/dinner/i.test(ev.title)) return true;
    const evMinutes = timeToMinutes(ev.time);
    return evMinutes !== dinnerMinutes;
  });

  // Insert the dinner row at the correct slot (sorted by time asc).
  // Build a display list of rows:
  type Row =
    | { kind: 'event'; ev: TimelineEvent; minutes: number | null }
    | { kind: 'dinner'; plan: DinnerPlan; minutes: number | null };

  const rows: Row[] = filtered.map((ev) => ({
    kind: 'event' as const,
    ev,
    minutes: timeToMinutes(ev.time),
  }));
  if (dinnerVisible) {
    rows.push({ kind: 'dinner' as const, plan: dinnerVisible, minutes: dinnerMinutes });
  }
  // Stable sort by minutes; rows with null minutes stay in original order at bottom.
  rows.sort((a, b) => {
    if (a.minutes == null && b.minutes == null) return 0;
    if (a.minutes == null) return 1;
    if (b.minutes == null) return -1;
    return a.minutes - b.minutes;
  });

  const clearFilter = () => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.delete('who');
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : '/', { scroll: false });
  };

  return (
    <div className="flex flex-col gap-2">
      {memberFilter !== 'family' && (
        <FilterPill member={memberFilter} onClear={clearFilter} />
      )}
      {rows.length === 0 ? (
        <div className="text-[11px] text-white/40 py-4 text-center">
          {memberFilter === 'family'
            ? 'Nothing on the calendar today.'
            : `Nothing on ${capitalize(memberFilter)}'s calendar today.`}
        </div>
      ) : (
        rows.map((row) =>
          row.kind === 'event' ? (
            <EventRow key={`ev-${row.ev.id}`} ev={row.ev} />
          ) : (
            <DinnerRow key={`dn-${row.plan.id}`} plan={row.plan} />
          ),
        )
      )}
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ─────────── Filter pill ─────────── */

function FilterPill({
  member,
  onClear,
}: {
  member: FamilyMember;
  onClear: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClear}
      aria-label={`Showing only ${member}. Tap to show family.`}
      className="flex items-center justify-between rounded-md"
      style={{
        padding: '8px 12px',
        background: `${familyColor(member)}1F`,
        border: `1px solid ${familyColor(member)}66`,
        color: '#FFFFFF',
      }}
    >
      <span className="text-[12px] font-semibold">
        Viewing {capitalize(member)} only
      </span>
      <span
        className="text-[10px] font-semibold uppercase tracking-[1px]"
        style={{ color: 'rgba(255,255,255,0.6)' }}
      >
        Show family ×
      </span>
    </button>
  );
}

// Format dinner scheduledTime ("6:30 PM") to the same short style the
// other rows use ("6:30p").
function formatShort(raw: string): string {
  const mins = timeToMinutes(raw);
  if (mins == null) return raw;
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h >= 12 ? 'p' : 'a';
  h = h % 12;
  if (h === 0) h = 12;
  const mStr = m === 0 ? '' : `:${String(m).padStart(2, '0')}`;
  return `${h}${mStr}${suffix}`;
}

/* ─────────── Event row (Sleeper-style) ─────────── */

function EventRow({ ev }: { ev: TimelineEvent }) {
  const family = isFamilyEvent(ev);
  // Show start–end when both present; else just start. Keep it tight so it
  // fits the 40px gutter (e.g. "7:30a" / "3:15–4:30p").
  const timeLabel = ev.endTime
    ? `${stripSuffixIfSameHalf(ev.time, ev.endTime)}–${ev.endTime}`
    : ev.time;

  return (
    <Link
      href={`/events/${ev.id}`}
      prefetch={false}
      aria-label={`Edit ${ev.title}`}
      className="flex items-center gap-2.5 rounded-md no-underline"
      style={{
        background: 'rgba(255,255,255,0.04)',
        padding: '10px 10px',
        minHeight: 52,
      }}
    >
      <span
        className="text-[10px] font-semibold shrink-0"
        style={{
          color: 'rgba(255,255,255,0.7)',
          minWidth: 54,
          lineHeight: 1.1,
        }}
      >
        {timeLabel}
      </span>
      {family ? <FamilyIcon /> : <PersonIcon member={ev.member} />}
      <div className="flex-1 min-w-0">
        <div
          className="text-[13px] font-semibold truncate"
          style={{ color: '#FFFFFF' }}
        >
          {ev.title}
        </div>
        {ev.detail && (
          <div
            className="text-[11px] leading-tight truncate"
            style={{ color: 'rgba(255,255,255,0.6)', marginTop: 1 }}
          >
            {ev.detail}
          </div>
        )}
      </div>
    </Link>
  );
}

/**
 * When both times share the same am/pm suffix, drop it from the start
 * so "3:15p–4:30p" renders as "3:15–4:30p". Cross-meridiem keeps both.
 */
function stripSuffixIfSameHalf(start: string, end: string): string {
  const startSuf = start.slice(-1);
  const endSuf = end.slice(-1);
  if ((startSuf === 'a' || startSuf === 'p') && startSuf === endSuf) {
    return start.slice(0, -1);
  }
  return start;
}

function PersonIcon({ member }: { member: FamilyMember }) {
  const letter = member.charAt(0).toUpperCase();
  const [photoOk, setPhotoOk] = useState(true);
  const accent = familyColor(member);

  return (
    <span
      aria-hidden
      className="flex items-center justify-center shrink-0"
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: photoOk ? '#0D1119' : accent,
        border: `2px solid ${accent}`,
        overflow: 'hidden',
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 800,
        lineHeight: 1,
      }}
    >
      {photoOk ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/avatars/${member}.jpg`}
          alt=""
          onError={() => setPhotoOk(false)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
          }}
          draggable={false}
        />
      ) : (
        letter
      )}
    </span>
  );
}

function FamilyIcon() {
  return (
    <span
      aria-hidden
      className="flex items-center justify-center shrink-0"
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.16)',
        border: '1.5px solid rgba(255,255,255,0.5)',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        {/* Two adult silhouettes + two children — simple family glyph */}
        <circle cx="8" cy="8" r="2.3" stroke="#FFFFFF" strokeWidth="1.5" />
        <circle cx="16" cy="8" r="2.3" stroke="#FFFFFF" strokeWidth="1.5" />
        <path
          d="M3.5 18c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M11.5 18c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </span>
  );
}

/* ─────────── Dinner row (inline, 1.5× standard height) ─────────── */

function DinnerRow({ plan }: { plan: DinnerPlan }) {
  const time = formatShort(plan.scheduledTime);
  // Standard row min-height ~52px, dinner 1.5× → ~78px.
  const rowHeight = 78;

  return (
    <Link
      href={`/meals/recipe/${plan.recipeId}`}
      prefetch={false}
      aria-label={`Dinner: ${plan.recipeName}`}
      className="relative block overflow-hidden rounded-md"
      style={{ height: rowHeight }}
    >
      {/* Recipe photo fills the row */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={plan.imageUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      {/* Bottom gradient for legibility */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0"
        style={{
          height: '75%',
          background:
            'linear-gradient(180deg, rgba(7,9,15,0) 0%, rgba(7,9,15,0.6) 55%, rgba(7,9,15,0.92) 100%)',
        }}
      />

      {/* Time label top-left */}
      <span
        className="absolute text-[10px] font-semibold"
        style={{
          top: 8,
          left: 10,
          color: '#FFFFFF',
          textShadow: '0 1px 3px rgba(0,0,0,0.7)',
        }}
      >
        {time}
      </span>

      {/* Family icon — top-right area (person slot) */}
      <span
        aria-hidden
        className="absolute flex items-center justify-center"
        style={{
          top: 8,
          right: 10,
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'rgba(7,9,15,0.55)',
          border: '1.5px solid rgba(255,255,255,0.6)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="8" cy="8" r="2.3" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx="16" cy="8" r="2.3" stroke="#FFFFFF" strokeWidth="1.5" />
          <path
            d="M3.5 18c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M11.5 18c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </span>

      {/* Bottom row: label + recipe name + play */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-2.5">
        <div className="min-w-0 pr-2">
          <div
            className="text-[10px] font-extrabold tracking-[1px]"
            style={{ color: '#FFFFFF' }}
          >
            DINNER · {plan.cookTime.toUpperCase()}
          </div>
          <div
            className="text-[13px] font-bold leading-tight mt-0.5 truncate"
            style={{ color: '#FFFFFF' }}
          >
            {plan.recipeName}
          </div>
        </div>
        <span
          aria-hidden
          className="flex shrink-0 items-center justify-center"
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: tokens.gold,
            boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
          }}
        >
          <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden>
            <path d="M0 0 L10 6 L0 12 Z" fill="#07090F" />
          </svg>
        </span>
      </div>

      {/* Gold pulse border */}
      <span
        aria-hidden
        className="dinner-row-border pointer-events-none absolute inset-0 rounded-md"
      />
      <style jsx>{`
        .dinner-row-border {
          border: 1.5px solid rgba(196, 160, 80, 0.75);
          animation: dinnerRowPulse 2.5s ease-in-out infinite;
        }
        @keyframes dinnerRowPulse {
          0%, 100% {
            border-color: rgba(196, 160, 80, 0.4);
            box-shadow: 0 0 0 0 rgba(196, 160, 80, 0);
          }
          50% {
            border-color: rgba(196, 160, 80, 0.75);
            box-shadow: 0 0 12px rgba(196, 160, 80, 0.3);
          }
        }
      `}</style>
    </Link>
  );
}
