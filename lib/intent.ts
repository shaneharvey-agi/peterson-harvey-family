/**
 * Placeholder intent router. Today this is a keyword classifier — eventually
 * it fans out to real agentic workflows (Calendar, Dinner, Tasks, Messages).
 * Keep the signature stable so VoiceOrb's release handler doesn't need to
 * change when we swap the body for an LLM call.
 */

export type IntentKind =
  | 'calendar'
  | 'dinner'
  | 'tasks'
  | 'messages'
  | 'unknown';

export interface Intent {
  kind: IntentKind;
  raw: string;
  /** Suggested route to push the user into after fulfilling the intent. */
  route?: string;
}

const CALENDAR = /(calendar|schedule|event|meeting|appointment|soccer|practice|pickup|drop\s?off|tomorrow|tonight)/i;
const DINNER = /(dinner|meal|recipe|cook|lunch|breakfast|eat|food|kitchen)/i;
const TASKS = /(task|chore|todo|to\s?do|remind|reminder|add\s|need to)/i;
const MESSAGES = /(message|text|tell|send|ask (molly|evey|jax|shane))/i;

export function handleIntent(input: string): Intent {
  const raw = (input ?? '').trim();
  if (!raw) return { kind: 'unknown', raw };

  if (MESSAGES.test(raw)) return { kind: 'messages', raw, route: '/messages' };
  if (CALENDAR.test(raw)) return { kind: 'calendar', raw, route: '/' };
  if (DINNER.test(raw)) return { kind: 'dinner', raw, route: '/' };
  if (TASKS.test(raw)) return { kind: 'tasks', raw, route: '/chores' };

  return { kind: 'unknown', raw };
}

export default handleIntent;
