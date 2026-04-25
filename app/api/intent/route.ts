import { NextRequest, NextResponse } from 'next/server';

/**
 * Haiku-powered intent classifier for the Universal M Orb voice flow.
 *
 * Input:
 *   { transcript: string, member?: 'shane'|'molly'|'evey'|'jax' }
 *
 *   `member` is an optional recipient hint — pass it when the caller
 *   already knows the target (e.g. legacy avatar long-press path). The
 *   M Orb leaves it blank and relies on this route to extract a recipient
 *   from the transcript itself.
 *
 * Output:
 *   { kind, content, recipient?, source }
 *     kind:      'request'|'message'|'chore'|'filter'
 *     content:   cleaned transcript with filler stripped
 *     recipient: 'shane'|'molly'|'evey'|'jax'|'family' if a target is named
 *     source:    'haiku' | 'fallback'
 *
 * Falls back to a rule-based classifier when ANTHROPIC_API_KEY is unset.
 * Never throws — always returns a valid intent.
 */

export const runtime = 'edge';

type IntentKind = 'request' | 'message' | 'chore' | 'filter';
type Recipient = 'shane' | 'molly' | 'evey' | 'jax' | 'family';

interface IntentResponse {
  kind: IntentKind;
  content: string;
  recipient?: Recipient;
  source: 'haiku' | 'fallback';
}

const NAMES: Record<string, string> = {
  shane: 'Shane',
  molly: 'Molly',
  evey: 'Evey',
  jax: 'Jax',
};

const RECIPIENT_KEYS: Recipient[] = ['shane', 'molly', 'evey', 'jax', 'family'];

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
          'You classify a short voice transcript spoken into a family ' +
          'assistant. Return strict JSON only, shape: ' +
          '{"kind":"...","content":"...","recipient":"..."} (no prose, no markdown).\n' +
          '\n' +
          'Fields:\n' +
          '- kind: one of "message" (something to tell someone), "request" ' +
          '(asking someone to do something), "chore" (an assignable household ' +
          'task), or "filter" (wants to see only one person\'s calendar).\n' +
          '- content: the cleaned message body with addressing/filler stripped. ' +
          'For "Tell Molly I\'m running late", content is "I\'m running late".\n' +
          '- recipient: one of "shane", "molly", "evey", "jax", "family", or "" ' +
          'if no target is named. The household is "the family" / "everyone" / ' +
          '"the kids" → "family".' +
          (memberHint ? ` The caller hinted recipient="${memberHint}"; use that unless the transcript clearly addresses someone else.` : ''),
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
  const s = String(raw || '').toLowerCase();
  if (s === 'request' || s === 'message' || s === 'chore' || s === 'filter') return s;
  return null;
}

function normalizeRecipient(raw: unknown): Recipient | undefined {
  const s = String(raw || '').toLowerCase().trim();
  if (!s) return undefined;
  if (RECIPIENT_KEYS.includes(s as Recipient)) return s as Recipient;
  // Common aliases
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
  // "tell molly ...", "ask jax ...", "let evey know ...", "text shane ..."
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
    // Bare-name addressing: transcript starts with a name + comma/space.
    const bare = t.match(/^(shane|molly|evey|jax)[,\s]+(.+)/);
    if (bare) {
      recipient = bare[1] as Recipient;
      body = bare[2].trim();
    }
  }

  let kind: IntentKind = 'message';
  if (/\b(calendar|schedule|filter|show me|her day|his day|their day)\b/.test(t)) {
    kind = 'filter';
  } else if (/\b(chore|task|clean|laundry|dishes|trash|put away|fold)\b/.test(t)) {
    kind = 'chore';
  } else if (/\b(can you|please|would you|could you|need)\b/.test(t) && recipient) {
    kind = 'request';
  }

  // Capitalize first letter of body for chat readability.
  const cleaned = body.charAt(0).toUpperCase() + body.slice(1);
  return { kind, content: cleaned, recipient, source: 'fallback' };
}
