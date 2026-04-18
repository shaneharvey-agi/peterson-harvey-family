// lib/mock/messages.ts
import type { FamilyMember } from '@/lib/design-tokens';

export type MessageType = 'brief' | 'urgent' | 'dm' | 'meal';

export interface Message {
  id: string;
  type: MessageType;
  title: string;          // headline / short
  preview: string;        // secondary line
  from?: FamilyMember;    // for dm/urgent
  imageUrl?: string;      // for meal
  unread?: boolean;
  timestamp: string;      // short display e.g. "8:02a"
}

export const mockMessages: Message[] = [
  {
    id: 'mock-m-brief',
    type: 'brief',
    title: 'Morning brief',
    preview:
      '4 events today · dinner at 6:30 · Evey has ballet · rain clearing by noon',
    timestamp: '7:00a',
    unread: true,
  },
  {
    id: 'mock-m-urgent',
    type: 'urgent',
    title: 'Jax nurse needs pickup',
    preview: 'Fever 101.4 — call school office',
    from: 'jax',
    timestamp: '10:42a',
    unread: true,
  },
  {
    id: 'mock-m-dm',
    type: 'dm',
    title: 'Molly',
    preview: 'Grabbing groceries — need anything?',
    from: 'molly',
    timestamp: '11:15a',
  },
  {
    id: 'mock-m-meal',
    type: 'meal',
    title: 'Tonight',
    preview: 'Sheet-Pan Honey Garlic Chicken',
    imageUrl:
      'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=400&q=70',
    timestamp: '6:30p',
  },
];
