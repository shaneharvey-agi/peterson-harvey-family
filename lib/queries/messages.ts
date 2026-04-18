// lib/queries/messages.ts
import { supabase } from '@/lib/supabase';
import type { FamilyMember } from '@/lib/design-tokens';
import { mockMessages, type Message, type MessageType } from '@/lib/mock/messages';

export type { Message, MessageType };

const TYPE_ORDER: Record<MessageType, number> = {
  brief: 0,
  urgent: 1,
  dm: 2,
  meal: 3,
};

function normalizeType(raw: unknown): MessageType {
  const s = String(raw || '').toLowerCase();
  if (s === 'brief' || s === 'urgent' || s === 'dm' || s === 'meal') return s;
  return 'dm';
}

function normalizeMember(raw: unknown): FamilyMember | undefined {
  const s = String(raw || '').toLowerCase();
  if (s.includes('shane')) return 'shane';
  if (s.includes('molly')) return 'molly';
  if (s.includes('evey')) return 'evey';
  if (s.includes('jax')) return 'jax';
  return undefined;
}

function sortMessages(list: Message[]): Message[] {
  // Order: brief → urgent (unread first) → dm → meal
  // Spec: "Unread urgents auto-bump to position 2" — i.e. immediately after brief.
  const briefs = list.filter((m) => m.type === 'brief');
  const urgentsUnread = list.filter((m) => m.type === 'urgent' && m.unread);
  const urgentsRead = list.filter((m) => m.type === 'urgent' && !m.unread);
  const dms = list.filter((m) => m.type === 'dm');
  const meals = list.filter((m) => m.type === 'meal');
  const others = list.filter((m) => !TYPE_ORDER.hasOwnProperty(m.type));
  return [...briefs, ...urgentsUnread, ...urgentsRead, ...dms, ...meals, ...others];
}

export async function fetchMessages(): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(12);

    if (error) throw error;
    if (!data || data.length === 0) return sortMessages(mockMessages);

    const mapped: Message[] = (data as any[]).map((row) => ({
      id: String(row.id),
      type: normalizeType(row.type),
      title: row.title || '',
      preview: row.preview || row.body || '',
      from: normalizeMember(row.from ?? row.sender ?? row.member),
      imageUrl: row.image_url || undefined,
      unread: !!row.unread,
      timestamp: row.timestamp || row.created_at || '',
    }));

    return sortMessages(mapped);
  } catch (err) {
    console.warn('[queries/messages] falling back to mock:', err);
    return sortMessages(mockMessages);
  }
}
