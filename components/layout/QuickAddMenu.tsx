'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { tokens } from '@/lib/design-tokens';

const GLASS_GOLD = '#C5A059';
const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

type MenuItemKey =
  | 'brainDump'
  | 'scanDoc'
  | 'findDinner'
  | 'recordMeal'
  | 'familyTask'
  | 'more';

type MenuItem = {
  key: MenuItemKey;
  label: string;
  href: string;
  icon: React.ReactNode;
};

const ITEMS: MenuItem[] = [
  { key: 'brainDump',  label: 'Brain Dump',  href: '/chat/mikayla',       icon: <BrainDumpIcon /> },
  { key: 'scanDoc',    label: 'Scan Doc',    href: '/scan',               icon: <ScanDocIcon /> },
  { key: 'findDinner', label: 'Find Dinner', href: '/dinner',             icon: <FindDinnerIcon /> },
  { key: 'recordMeal', label: 'Record Meal', href: '/meals/record',       icon: <RecordMealIcon /> },
  { key: 'familyTask', label: 'Family Task', href: '/chores?add=1',       icon: <FamilyTaskIcon /> },
  { key: 'more',       label: 'More...',     href: '/more',               icon: <MoreIcon /> },
];

type Phase = 'opening' | 'open' | 'closing';

export function QuickAddMenu({
  open,
  onClose,
  activeKey,
}: {
  open: boolean;
  onClose: () => void;
  activeKey?: MenuItemKey;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('opening');

  useEffect(() => {
    if (!open) return;
    setPhase('opening');
    const raf = requestAnimationFrame(() => setPhase('open'));
    return () => cancelAnimationFrame(raf);
  }, [open]);

  if (!open) return null;

  const implode = (href: string) => {
    setPhase('closing');
    window.setTimeout(() => {
      onClose();
      router.push(href);
    }, 180);
  };

  const handleBackdrop = () => {
    setPhase('closing');
    window.setTimeout(onClose, 160);
  };

  const scale   = phase === 'open' ? 1 : phase === 'closing' ? 0.2 : 0.05;
  const opacity = phase === 'open' ? 1 : phase === 'closing' ? 0   : 0;
  const translateY = phase === 'open' ? 0 : phase === 'closing' ? -8 : -4;

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Quick add">
      {/* Backdrop — tap outside to dismiss */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={handleBackdrop}
        className="absolute inset-0"
        style={{
          background: phase === 'open' ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0)',
          backdropFilter: phase === 'open' ? 'blur(2px)' : 'blur(0px)',
          WebkitBackdropFilter: phase === 'open' ? 'blur(2px)' : 'blur(0px)',
          border: 'none',
          padding: 0,
          transition: 'background 180ms ease, backdrop-filter 180ms ease',
        }}
      />

      {/* Popover — anchored under the top-right "+" */}
      <div
        className={phase === 'opening' ? 'quickadd-glow' : ''}
        style={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top) + 52px)',
          right: 10,
          width: 248,
          transformOrigin: 'top right',
          transform: `translateY(${translateY}px) scale(${scale})`,
          opacity,
          transition:
            phase === 'closing'
              ? 'transform 180ms cubic-bezier(0.4, 0, 1, 1), opacity 160ms ease'
              : `transform 360ms ${SPRING}, opacity 220ms ease`,
          background: 'rgba(10, 25, 47, 0.75)',
          backdropFilter: 'blur(25px) saturate(150%)',
          WebkitBackdropFilter: 'blur(25px) saturate(150%)',
          border: `0.5px solid ${GLASS_GOLD}`,
          borderRadius: 18,
          padding: '10px 10px 12px',
          boxShadow:
            '0 18px 42px rgba(0,0,0,0.55), 0 0 0 1px rgba(197,160,89,0.10) inset',
        }}
      >
        {/* Header: Mikayla lockup */}
        <div
          className="flex items-center gap-2"
          style={{ padding: '6px 6px 8px' }}
        >
          <span
            className="flex items-center justify-center shrink-0"
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              border: `1px solid ${GLASS_GOLD}`,
              color: GLASS_GOLD,
              fontSize: 12,
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            M
          </span>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: 0.2,
            }}
          >
            Mikayla.ai
          </span>
          <SparkleCluster />
        </div>

        <div style={{ height: 1, background: 'rgba(197,160,89,0.18)', margin: '0 2px 6px' }} />

        {/* Items */}
        <ul className="flex flex-col" style={{ gap: 2 }}>
          {ITEMS.map((item) => {
            const active = item.key === activeKey;
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => implode(item.href)}
                  className="flex items-center w-full text-left"
                  style={{
                    gap: 12,
                    padding: '10px 10px',
                    borderRadius: 12,
                    background: 'transparent',
                    border: active
                      ? `1px solid ${GLASS_GOLD}`
                      : '1px solid transparent',
                    color: '#FFFFFF',
                    boxShadow: active
                      ? `0 0 0 1px rgba(197,160,89,0.25), 0 0 14px rgba(197,160,89,0.18)`
                      : 'none',
                    transition: 'background 140ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = 'rgba(197,160,89,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span
                    className="flex items-center justify-center shrink-0"
                    style={{ width: 22, height: 22, color: GLASS_GOLD }}
                    aria-hidden
                  >
                    {item.icon}
                  </span>
                  <span
                    className="flex-1"
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      letterSpacing: 0.1,
                      color: '#FFFFFF',
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    aria-hidden
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: GLASS_GOLD,
                      boxShadow: `0 0 6px rgba(197,160,89,0.7)`,
                    }}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function SparkleCluster() {
  return (
    <span className="inline-flex ml-auto" style={{ gap: 2, opacity: 0.8 }} aria-hidden>
      <Sparkle size={6} />
      <Sparkle size={4} />
      <Sparkle size={5} />
    </span>
  );
}

function Sparkle({ size }: { size: number }) {
  return (
    <svg width={size * 2} height={size * 2} viewBox="0 0 12 12" fill="none">
      <path
        d="M6 0.5l1.2 3.3L10.5 5 7.2 6.2 6 9.5 4.8 6.2 1.5 5l3.3-1.2L6 0.5z"
        fill={GLASS_GOLD}
        opacity="0.9"
      />
    </svg>
  );
}

/* ── Gold line icons ── */

function BrainDumpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="6" r="1.6" />
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
      <circle cx="8" cy="18" r="1.6" />
      <circle cx="16" cy="18" r="1.6" />
      <path d="M12 7.6v2.8M10.6 7l-4 4M13.4 7l4 4M6 13.4L7.2 16.8M18 13.4l-1.2 3.4M9.2 18.6h5.6" />
    </svg>
  );
}

function ScanDocIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h8l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M14 3v4h4" />
      <circle cx="12" cy="14" r="2.6" />
      <path d="M9.5 11.5h.01M15 11.5h.01" />
    </svg>
  );
}

function FindDinnerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3v8M5 3v5a2 2 0 0 0 2 2M9 3v5a2 2 0 0 1-2 2M7 11v10" />
      <path d="M17 14c0 3-3 6-3 6s-3-3-3-6a3 3 0 0 1 6 0z" />
      <circle cx="14" cy="14" r="1" />
    </svg>
  );
}

function RecordMealIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13.5" r="3.2" />
      <path d="M19 6.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6L19 6.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FamilyTaskIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2.4" />
      <circle cx="16" cy="8.5" r="2" />
      <path d="M3.5 18c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" />
      <path d="M13 18c0-2 1.5-3.7 3.5-4.2" />
      <path d="M17 16.5l1.4 1.4L21 15.3" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="6" cy="14" r="1.3" fill="currentColor" />
      <circle cx="11" cy="14" r="1.3" fill="currentColor" />
      <circle cx="16" cy="14" r="1.3" fill="currentColor" />
      <path
        d="M19.5 6.5l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5L17.4 8.6l1.5-.6L19.5 6.5z"
        fill="currentColor"
      />
    </svg>
  );
}

export default QuickAddMenu;
