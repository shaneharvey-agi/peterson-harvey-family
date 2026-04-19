// lib/events/filter.ts
//
// Pure member filter. Same function runs from URL state (UI) or from
// Mikayla's voice handler ("show only Shane's events today").

import type { TimelineEvent } from '@/lib/mock/events';
import type { FamilyMember } from '@/lib/design-tokens';

export type MemberFilter = FamilyMember | 'family';

const VALID_MEMBERS: FamilyMember[] = ['shane', 'molly', 'evey', 'jax'];

/** Parse a raw URL param value into a MemberFilter. Unknown → 'family'. */
export function parseMemberFilter(raw: string | null | undefined): MemberFilter {
  if (!raw) return 'family';
  const v = raw.toLowerCase().trim();
  if (VALID_MEMBERS.includes(v as FamilyMember)) return v as FamilyMember;
  return 'family';
}

/** Return events visible under the current filter. */
export function filterByMember(
  events: TimelineEvent[],
  filter: MemberFilter,
): TimelineEvent[] {
  if (filter === 'family') return events;
  return events.filter((ev) => ev.member === filter);
}
