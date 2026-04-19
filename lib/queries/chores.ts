// lib/queries/chores.ts
import { supabase, type ChoreRow } from '@/lib/supabase';
import type { FamilyMember } from '@/lib/design-tokens';
import { mockChores, type Chore } from '@/lib/mock/chores';

export type { Chore };

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

function mapRow(row: ChoreRow): Chore {
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

export async function fetchChores(): Promise<Chore[]> {
  try {
    const { data, error } = await supabase
      .from('chores')
      .select('*')
      .order('done_at', { ascending: true, nullsFirst: true })
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    if (!data || data.length === 0) return mockChores;
    return (data as ChoreRow[]).map(mapRow);
  } catch (err) {
    console.warn('[queries/chores] falling back to mock:', err);
    return mockChores;
  }
}

export async function fetchChoresByAssignee(
  assignee: FamilyMember,
): Promise<Chore[]> {
  const all = await fetchChores();
  return all.filter((c) => c.assignee === assignee);
}

export async function fetchChoreById(id: string): Promise<Chore | null> {
  if (id.startsWith('mock-')) {
    return mockChores.find((c) => c.id === id) ?? null;
  }
  try {
    const numeric = Number(id);
    if (!Number.isFinite(numeric)) return null;
    const { data, error } = await supabase
      .from('chores')
      .select('*')
      .eq('id', numeric)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return mapRow(data as ChoreRow);
  } catch (err) {
    console.warn('[queries/chores] fetchChoreById failed:', err);
    return null;
  }
}
