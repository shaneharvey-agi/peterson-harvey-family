// lib/mock/chores.ts
//
// Preview/fallback data for the chores layer. A chore always has an
// assignee (the kid or family member doing it) and a createdBy (the
// parent who asked). doneAt null = open.

import type { FamilyMember } from '@/lib/design-tokens';

export interface Chore {
  id: string;
  assignee: FamilyMember;
  title: string;
  dueDate: string | null;   // YYYY-MM-DD
  doneAt: string | null;    // ISO; null = open
  createdBy: FamilyMember | null;
  notes?: string;
  createdAt: string;        // ISO
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const now = new Date();
const hoursAgo = (n: number) => new Date(now.getTime() - n * 3_600_000).toISOString();

export const mockChores: Chore[] = [
  {
    id: 'mock-c1',
    assignee: 'jax',
    title: 'Take out the trash',
    dueDate: daysFromNow(0),
    doneAt: null,
    createdBy: 'shane',
    createdAt: hoursAgo(4),
  },
  {
    id: 'mock-c2',
    assignee: 'evey',
    title: 'Fold laundry in the basket',
    dueDate: daysFromNow(0),
    doneAt: null,
    createdBy: 'molly',
    notes: 'Just your stuff, leave Jax\u2019s for him.',
    createdAt: hoursAgo(6),
  },
  {
    id: 'mock-c3',
    assignee: 'jax',
    title: 'Feed the dog',
    dueDate: daysFromNow(0),
    doneAt: hoursAgo(1),
    createdBy: 'shane',
    createdAt: hoursAgo(10),
  },
  {
    id: 'mock-c4',
    assignee: 'evey',
    title: 'Clean room before Friday',
    dueDate: daysFromNow(2),
    doneAt: null,
    createdBy: 'molly',
    createdAt: hoursAgo(20),
  },
  {
    id: 'mock-c5',
    assignee: 'jax',
    title: 'Finish reading log for the week',
    dueDate: daysFromNow(3),
    doneAt: null,
    createdBy: 'shane',
    notes: '20 minutes a night.',
    createdAt: hoursAgo(30),
  },
];
