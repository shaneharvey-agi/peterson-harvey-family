// Real Gmail provider — uses an OAuth refresh token (no user-facing
// consent flow at request time). Set these env vars to enable:
//
//   GMAIL_CLIENT_ID
//   GMAIL_CLIENT_SECRET
//   GMAIL_REFRESH_TOKEN   ← obtained once via OAuth Playground; never expires
//                            until you revoke it in your Google account
//
// Scope required (when minting the refresh token):
//   https://www.googleapis.com/auth/gmail.readonly
//
// Provider selection happens in lib/services/email/index.ts based on
// presence of GMAIL_REFRESH_TOKEN. When unset, the mock provider runs.

import type { EmailFetchOptions, EmailMessage, EmailProvider } from './types';
import { PRIORITY_KEYWORDS } from './types';

interface GmailListResponse {
  messages?: { id: string; threadId: string }[];
  resultSizeEstimate?: number;
}

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailPart {
  mimeType?: string;
  body?: { data?: string; size?: number };
  parts?: GmailPart[];
  headers?: GmailHeader[];
}

interface GmailMessageResponse {
  id: string;
  internalDate?: string; // ms epoch as string
  payload?: GmailPart & { headers?: GmailHeader[] };
  snippet?: string;
}

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

// In-memory access-token cache (single Vercel function instance). New
// invocations after a cold start will mint a fresh access token; that's
// cheap (one POST, ~200ms).
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30_000) {
    return cachedToken.value;
  }
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Gmail env not configured: need GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN.',
    );
  }
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    throw new Error(`Gmail token exchange failed: ${resp.status} ${detail}`);
  }
  const json = (await resp.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: json.access_token,
    expiresAt: now + json.expires_in * 1000,
  };
  return cachedToken.value;
}

function buildQuery(sinceISO?: string): string {
  // Gmail search syntax: parenthesized OR over keywords, then newer_than.
  // newer_than supports d (days), h (hours). We default to 1d and let the
  // dedupe ledger do the heavier lifting.
  const kw = PRIORITY_KEYWORDS.map((k) => `"${k}"`).join(' OR ');
  let q = `(${kw})`;
  if (sinceISO) {
    const ageMs = Date.now() - Date.parse(sinceISO);
    const days = Math.max(1, Math.ceil(ageMs / 86_400_000));
    q += ` newer_than:${days}d`;
  } else {
    q += ' newer_than:1d';
  }
  return q;
}

async function gmailFetch<T>(path: string, accessToken: string): Promise<T> {
  const resp = await fetch(`${GMAIL_BASE}${path}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    throw new Error(`Gmail ${path} failed: ${resp.status} ${detail}`);
  }
  return (await resp.json()) as T;
}

function header(headers: GmailHeader[] | undefined, name: string): string {
  if (!headers) return '';
  const lower = name.toLowerCase();
  return headers.find((h) => h.name.toLowerCase() === lower)?.value ?? '';
}

function decodeBase64Url(data: string): string {
  // Gmail returns base64url (RFC 4648 §5). Convert to standard base64.
  const b64 = data.replace(/-/g, '+').replace(/_/g, '/');
  try {
    return Buffer.from(b64, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

function extractPlainText(part: GmailPart | undefined): string {
  if (!part) return '';
  // Prefer text/plain; recurse through multipart.
  if (part.mimeType === 'text/plain' && part.body?.data) {
    return decodeBase64Url(part.body.data);
  }
  if (part.parts && part.parts.length > 0) {
    // Look at text/plain children first.
    for (const p of part.parts) {
      if (p.mimeType === 'text/plain' && p.body?.data) {
        return decodeBase64Url(p.body.data);
      }
    }
    for (const p of part.parts) {
      const found = extractPlainText(p);
      if (found) return found;
    }
  }
  // Fallback: HTML stripped of tags.
  if (part.mimeType === 'text/html' && part.body?.data) {
    const html = decodeBase64Url(part.body.data);
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return '';
}

export const gmailProvider: EmailProvider = {
  name: 'gmail',
  async fetchPriority(opts: EmailFetchOptions = {}): Promise<EmailMessage[]> {
    const accessToken = await getAccessToken();
    const q = buildQuery(opts.since);
    const limit = Math.min(opts.limit ?? 20, 50);

    const list = await gmailFetch<GmailListResponse>(
      `/messages?q=${encodeURIComponent(q)}&maxResults=${limit}`,
      accessToken,
    );
    const ids = (list.messages ?? []).map((m) => m.id);
    if (ids.length === 0) return [];

    // Fetch in parallel — Gmail tolerates a small concurrent burst per token.
    const messages = await Promise.all(
      ids.map((id) =>
        gmailFetch<GmailMessageResponse>(`/messages/${id}?format=full`, accessToken).catch(
          () => null,
        ),
      ),
    );

    const out: EmailMessage[] = [];
    for (const m of messages) {
      if (!m || !m.payload) continue;
      const headers = m.payload.headers;
      const from = header(headers, 'From');
      const subject = header(headers, 'Subject');
      const body = extractPlainText(m.payload);
      const receivedAt = m.internalDate
        ? new Date(Number(m.internalDate)).toISOString()
        : new Date().toISOString();
      out.push({
        id: m.id,
        from,
        subject,
        body: body || m.snippet || '',
        receivedAt,
      });
    }
    return out;
  },
};
