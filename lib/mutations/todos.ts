// lib/mutations/todos.ts
//
// Voice-callable to-do mutations. Same MutationResult contract as the
// other mutation modules so the M Orb dispatch can fire its gold-halo
// confirmation only on a successful insert.

import { supabase, type Todo } from '@/lib/supabase';

export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type TodoCategory = 'personal' | 'business' | 'family';

export interface AddTodoInput {
  text: string;
  cat?: TodoCategory;       // defaults to 'personal'
}

const VALID_CATS: TodoCategory[] = ['personal', 'business', 'family'];

function normalizeCat(raw: string | undefined): TodoCategory {
  const s = (raw || '').toLowerCase().trim();
  return (VALID_CATS as string[]).includes(s) ? (s as TodoCategory) : 'personal';
}

export async function addTodo(
  input: AddTodoInput,
): Promise<MutationResult<Todo>> {
  const text = input.text.trim();
  if (!text) return { ok: false, error: 'Todo is empty.' };
  try {
    const { data, error } = await supabase
      .from('todos')
      .insert({
        text,
        done: false,
        cat: normalizeCat(input.cat),
      })
      .select('*')
      .single();
    if (error) throw error;
    return { ok: true, data: data as Todo };
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
