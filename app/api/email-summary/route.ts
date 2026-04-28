import { NextRequest, NextResponse } from 'next/server';
import { summarizeEmail, type EmailSummary } from '@/lib/services/email/summarize';

/**
 * Haiku-powered email summarizer (single-shot).
 *
 * Input:
 *   { from: string, subject: string, body: string }
 *
 * Output (when worthAlerting=true):
 *   { worthAlerting: true, kind: 'email_alert', title, body, severity, actionLabel, source }
 * Output (when worthAlerting=false — Haiku judged this not worth surfacing):
 *   { worthAlerting: false, kind: 'email_alert', source }
 *
 * Shares its prompt + parsing + fallback with /api/email-poll via
 * lib/services/email/summarize.ts. Never throws.
 */

export const runtime = 'edge';

interface SummaryResponse {
  worthAlerting: boolean;
  kind: 'email_alert';
  title?: string;
  body?: string;
  severity?: EmailSummary['severity'];
  actionLabel?: string;
  source: EmailSummary['source'] | 'skip';
}

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null);
  const from = String(payload?.from ?? '').trim();
  const subject = String(payload?.subject ?? '').trim();
  const body = String(payload?.body ?? '').trim();

  if (!subject && !body) {
    return NextResponse.json<SummaryResponse>({
      worthAlerting: false,
      kind: 'email_alert',
      source: 'skip',
    });
  }

  const summary = await summarizeEmail({ from, subject, body });
  if (!summary) {
    return NextResponse.json<SummaryResponse>({
      worthAlerting: false,
      kind: 'email_alert',
      source: 'skip',
    });
  }
  return NextResponse.json<SummaryResponse>({
    worthAlerting: true,
    kind: 'email_alert',
    ...summary,
  });
}
