// lib/mutations/memories.ts
//
// Brain-dump destination for the M Orb intent router. Haiku classifies a
// transcript as "brain_dump" when it doesn't fit message/request/chore/filter,
// and the cleaned content lands here so nothing said to Mikayla is lost.

import { supabase, type MemoryRow } from '@/lib/supabase';
import type { FamilyMember } from '@/lib/design-tokens';

export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export interface SaveMemoryInput {
  author: FamilyMember;
  content: string;
  source?: string;            // 'voice' | 'chat' | 'system'
}

export interface Memory {
  id: string;
  author: FamilyMember;
  content: string;
  source: string;
  createdAt: string;
}

export async function saveMemory(
  input: SaveMemoryInput,
): Promise<MutationResult<Memory>> {
  const content = input.content.trim();
  if (!content) return { ok: false, error: 'Memory is empty.' };
  try {
    const { data, error } = await supabase
      .from('memories')
      .insert({
        author: input.author,
        content,
        source: input.source ?? 'voice',
      })
      .select('*')
      .single();
    if (error) throw error;
    return { ok: true, data: rowToMemory(data as MemoryRow) };
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

function rowToMemory(row: MemoryRow): Memory {
  const normalize = (w: string | null | undefined): FamilyMember => {
    const v = (w || '').toLowerCase().trim();
    if (v.includes('shane')) return 'shane';
    if (v.includes('molly')) return 'molly';
    if (v.includes('evey')) return 'evey';
    return 'jax';
  };
  return {
    id: String(row.id),
    author: normalize(row.author),
    content: row.content || '',
    source: row.source || 'voice',
    createdAt: row.created_at,
  };
}
