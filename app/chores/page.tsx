'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { fetchChores, type Chore } from '@/lib/queries/chores';
import { addChore, completeChore } from '@/lib/mutations/chores';
import {
  tokens,
  familyColor,
  familyBg,
  familyText,
  type FamilyMember,
} from '@/lib/design-tokens';

const MEMBERS: { member: FamilyMember; letter: string }[] = [
  { member: 'jax', letter: 'J' },
  { member: 'evey', letter: 'E' },
  { member: 'molly', letter: 'M' },
  { member: 'shane', letter: 'S' },
];

function isFamilyMember(v: string | null): v is FamilyMember {
  return v === 'shane' || v === 'molly' || v === 'evey' || v === 'jax';
}

export default function ChoresPage() {
  const [items, setItems] = useState<Chore[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [prefillAssignee, setPrefillAssignee] = useState<FamilyMember | null>(null);

  useEffect(() => {
    // Read URL params client-side so the page stays SSG-safe (no
    // useSearchParams / Suspense requirement). Supports ?for=<member>&add=1
    // from the avatar long-press "Add chore" action.
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const forParam = params.get('for');
      const addParam = params.get('add');
      if (isFamilyMember(forParam)) setPrefillAssignee(forParam);
      if (addParam === '1') setAddOpen(true);
    }
    let alive = true;
    (async () => {
      const list = await fetchChores();
      if (alive) setItems(list);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const { open, done } = useMemo(() => {
    const o: Chore[] = [];
    const d: Chore[] = [];
    for (const c of items ?? []) (c.doneAt === null ? o : d).push(c);
    return { open: o, done: d };
  }, [items]);

  async function handleToggle(c: Chore) {
    if (busy || c.doneAt !== null) return;
    setBusy(true);
    const stamp = new Date().toISOString();
    setItems((prev) =>
      prev ? prev.map((x) => (x.id === c.id ? { ...x, doneAt: stamp } : x)) : prev,
    );
    await completeChore(c.id);
    setBusy(false);
  }

  async function handleAdd(input: {
    assignee: FamilyMember;
    title: string;
    dueDate: string | null;
  }) {
    if (busy) return;
    setBusy(true);
    const res = await addChore({
      assignee: input.assignee,
      title: input.title,
      dueDate: input.dueDate,
      createdBy: 'shane',
    });
    if (res.ok) {
      setItems((prev) => (prev ? [res.data, ...prev] : [res.data]));
      setAddOpen(false);
    } else {
      // Preview/no-supabase: optimistically insert locally so the UI still feels live.
      const local: Chore = {
        id: `local-${Date.now()}`,
        assignee: input.assignee,
        title: input.title.trim(),
        dueDate: input.dueDate,
        doneAt: null,
        createdBy: 'shane',
        notes: undefined,
        createdAt: new Date().toISOString(),
      };
      setItems((prev) => (prev ? [local, ...prev] : [local]));
      setAddOpen(false);
    }
    setBusy(false);
  }

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
      <header
        className="flex items-center justify-between px-4"
        style={{
          paddingTop: `calc(12px + env(safe-area-inset-top))`,
          paddingBottom: 12,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(7,9,15,0.92)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Link href="/" className="text-[13px] text-white/60 no-underline">
          ← Back
        </Link>
        <span className="text-[11px] uppercase tracking-[1px] text-white/40">
          Chores
        </span>
        <button
          type="button"
          onClick={() => setAddOpen((v) => !v)}
          className="text-[11px] font-semibold"
          style={{
            color: tokens.gold,
            padding: 0,
            background: 'transparent',
            border: 'none',
          }}
        >
          {addOpen ? 'Close' : 'Add'}
        </button>
      </header>

      <div className="px-4 pb-24 pt-2 flex flex-col gap-3">
        {addOpen && (
          <AddChoreForm
            onSubmit={handleAdd}
            busy={busy}
            initialAssignee={prefillAssignee ?? 'jax'}
          />
        )}

        {items === null ? (
          <div className="pt-10 text-center text-white/40">Loading…</div>
        ) : open.length === 0 && done.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <Section label={`Open · ${open.length}`}>
              {open.length === 0 ? (
                <div className="text-[12px] text-white/40 py-2">
                  Nothing open. Nice.
                </div>
              ) : (
                open.map((c) => (
                  <ChoreRow key={c.id} chore={c} onToggle={() => handleToggle(c)} />
                ))
              )}
            </Section>

            {done.length > 0 && (
              <Section label={`Done · ${done.length}`}>
                {done.map((c) => (
                  <ChoreRow key={c.id} chore={c} onToggle={() => {}} />
                ))}
              </Section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

/* ─────────── add form ─────────── */

function AddChoreForm({
  onSubmit,
  busy,
  initialAssignee,
}: {
  onSubmit: (v: {
    assignee: FamilyMember;
    title: string;
    dueDate: string | null;
  }) => void;
  busy: boolean;
  initialAssignee: FamilyMember;
}) {
  const [assignee, setAssignee] = useState<FamilyMember>(initialAssignee);
  const [title, setTitle] = useState('');
  const [due, setDue] = useState<'today' | 'tomorrow' | 'none'>('today');

  const canSubmit = title.trim().length > 0 && !busy;

  function submit() {
    if (!canSubmit) return;
    onSubmit({
      assignee,
      title,
      dueDate:
        due === 'none'
          ? null
          : due === 'today'
            ? todayIso(0)
            : todayIso(1),
    });
    setTitle('');
    setDue('today');
  }

  return (
    <div
      className="rounded-md"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '12px 12px 10px',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        {MEMBERS.map((m) => {
          const active = assignee === m.member;
          return (
            <button
              key={m.member}
              type="button"
              onClick={() => setAssignee(m.member)}
              className="flex items-center justify-center"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: familyBg(m.member),
                border: `${active ? 2.5 : 1.5}px solid ${familyColor(m.member)}`,
                color: familyText(m.member),
                fontSize: 12,
                fontWeight: 700,
                padding: 0,
                opacity: active ? 1 : 0.55,
              }}
              aria-pressed={active}
              aria-label={`Assign to ${m.member}`}
            >
              {m.letter}
            </button>
          );
        })}
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs doing?"
        className="w-full"
        style={{
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
          color: '#FFFFFF',
          fontSize: 14,
          padding: '6px 2px',
          outline: 'none',
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
      />

      <div className="flex items-center justify-between mt-3">
        <div className="flex gap-1.5">
          {(['today', 'tomorrow', 'none'] as const).map((opt) => {
            const active = due === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setDue(opt)}
                className="text-[11px]"
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: active ? `${tokens.gold}22` : 'transparent',
                  border: `1px solid ${active ? tokens.gold : 'rgba(255,255,255,0.12)'}`,
                  color: active ? tokens.gold : 'rgba(255,255,255,0.55)',
                  fontWeight: 600,
                }}
              >
                {opt === 'none' ? 'No date' : opt}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="text-[12px] font-semibold"
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            background: canSubmit ? tokens.gold : 'rgba(255,255,255,0.08)',
            color: canSubmit ? '#07090F' : 'rgba(255,255,255,0.35)',
            border: 'none',
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

/* ─────────── rows ─────────── */

function ChoreRow({
  chore,
  onToggle,
}: {
  chore: Chore;
  onToggle: () => void;
}) {
  const done = chore.doneAt !== null;
  const accent = familyColor(chore.assignee);

  return (
    <div
      className="flex items-start gap-3 rounded-md"
      style={{
        background: done ? 'rgba(255,255,255,0.02)' : `${accent}10`,
        border: `1px solid ${done ? 'rgba(255,255,255,0.05)' : `${accent}33`}`,
        padding: '10px 12px',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={done ? 'Completed' : `Mark ${chore.title} done`}
        aria-pressed={done}
        className="shrink-0 flex items-center justify-center"
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: done ? accent : 'transparent',
          border: `2px solid ${accent}`,
          padding: 0,
          marginTop: 2,
        }}
      >
        {done && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12l4 4 10-10"
              stroke="#07090F"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <div
            className="text-[13px] font-semibold truncate"
            style={{
              color: done ? 'rgba(255,255,255,0.45)' : '#FFFFFF',
              textDecoration: done ? 'line-through' : 'none',
            }}
          >
            {chore.title}
          </div>
          <span
            className="text-[10px] shrink-0 uppercase tracking-[0.5px]"
            style={{ color: accent, fontWeight: 700 }}
          >
            {chore.assignee}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {chore.dueDate && (
            <span
              className="text-[11px]"
              style={{
                color: dueColor(chore.dueDate, done),
                fontWeight: 600,
              }}
            >
              {formatDue(chore.dueDate)}
            </span>
          )}
          {chore.notes && (
            <span className="text-[11px] text-white/50 truncate">
              {chore.notes}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <div className="text-[10px] uppercase tracking-[1.5px] text-white/35 px-1">
        {label}
      </div>
      {children}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="pt-16 text-center">
      <div className="text-[13px] text-white/55">No chores yet.</div>
      <div className="text-[11px] text-white/35 mt-1">
        Tap Add, or press-and-hold M to dictate.
      </div>
    </div>
  );
}

/* ─────────── helpers ─────────── */

function todayIso(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDue(iso: string): string {
  const today = todayIso(0);
  const tomorrow = todayIso(1);
  if (iso === today) return 'Today';
  if (iso === tomorrow) return 'Tomorrow';
  const d = new Date(`${iso}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - now.getTime()) / 86_400_000);
  if (diffDays < 0) return `${Math.abs(diffDays)}d late`;
  if (diffDays < 7) {
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function dueColor(iso: string, done: boolean): string {
  if (done) return 'rgba(255,255,255,0.35)';
  const today = todayIso(0);
  const d = new Date(`${iso}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (d.getTime() < now.getTime()) return tokens.red;
  if (iso === today) return tokens.gold;
  return 'rgba(255,255,255,0.55)';
}
