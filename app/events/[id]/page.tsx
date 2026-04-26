'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchEventById, type EventDetail } from '@/lib/queries/events';
import { supabase, type Event as SbEvent } from '@/lib/supabase';
import { updateEvent, deleteEvent } from '@/lib/mutations/events';
import {
  detectConflicts,
  type ConflictCandidate,
} from '@/lib/events/conflicts';
import { tokens, type FamilyMember } from '@/lib/design-tokens';

type Status =
  | { kind: 'loading' }
  | { kind: 'missing' }
  | { kind: 'ready'; original: EventDetail }
  | { kind: 'saving' }
  | { kind: 'error'; message: string };

const MEMBERS: FamilyMember[] = ['shane', 'molly', 'evey', 'jax'];

export default function EventEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  const [status, setStatus] = useState<Status>({ kind: 'loading' });
  const [dayEvents, setDayEvents] = useState<ConflictCandidate[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [who, setWho] = useState<FamilyMember>('molly');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Initial load: event + other events on that day (for conflicts)
  useEffect(() => {
    let alive = true;
    (async () => {
      const detail = await fetchEventById(id);
      if (!alive) return;
      if (!detail) {
        setStatus({ kind: 'missing' });
        return;
      }
      setTitle(detail.title);
      setDate(detail.date);
      setTime(detail.time ?? '');
      setEndTime(detail.endTime ?? '');
      setWho(detail.member);
      setAddress(detail.address);
      setNotes(detail.notes);
      setStatus({ kind: 'ready', original: detail });

      // Pull same-day events for conflict detection (best effort).
      try {
        const { data } = await supabase
          .from('events')
          .select('*')
          .eq('date', detail.date);
        if (!alive || !data) return;
        setDayEvents(
          (data as SbEvent[]).map((r) => ({
            id: String(r.id),
            date: r.date,
            time: r.time,
            endTime: r.end_time,
            member: toMember(r.who),
            title: r.title || '(untitled)',
          })),
        );
      } catch {
        // mock / offline — skip conflict check
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const conflicts = useMemo(() => {
    if (status.kind !== 'ready' && status.kind !== 'saving') return [];
    return detectConflicts(
      {
        id,
        date,
        time: time || null,
        endTime: endTime || null,
        member: who,
        title,
      },
      dayEvents,
    );
  }, [id, date, time, endTime, who, title, dayEvents, status.kind]);

  if (status.kind === 'loading') {
    return <Shell><div className="pt-10 text-center text-white/50">Loading…</div></Shell>;
  }
  if (status.kind === 'missing') {
    return (
      <Shell>
        <div className="pt-10 text-center text-white/70">
          <div className="text-lg font-semibold mb-2">Event not found</div>
          <Link href="/" className="text-[13px] underline text-white/50">
            Back to home
          </Link>
        </div>
      </Shell>
    );
  }

  async function onSave() {
    setStatus({ kind: 'saving' });
    const result = await updateEvent(id, {
      title,
      date,
      time: time || null,
      endTime: endTime || null,
      who,
      address,
      notes,
    });
    if (!result.ok) {
      setStatus({ kind: 'error', message: result.error });
      return;
    }
    router.push('/');
  }

  async function onDelete() {
    if (!confirm('Delete this event?')) return;
    setStatus({ kind: 'saving' });
    const result = await deleteEvent(id);
    if (!result.ok) {
      setStatus({ kind: 'error', message: result.error });
      return;
    }
    router.push('/');
  }

  const saving = status.kind === 'saving';
  const errMsg = status.kind === 'error' ? status.message : null;

  return (
    <Shell>
      <div
        className="px-4 pb-8 flex flex-col gap-4"
        style={{
          // Push the header below the iOS dynamic island / system clock.
          // The Shell only sets bottom padding for the persistent BottomNav;
          // the top edge needs its own safe-area reservation.
          paddingTop: 'calc(16px + env(safe-area-inset-top))',
        }}
      >
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="text-[13px] text-white/60 no-underline"
            aria-label="Back"
          >
            ← Back
          </Link>
          <span className="text-[11px] uppercase tracking-[1px] text-white/40">
            Edit event
          </span>
          <span className="w-[42px]" aria-hidden />
        </header>

        {conflicts.length > 0 && (
          <ConflictBanner conflicts={conflicts} member={who} />
        )}

        <Field label="Title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="Event title"
          />
        </Field>

        <Field label="Who">
          <div className="flex gap-1.5">
            {MEMBERS.map((m) => {
              const active = who === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setWho(m)}
                  className="flex-1 text-[12px] font-semibold rounded-md capitalize"
                  style={{
                    padding: '10px 0',
                    background: active ? tokens[m] : 'rgba(255,255,255,0.04)',
                    color: active ? '#FFFFFF' : 'rgba(255,255,255,0.65)',
                    border: `1px solid ${active ? tokens[m] : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="End">
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Date">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Address">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={inputClass}
            placeholder="Optional"
          />
        </Field>

        <Field label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputClass}
            rows={3}
            placeholder="Optional"
          />
        </Field>

        {errMsg && (
          <div
            className="text-[12px] rounded-md px-3 py-2"
            style={{
              background: 'rgba(226, 75, 74, 0.12)',
              color: tokens.red,
              border: `1px solid ${tokens.red}40`,
            }}
          >
            {errMsg}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex-1 rounded-md text-[13px] font-semibold"
            style={{
              padding: '12px 0',
              background: tokens.gold,
              color: '#07090F',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={saving}
            className="rounded-md text-[13px] font-semibold"
            style={{
              padding: '12px 16px',
              background: 'rgba(226, 75, 74, 0.12)',
              color: tokens.red,
              border: `1px solid ${tokens.red}40`,
            }}
          >
            Delete
          </button>
        </div>

        <p className="text-[11px] text-white/35 text-center pt-2">
          Tip: press &amp; hold M and tell Mikayla what to change.
        </p>
      </div>
    </Shell>
  );
}

/* ─────────── helpers ─────────── */

const inputClass =
  'w-full text-[13px] rounded-md px-3 py-2.5 bg-[rgba(255,255,255,0.04)] border border-white/10 text-white placeholder-white/30 outline-none focus:border-white/30';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="relative mx-auto"
      style={{
        maxWidth: 393,
        minHeight: '100dvh',
        background: tokens.bg,
        color: '#FFFFFF',
        // Reserve space for the persistent BottomNav (mounted in app/layout.tsx).
        paddingBottom: 'calc(96px + env(safe-area-inset-bottom))',
      }}
    >
      {children}
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] uppercase tracking-[1px] text-white/45">
        {label}
      </span>
      {children}
    </label>
  );
}

function ConflictBanner({
  conflicts,
  member,
}: {
  conflicts: ConflictCandidate[];
  member: FamilyMember;
}) {
  return (
    <div
      className="rounded-md px-3 py-2 text-[12px]"
      style={{
        background: `${tokens.gold}1F`,
        border: `1px solid ${tokens.gold}66`,
        color: '#F5E1A8',
      }}
    >
      <div className="font-semibold mb-0.5">
        Conflict for {member}
      </div>
      <ul className="list-disc pl-4">
        {conflicts.map((c) => (
          <li key={c.id}>
            {c.title}
            {c.time ? ` at ${c.time}` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}

function toMember(who: string): FamilyMember {
  const w = (who || '').toLowerCase();
  if (w.includes('shane')) return 'shane';
  if (w.includes('evey')) return 'evey';
  if (w.includes('jax')) return 'jax';
  return 'molly';
}
