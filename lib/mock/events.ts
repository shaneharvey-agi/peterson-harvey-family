// lib/mock/events.ts
import type { FamilyMember } from '@/lib/design-tokens';

export interface TimelineEvent {
  id: string;
  time: string;        // short formatted e.g. "8:15a"
  title: string;
  detail?: string;
  member: FamilyMember;
}

export const mockEvents: TimelineEvent[] = [
  {
    id: 'mock-e1',
    time: '7:30a',
    title: 'School drop-off',
    detail: 'Evey + Jax — Hillcrest Elementary',
    member: 'molly',
  },
  {
    id: 'mock-e2',
    time: '9:00a',
    title: 'Standup — Engineering',
    detail: 'Zoom · 30 min',
    member: 'shane',
  },
  {
    id: 'mock-e3',
    time: '3:15p',
    title: 'Soccer practice',
    detail: 'Lake Stevens field 4',
    member: 'jax',
  },
  {
    id: 'mock-e4',
    time: '4:45p',
    title: 'Ballet',
    detail: 'Studio B',
    member: 'evey',
  },
  {
    id: 'mock-e5',
    time: '6:30p',
    title: 'Family dinner',
    member: 'molly',
  },
];
