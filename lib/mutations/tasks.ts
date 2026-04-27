// lib/mutations/tasks.ts
//
// Unified task mutations. Replaces lib/mutations/chores.ts and
// lib/mutations/todos.ts. Both the /tasks page and the M Orb voice
// dispatch call these directly.

import { supabase, type TaskRow } from '@/lib/supabase';
import type { FamilyMember } from '@/lib/design-tokens';
import { mapRow, type Task } from '@/lib/queries/tasks';

export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export interface AddTaskInput {
  assignee: FamilyMember;
  title: string;
  dueDate?: string | null;       // YYYY-MM-DD or null
  createdBy?: FamilyMember | null;
  notes?: string | null;
}

function isValidDate(v: string | null | undefined): boolean {
  if (v === null || v === undefined) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function validate(input: AddTaskInput): string | null {
  if (!input.assignee) return 'Assignee is required.';
  if (!input.title.trim()) return 'Title is required.';
  if (!isValidDate(input.dueDate)) return 'Invalid due date.';
  return null;
}

export async function addTask(
  input: AddTaskInput,
): Promise<MutationResult<Task>> {
  const err = validate(input);
  if (err) return { ok: false, error: err };
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        assignee: input.assignee,
        title: input.title.trim(),
        due_date: input.dueDate ?? null,
        created_by: input.createdBy ?? null,
        notes: input.notes ?? null,
      })
      .select('*')
      .single();
    if (error) throw error;
    return { ok: true, data: mapRow(data as TaskRow) };
  } catch (e) {
    return { ok: false, error: humanize(e) };
  }
}

export async function completeTask(
  id: string,
): Promise<MutationResult<{ id: string; doneAt: string }>> {
  const numeric = Number(id);
  if (!Number.isFinite(numeric)) {
    return { ok: false, error: 'Invalid task id.' };
  }
  const doneAt = new Date().toISOString();
  try {
    const { error } = await supabase
      .from('tasks')
      .update({ done_at: doneAt })
      .eq('id', numeric);
    if (error) throw error;
    return { ok: true, data: { id, doneAt } };
  } catch (e) {
    return { ok: false, error: humanize(e) };
  }
}

export async function reassignTask(
  id: string,
  assignee: FamilyMember,
): Promise<MutationResult<{ id: string; assignee: FamilyMember }>> {
  const numeric = Number(id);
  if (!Number.isFinite(numeric)) {
    return { ok: false, error: 'Invalid task id.' };
  }
  try {
    const { error } = await supabase
      .from('tasks')
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
