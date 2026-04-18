'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchTonightDinner, type DinnerPlan } from '@/lib/queries/dinner';

export function DinnerCard() {
  const [plan, setPlan] = useState<DinnerPlan | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const p = await fetchTonightDinner();
      if (!alive) return;
      setPlan(p);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!plan) {
    return <div className="h-[120px] rounded-xl bg-white/5" aria-hidden />;
  }

  return (
    <Link
      href={`/meals/recipe/${plan.recipeId}`}
      prefetch={false}
      className="dinner-card-root block relative h-[120px] w-full overflow-hidden rounded-xl"
      aria-label={`Dinner: ${plan.recipeName}`}
    >
      {/* Hero image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={plan.imageUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      {/* Bottom gradient for legibility */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-3/4"
        style={{
          background:
            'linear-gradient(180deg, rgba(7,9,15,0) 0%, rgba(7,9,15,0.55) 55%, rgba(7,9,15,0.92) 100%)',
        }}
      />

      {/* Text + play */}
      <div className="absolute inset-0 flex items-end justify-between p-3">
        <div className="min-w-0 pr-2">
          <div
            className="text-[10px] font-extrabold tracking-[1px]"
            style={{ color: '#C4A050' }}
          >
            DINNER · {plan.cookTime.toUpperCase()}
          </div>
          <div className="text-[15px] font-bold text-white leading-tight mt-0.5 truncate">
            {plan.recipeName}
          </div>
        </div>

        <span
          aria-hidden
          className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full"
          style={{
            background: '#C4A050',
            boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
          }}
        >
          <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden>
            <path d="M0 0 L10 6 L0 12 Z" fill="#07090F" />
          </svg>
        </span>
      </div>

      {/* Gold pulse border */}
      <span
        aria-hidden
        className="dinner-card-border pointer-events-none absolute inset-0 rounded-xl"
      />

      <style jsx>{`
        .dinner-card-border {
          border: 1.5px solid rgba(196, 160, 80, 0.75);
          animation: dinnerPulse 2.5s ease-in-out infinite;
        }
        @keyframes dinnerPulse {
          0%,
          100% {
            border-color: rgba(196, 160, 80, 0.4);
            box-shadow: 0 0 0 0 rgba(196, 160, 80, 0);
          }
          50% {
            border-color: rgba(196, 160, 80, 0.75);
            box-shadow: 0 0 14px rgba(196, 160, 80, 0.35);
          }
        }
      `}</style>
    </Link>
  );
}
