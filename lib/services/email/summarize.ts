// Shared Haiku summarizer used by /api/email-summary and /api/email-poll.
//
// Single source of truth for the prompt + parsing + fallback heuristics
// so the two routes can never drift apart.
//
// Returns null when the email is not worth alerting on (marketing,
// newsletter, promo, automated digest). Callers should record the
// email id in `processed_emails` regardless so we don't re-classify
// the same junk on every poll.

export type Severity = 'info' | 'warning' | 'urgent';

export interface SummarizableEmail {
  from: string;
  subject: string;
  body: string;
}

export interface EmailSummary {
  title: string;
  body?: string;
  severity: Severity;
  actionLabel?: string;
  source: 'haiku' | 'fallback';
}

const SYSTEM_PROMPT = [
  'You are a personal-assistant filter for the household owner Shane.',
  'You will receive ONE email (sender, subject, body) and must decide:',
  '  (A) is this even worth alerting Shane about?',
  '  (B) if yes, summarize it as a single Actionable Alert.',
  '',
  'Return strict JSON only — no prose, no markdown, no code fences.',
  'Shape: {"worthAlerting": true|false, "title": string, "body": string, "severity": string, "actionLabel": string}',
  '',
  '== worthAlerting ==',
  'TRUE only when the email contains a SPECIFIC, ACTIONABLE thing Shane needs to',
  'know — examples:',
  '  - care/maintenance instructions for something he bought',
  '  - school/childcare logistics, dismissal times, sign-ups, forms',
  '  - appointment reminders, prescription pickup, package arrival',
  '  - personal request from a real person (family, contractor, friend)',
  '  - bill due, payment failure, security alert',
  '  - something a family member forwarded that needs his attention',
  '',
  'FALSE for: marketing, promotions, newsletters, sales pitches, automated',
  '"weekly digests", brand announcements, app feature emails, social media',
  'notifications, generic "tips" emails, calendar invites you already saw,',
  'shipping/order receipts that just confirm an order with no action needed,',
  'mass mailings even if they greet "Shane,".',
  '',
  'When uncertain, prefer FALSE. Shane will see real Gmail anyway —',
  'these alerts are for things that actually need his hands or mind today.',
  '',
  'When worthAlerting is FALSE, set title="" body="" actionLabel="" severity="info".',
  '',
  '== title (only when worthAlerting=true) ==',
  'ONE clean sentence. Max 90 chars. Lead with a 1-2 word category prefix + ": ".',
  'Categories: "Care Alert" | "Action Needed" | "Schedule" | "Pickup" | "Heads Up"',
  '',
  'STRICT formatting rules — violating any of these means the title is wrong:',
  '  - NO URLs (no http://, https://, www., or domain.com fragments)',
  '  - NO markdown ([text](url), **bold**, raw brackets)',
  '  - NO escape characters (\\r, \\n, \\t)',
  '  - NO HTML entities (&amp; &nbsp; etc.)',
  '  - NO marketing copy fragments ("limited time", "tips inside", "free")',
  '  - NO empty placeholders ("...", "TBD", "(see link)")',
  '',
  'Distill the SPECIFIC thing — not a paraphrase of the subject line.',
  'PREFER the subject line as your title source — it is human-written and',
  'signal-dense. Strip "Fwd:"/"Re:" prefixes. Only mine the body for detail',
  'when the subject is too generic. NEVER produce a title from email-template',
  'footer phrases ("View it in your browser", "Click here", legal disclaimers).',
  'If the email is FORWARDED (subject starts "Fwd:" or body has',
  '"Forwarded message" header), summarize what the FORWARDED CONTENT is asking,',
  'NOT the forwarder or the forwarding metadata.',
  '',
  'Examples of GOOD titles:',
  '  "Care Alert: Hand wash sweater, lay flat to dry."',
  '  "Schedule: Friday early dismissal — pick up kids by 12:20."',
  '  "Pickup: Walgreens Rx ready — pickup window closes Sunday 9pm."',
  '  "Action Needed: Reply to confirm Jaxon\'s dental appointment Thursday."',
  '  "Action Needed: Contractor needs sign-off on pendant swap by Thursday."',
  '',
  'Examples of BAD titles (never produce these):',
  '  "Care Alert: Forwarded message --------- From: ..."  ← header text, not content',
  '  "Action Needed: The previous email was sent at 11:55"  ← meta-text, not the ask',
  '  "Heads Up: Hi Shane,"  ← greeting fragment',
  '  "Care Alert: [Logo](https://...)"  ← contains markdown/URL',
  '  "Care Alert: View it in your browser"  ← email-template footer phrase',
  '  "Action Needed: 2510-2521 and is legally privileged"  ← legal disclaimer fragment',
  '',
  '== body ==',
  'Optional 1-liner with sender or context. Max 70 chars. No URLs. Empty if redundant.',
  '',
  '== severity ==',
  '  "urgent"  — time-sensitive within 24h AND requires Shane to act',
  '  "warning" — action needed but not immediate (this week)',
  '  "info"    — reference info / care instructions / FYI',
  '',
  '== actionLabel ==',
  'Short verb CTA, max 14 chars. Default "Read email".',
].join('\n');

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

export async function summarizeEmail(
  msg: SummarizableEmail,
): Promise<EmailSummary | null> {
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
        model: HAIKU_MODEL,
        max_tokens: 320,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `From: ${msg.from}\nSubject: ${msg.subject}\n\n${truncateForPrompt(stripForwardingHeader(msg.body))}`,
          },
        ],
      }),
    });
    if (!resp.ok) throw new Error(`Haiku ${resp.status}`);
    const data: any = await resp.json();
    const text = data?.content?.[0]?.text ?? '';
    const parsed = parseHaikuJSON(text);
    if (parsed === 'skip') return null;
    if (parsed) return { ...parsed, source: 'haiku' };
    // Haiku returned something we couldn't parse — log it so we can
    // diagnose, then fall back to the rules summarizer.
    console.warn('[summarizeEmail] Haiku unparseable, raw response:', text.slice(0, 400));
    return rulesFallback(msg);
  } catch (e) {
    console.warn('[summarizeEmail] Haiku failed, using fallback:', e);
    return rulesFallback(msg);
  }
}

/* ─────────── parsing ─────────── */

function parseHaikuJSON(
  text: string,
): Omit<EmailSummary, 'source'> | 'skip' | null {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  let obj: any;
  try {
    obj = JSON.parse(cleaned);
  } catch {
    return null;
  }
  if (obj?.worthAlerting === false) return 'skip';

  const title = sanitizeTitle(obj?.title);
  if (!title) return null; // worthAlerting=true but no usable title → bail

  return {
    title,
    body: sanitizeBody(obj?.body) || undefined,
    severity: normalizeSeverity(obj?.severity),
    actionLabel:
      typeof obj?.actionLabel === 'string' && obj.actionLabel.trim()
        ? obj.actionLabel.trim().slice(0, 14)
        : 'Read email',
  };
}

function normalizeSeverity(raw: unknown): Severity {
  const s = String(raw || '').toLowerCase().trim();
  if (s === 'urgent' || s === 'warning' || s === 'info') return s;
  return 'info';
}

/* ─────────── sanitizers ─────────── */

const URL_RE = /\bhttps?:\/\/\S+|\bwww\.\S+/gi;
const MARKDOWN_LINK_RE = /\[([^\]]*)\]\([^)]*\)/g;
const HTML_ENTITY_RE = /&(?:amp|nbsp|lt|gt|quot|#x?\d+);/gi;

function sanitizeTitle(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  let t = raw
    .replace(MARKDOWN_LINK_RE, '$1')
    .replace(URL_RE, '')
    .replace(HTML_ENTITY_RE, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[\[\]{}<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  // Strip stray punctuation left at the edges by URL/markdown removal.
  t = t.replace(/^[\s\-:.,;]+/, '').replace(/[\s\-:.,;]+$/, '');
  if (looksLikeGarbageTitle(t)) return '';
  if (t.length > 90) t = t.slice(0, 87).trimEnd() + '…';
  return t;
}

/**
 * Detects clearly-broken titles produced by either the model or the
 * rules fallback when the email body started with template fragments
 * (forwarding headers, email-client preamble, etc). Returning '' from
 * sanitizeTitle then forces a drop instead of writing a junk alert.
 */
function looksLikeGarbageTitle(t: string): boolean {
  const stripped = t.replace(/^(Care Alert|Action Needed|Schedule|Pickup|Heads Up):\s*/i, '');
  if (!stripped) return true;
  const low = stripped.toLowerCase();
  if (low.startsWith('forwarded message')) return true;
  if (low.startsWith('begin forwarded message')) return true;
  if (low.startsWith('-----')) return true;
  if (/^from:\s/i.test(stripped)) return true;
  if (/\bnoreply@|\bno-reply@/i.test(stripped)) return true;
  if (/\b\S+@\S+\.\S+/.test(stripped)) return true; // bare email address
  if (/^the previous email/i.test(stripped)) return true;
  if (/^on \w+,? \w+ \d/i.test(stripped)) return true; // "On Mon, Apr 28..."
  if (looksLikeTemplatePhrase(stripped)) return true;
  // Numeric-only fragments ("2510-2521", "1.2.3", line numbers).
  if (/^[\d\s\-.,]+$/.test(stripped)) return true;
  // Title is just a single common verb/noun fragment with no real info.
  if (stripped.length < 12 && !/[?!.]/.test(stripped)) return true;
  return false;
}

function sanitizeBody(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  let b = raw
    .replace(MARKDOWN_LINK_RE, '$1')
    .replace(URL_RE, '')
    .replace(HTML_ENTITY_RE, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (b.length > 70) b = b.slice(0, 67).trimEnd() + '…';
  return b;
}

function truncateForPrompt(body: string): string {
  // Emails can be enormous (newsletters with full HTML). Cap input
  // tokens — first ~3000 chars is plenty for Haiku to classify.
  if (body.length <= 3000) return body;
  return body.slice(0, 3000) + '\n\n[…body truncated]';
}

/**
 * Strips the standard "---------- Forwarded message ---------" header
 * block (and Apple Mail's "Begin forwarded message:" variant) so the
 * summarizer sees the real content first instead of From/Date/Subject/To
 * metadata. Conservative — leaves the body alone if no header pattern matches.
 */
export function stripForwardingHeader(body: string): string {
  if (!body) return body;
  // Gmail-style: "---------- Forwarded message ---------" then a few
  // header lines (From:/Date:/Subject:/To:), then a blank line, then content.
  const gmailMatch = body.match(
    /-{2,}\s*Forwarded message\s*-{2,}\s*\n(?:[^\n]*\n){0,8}?\n([\s\S]+)/i,
  );
  if (gmailMatch) return gmailMatch[1].trim();
  // Apple Mail: "Begin forwarded message:\n\nFrom: ...\nSubject: ...\n\n<content>"
  const appleMatch = body.match(
    /Begin forwarded message:\s*\n(?:[^\n]*\n){0,8}?\n([\s\S]+)/i,
  );
  if (appleMatch) return appleMatch[1].trim();
  return body;
}

export function cleanFromAddress(from: string): string {
  // "Name <addr@x>" → "Name"; bare addr → addr
  const angled = from.match(/^(.+?)\s*<[^>]+>$/);
  return (angled?.[1] ?? from).replace(/^["']|["']$/g, '').trim();
}

/* ─────────── fallback (no Haiku) ─────────── */

const MARKETING_HINTS = [
  'unsubscribe',
  'view in browser',
  'view it in your browser',
  'view this email in your browser',
  'trouble viewing',
  'add us to your address book',
  '% off',
  '%off',
  'free shipping',
  'limited time',
  'sale ends',
  'shop now',
  'click here',
  'newsletter',
  'tips inside',
  'we noticed you',
  'last chance',
  'flash sale',
  'this week only',
  'manage your preferences',
  'no longer wish to receive',
];

/**
 * Email-template / footer / legal phrases that frequently leak into
 * the rules-fallback's "first sentence." Treat them as garbage so the
 * fallback skips past them to the next sentence.
 */
const TEMPLATE_PHRASES = [
  'view it in your browser',
  'view this email in your browser',
  'view in browser',
  'trouble viewing',
  'click here to',
  'is legally privileged',
  'confidential and may contain',
  'this message is intended',
  'please do not reply',
  'add us to your',
  'manage your preferences',
];

function looksLikeTemplatePhrase(s: string): boolean {
  const low = s.toLowerCase();
  return TEMPLATE_PHRASES.some((p) => low.includes(p));
}

function looksLikeMarketing(text: string): boolean {
  const t = text.toLowerCase();
  return MARKETING_HINTS.some((h) => t.includes(h));
}

function rulesFallback(msg: SummarizableEmail): EmailSummary | null {
  const cleanedBody = stripForwardingHeader(msg.body);
  const haystack = `${msg.subject}\n${cleanedBody}`;
  if (looksLikeMarketing(haystack)) return null;

  const text = haystack.toLowerCase();
  let prefix = 'Heads Up';
  let severity: Severity = 'info';

  if (/\b(care|wash|dry|clean|store|maintain|fabric)\b/.test(text)) {
    prefix = 'Care Alert';
  } else if (/\b(pickup|ready|prescription|rx)\b/.test(text)) {
    prefix = 'Pickup';
    severity = 'warning';
  } else if (/\b(dismissal|appointment|schedule|delivery|arrives|tomorrow|today|tonight|confirm)\b/.test(text)) {
    prefix = 'Schedule';
    severity = 'warning';
  } else if (/\b(sign[- ]off|approve|need(s)? you|review|decide|action|please reply|reply)\b/.test(text)) {
    prefix = 'Action Needed';
    severity = 'warning';
  }

  // Subject is human-written and signal-dense — start there. Strip
  // Fwd:/Re:/RE: prefixes that don't add meaning.
  const cleanedSubject = msg.subject
    .replace(/^(?:(?:fwd|fw|re|aw):\s*)+/i, '')
    .trim();
  let distilled = sanitizeTitle(cleanedSubject);

  // If the subject is too thin or got rejected as garbage, walk the body
  // looking for the first sentence that survives sanitization.
  if (!distilled || distilled.length < 14) {
    const sentences = cleanedBody.split(/(?<=[.!?])\s/).slice(0, 8);
    for (const s of sentences) {
      const candidate = sanitizeTitle(s);
      if (candidate && candidate.length >= 14) {
        distilled = candidate;
        break;
      }
    }
  }
  if (!distilled) return null; // nothing usable left

  return {
    title: `${prefix}: ${distilled}`,
    body: `From: ${cleanFromAddress(msg.from)}`,
    severity,
    actionLabel: 'Read email',
    source: 'fallback',
  };
}
