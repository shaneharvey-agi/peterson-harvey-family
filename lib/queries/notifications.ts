// lib/queries/notifications.ts
import { supabase, type NotificationRow } from '@/lib/supabase';
import {
  mockNotifications,
  type Notification,
  type NotificationKind,
  type NotificationSeverity,
} from '@/lib/mock/notifications';

export type { Notification, NotificationKind, NotificationSeverity };

function mapRow(row: NotificationRow): Notification {
  return {
    id: String(row.id),
    kind: (row.kind as NotificationKind) || 'info',
    severity: (row.severity as NotificationSeverity) || 'info',
    title: row.title || '(untitled)',
    body: row.body ?? undefined,
    createdAt: row.created_at,
    readAt: row.read_at,
    actionUrl: row.action_url ?? undefined,
    actionLabel: row.action_label ?? undefined,
  };
}

export async function fetchNotifications(): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    if (!data || data.length === 0) return mockNotifications;
    return (data as NotificationRow[]).map(mapRow);
  } catch (err) {
    console.warn('[queries/notifications] falling back to mock:', err);
    return mockNotifications;
  }
}

export async function fetchUnreadCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .is('read_at', null);
    if (error) throw error;
    return count ?? 0;
  } catch {
    return mockNotifications.filter((n) => n.readAt === null).length;
  }
}
