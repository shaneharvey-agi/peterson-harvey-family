import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  getEmailProvider,
  matchesPriority,
  type EmailMessage,
} from '@/lib/services/email';
import {
  summarizeEmail,
  cleanFromAddress,
  type EmailSummary,
} from '@/lib/services/email/summarize';

/**
 * Email Intelligence Bridge — poll endpoint.
 *
 *   POST /api/email-poll
 *
 * Pipeline:
 *   1. Provider yields recent priority emails (Care / Instructions / Shane).
 *   2. Each is deduped against `processed_emails`.
 *   3. New ones are summarized via the shared Haiku summarizer.
 *      Marketing/newsletter/promo content is dropped (worthAlerting=false)
 *      but still recorded in the dedupe ledger so we don't re-classify
 *      the same junk on every poll.
 *   4. Surviving summaries are written as `notifications` rows
 *      (kind=email_alert).
 *
 * Returns: { processed, written, dropped, skipped, errors, provider }
 *
 * Trigger paths:
 *   - Manual: "Sync inbox" button on /notifications.
 *   - Future: Vercel cron on a 5–15 min cadence.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PollResult {
  processed: number; // total priority emails this run pulled in
  written: number;   // summaries that became notifications
  dropped: number;   // worthAlerting=false; ledgered, no notification
  skipped: number;   // already in dedupe ledger from a prior poll
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
    dropped: 0,
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
      if (!summary) {
        // Marketing/newsletter/etc. Ledger it so we don't re-Haiku next poll.
        await recordProcessed(msg, null);
        result.dropped += 1;
        continue;
      }
      const notifId = await writeNotification(msg, summary, provider.name);
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

async function writeNotification(
  msg: EmailMessage,
  summary: EmailSummary,
  providerName: string,
): Promise<number | null> {
  // Gmail message ids work in Gmail's web URL fragment — both message
  // and thread ids resolve to the thread view. Lets the user tap a card
  // and land directly in the conversation. Mock provider has no real
  // Gmail thread, so we leave the link blank.
  const actionUrl =
    providerName === 'gmail'
      ? `https://mail.google.com/mail/u/0/#inbox/${msg.id}`
      : null;
  const row = {
    kind: 'email_alert',
    severity: summary.severity,
    title: summary.title,
    body: summary.body ?? `From: ${cleanFromAddress(msg.from)}`,
    action_label: summary.actionLabel ?? null,
    action_url: actionUrl,
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
    from_addr: cleanFromAddress(msg.from),
    subject: msg.subject,
    notification_id: notifId,
  });
  if (error) throw error;
}

function humanize(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) {
    return String((e as { message: unknown }).message);
  }
  return 'Unknown error.';
}
