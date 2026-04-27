'use client';

import { tokens, type FamilyMember, familyColor } from '@/lib/design-tokens';
import { impact } from '@/lib/haptics';

const CHIPS: { member: FamilyMember; label: string }[] = [
  { member: 'shane', label: 'Shane' },
  { member: 'molly', label: 'Molly' },
  { member: 'jax', label: 'Jax' },
  { member: 'evey', label: 'Evey' },
];

interface Props {
  active: FamilyMember;
  onSelect: (m: FamilyMember) => void;
}

/**
 * Horizontal Liquid Glass filter bar — one pill per family member,
 * each showing the avatar photo + first name. Active pill picks up the
 * navy-frost background, gold border and soft gold glow from the 2026
 * Executive Shell vocabulary.
 */
export function FamilyFilterChips({ active, onSelect }: Props) {
  return (
    <div
      className="-mx-4"
      style={{
        overflowX: 'auto',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        touchAction: 'pan-x',
      }}
      role="tablist"
      aria-label="Filter chores by family member"
    >
      <div
        className="flex items-center px-4"
        style={{ gap: 8, width: 'max-content', paddingTop: 4, paddingBottom: 6 }}
      >
        {CHIPS.map(({ member, label }) => (
          <FilterChip
            key={member}
            member={member}
            label={label}
            active={active === member}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  member,
  label,
  active,
  onSelect,
}: {
  member: FamilyMember;
  label: string;
  active: boolean;
  onSelect: (m: FamilyMember) => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => {
        if (!active) impact('light');
        onSelect(member);
      }}
      className="flex items-center"
      style={{
        gap: 8,
        padding: '5px 14px 5px 5px',
        borderRadius: 999,
        background: active
          ? 'rgba(15, 31, 56, 0.55)'
          : 'rgba(255, 255, 255, 0.06)',
        border: `0.5px solid ${tokens.gold}`,
        backdropFilter: 'blur(35px) saturate(1.1)',
        WebkitBackdropFilter: 'blur(35px) saturate(1.1)',
        boxShadow: active
          ? '0 0 12px 2px rgba(196, 160, 80, 0.10)'
          : 'none',
        color: active ? tokens.gold : 'rgba(255, 255, 255, 0.78)',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.3px',
        opacity: active ? 1 : 0.78,
        transition:
          'background 200ms ease, color 200ms ease, box-shadow 200ms ease, opacity 200ms ease',
        whiteSpace: 'nowrap',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          overflow: 'hidden',
          border: `1px solid ${familyColor(member)}`,
          flexShrink: 0,
          display: 'block',
        }}
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/avatars/${member}.jpg`}
          alt=""
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </span>
      {label}
    </button>
  );
}

export default FamilyFilterChips;
