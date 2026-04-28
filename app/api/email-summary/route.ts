import { NextRequest, NextResponse } from 'next/server';

/**
 * Haiku-powered email summarizer.
 *
 * Input:
 *   { from: string, subject: string, body: string }
 *
 * Output:
 *   { title, body, kind, severity, actionLabel?, source }
 *     title:       1-sentence Actionable Alert prefixed with a category
 *                  word, e.g. "Care Alert: Hand wash sweater, lay flat to dry."
 *     body:        Optional 1-line context (sender / what triggered it).
 *     kind:        Notification kind — always 'email_alert' from this route.
 *     severity:    'info' | 'warning' | 'urgent' (Haiku-classified).
 *     actionLabel: Optional CTA, e.g. "Read email".
 *     source:      'haiku' | 'fallback'
 *
 * Falls back to a deterministic summarizer when ANTHROPIC_API_KEY is
 * unset or Haiku errors. Never throws — always returns a valid alert.
 */

export const runtime = 'edge';

type Severity = 'info' | 'warning' | 'urgent';

interface SummaryResponse {
  title: string;
  body?: string;
  kind: 'email_alert';
  severity: Severity;
  actionLabel?: string;
  source: 'haiku' | 'fallback';
}

const SYSTEM_PROMPT = [
  'You are a personal-assistant filter for the household owner Shane.',
  'You will receive ONE email (sender, subject, body) and must summarize',
  'it into a single Actionable Alert that fits in a notification card.',
  'Return strict JSON only — no prose, no markdown, no code fences.',
  'Shape: {"title":"...","body":"...","severity":"...","actionLabel":"..."}',
  '',
  'title: ONE sentence, max ~90 chars. Lead with a 1-2 word category prefix',
  '       followed by ": ". Pick the prefix from the email\'s nature:',
  '         "Care Alert"        — care/maintenance/cleaning instructions',
  '         "Action Needed"     — something Shane must decide or do',
  '         "Schedule"          — date/time logistics (school, appts, deliveries)',
  '         "Pickup"            — something is ready to collect',
  '         "Heads Up"          — informational, no action required',
  '       Then give the SPECIFIC actionable distillation, not a paraphrase of',
  '       the subject. Examples:',
  '         "Care Alert: Hand wash sweater, lay flat to dry."',
  '         "Schedule: Friday early dismissal — pick up kids by 12:20."',
  '         "Pickup: Walgreens Rx ready — pickup window closes Sunday 9pm."',
  '         "Action Needed: Contractor needs sign-off on pendant swap + Subzero install Thurs 9–11a."',
  '',
  'body: optional 1-liner with sender or context. Keep <70 chars. Empty string if redundant.',
  '',
  'severity:',
  '  - "urgent"  if it\'s time-sensitive (within 24h) AND requires Shane to act.',
  '  - "warning" if action is needed but not immediate (this week).',
  '  - "info"    if it\'s reference info / care instructions / FYI.',
  '',
  'actionLabel: short verb CTA, max 14 chars. e.g. "Read email", "Open thread", "Reply".',
  '             Use "Read email" by default.',
].join('\n');

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null);
  const from = String(payload?.from ?? '').trim();
  const subject = String(payload?.subject ?? '').trim();
  const body = String(payload?.body ?? '').trim();

  if (!subject && !body) {
    return NextResponse.json<SummaryResponse>({
      title: 'Heads Up: empty email',
      kind: 'email_alert',
      severity: 'info',
      source: 'fallback',
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json<SummaryResponse>(rulesFallback(from, subject, body));
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
        max_tokens: 280,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `From: ${from}\nSubject: ${subject}\n\n${body}`,
          },
        ],
      }),
    });

    if (!haikuResp.ok) throw new Error(`Haiku ${haikuResp.status}`);
    const data: any = await haikuResp.json();
    const text = data?.content?.[0]?.text ?? '';
    const parsed = parseHaikuJSON(text);
    if (parsed) {
      return NextResponse.json<SummaryResponse>({
        ...parsed,
        kind: 'email_alert',
        source: 'haiku',
      });
    }
    return NextResponse.json<SummaryResponse>(rulesFallback(from, subject, body));
  } catch (err) {
    console.warn('[api/email-summary] Haiku failed, using fallback:', err);
    return NextResponse.json<SummaryResponse>(rulesFallback(from, subject, body));
  }
}

function parseHaikuJSON(
  text: string,
): { title: string; body?: string; severity: Severity; actionLabel?: string } | null {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    const obj = JSON.parse(cleaned);
    const title = typeof obj?.title === 'string' ? obj.title.trim() : '';
    if (!title) return null;
    const severity = normalizeSeverity(obj?.severity);
    const bodyOut = typeof obj?.body === 'string' && obj.body.trim() ? obj.body.trim() : undefined;
    const actionLabel =
      typeof obj?.actionLabel === 'string' && obj.actionLabel.trim()
        ? obj.actionLabel.trim().slice(0, 14)
        : 'Read email';
    return { title, body: bodyOut, severity, actionLabel };
  } catch {
    return null;
  }
}

function normalizeSeverity(raw: unknown): Severity {
  const s = String(raw || '').toLowerCase().trim();
  if (s === 'urgent' || s === 'warning' || s === 'info') return s;
  return 'info';
}

function rulesFallback(from: string, subject: string, body: string): SummaryResponse {
  const text = `${subject} ${body}`.toLowerCase();
  let prefix = 'Heads Up';
  let severity: Severity = 'info';

  if (/\b(care|wash|dry|clean|store|maintain|fabric)\b/.test(text)) {
    prefix = 'Care Alert';
  } else if (/\b(pickup|ready|prescription|rx)\b/.test(text)) {
    prefix = 'Pickup';
    severity = 'warning';
  } else if (/\b(dismissal|appointment|schedule|delivery|arrives|tomorrow|today|tonight)\b/.test(text)) {
    prefix = 'Schedule';
    severity = 'warning';
  } else if (/\b(sign[- ]off|approve|need(s)? you|review|decide|confirm|action)\b/.test(text)) {
    prefix = 'Action Needed';
    severity = 'warning';
  }

  // Best-effort 1-sentence distill: take the first sentence of the body.
  const firstSentence = (body.split(/(?<=[.!?])\s/)[0] ?? subject).trim();
  const distilled = firstSentence.length > 90 ? firstSentence.slice(0, 87) + '…' : firstSentence;

  return {
    title: `${prefix}: ${distilled}`,
    body: from ? `From: ${from.replace(/<[^>]+>/g, '').trim()}` : undefined,
    kind: 'email_alert',
    severity,
    actionLabel: 'Read email',
    source: 'fallback',
  };
}
