// lib/queries/tasks.ts
//
// Unified per-person task list. Replaces lib/queries/chores.ts. The UI
// labels rows as "Chores" or "To-Dos" based on the assignee's role —
// see `taskListLabel(member)`.

import { supabase, type TaskRow } from '@/lib/supabase';
import type { FamilyMember } from '@/lib/design-tokens';

export interface Task {
  id: string;
  assignee: FamilyMember;
  title: string;
  dueDate: string | null;
  doneAt: string | null;
  createdBy: FamilyMember | null;
  notes?: string;
  createdAt: string;
}

/** Adults get "To-Do" labels; kids get "Chore" labels. */
const ADULTS: FamilyMember[] = ['shane', 'molly'];

export interface TaskListLabel {
  singular: string;            // "to-do" | "chore"
  plural: string;              // "To-Dos" | "Chores"
  pluralUpper: string;         // "TO-DOS" | "CHORES"
  addCta: (name: string) => string;
}

export function taskListLabel(member: FamilyMember): TaskListLabel {
  const isAdult = ADULTS.includes(member);
  return isAdult
    ? {
        singular: 'to-do',
        plural: 'To-Dos',
        pluralUpper: 'TO-DOS',
        addCta: (name) => `Add to-do for ${name}`,
      }
    : {
        singular: 'chore',
        plural: 'Chores',
        pluralUpper: 'CHORES',
        addCta: (name) => `Add chore for ${name}`,
      };
}

function normalizeMember(who: string | null): FamilyMember {
  const w = (who || '').toLowerCase().trim();
  if (w.includes('shane')) return 'shane';
  if (w.includes('molly')) return 'molly';
  if (w.includes('evey')) return 'evey';
  if (w.includes('jax')) return 'jax';
  return 'jax';
}

function normalizeCreator(who: string | null): FamilyMember | null {
  if (!who) return null;
  return normalizeMember(who);
}

export function mapRow(row: TaskRow): Task {
  return {
    id: String(row.id),
    assignee: normalizeMember(row.assignee),
    title: row.title || '(untitled)',
    dueDate: row.due_date,
    doneAt: row.done_at,
    createdBy: normalizeCreator(row.created_by),
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

export async function fetchTasks(): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('done_at', { ascending: true, nullsFirst: true })
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return ((data as TaskRow[]) ?? []).map(mapRow);
  } catch (err) {
    console.warn('[queries/tasks] fetch failed, returning empty:', err);
    return [];
  }
}

export async function fetchTasksByAssignee(
  assignee: FamilyMember,
): Promise<Task[]> {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assignee', assignee)
      .order('done_at', { ascending: true, nullsFirst: true })
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return ((data as TaskRow[]) ?? []).map(mapRow);
  } catch (err) {
    console.warn('[queries/tasks] fetchTasksByAssignee failed:', err);
    return [];
  }
}
