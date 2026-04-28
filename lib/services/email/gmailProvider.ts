// Real Gmail provider — placeholder.
//
// To enable, set these env vars in Vercel (Production + Preview):
//   GMAIL_CLIENT_ID
//   GMAIL_CLIENT_SECRET
//   GMAIL_REFRESH_TOKEN     ← obtained via one-time OAuth consent flow
//
// Then implement fetchPriority() against the Gmail REST API:
//   1. POST https://oauth2.googleapis.com/token to exchange the refresh
//      token for a short-lived access token.
//   2. GET  https://gmail.googleapis.com/gmail/v1/users/me/messages
//      ?q=(Care OR Instructions OR Shane) newer_than:1d
//   3. For each message id, GET the full message (format=full), parse
//      the `From`, `Subject`, and the text/plain body part.
//
// We stub it for tonight so the build doesn't pull in `googleapis` and
// the pipeline runs end-to-end against the mock provider.

import type { EmailFetchOptions, EmailMessage, EmailProvider } from './types';

export const gmailProvider: EmailProvider = {
  name: 'gmail',
  async fetchPriority(_opts: EmailFetchOptions = {}): Promise<EmailMessage[]> {
    throw new Error(
      'gmailProvider not implemented yet — set GMAIL_REFRESH_TOKEN and ' +
        'wire the Gmail REST calls in lib/services/email/gmailProvider.ts.',
    );
  },
};
