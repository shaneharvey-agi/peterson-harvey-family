// Twilio SMS adapter for the Active Bloom voice flow.
//
// Called from FamilyAvatars when Shane releases a long-press on a family
// avatar with a non-empty transcript. Fires in parallel with the in-app
// chat_messages write — the Supabase row is the in-app surface, this is
// the actual phone delivery.
//
// SAFE NO-OP MODE: if any required env var is missing (Twilio creds OR
// the recipient's phone number), this route returns {ok:true, sent:false}
// with a reason. The client treats the call as fire-and-forget and never
// surfaces a failure for the no-op case — the in-app message is still
// in Supabase, so nothing is "lost." This lets us merge the wiring
// without forcing immediate Twilio configuration.
//
// REQUIRED ENV (set in Vercel for feat/v5.1 preview):
//   TWILIO_ACCOUNT_SID    — Twilio account SID (starts AC…)
//   TWILIO_AUTH_TOKEN     — Twilio auth token
//   TWILIO_FROM_NUMBER    — E.164 sender number, e.g. +15555550100
//   FAMILY_PHONE_MOLLY    — E.164 number for Molly's phone
//   FAMILY_PHONE_EVEY     — E.164 number for Evey's phone
//   FAMILY_PHONE_JAX      — E.164 number for Jax's phone
//   FAMILY_PHONE_SHANE    — E.164 number for Shane (own self-notes loop)

import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

export const runtime = 'nodejs';

type Member = 'shane' | 'molly' | 'evey' | 'jax';

const VALID_MEMBERS: readonly Member[] = ['shane', 'molly', 'evey', 'jax'];

interface SendInput {
  member: Member;
  body: string;
}

function parseInput(raw: unknown): SendInput | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const member = String(r.member ?? '').toLowerCase() as Member;
  const body = String(r.body ?? '').trim();
  if (!VALID_MEMBERS.includes(member)) return null;
  if (!body) return null;
  return { member, body };
}

function lookupRecipientPhone(member: Member): string | null {
  const key = `FAMILY_PHONE_${member.toUpperCase()}`;
  const v = process.env[key];
  return v && v.trim() ? v.trim() : null;
}

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const input = parseInput(raw);
  if (!input) {
    return NextResponse.json({ ok: false, error: 'invalid_input' }, { status: 400 });
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const to = lookupRecipientPhone(input.member);

  // Safe no-op: any missing piece → 200 with reason. Caller doesn't surface.
  if (!sid || !token || !from) {
    return NextResponse.json({
      ok: true,
      sent: false,
      reason: 'twilio_not_configured',
    });
  }
  if (!to) {
    return NextResponse.json({
      ok: true,
      sent: false,
      reason: 'recipient_phone_missing',
      member: input.member,
    });
  }

  try {
    const client = twilio(sid, token);
    const msg = await client.messages.create({
      from,
      to,
      body: input.body,
    });
    return NextResponse.json({ ok: true, sent: true, sid: msg.sid });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'twilio_error';
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
