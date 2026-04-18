// lib/queries/events.ts
import { supabase, type Event as SbEvent } from '@/lib/supabase';
import type { FamilyMember } from '@/lib/design-tokens';
import { mockEvents, type TimelineEvent } from '@/lib/mock/events';

export type { TimelineEvent };

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

function formatTime(raw: string | null): string {
  if (!raw) return '';
  // accepts 'HH:MM' or 'HH:MM:SS'
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

function mapRow(row: SbEvent): TimelineEvent {
  return {
    id: String(row.id),
    time: formatTime(row.time),
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
