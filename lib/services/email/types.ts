// Email Intelligence Bridge — provider-neutral types.
//
// `EmailProvider` is the contract the poller talks to. Today we ship a
// mock provider that yields a small set of realistic priority emails so
// the full pipeline (poll → Haiku summarize → notification card) is
// observable end-to-end on Vercel preview without OAuth.
//
// Swap-in path for real Gmail: implement EmailProvider against the
// Gmail REST API with an OAuth refresh token (env GMAIL_REFRESH_TOKEN)
// and have lib/services/email/index.ts return that provider when the
// token is set.

export interface EmailMessage {
  /** Stable unique id (Gmail message id when real). Used to dedupe. */
  id: string;
  /** "Sender Name <sender@example.com>" or just an address. */
  from: string;
  subject: string;
  /** Plain-text body. HTML stripped upstream. */
  body: string;
  /** ISO timestamp the email was received. */
  receivedAt: string;
}

export interface EmailFetchOptions {
  /** Only return messages received after this ISO timestamp. */
  since?: string;
  /**
   * Hard cap so a stale provider can't dump hundreds of items into
   * the notification tray on first run.
   */
  limit?: number;
}

export interface EmailProvider {
  readonly name: string;
  /**
   * Returns priority-keyword matches received since the cursor. Caller
   * is expected to dedupe by `id` before processing.
   */
  fetchPriority(opts: EmailFetchOptions): Promise<EmailMessage[]>;
}

/**
 * Priority keywords (case-insensitive, substring match against
 * subject + body). When real Gmail is wired, these become a Gmail
 * search query: `(Care OR Instructions OR Shane) newer_than:1d`.
 */
export const PRIORITY_KEYWORDS = ['Care', 'Instructions', 'Shane'] as const;

export function matchesPriority(msg: Pick<EmailMessage, 'subject' | 'body'>): boolean {
  const haystack = `${msg.subject}\n${msg.body}`.toLowerCase();
  return PRIORITY_KEYWORDS.some((kw) => haystack.includes(kw.toLowerCase()));
}
