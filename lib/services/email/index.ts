// Email Intelligence Bridge — provider selection.
//
// Returns the real Gmail provider when GMAIL_REFRESH_TOKEN is set,
// otherwise falls back to the mock provider. Lets the rest of the
// pipeline stay agnostic.

import { gmailProvider } from './gmailProvider';
import { mockProvider } from './mockProvider';
import type { EmailProvider } from './types';

export function getEmailProvider(): EmailProvider {
  if (process.env.GMAIL_REFRESH_TOKEN) return gmailProvider;
  return mockProvider;
}

export type { EmailMessage, EmailFetchOptions, EmailProvider } from './types';
export { PRIORITY_KEYWORDS, matchesPriority } from './types';
