import type { FamilyMember } from '@/lib/design-tokens';

export type RequestStatus = 'pending' | 'complete';
export type RequestPriority = 'low' | 'normal' | 'high';

export interface FamilyRequest {
  id: string;
  fromId: FamilyMember;
  toId: FamilyMember;
  content: string;
  status: RequestStatus;
  priority: RequestPriority;
  createdAt: string;
  completedAt: string | null;
}

// Session-scoped fallback store. Lives in module memory so requests sent
// in preview mode (no Supabase) still drive the pending badges until reload.
const localStore: FamilyRequest[] = [];

export function getLocalRequests(): FamilyRequest[] {
  return localStore.slice();
}

export function appendLocalRequest(req: FamilyRequest): void {
  localStore.push(req);
}

export function pendingByRecipient(list: FamilyRequest[]): Record<FamilyMember, number> {
  const out: Record<FamilyMember, number> = { shane: 0, molly: 0, evey: 0, jax: 0 };
  for (const r of list) {
    if (r.status === 'pending') out[r.toId] = (out[r.toId] ?? 0) + 1;
  }
  return out;
}
