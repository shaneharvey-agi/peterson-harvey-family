'use client';

import { useState } from 'react';
import { tokens, type FamilyMember, familyBg, familyColor, familyText } from '@/lib/design-tokens';

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
        />
      ))}
    </div>
  );
}

function AvatarButton({
  member,
  letter,
  unread,
}: {
  member: FamilyMember;
  letter: string;
  unread: number;
}) {
  const [photoOk, setPhotoOk] = useState(true);

  return (
    <button
      type="button"
      aria-label={`${member} messages`}
      className="relative flex items-center justify-center"
      style={{
        width: 50,
        height: 50,
        padding: 0,
        background: 'transparent',
        border: 'none',
      }}
    >
      <span
        className="flex items-center justify-center"
        style={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          background: familyBg(member),
          border: `2.5px solid ${familyColor(member)}`,
          overflow: 'hidden',
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
