import { NextRequest, NextResponse } from 'next/server';

/**
 * Haiku-powered intent classifier for the Universal M Orb voice flow.
 *
 * Input:
 *   { transcript: string, member?: 'shane'|'molly'|'evey'|'jax' }
 *
 *   `member` is an optional recipient hint — pass it when the caller
 *   already knows the target. The M Orb leaves it blank and relies on
 *   this route to extract a recipient from the transcript itself.
 *
 * Output:
 *   { kind, content, recipient?, source }
 *     kind:      'message'|'request'|'task'|'brain_dump'|'filter'
 *     content:   cleaned transcript with addressing/filler stripped
 *     recipient: 'shane'|'molly'|'evey'|'jax'|'family' if a target is named
 *     source:    'haiku' | 'fallback'
 *
 *   `task` is the unified per-person to-do (UI labels it "Chore" for
 *   kids, "To-Do" for adults). recipient is the assignee — defaults to
 *   Shane (the speaker) when no one else is named.
 *
 * Falls back to a rule-based classifier when ANTHROPIC_API_KEY is unset
 * or Haiku errors. Never throws — always returns a valid intent.
 */

export const runtime = 'edge';

type IntentKind = 'message' | 'request' | 'task' | 'brain_dump' | 'filter';
type Recipient = 'shane' | 'molly' | 'evey' | 'jax' | 'family';

interface IntentResponse {
  kind: IntentKind;
  content: string;
  recipient?: Recipient;
  source: 'haiku' | 'fallback';
}

const RECIPIENT_KEYS: Recipient[] = ['shane', 'molly', 'evey', 'jax', 'family'];

const SYSTEM_PROMPT = [
  'You classify a short voice transcript spoken into a family assistant.',
  'The speaker is always Shane (the household owner). Return strict JSON only —',
  'no prose, no markdown, no code fences.',
  'Shape: {"kind":"...","content":"...","recipient":"..."}',
  '',
  'kind is one of:',
  '- "message"    — relaying information to a person. e.g. "Tell Molly I\'m running late."',
  '- "task"       — an action item to track on someone\'s list (chore for a kid, to-do for an adult). e.g. "Add walk the dogs to Jax\'s list", "Pick up milk", "Remind me to call the contractor tomorrow", "Add review the Boujie listing to my list". The recipient field is the ASSIGNEE — leave blank to default to Shane.',
  '- "request"    — asking another person to do a specific favor RIGHT NOW (one-off, not list-tracked). e.g. "Molly, can you grab the dry cleaning?". Must have a non-Shane recipient.',
  '- "brain_dump" — a thought, note, observation, or idea — not a concrete action. e.g. "I think Hawaii would be good for the family vacation this year." or "Molly seemed tired today."',
  '- "filter"     — wants to see only one person\'s calendar/day. e.g. "Show me Evey\'s schedule."',
  '',
  'task vs request: a task lives on a list (persistent); a request is an immediate one-time ask.',
  'task vs brain_dump: if Shane could put a checkbox next to it, it\'s a task.',
  '',
  'content: the cleaned body with addressing/filler stripped.',
  '  "Tell Molly I\'m running late" → "I\'m running late"',
  '  "Add walk the dogs to Jax\'s list" → "Walk the dogs"',
  '  "Molly, can you grab the dry cleaning" → "Can you grab the dry cleaning?"',
  '  "Remind me to look into the new espresso machine" → "Look into the new espresso machine"',
  '  "Add pick up milk to my list" → "Pick up milk"',
  '',
  'recipient: one of "shane", "molly", "evey", "jax", "family", or "" if none.',
  '  Aliases: "mom"/"mommy" → molly, "dad"/"daddy" → shane,',
  '  "the family"/"everyone"/"the kids"/"household" → family.',
  '  For tasks: recipient = ASSIGNEE. If Shane says it about himself or no assignee is named, leave blank.',
  '  brain_dump defaults to recipient="" (they belong to Shane himself).',
].join('\n');

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const transcript = String(body?.transcript ?? '').trim();
  const memberHint = normalizeRecipient(body?.member);

  if (!transcript) {
    return NextResponse.json<IntentResponse>({
      kind: 'message',
      content: '',
      recipient: memberHint,
      source: 'fallback',
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json<IntentResponse>(rulesFallback(transcript, memberHint));
  }

  try {
    const haikuResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 240,
        system:
          SYSTEM_PROMPT +
          (memberHint
            ? `\n\nThe caller hinted recipient="${memberHint}"; use that unless the transcript clearly addresses someone else.`
            : ''),
        messages: [{ role: 'user', content: transcript }],
      }),
    });

    if (!haikuResp.ok) throw new Error(`Haiku ${haikuResp.status}`);
    const data: any = await haikuResp.json();
    const text = data?.content?.[0]?.text ?? '';
    const parsed = parseHaikuJSON(text);
    if (parsed) {
      return NextResponse.json<IntentResponse>({
        ...parsed,
        recipient: parsed.recipient ?? memberHint,
        source: 'haiku',
      });
    }
    return NextResponse.json<IntentResponse>(rulesFallback(transcript, memberHint));
  } catch (err) {
    console.warn('[api/intent] Haiku failed, using fallback:', err);
    return NextResponse.json<IntentResponse>(rulesFallback(transcript, memberHint));
  }
}

function parseHaikuJSON(
  text: string,
): { kind: IntentKind; content: string; recipient?: Recipient } | null {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    const obj = JSON.parse(cleaned);
    const kind = normalizeKind(obj?.kind);
    const content = typeof obj?.content === 'string' ? obj.content : '';
    const recipient = normalizeRecipient(obj?.recipient);
    if (!kind || !content) return null;
    return { kind, content, recipient };
  } catch {
    return null;
  }
}

function normalizeKind(raw: unknown): IntentKind | null {
  const s = String(raw || '').toLowerCase().replace(/[\s-]+/g, '_');
  if (
    s === 'message' ||
    s === 'request' ||
    s === 'task' ||
    s === 'brain_dump' ||
    s === 'filter'
  ) {
    return s;
  }
  // Legacy buckets / synonyms collapse into 'task' or 'brain_dump'.
  if (
    s === 'chore' ||
    s === 'todo' ||
    s === 'to_do' ||
    s === 'reminder' ||
    s === 'remind'
  ) {
    return 'task';
  }
  if (s === 'note' || s === 'memory' || s === 'thought' || s === 'idea') {
    return 'brain_dump';
  }
  return null;
}

function normalizeRecipient(raw: unknown): Recipient | undefined {
  const s = String(raw || '').toLowerCase().trim();
  if (!s) return undefined;
  if (RECIPIENT_KEYS.includes(s as Recipient)) return s as Recipient;
  if (s === 'mom' || s === 'mommy') return 'molly';
  if (s === 'dad' || s === 'daddy') return 'shane';
  if (s === 'household' || s === 'everyone' || s === 'kids' || s === 'the family') return 'family';
  return undefined;
}

function rulesFallback(transcript: string, hint: Recipient | undefined): IntentResponse {
  const t = transcript.toLowerCase();

  // Recipient extraction — prefer explicit name in transcript over hint.
  let recipient: Recipient | undefined = hint;
  let body = transcript;
  const addressed = t.match(
    /\b(?:tell|ask|message|text|let|remind)\s+(shane|molly|evey|jax|mom|dad|mommy|daddy|the family|everyone|kids|household)\b\s*(?:that\s+|to\s+|know\s+(?:that\s+)?)?(.*)/,
  );
  if (addressed) {
    const target = normalizeRecipient(addressed[1]);
    if (target) {
      recipient = target;
      body = addressed[2]?.trim() || transcript;
    }
  } else {
    const bare = t.match(/^(shane|molly|evey|jax)[,\s]+(.+)/);
    if (bare) {
      recipient = bare[1] as Recipient;
      body = bare[2].trim();
    }
  }

  // Strip "add ... to (my|jax's|...) list" framing so the body is the bare task.
  const listAdd = body.match(/^add\s+(.+?)\s+to\s+(?:my|the|\w+(?:'s)?)\s+(?:list|todos?|to[- ]?do(?:\s+list)?|chores?(?:\s+list)?)\b/i);
  if (listAdd) body = listAdd[1].trim();
  // "Remind me to ..." → bare action.
  const remindMe = body.match(/^remind\s+me\s+to\s+(.+)/i);
  if (remindMe) body = remindMe[1].trim();

  let kind: IntentKind = 'brain_dump';
  if (/\b(calendar|schedule|filter|show me|her day|his day|their day)\b/.test(t)) {
    kind = 'filter';
  } else if (recipient && recipient !== 'shane' && /\b(can you|please|would you|could you|need)\b/.test(t)) {
    kind = 'request';
  } else if (
    // Action-verb to-do for Shane (no other recipient).
    /^(add|pick\s+up|grab|buy|call|email|book|schedule|order|finish|review|look\s+into|remind|don'?t\s+forget|remember\s+to)\b/i.test(body) ||
    /\b(my\s+(?:to[- ]?do|todo|list))\b/i.test(t) ||
    // Task with an explicit assignee.
    (recipient && recipient !== 'shane' && /\b(add\s+\w+\s+to|chore|task|clean|laundry|dishes|trash|put away|fold|walk the dog)\b/.test(t))
  ) {
    kind = 'task';
  } else if (recipient && recipient !== 'shane') {
    kind = 'message';
  }

  const cleaned = body.charAt(0).toUpperCase() + body.slice(1);
  return { kind, content: cleaned, recipient, source: 'fallback' };
}
