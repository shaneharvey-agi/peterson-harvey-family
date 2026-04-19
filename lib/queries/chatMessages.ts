// lib/queries/chatMessages.ts
import { supabase, type ChatMessageRow } from '@/lib/supabase';
import type { FamilyMember } from '@/lib/design-tokens';
import {
  mockChatMessages,
  type ChatMessage,
  type ThreadKey,
  type MessageSender,
} from '@/lib/mock/chatMessages';

export type { ChatMessage, ThreadKey, MessageSender };

export interface ThreadSummary {
  key: ThreadKey;
  title: string;
  lastMessage: ChatMessage | null;
  unreadCount: number;
}

/** Canonical thread order in the inbox. Mikayla pinned top, then family group, then members. */
export const THREAD_ORDER: ThreadKey[] = [
  'mikayla',
  'family',
  'molly',
  'evey',
  'jax',
  'shane',
];

const TITLES: Record<ThreadKey, string> = {
  mikayla: 'Mikayla',
  family: 'Family',
  shane: 'Notes to self',
  molly: 'Molly',
  evey: 'Evey',
  jax: 'Jax',
};

export function threadTitle(key: ThreadKey): string {
  return TITLES[key];
}

function isThreadKey(v: string): v is ThreadKey {
  return (
    v === 'mikayla' ||
    v === 'family' ||
    v === 'shane' ||
    v === 'molly' ||
    v === 'evey' ||
    v === 'jax'
  );
}

export function parseThreadKey(v: string | null | undefined): ThreadKey | null {
  if (!v) return null;
  const lower = v.toLowerCase().trim();
  return isThreadKey(lower) ? lower : null;
}

function normalizeSender(raw: string): MessageSender {
  const s = raw.toLowerCase().trim();
  if (s.includes('mikayla')) return 'mikayla';
  if (s.includes('shane')) return 'shane';
  if (s.includes('molly')) return 'molly';
  if (s.includes('evey')) return 'evey';
  return 'jax';
}

function mapRow(row: ChatMessageRow): ChatMessage {
  const key = parseThreadKey(row.thread_key) ?? 'family';
  return {
    id: String(row.id),
    threadKey: key,
    sender: normalizeSender(row.sender),
    body: row.body || '',
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

/** All messages across all threads, newest last (chronological). */
export async function fetchAllChatMessages(): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(500);
    if (error) throw error;
    if (!data || data.length === 0) return [...mockChatMessages];
    return (data as ChatMessageRow[]).map(mapRow);
  } catch (err) {
    console.warn('[queries/chatMessages] falling back to mock:', err);
    return [...mockChatMessages];
  }
}

/** Messages in a single thread, chronological (oldest first). */
export async function fetchThreadMessages(
  key: ThreadKey,
): Promise<ChatMessage[]> {
  const all = await fetchAllChatMessages();
  return all.filter((m) => m.threadKey === key);
}

/** Inbox summary: one row per thread, newest activity first with canonical pins. */
export async function fetchThreads(): Promise<ThreadSummary[]> {
  const all = await fetchAllChatMessages();
  const byThread = new Map<ThreadKey, ChatMessage[]>();
  for (const key of THREAD_ORDER) byThread.set(key, []);
  for (const m of all) {
    if (!byThread.has(m.threadKey)) byThread.set(m.threadKey, []);
    byThread.get(m.threadKey)!.push(m);
  }
  const summaries: ThreadSummary[] = [];
  for (const key of THREAD_ORDER) {
    const msgs = byThread.get(key) ?? [];
    const last = msgs.length > 0 ? msgs[msgs.length - 1] : null;
    // Unread = messages from someone *other* than Shane with readAt null.
    const unreadCount = msgs.filter(
      (m) => m.sender !== 'shane' && m.readAt === null,
    ).length;
    summaries.push({
      key,
      title: TITLES[key],
      lastMessage: last,
      unreadCount,
    });
  }
  return summaries;
}

/** Total unread across all threads. Used for the top-strip envelope badge. */
export async function fetchTotalUnreadMessages(): Promise<number> {
  const threads = await fetchThreads();
  return threads.reduce((n, t) => n + t.unreadCount, 0);
}

/** 1:1 thread key for a family member. Shane → his self-notes thread. */
export function memberThreadKey(m: FamilyMember): ThreadKey {
  return m;
}
