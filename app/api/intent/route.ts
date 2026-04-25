import { NextRequest, NextResponse } from 'next/server';

/**
 * Haiku-powered intent classifier for Active Bloom transcripts.
 *
 * Input:
 *   { transcript: string, member: 'shane'|'molly'|'evey'|'jax' }
 *
 * Output:
 *   { kind: 'request'|'message'|'chore'|'filter', content: string }
 *
 * Falls back to a rule-based classifier when ANTHROPIC_API_KEY is unset
 * (the Vercel preview probably doesn't have the key yet). Never throws to
 * the caller — always returns a valid intent.
 */

export const runtime = 'edge';

type IntentKind = 'request' | 'message' | 'chore' | 'filter';

interface IntentResponse {
  kind: IntentKind;
  content: string;
  source: 'haiku' | 'fallback';
}

const NAMES: Record<string, string> = {
  shane: 'Shane',
  molly: 'Molly',
  evey: 'Evey',
  jax: 'Jax',
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const transcript = String(body?.transcript ?? '').trim();
  const memberKey = String(body?.member ?? '').toLowerCase();
  const memberName = NAMES[memberKey] ?? 'them';

  if (!transcript) {
    return NextResponse.json<IntentResponse>({
      kind: 'request',
      content: '',
      source: 'fallback',
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json<IntentResponse>(rulesFallback(transcript));
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
        max_tokens: 200,
        system:
          'You are an intent classifier. The user spoke a short message about ' +
          `their family member ${memberName}. Classify the intent into exactly ` +
          'one of: request (asking them to do something), message (something to ' +
          'tell them), chore (an assignable task), filter (wants to see only their ' +
          'calendar). Reply with strict JSON only, shape: ' +
          '{"kind": "...", "content": "..."} where content is the cleaned text ' +
          'with filler stripped. No prose, no markdown.',
        messages: [{ role: 'user', content: transcript }],
      }),
    });

    if (!haikuResp.ok) throw new Error(`Haiku ${haikuResp.status}`);
    const data: any = await haikuResp.json();
    const text = data?.content?.[0]?.text ?? '';
    const parsed = parseHaikuJSON(text);
    if (parsed) return NextResponse.json<IntentResponse>({ ...parsed, source: 'haiku' });
    return NextResponse.json<IntentResponse>(rulesFallback(transcript));
  } catch (err) {
    console.warn('[api/intent] Haiku failed, using fallback:', err);
    return NextResponse.json<IntentResponse>(rulesFallback(transcript));
  }
}

function parseHaikuJSON(text: string): { kind: IntentKind; content: string } | null {
  // Haiku occasionally wraps the JSON in fences — strip them first.
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    const obj = JSON.parse(cleaned);
    const kind = normalizeKind(obj?.kind);
    const content = typeof obj?.content === 'string' ? obj.content : '';
    if (!kind || !content) return null;
    return { kind, content };
  } catch {
    return null;
  }
}

function normalizeKind(raw: unknown): IntentKind | null {
  const s = String(raw || '').toLowerCase();
  if (s === 'request' || s === 'message' || s === 'chore' || s === 'filter') return s;
  return null;
}

function rulesFallback(transcript: string): IntentResponse {
  const t = transcript.toLowerCase();
  let kind: IntentKind = 'request';
  if (/\b(calendar|schedule|filter|show me|her day|his day|their day)\b/.test(t)) {
    kind = 'filter';
  } else if (/\b(chore|task|clean|laundry|dishes|trash|put away|fold)\b/.test(t)) {
    kind = 'chore';
  } else if (/\b(tell|message|text|let .+ know|say to)\b/.test(t)) {
    kind = 'message';
  }
  return { kind, content: transcript, source: 'fallback' };
}
