import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  getEmailProvider,
  matchesPriority,
  type EmailMessage,
} from '@/lib/services/email';

/**
 * Email Intelligence Bridge — poll endpoint.
 *
 *   POST /api/email-poll
 *
 * Pipeline:
 *   1. Provider yields recent priority emails (Care / Instructions / Shane).
 *   2. Each is deduped against `processed_emails`.
 *   3. New ones are summarized via Haiku → /api/email-summary semantics
 *      (called inline here; same prompt logic).
 *   4. Each summary is written as a `notifications` row (kind=email_alert).
 *   5. Email id is recorded in `processed_emails` so future polls skip it.
 *
 * Returns: { processed, written, skipped, errors, provider }
 *
 * Trigger paths:
 *   - Manual: "Sync inbox" button on /notifications.
 *   - Future: Vercel cron (vercel.json) on a 5–15 min cadence.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PollResult {
  processed: number;
  written: number;
  skipped: number;
  errors: string[];
  provider: string;
}

export async function POST(_req: NextRequest) {
  return NextResponse.json(await runPoll());
}

// Allow GET for debugging from a browser address bar.
export async function GET(_req: NextRequest) {
  return NextResponse.json(await runPoll());
}

async function runPoll(): Promise<PollResult> {
  const provider = getEmailProvider();
  const result: PollResult = {
    processed: 0,
    written: 0,
    skipped: 0,
    errors: [],
    provider: provider.name,
  };

  let messages: EmailMessage[] = [];
  try {
    messages = await provider.fetchPriority({ limit: 20 });
  } catch (e) {
    result.errors.push(`provider.fetchPriority: ${humanize(e)}`);
    return result;
  }

  // Defensive double-filter — provider should already match, but a real
  // Gmail query like `(Care OR Instructions OR Shane)` can return
  // borderline hits, and we don't want to summarize unrelated mail.
  const priority = messages.filter((m) => matchesPriority(m));
  result.processed = priority.length;
  if (priority.length === 0) return result;

  const ids = priority.map((m) => m.id);
  const seen = await alreadyProcessedIds(ids);

  for (const msg of priority) {
    if (seen.has(msg.id)) {
      result.skipped += 1;
      continue;
    }
    try {
      const summary = await summarizeEmail(msg);
      const notifId = await writeNotification(msg, summary);
      await recordProcessed(msg, notifId);
      result.written += 1;
    } catch (e) {
      result.errors.push(`${msg.id}: ${humanize(e)}`);
    }
  }

  return result;
}

/* ─────────── Supabase helpers ─────────── */

async function alreadyProcessedIds(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  try {
    const { data, error } = await supabase
      .from('processed_emails')
      .select('id')
      .in('id', ids);
    if (error) throw error;
    return new Set((data ?? []).map((r: { id: string }) => r.id));
  } catch (e) {
    // Fail open: if we can't read the dedupe table, skip nothing —
    // duplicates are recoverable, missed alerts aren't.
    console.warn('[api/email-poll] dedupe lookup failed:', e);
    return new Set();
  }
}

interface EmailSummary {
  title: string;
  body?: string;
  severity: 'info' | 'warning' | 'urgent';
  actionLabel?: string;
}

async function writeNotification(
  msg: EmailMessage,
  summary: EmailSummary,
): Promise<number | null> {
  const row = {
    kind: 'email_alert',
    severity: summary.severity,
    title: summary.title,
    body: summary.body ?? `From: ${cleanFrom(msg.from)}`,
    action_label: summary.actionLabel ?? null,
    action_url: null, // No tap-through until Gmail UI exists.
    created_at: msg.receivedAt,
  };
  const { data, error } = await supabase
    .from('notifications')
    .insert(row)
    .select('id')
    .single();
  if (error) throw error;
  return (data as { id: number } | null)?.id ?? null;
}

async function recordProcessed(msg: EmailMessage, notifId: number | null) {
  const { error } = await supabase.from('processed_emails').insert({
    id: msg.id,
    from_addr: cleanFrom(msg.from),
    subject: msg.subject,
    notification_id: notifId,
  });
  if (error) throw error;
}

/* ─────────── Haiku summarizer (inline) ─────────── */

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

async function summarizeEmail(msg: EmailMessage): Promise<EmailSummary> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return rulesFallback(msg);

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
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
            content: `From: ${msg.from}\nSubject: ${msg.subject}\n\n${msg.body}`,
          },
        ],
      }),
    });
    if (!resp.ok) throw new Error(`Haiku ${resp.status}`);
    const data: any = await resp.json();
    const text = data?.content?.[0]?.text ?? '';
    const parsed = parseHaikuJSON(text);
    return parsed ?? rulesFallback(msg);
  } catch (e) {
    console.warn('[api/email-poll] Haiku failed, using fallback:', e);
    return rulesFallback(msg);
  }
}

function parseHaikuJSON(text: string): EmailSummary | null {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    const obj = JSON.parse(cleaned);
    const title = typeof obj?.title === 'string' ? obj.title.trim() : '';
    if (!title) return null;
    return {
      title,
      body: typeof obj?.body === 'string' && obj.body.trim() ? obj.body.trim() : undefined,
      severity: normalizeSeverity(obj?.severity),
      actionLabel:
        typeof obj?.actionLabel === 'string' && obj.actionLabel.trim()
          ? obj.actionLabel.trim().slice(0, 14)
          : 'Read email',
    };
  } catch {
    return null;
  }
}

function normalizeSeverity(raw: unknown): 'info' | 'warning' | 'urgent' {
  const s = String(raw || '').toLowerCase().trim();
  if (s === 'urgent' || s === 'warning' || s === 'info') return s;
  return 'info';
}

function rulesFallback(msg: EmailMessage): EmailSummary {
  const text = `${msg.subject} ${msg.body}`.toLowerCase();
  let prefix = 'Heads Up';
  let severity: 'info' | 'warning' | 'urgent' = 'info';

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

  const firstSentence = (msg.body.split(/(?<=[.!?])\s/)[0] ?? msg.subject).trim();
  const distilled = firstSentence.length > 90 ? firstSentence.slice(0, 87) + '…' : firstSentence;
  return {
    title: `${prefix}: ${distilled}`,
    body: `From: ${cleanFrom(msg.from)}`,
    severity,
    actionLabel: 'Read email',
  };
}

/* ─────────── misc ─────────── */

function cleanFrom(from: string): string {
  // "Name <addr@x>" → "Name"; bare addr → addr
  const angled = from.match(/^(.+?)\s*<[^>]+>$/);
  return (angled?.[1] ?? from).trim();
}

function humanize(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) {
    return String((e as { message: unknown }).message);
  }
  return 'Unknown error.';
}
