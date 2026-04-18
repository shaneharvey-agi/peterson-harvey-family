'use client';

import { tokens } from '@/lib/design-tokens';
import { MOrb } from '@/components/icons/MOrb';
import { MealsIcon } from '@/components/icons/MealsIcon';

type Tab = 'home' | 'todo' | 'kitchen' | 'meals';

export function BottomNav({ active = 'home' }: { active?: Tab }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-10"
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        background: 'rgba(7, 9, 15, 0.95)',
        borderTop: '0.5px solid rgba(196, 160, 80, 0.15)',
        padding: '8px 14px 20px',
        paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex items-end justify-between">
        <NavItem label="Home" active={active === 'home'} icon={<HomeIcon active={active === 'home'} />} />
        <NavItem label="To Do" active={active === 'todo'} icon={<TodoIcon active={active === 'todo'} />} />
        <div className="flex flex-col items-center" style={{ width: 56 }}>
          <MOrb />
        </div>
        <NavItem label="Kitchen" active={active === 'kitchen'} icon={<KitchenIcon active={active === 'kitchen'} />} />
        <NavItem label="Meals" active={active === 'meals'} icon={<MealsIcon size={28} />} />
      </div>
    </nav>
  );
}

function NavItem({
  label,
  active,
  icon,
}: {
  label: string;
  active: boolean;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="flex flex-col items-center"
      style={{
        gap: 4,
        background: 'transparent',
        border: 'none',
        padding: '4px 6px',
        color: active ? tokens.gold : 'rgba(255, 255, 255, 0.55)',
        minWidth: 48,
      }}
    >
      <span style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </span>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.2, lineHeight: 1 }}>
        {label}
      </span>
    </button>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  const stroke = active ? tokens.gold : 'rgba(255,255,255,0.55)';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-6h-6v6H5a2 2 0 0 1-2-2v-9z"
        stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function TodoIcon({ active }: { active: boolean }) {
  const stroke = active ? tokens.gold : 'rgba(255,255,255,0.55)';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="3" stroke={stroke} strokeWidth="1.8" />
      <path d="M8 12l3 3 5-6" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function KitchenIcon({ active }: { active: boolean }) {
  const stroke = active ? tokens.gold : 'rgba(255,255,255,0.55)';
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="3" width="14" height="18" rx="2" stroke={stroke} strokeWidth="1.8" />
      <path d="M5 9h14" stroke={stroke} strokeWidth="1.8" />
      <circle cx="9" cy="6" r="0.8" fill={stroke} />
      <circle cx="9" cy="14" r="0.8" fill={stroke} />
    </svg>
  );
}

export default BottomNav;
