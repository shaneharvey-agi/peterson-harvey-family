import { supabase } from '@/lib/supabase';
import type { FamilyMember } from '@/lib/design-tokens';
import {
  getLocalRequests,
  pendingByRecipient,
  type FamilyRequest,
  type RequestPriority,
  type RequestStatus,
} from '@/lib/mock/requests';

export type { FamilyRequest, RequestPriority, RequestStatus };

const VALID_MEMBERS = new Set<FamilyMember>(['shane', 'molly', 'evey', 'jax']);

function normalizeMember(raw: unknown): FamilyMember | null {
  const s = String(raw || '').toLowerCase();
  return (VALID_MEMBERS.has(s as FamilyMember) ? (s as FamilyMember) : null);
}

function normalizeStatus(raw: unknown): RequestStatus {
  return raw === 'complete' ? 'complete' : 'pending';
}

function normalizePriority(raw: unknown): RequestPriority {
  if (raw === 'high' || raw === 'low') return raw;
  return 'normal';
}

export async function fetchPendingByRecipient(): Promise<Record<FamilyMember, number>> {
  try {
    const { data, error } = await supabase
      .from('requests')
      .select('to_id, status')
      .eq('status', 'pending');

    if (error) throw error;

    const out: Record<FamilyMember, number> = { shane: 0, molly: 0, evey: 0, jax: 0 };
    for (const row of (data as any[]) ?? []) {
      const to = normalizeMember(row.to_id);
      if (to) out[to] = (out[to] ?? 0) + 1;
    }
    // Layer in any session-local sends so a freshly sent request shows up
    // even when the table doesn't exist yet.
    const localPending = pendingByRecipient(getLocalRequests());
    (Object.keys(out) as FamilyMember[]).forEach((k) => {
      out[k] = (out[k] ?? 0) + (localPending[k] ?? 0);
    });
    return out;
  } catch (err) {
    console.warn('[queries/requests] falling back to local store:', err);
    return pendingByRecipient(getLocalRequests());
  }
}
