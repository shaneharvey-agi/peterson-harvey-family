'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { tokens, type FamilyMember, familyBg, familyColor, familyText } from '@/lib/design-tokens';
import { parseMemberFilter } from '@/lib/events/filter';

type AvatarMember = {
  member: FamilyMember;
  letter: string;
  unread?: number;
};

const DEFAULT_MEMBERS: AvatarMember[] = [
  { member: 'molly', letter: 'M', unread: 2 },
  { member: 'evey',  letter: 'E', unread: 1 },
  { member: 'jax',   letter: 'J', unread: 0 },
];

export function FamilyAvatars({ members = DEFAULT_MEMBERS }: { members?: AvatarMember[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = parseMemberFilter(searchParams?.get('who'));

  const toggleFilter = (member: FamilyMember) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (active === member) {
      params.delete('who');
    } else {
      params.set('who', member);
    }
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : '/', { scroll: false });
  };

  return (
    <div
      className="flex items-center"
      style={{ gap: 14, padding: '8px 0 12px' }}
    >
      {members.map(({ member, letter, unread = 0 }) => (
        <AvatarButton
          key={member}
          member={member}
          letter={letter}
          unread={unread}
          isActive={active === member}
          onToggle={() => toggleFilter(member)}
        />
      ))}
    </div>
  );
}

function AvatarButton({
  member,
  letter,
  unread,
  isActive,
  onToggle,
}: {
  member: FamilyMember;
  letter: string;
  unread: number;
  isActive: boolean;
  onToggle: () => void;
}) {
  const [photoOk, setPhotoOk] = useState(true);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={
        isActive
          ? `Showing only ${member}. Tap to show family.`
          : `Show only ${member}'s calendar`
      }
      aria-pressed={isActive}
      className="relative flex items-center justify-center"
      style={{
        width: 50,
        height: 50,
        padding: 0,
        background: 'transparent',
        border: 'none',
        opacity: isActive ? 1 : 0.92,
        transform: isActive ? 'scale(1.06)' : 'scale(1)',
        transition: 'transform 180ms ease, opacity 180ms ease',
      }}
    >
      <span
        className="flex items-center justify-center"
        style={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          background: familyBg(member),
          border: `${isActive ? 3.5 : 2.5}px solid ${familyColor(member)}`,
          overflow: 'hidden',
          boxShadow: isActive
            ? `0 0 0 2px ${tokens.bg}, 0 0 10px ${familyColor(member)}80`
            : 'none',
        }}
      >
        {photoOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/avatars/${member}.jpg`}
            alt=""
            onError={() => setPhotoOk(false)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            draggable={false}
          />
        ) : (
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: familyText(member),
              lineHeight: 1,
            }}
          >
            {letter}
          </span>
        )}
      </span>
      {unread > 0 && (
        <span
          className="pulse-red absolute flex items-center justify-center"
          style={{
            top: -2,
            right: -2,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: tokens.red,
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            border: `2px solid ${tokens.bg}`,
            lineHeight: 1,
          }}
        >
          {unread}
        </span>
      )}
    </button>
  );
}

export default FamilyAvatars;
