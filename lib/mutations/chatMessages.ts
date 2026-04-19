// lib/mutations/chatMessages.ts
//
// Voice-callable chat message mutations. Same contract as the other
// mutation layers: plain typed input, MutationResult return, no UI
// coupling. `sendMessage` is what Mikayla calls when Shane says
// "tell Molly I'm running late" — same entry point as the composer.

import { supabase, type ChatMessageRow } from '@/lib/supabase';
import type {
  ChatMessage,
  MessageSender,
  ThreadKey,
} from '@/lib/queries/chatMessages';

export type MutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export interface SendMessageInput {
  threadKey: ThreadKey;
  sender: MessageSender;   // who the message is *from* — Shane or Mikayla
  body: string;
}

function validate(input: SendMessageInput): string | null {
  if (!input.threadKey) return 'Thread is required.';
  if (!input.body.trim()) return 'Message is empty.';
  return null;
}

export async function sendMessage(
  input: SendMessageInput,
): Promise<MutationResult<ChatMessage>> {
  const err = validate(input);
  if (err) return { ok: false, error: err };
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        thread_key: input.threadKey,
        sender: input.sender,
        body: input.body.trim(),
        // Shane's own outbound messages count as read — he just sent them.
        read_at: input.sender === 'shane' ? new Date().toISOString() : null,
      })
      .select('*')
      .single();
    if (error) throw error;
    return { ok: true, data: rowToMessage(data as ChatMessageRow) };
  } catch (e) {
    return { ok: false, error: humanize(e) };
  }
}

export async function markThreadRead(
  threadKey: ThreadKey,
): Promise<MutationResult<{ threadKey: ThreadKey; count: number }>> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('thread_key', threadKey)
      .is('read_at', null)
      .neq('sender', 'shane')
      .select('id');
    if (error) throw error;
    return { ok: true, data: { threadKey, count: data?.length ?? 0 } };
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

function rowToMessage(row: ChatMessageRow): ChatMessage {
  const sender = ((): MessageSender => {
    const s = (row.sender || '').toLowerCase();
    if (s.includes('mikayla')) return 'mikayla';
    if (s.includes('shane')) return 'shane';
    if (s.includes('molly')) return 'molly';
    if (s.includes('evey')) return 'evey';
    return 'jax';
  })();
  const key = ((): ThreadKey => {
    const k = (row.thread_key || '').toLowerCase();
    if (k === 'mikayla') return 'mikayla';
    if (k === 'family') return 'family';
    if (k === 'shane') return 'shane';
    if (k === 'molly') return 'molly';
    if (k === 'evey') return 'evey';
    return 'jax';
  })();
  return {
    id: String(row.id),
    threadKey: key,
    sender,
    body: row.body || '',
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}
