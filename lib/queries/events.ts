// lib/queries/events.ts
import { supabase, type Event as SbEvent } from '@/lib/supabase';
import type { FamilyMember } from '@/lib/design-tokens';
import { mockEvents, type TimelineEvent } from '@/lib/mock/events';

export type { TimelineEvent };

/** Short "8:15a" formatter used across the timeline UI. */
export function formatShortTime(raw: string | null): string {
  if (!raw) return '';
  const parts = raw.split(':');
  if (parts.length < 2) return raw;
  let h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return raw;
  const suffix = h >= 12 ? 'p' : 'a';
  h = h % 12;
  if (h === 0) h = 12;
  const mStr = m === 0 ? '' : `:${String(m).padStart(2, '0')}`;
  return `${h}${mStr}${suffix}`;
}

/** ISO date (YYYY-MM-DD) for today in local time. */
function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function normalizeMember(who: string): FamilyMember {
  const w = (who || '').toLowerCase().trim();
  if (w.includes('shane')) return 'shane';
  if (w.includes('molly')) return 'molly';
  if (w.includes('evey')) return 'evey';
  if (w.includes('jax')) return 'jax';
  return 'molly';
}

function mapRow(row: SbEvent): TimelineEvent {
  return {
    id: String(row.id),
    time: formatShortTime(row.time),
    endTime: row.end_time ? formatShortTime(row.end_time) : null,
    title: row.title || '(untitled)',
    detail: [row.address, row.notes].filter(Boolean).join(' · ') || undefined,
    member: normalizeMember(row.who),
  };
}

export async function fetchTodayEvents(): Promise<TimelineEvent[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('date', todayIso())
      .order('time', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return mockEvents;
    return (data as SbEvent[]).map(mapRow);
  } catch (err) {
    console.warn('[queries/events] falling back to mock:', err);
    return mockEvents;
  }
}

/**
 * Full editable event (raw, unformatted) — used by the detail/edit route.
 * Times are raw 24h "HH:MM" strings so the edit form can round-trip them.
 */
export interface EventDetail {
  id: string;
  title: string;
  date: string;            // YYYY-MM-DD
  time: string | null;     // HH:MM
  endTime: string | null;  // HH:MM
  who: string;             // raw who string (may be "Molly", "Evey + Jax", etc.)
  member: FamilyMember;
  address: string;
  notes: string;
}

function mapDetail(row: SbEvent): EventDetail {
  return {
    id: String(row.id),
    title: row.title || '',
    date: row.date,
    time: row.time,
    endTime: row.end_time,
    who: row.who || '',
    member: normalizeMember(row.who),
    address: row.address || '',
    notes: row.notes || '',
  };
}

/** Look up a single event by id, with a mock fallback for preview builds. */
export async function fetchEventById(id: string): Promise<EventDetail | null> {
  // Mock fallback (ids prefixed "mock-")
  if (id.startsWith('mock-')) {
    const m = mockEvents.find((e) => e.id === id);
    if (!m) return null;
    return {
      id: m.id,
      title: m.title,
      date: todayIso(),
      time: null,
      endTime: null,
      who: m.member,
      member: m.member,
      address: '',
      notes: m.detail ?? '',
    };
  }
  try {
    const numeric = Number(id);
    if (!Number.isFinite(numeric)) return null;
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', numeric)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return mapDetail(data as SbEvent);
  } catch (err) {
    console.warn('[queries/events] fetchEventById failed:', err);
    return null;
  }
}
