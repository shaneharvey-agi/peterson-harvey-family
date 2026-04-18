// lib/events/conflicts.ts
//
// Pure conflict detection. No Supabase calls, no React. Same function is
// invoked by Mikayla (pre-confirmation of a voice command) and by the
// edit route (surface overlaps to the user).
//
// Conflict rules:
//   - Both events must share the same date.
//   - Both events must have a start time (events without times are informational).
//   - Per-member: overlap in [time, endTime) flags as a conflict.
//   - If either event has no endTime, treat as a 30-min default window.
//   - An event does not conflict with itself (ignoreId).

import type { FamilyMember } from '@/lib/design-tokens';

/** Minimal shape we compare. Takes raw 24h HH:MM strings. */
export interface ConflictCandidate {
  id: string;
  date: string;
  time: string | null;
  endTime: string | null;
  member: FamilyMember;
  title: string;
}

const DEFAULT_WINDOW_MINUTES = 30;

function timeToMinutes(v: string | null): number | null {
  if (!v) return null;
  const parts = v.split(':');
  if (parts.length < 2) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function windowOf(ev: ConflictCandidate): [number, number] | null {
  const start = timeToMinutes(ev.time);
  if (start == null) return null;
  const end = timeToMinutes(ev.endTime);
  return [start, end == null ? start + DEFAULT_WINDOW_MINUTES : end];
}

/**
 * Return existing events that overlap with `proposed`. Ignores `proposed.id`
 * (so editing an event doesn't flag itself as a conflict).
 *
 * Same-member overlap = hard conflict. Cross-member overlap is NOT flagged
 * here — Mikayla handles household-wide "double-booking two kids" warnings
 * at a higher layer when needed.
 */
export function detectConflicts(
  proposed: ConflictCandidate,
  existing: ConflictCandidate[],
): ConflictCandidate[] {
  const pw = windowOf(proposed);
  if (!pw) return [];
  const [pStart, pEnd] = pw;

  return existing.filter((ev) => {
    if (ev.id === proposed.id) return false;
    if (ev.date !== proposed.date) return false;
    if (ev.member !== proposed.member) return false;
    const ew = windowOf(ev);
    if (!ew) return false;
    const [eStart, eEnd] = ew;
    // half-open overlap: [a, b) intersects [c, d) iff a < d && c < b
    return pStart < eEnd && eStart < pEnd;
  });
}
