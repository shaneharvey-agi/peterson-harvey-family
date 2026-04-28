'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  fetchTasks,
  taskListLabel,
  type Task,
} from '@/lib/queries/tasks';
import { addTask, completeTask } from '@/lib/mutations/tasks';
import {
  tokens,
  familyColor,
  type FamilyMember,
} from '@/lib/design-tokens';
import { FamilyFilterChips } from '@/components/tasks/FamilyFilterChips';
import { impact } from '@/lib/haptics';

const CURRENT_USER: FamilyMember = 'shane';

function isFamilyMember(v: string | null): v is FamilyMember {
  return v === 'shane' || v === 'molly' || v === 'evey' || v === 'jax';
}

export default function TasksPage() {
  const [items, setItems] = useState<Task[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FamilyMember>(CURRENT_USER);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const who = params.get('who');
      const forParam = params.get('for');
      const addParam = params.get('add');
      const seed = isFamilyMember(who)
        ? who
        : isFamilyMember(forParam)
          ? forParam
          : CURRENT_USER;
      setActiveFilter(seed);
      if (addParam === '1') setAddOpen(true);
    }
    let alive = true;
    (async () => {
      const list = await fetchTasks();
      if (alive) setItems(list);
    })();
    return () => {
      alive = false;
    };
  }, []);

  function selectFilter(member: FamilyMember) {
    setActiveFilter(member);
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('who', member);
    url.searchParams.delete('for');
    window.history.replaceState({}, '', url.toString());
  }

  const { open, done } = useMemo(() => {
    const o: Task[] = [];
    const d: Task[] = [];
    for (const t of items ?? []) {
      if (t.assignee !== activeFilter) continue;
      (t.doneAt === null ? o : d).push(t);
    }
    return { open: o, done: d };
  }, [items, activeFilter]);

  async function handleToggle(t: Task) {
    if (busy || t.doneAt !== null) return;
    setBusy(true);
    const stamp = new Date().toISOString();
    setItems((prev) =>
      prev ? prev.map((x) => (x.id === t.id ? { ...x, doneAt: stamp } : x)) : prev,
    );
    await completeTask(t.id);
    setBusy(false);
  }

  async function handleAdd(input: { title: string; dueDate: string | null }) {
    if (busy) return;
    setBusy(true);
    const res = await addTask({
      assignee: activeFilter,
      title: input.title,
      dueDate: input.dueDate,
      createdBy: CURRENT_USER,
    });
    if (res.ok) {
      setItems((prev) => (prev ? [res.data, ...prev] : [res.data]));
      setAddOpen(false);
    } else {
      const local: Task = {
        id: `local-${Date.now()}`,
        assignee: activeFilter,
        title: input.title.trim(),
        dueDate: input.dueDate,
        doneAt: null,
        createdBy: CURRENT_USER,
        notes: undefined,
        createdAt: new Date().toISOString(),
      };
      setItems((prev) => (prev ? [local, ...prev] : [local]));
      setAddOpen(false);
    }
    setBusy(false);
  }

  const memberName = capitalize(activeFilter);
  const label = taskListLabel(activeFilter);

  return (
    <main
      className="relative mx-auto"
      style={{
        maxWidth: 393,
        minHeight: '100dvh',
        background: tokens.bg,
        color: '#FFFFFF',
        paddingBottom: 'calc(96px + env(safe-area-inset-bottom))',
      }}
    >
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(7,9,15,0.92)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          paddingTop: `calc(14px + env(safe-area-inset-top))`,
          paddingBottom: 8,
        }}
      >
        <div className="flex items-center justify-between px-4 pb-2">
          <Link
            href="/"
            className="text-[13px] text-white/65 no-underline"
            style={{ fontWeight: 600 }}
          >
            ← Back
          </Link>
          <span
            className="wordmark uppercase"
            style={{
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: '2px',
              lineHeight: 1,
            }}
          >
            {label.pluralUpper}
          </span>
          <span aria-hidden style={{ width: 36 }} />
        </div>
        <div className="px-4">
          <FamilyFilterChips active={activeFilter} onSelect={selectFilter} />
        </div>
      </header>

      <div className="px-4 pb-24 pt-4 flex flex-col gap-3">
        {addOpen ? (
          <AddTaskForm
            onSubmit={handleAdd}
            onClose={() => setAddOpen(false)}
            busy={busy}
            assignee={activeFilter}
            label={label}
          />
        ) : (
          <AddCta
            memberName={memberName}
            label={label}
            onTap={() => setAddOpen(true)}
            prominent={items !== null && open.length === 0 && done.length === 0}
          />
        )}

        {items === null ? (
          <div className="pt-10 text-center text-white/40">Loading…</div>
        ) : open.length === 0 && done.length === 0 ? (
          <EmptyHint />
        ) : (
          <>
            <Section label={`Open · ${open.length}`}>
              {open.length === 0 ? (
                <div className="text-[12px] text-white/40 py-2">
                  Nothing open for {memberName}. Nice.
                </div>
              ) : (
                open.map((t) => (
                  <TaskRow key={t.id} task={t} onToggle={() => handleToggle(t)} />
                ))
              )}
            </Section>

            {done.length > 0 && (
              <Section label={`Done · ${done.length}`}>
                {done.map((t) => (
                  <TaskRow key={t.id} task={t} onToggle={() => {}} />
                ))}
              </Section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

/* ─────────── add CTA + form ─────────── */

function AddCta({
  memberName,
  label,
  onTap,
  prominent,
}: {
  memberName: string;
  label: ReturnType<typeof taskListLabel>;
  onTap: () => void;
  prominent: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        impact('light');
        onTap();
      }}
      className="w-full flex items-center justify-center"
      style={{
        gap: 10,
        padding: prominent ? '22px 18px' : '15px 18px',
        marginTop: prominent ? 'clamp(40px, 18vh, 140px)' : 0,
        borderRadius: 18,
        background: 'rgba(15, 31, 56, 0.55)',
        border: `1px solid ${tokens.goldBorder}`,
        backdropFilter: 'blur(35px) saturate(1.1)',
        WebkitBackdropFilter: 'blur(35px) saturate(1.1)',
        boxShadow: '0 0 12px 2px rgba(196, 160, 80, 0.10)',
        color: tokens.gold,
        fontSize: prominent ? 15 : 14,
        fontWeight: 700,
        letterSpacing: '0.3px',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        transition: 'padding 220ms cubic-bezier(0.22, 1, 0.36, 1), margin 220ms ease',
      }}
      aria-label={label.addCta(memberName)}
    >
      <PlusGlyph size={prominent ? 24 : 20} />
      <span>{label.addCta(memberName)}</span>
    </button>
  );
}

function PlusGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
      <path
        d="M12 4v16M4 12h16"
        stroke={tokens.gold}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AddTaskForm({
  onSubmit,
  onClose,
  busy,
  assignee,
  label,
}: {
  onSubmit: (v: { title: string; dueDate: string | null }) => void;
  onClose: () => void;
  busy: boolean;
  assignee: FamilyMember;
  label: ReturnType<typeof taskListLabel>;
}) {
  const [title, setTitle] = useState('');
  const [due, setDue] = useState<'today' | 'tomorrow' | 'none'>('today');

  const canSubmit = title.trim().length > 0 && !busy;

  function submit() {
    if (!canSubmit) return;
    onSubmit({
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
      <div className="flex items-center justify-between mb-2">
        <div
          className="text-[10px] uppercase tracking-[1.2px]"
          style={{ color: familyColor(assignee), fontWeight: 700 }}
        >
          {`Adding ${label.singular} for ${capitalize(assignee)}`}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close add form"
          className="flex items-center justify-center"
          style={{
            width: 26,
            height: 26,
            padding: 0,
            background: 'rgba(255,255,255,0.06)',
            border: '0.5px solid rgba(255,255,255,0.18)',
            borderRadius: 999,
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path
              d="M2 2l8 8M10 2l-8 8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
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

function TaskRow({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: () => void;
}) {
  const done = task.doneAt !== null;
  const accent = familyColor(task.assignee);

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
        aria-label={done ? 'Completed' : `Mark ${task.title} done`}
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
            {task.title}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {task.dueDate && (
            <span
              className="text-[11px]"
              style={{
                color: dueColor(task.dueDate, done),
                fontWeight: 600,
              }}
            >
              {formatDue(task.dueDate)}
            </span>
          )}
          {task.notes && (
            <span className="text-[11px] text-white/50 truncate">
              {task.notes}
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

function EmptyHint() {
  return (
    <div className="pt-3 text-center">
      <div className="text-[11px] text-white/35">
        Or press-and-hold M to dictate.
      </div>
    </div>
  );
}

/* ─────────── helpers ─────────── */

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

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
