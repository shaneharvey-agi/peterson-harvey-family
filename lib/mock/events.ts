// lib/mock/events.ts
import type { FamilyMember } from '@/lib/design-tokens';

export interface TimelineEvent {
  id: string;
  time: string;              // short formatted e.g. "8:15a"
  endTime?: string | null;   // short formatted e.g. "9:00a" — optional
  title: string;
  detail?: string;
  member: FamilyMember;
}

export const mockEvents: TimelineEvent[] = [
  {
    id: 'mock-e1',
    time: '7:30a',
    endTime: '8:00a',
    title: 'School drop-off',
    detail: 'Evey + Jax — Hillcrest Elementary',
    member: 'molly',
  },
  {
    id: 'mock-e2',
    time: '9:00a',
    endTime: '9:30a',
    title: 'Standup — Engineering',
    detail: 'Zoom',
    member: 'shane',
  },
  {
    id: 'mock-e3',
    time: '3:15p',
    endTime: '4:30p',
    title: 'Soccer practice',
    detail: 'Lake Stevens field 4',
    member: 'jax',
  },
  {
    id: 'mock-e4',
    time: '4:45p',
    endTime: '5:45p',
    title: 'Ballet',
    detail: 'Studio B',
    member: 'evey',
  },
  {
    id: 'mock-e5',
    time: '6:30p',
    endTime: '7:15p',
    title: 'Family dinner',
    member: 'molly',
  },
];
