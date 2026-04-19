// lib/mutations/chores.ts
//
// Voice-first chore mutations. Same contract as events/notifications:
// plain typed input, MutationResult return, no UI coupling. Mikayla's
// voice handler and the /chores page both call these same functions.

import { supabase, type ChoreRow } from '@/lib/supabase';
import type { FamilyMember } from '@/lib/design-tokens';
import type { Chore } from '@/lib/queries/chores';

export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export interface AddChoreInput {
  assignee: FamilyMember;
  title: string;
  dueDate: string | null;   // YYYY-MM-DD or null
  createdBy: FamilyMember | null;
  notes?: string;
}

function isValidDate(v: string | null): boolean {
  if (v === null) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function validate(input: AddChoreInput): string | null {
  if (!input.assignee) return 'Assignee is required.';
  if (!input.title.trim()) return 'Title is required.';
  if (!isValidDate(input.dueDate)) return 'Invalid due date.';
  return null;
}

export async function addChore(
  input: AddChoreInput,
): Promise<MutationResult<Chore>> {
  const err = validate(input);
  if (err) return { ok: false, error: err };
  try {
    const { data, error } = await supabase
      .from('chores')
      .insert({
        assignee: input.assignee,
        title: input.title.trim(),
        due_date: input.dueDate,
        created_by: input.createdBy,
        notes: input.notes ?? null,
      })
      .select('*')
      .single();
    if (error) throw error;
    return { ok: true, data: rowToChore(data as ChoreRow) };
  } catch (e) {
    return { ok: false, error: humanize(e) };
  }
}

export async function completeChore(
  id: string,
): Promise<MutationResult<{ id: string; doneAt: string }>> {
  const numeric = Number(id);
  if (!Number.isFinite(numeric)) {
    return { ok: false, error: 'Invalid chore id.' };
  }
  const doneAt = new Date().toISOString();
  try {
    const { error } = await supabase
      .from('chores')
      .update({ done_at: doneAt })
      .eq('id', numeric);
    if (error) throw error;
    return { ok: true, data: { id, doneAt } };
  } catch (e) {
    return { ok: false, error: humanize(e) };
  }
}

export async function reassignChore(
  id: string,
  assignee: FamilyMember,
): Promise<MutationResult<{ id: string; assignee: FamilyMember }>> {
  const numeric = Number(id);
  if (!Number.isFinite(numeric)) {
    return { ok: false, error: 'Invalid chore id.' };
  }
  try {
    const { error } = await supabase
      .from('chores')
      .update({ assignee })
      .eq('id', numeric);
    if (error) throw error;
    return { ok: true, data: { id, assignee } };
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

function rowToChore(row: ChoreRow): Chore {
  const normalize = (w: string | null): FamilyMember => {
    const v = (w || '').toLowerCase().trim();
    if (v.includes('shane')) return 'shane';
    if (v.includes('molly')) return 'molly';
    if (v.includes('evey')) return 'evey';
    return 'jax';
  };
  return {
    id: String(row.id),
    assignee: normalize(row.assignee),
    title: row.title || '',
    dueDate: row.due_date,
    doneAt: row.done_at,
    createdBy: row.created_by ? normalize(row.created_by) : null,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}
