// Mock email provider — yields a fixed set of realistic priority emails.
//
// Used when GMAIL_REFRESH_TOKEN is unset (preview branches, local dev,
// before Shane runs the OAuth consent flow). Returns each seed email
// once per (cursor) call so re-polling produces nothing new — same
// dedupe semantics as real Gmail with `historyId`.

import type { EmailMessage, EmailFetchOptions, EmailProvider } from './types';

const SEED: EmailMessage[] = [
  {
    id: 'mock-cashmere-care',
    from: 'Naadam <orders@naadam.co>',
    subject: 'Caring for your new cashmere sweater',
    body:
      'Thanks for your order, Shane! A few care instructions to keep your ' +
      'cashmere looking new: hand wash in cold water with a wool-safe ' +
      'detergent, lay flat to dry on a clean towel — never hang. Avoid ' +
      'direct sunlight while drying. Store folded with cedar to deter moths.',
    receivedAt: new Date(Date.now() - 35 * 60_000).toISOString(),
  },
  {
    id: 'mock-school-pickup',
    from: 'Riverbend Day School <office@riverbend.edu>',
    subject: 'Early dismissal Friday — pickup instructions for Evey & Jax',
    body:
      'Reminder: school dismisses at 12:30pm this Friday for staff ' +
      'development. Please arrive by 12:20. Evey can be picked up at the ' +
      'south gate; Jax should be collected from the gym lobby. Aftercare ' +
      'is not available on early-dismissal days.',
    receivedAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
  },
  {
    id: 'mock-rx-refill',
    from: 'Walgreens Rx <noreply@walgreens.com>',
    subject: 'Prescription ready for pickup — Shane',
    body:
      'Your prescription is ready for pickup at Walgreens #4421 ' +
      '(2150 Market St). Pickup window closes Sunday at 9pm. Bring photo ID.',
    receivedAt: new Date(Date.now() - 5 * 3_600_000).toISOString(),
  },
  {
    id: 'mock-contractor-instructions',
    from: 'Mike Albrecht <mike@albrechtbuild.com>',
    subject: 'Instructions for the kitchen punch list — needs your sign-off',
    body:
      'Shane — punch list attached. Two items need your call: (1) the ' +
      'pendant over the island is back-ordered 4 wks, want me to swap to ' +
      'the alternate? (2) Subzero install is scheduled Thursday 9–11a, ' +
      'someone needs to be on site to let the crew in.',
    receivedAt: new Date(Date.now() - 9 * 3_600_000).toISOString(),
  },
];

export const mockProvider: EmailProvider = {
  name: 'mock',
  async fetchPriority(opts: EmailFetchOptions = {}): Promise<EmailMessage[]> {
    const sinceMs = opts.since ? Date.parse(opts.since) : 0;
    const fresh = SEED.filter((m) => Date.parse(m.receivedAt) > sinceMs);
    return fresh.slice(0, opts.limit ?? 10);
  },
};
