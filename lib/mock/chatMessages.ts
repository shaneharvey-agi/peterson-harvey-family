// lib/mock/chatMessages.ts
//
// Preview/fallback data for the threaded messaging screen. Threads are
// implicit — they're identified by `threadKey`. The canonical keys are
// 'family' (household group), a family-member slug for 1:1 threads, and
// 'mikayla' for Shane's direct line to the assistant.
//
// Senders are 'shane' | 'molly' | 'evey' | 'jax' | 'mikayla'. Shane is
// always the "me" in the UI — his bubbles render right-aligned.

import type { FamilyMember } from '@/lib/design-tokens';

export type ThreadKey = 'family' | 'mikayla' | FamilyMember;
export type MessageSender = FamilyMember | 'mikayla';

export interface ChatMessage {
  id: string;
  threadKey: ThreadKey;
  sender: MessageSender;
  body: string;
  readAt: string | null;   // null = unread
  createdAt: string;       // ISO
}

const now = new Date();
const mAgo = (n: number) => new Date(now.getTime() - n * 60_000).toISOString();
const hAgo = (n: number) => new Date(now.getTime() - n * 3_600_000).toISOString();
const dAgo = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString();

export const mockChatMessages: ChatMessage[] = [
  // ── Mikayla 1:1 ──
  {
    id: 'mk-1',
    threadKey: 'mikayla',
    sender: 'mikayla',
    body: 'Morning. Jax has soccer at 5, and Evey\u2019s ballet pickup is the usual 6:15. Want me to move dinner back to 7?',
    readAt: null,
    createdAt: mAgo(12),
  },
  {
    id: 'mk-2',
    threadKey: 'mikayla',
    sender: 'mikayla',
    body: 'I also caught that Molly\u2019s 2pm tomorrow conflicts with Evey\u2019s orthodontist. I can ask Molly to move hers — tap and I\u2019ll handle it.',
    readAt: null,
    createdAt: mAgo(4),
  },

  // ── Family group ──
  {
    id: 'fm-1',
    threadKey: 'family',
    sender: 'mikayla',
    body: 'Morning brief: 4 things today, rain clears by noon, dinner is sheet-pan honey garlic.',
    readAt: hAgo(2),
    createdAt: hAgo(3),
  },
  {
    id: 'fm-2',
    threadKey: 'family',
    sender: 'molly',
    body: 'I\u2019ll grab Evey from ballet on my way home.',
    readAt: hAgo(1),
    createdAt: hAgo(2),
  },
  {
    id: 'fm-3',
    threadKey: 'family',
    sender: 'shane',
    body: 'Thanks. I\u2019ve got Jax at soccer.',
    readAt: hAgo(1),
    createdAt: hAgo(2),
  },
  {
    id: 'fm-4',
    threadKey: 'family',
    sender: 'jax',
    body: 'can we have ice cream after',
    readAt: null,
    createdAt: mAgo(22),
  },

  // ── Molly 1:1 ──
  {
    id: 'mo-1',
    threadKey: 'molly',
    sender: 'molly',
    body: 'Heading to the store — do we need anything besides milk?',
    readAt: hAgo(4),
    createdAt: hAgo(5),
  },
  {
    id: 'mo-2',
    threadKey: 'molly',
    sender: 'shane',
    body: 'Bread and that oat stuff Evey likes please',
    readAt: hAgo(4),
    createdAt: hAgo(5),
  },
  {
    id: 'mo-3',
    threadKey: 'molly',
    sender: 'molly',
    body: 'Got it. Also the HOA sent another email, I\u2019ll forward.',
    readAt: null,
    createdAt: mAgo(45),
  },

  // ── Evey 1:1 ──
  {
    id: 'ev-1',
    threadKey: 'evey',
    sender: 'evey',
    body: 'Dad can you bring my ballet bag? I left it by the stairs.',
    readAt: null,
    createdAt: mAgo(18),
  },

  // ── Jax 1:1 ──
  {
    id: 'jx-1',
    threadKey: 'jax',
    sender: 'jax',
    body: 'coach said practice is pushed to 5:30',
    readAt: hAgo(6),
    createdAt: hAgo(7),
  },
  {
    id: 'jx-2',
    threadKey: 'jax',
    sender: 'shane',
    body: 'Copy. Meet you there.',
    readAt: hAgo(6),
    createdAt: hAgo(7),
  },

  // ── Shane self-notes ──
  {
    id: 'sh-1',
    threadKey: 'shane',
    sender: 'shane',
    body: 'Remember to book Evey\u2019s dentist follow-up.',
    readAt: dAgo(1),
    createdAt: dAgo(2),
  },
];
