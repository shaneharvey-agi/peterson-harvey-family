// lib/mutations/events.ts
//
// Voice-first event mutation layer. Every function here takes plain typed
// input and returns a typed result — no UI coupling. Mikayla's voice
// handler and the /events/[id] edit form both call these same functions.
//
// Contract: accept raw "HH:MM" time strings (24h) or null. Callers that
// take human input ("6:30pm", "six thirty") normalize BEFORE calling.
// This module does not guess — if you hand it garbage, it errors out.

import { supabase } from '@/lib/supabase';
import type { EventDetail } from '@/lib/queries/events';

/** Input shape shared by create and update. `id` present = update. */
export interface EventInput {
  title: string;
  date: string;            // YYYY-MM-DD
  time: string | null;     // HH:MM (24h), null = all-day / unspecified
  endTime: string | null;  // HH:MM (24h), null = no end
  who: string;             // free-form; query layer normalizes to member
  address: string;
  notes: string;
}

export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** Strict "HH:MM" or "HH:MM:SS" validator. */
function isValidTime(v: string | null): boolean {
  if (v === null) return true;
  return /^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(v);
}

function validate(input: EventInput): string | null {
  if (!input.title.trim()) return 'Title is required.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return 'Invalid date.';
  if (!isValidTime(input.time)) return 'Invalid start time.';
  if (!isValidTime(input.endTime)) return 'Invalid end time.';
  if (input.time && input.endTime && input.endTime <= input.time) {
    return 'End time must be after start time.';
  }
  return null;
}

export async function createEvent(
  input: EventInput,
): Promise<MutationResult<EventDetail>> {
  const err = validate(input);
  if (err) return { ok: false, error: err };
  try {
    const { data, error } = await supabase
      .from('events')
      .insert({
        title: input.title,
        date: input.date,
        time: input.time,
        end_time: input.endTime,
        who: input.who,
        address: input.address,
        notes: input.notes,
      })
      .select('*')
      .single();
    if (error) throw error;
    return { ok: true, data: rowToDetail(data) };
  } catch (e) {
    return { ok: false, error: humanize(e) };
  }
}

export async function updateEvent(
  id: string,
  input: EventInput,
): Promise<MutationResult<EventDetail>> {
  const err = validate(input);
  if (err) return { ok: false, error: err };
  const numeric = Number(id);
  if (!Number.isFinite(numeric)) {
    return { ok: false, error: 'Invalid event id.' };
  }
  try {
    const { data, error } = await supabase
      .from('events')
      .update({
        title: input.title,
        date: input.date,
        time: input.time,
        end_time: input.endTime,
        who: input.who,
        address: input.address,
        notes: input.notes,
      })
      .eq('id', numeric)
      .select('*')
      .single();
    if (error) throw error;
    return { ok: true, data: rowToDetail(data) };
  } catch (e) {
    return { ok: false, error: humanize(e) };
  }
}

export async function deleteEvent(
  id: string,
): Promise<MutationResult<{ id: string }>> {
  const numeric = Number(id);
  if (!Number.isFinite(numeric)) {
    return { ok: false, error: 'Invalid event id.' };
  }
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', numeric);
    if (error) throw error;
    return { ok: true, data: { id } };
  } catch (e) {
    return { ok: false, error: humanize(e) };
  }
}

function humanize(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) {
    return String((e as { message: unknown }).message);
  }
  return 'Unknown error.';
}

function rowToDetail(row: Record<string, unknown>): EventDetail {
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    date: String(row.date ?? ''),
    time: (row.time as string | null) ?? null,
    endTime: (row.end_time as string | null) ?? null,
    who: String(row.who ?? ''),
    member: 'molly', // query layer re-normalizes on read; detail is informational here
    address: String(row.address ?? ''),
    notes: String(row.notes ?? ''),
  };
}
