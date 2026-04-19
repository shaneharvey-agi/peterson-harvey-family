// lib/mock/notifications.ts

export type NotificationKind =
  | 'conflict'       // Calendar overlap Mikayla noticed
  | 'stale_todo'     // Old uncompleted task
  | 'dinner_missing' // Upcoming day with no dinner plan
  | 'reminder'       // Time-based nudge
  | 'info';          // Generic passthrough

export type NotificationSeverity = 'info' | 'warning' | 'urgent';

export interface Notification {
  id: string;
  kind: NotificationKind;
  severity: NotificationSeverity;
  title: string;
  body?: string;
  createdAt: string;     // ISO
  readAt: string | null; // null = unread
  actionUrl?: string;    // deep link for tap-through (e.g. /events/123)
  actionLabel?: string;  // CTA text (e.g. "Open", "Resolve")
}

const now = new Date();
const minsAgo = (n: number) => new Date(now.getTime() - n * 60_000).toISOString();
const hoursAgo = (n: number) => new Date(now.getTime() - n * 3_600_000).toISOString();

export const mockNotifications: Notification[] = [
  {
    id: 'mock-n1',
    kind: 'conflict',
    severity: 'urgent',
    title: 'Jax has two things at 3:15p',
    body: 'Soccer practice overlaps a pediatrician appointment tomorrow.',
    createdAt: minsAgo(12),
    readAt: null,
    actionUrl: '/events/mock-e3',
    actionLabel: 'Review',
  },
  {
    id: 'mock-n2',
    kind: 'dinner_missing',
    severity: 'warning',
    title: 'Thursday has no dinner plan',
    body: 'Want me to pull a recipe or ask Molly what she wants?',
    createdAt: hoursAgo(2),
    readAt: null,
    actionLabel: 'Plan dinner',
  },
  {
    id: 'mock-n3',
    kind: 'reminder',
    severity: 'info',
    title: 'Ballet pickup in 30 minutes',
    body: 'Evey — Studio B.',
    createdAt: minsAgo(45),
    readAt: null,
  },
  {
    id: 'mock-n4',
    kind: 'stale_todo',
    severity: 'info',
    title: '4 todos older than a week',
    body: 'Tap to review, archive, or reassign.',
    createdAt: hoursAgo(20),
    readAt: hoursAgo(6),
  },
  {
    id: 'mock-n5',
    kind: 'info',
    severity: 'info',
    title: 'I updated Molly\u2019s calendar from her text',
    body: 'Moved her 2pm to 3pm Thursday per her message.',
    createdAt: hoursAgo(8),
    readAt: hoursAgo(8),
  },
];
