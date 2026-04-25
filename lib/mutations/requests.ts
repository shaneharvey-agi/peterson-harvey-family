import { supabase } from '@/lib/supabase';
import type { FamilyMember } from '@/lib/design-tokens';
import { appendLocalRequest, type FamilyRequest, type RequestPriority } from '@/lib/mock/requests';

export const REQUEST_SENT_EVENT = 'request:sent';

interface SendRequestInput {
  fromId: FamilyMember;
  toId: FamilyMember;
  content: string;
  priority?: RequestPriority;
}

export async function sendRequest(
  input: SendRequestInput,
): Promise<{ ok: true; data: FamilyRequest } | { ok: false; error: string }> {
  const trimmed = input.content.trim();
  if (!trimmed) return { ok: false, error: 'Empty request' };

  const now = new Date().toISOString();
  const optimistic: FamilyRequest = {
    id: `local-${Date.now()}`,
    fromId: input.fromId,
    toId: input.toId,
    content: trimmed,
    status: 'pending',
    priority: input.priority ?? 'normal',
    createdAt: now,
    completedAt: null,
  };

  try {
    const { data, error } = await supabase
      .from('requests')
      .insert({
        from_id: input.fromId,
        to_id: input.toId,
        content: trimmed,
        status: 'pending',
        priority: input.priority ?? 'normal',
      })
      .select('*')
      .single();

    if (error || !data) throw error ?? new Error('No row returned');

    const row = data as any;
    const saved: FamilyRequest = {
      id: String(row.id),
      fromId: row.from_id,
      toId: row.to_id,
      content: row.content,
      status: row.status,
      priority: row.priority,
      createdAt: row.created_at,
      completedAt: row.completed_at ?? null,
    };
    broadcastSent();
    return { ok: true, data: saved };
  } catch (err) {
    // Supabase isn't configured (preview) or the table doesn't exist yet —
    // park the request in the local store so the badge still updates.
    console.warn('[mutations/requests] using local store fallback:', err);
    appendLocalRequest(optimistic);
    broadcastSent();
    return { ok: true, data: optimistic };
  }
}

function broadcastSent() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(REQUEST_SENT_EVENT));
}
