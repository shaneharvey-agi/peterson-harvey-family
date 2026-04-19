// lib/mutations/notifications.ts
//
// Voice-callable notification actions. Same contract as event mutations:
// plain typed args, MutationResult return.

import { supabase } from '@/lib/supabase';

export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function markNotificationRead(
  id: string,
): Promise<MutationResult<{ id: string }>> {
  const numeric = Number(id);
  if (!Number.isFinite(numeric)) {
    return { ok: false, error: 'Invalid notification id.' };
  }
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', numeric);
    if (error) throw error;
    return { ok: true, data: { id } };
  } catch (e) {
    return { ok: false, error: humanize(e) };
  }
}

export async function markAllNotificationsRead(): Promise<
  MutationResult<{ count: number }>
> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null)
      .select('id');
    if (error) throw error;
    return { ok: true, data: { count: data?.length ?? 0 } };
  } catch (e) {
    return { ok: false, error: humanize(e) };
  }
}

export async function dismissNotification(
  id: string,
): Promise<MutationResult<{ id: string }>> {
  const numeric = Number(id);
  if (!Number.isFinite(numeric)) {
    return { ok: false, error: 'Invalid notification id.' };
  }
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', numeric);
    if (error) throw error;
    return { ok: true, data: { id } };
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
