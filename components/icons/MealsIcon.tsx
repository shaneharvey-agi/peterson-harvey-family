// components/icons/MealsIcon.tsx
export function MealsIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <defs>
        <linearGradient id="goldBubble" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"  stopColor="#E8C574"/>
          <stop offset="60%" stopColor="#C4A050"/>
          <stop offset="100%" stopColor="#8C7338"/>
        </linearGradient>
        <linearGradient id="goldShadow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"  stopColor="#8C7338"/>
          <stop offset="100%" stopColor="#5C4B22"/>
        </linearGradient>
        <linearGradient id="navySpark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"  stopColor="#2D3954"/>
          <stop offset="100%" stopColor="#07090F"/>
        </linearGradient>
        <linearGradient id="playGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"  stopColor="#FFFFFF"/>
          <stop offset="100%" stopColor="#E8C574"/>
        </linearGradient>
      </defs>
      <ellipse cx="15" cy="27" rx="10" ry="1.5" fill="#07090F" opacity="0.5"/>
      <path d="M4 10 Q4 5 9 5 L23 5 Q28 5 28 10 L28 19 Q28 23 24 23 L14 23 L10 28 L10 23 Q4 23 4 19 Z" fill="url(#goldShadow)" transform="translate(1.2, 1.2)"/>
      <path d="M4 10 Q4 5 9 5 L23 5 Q28 5 28 10 L28 19 Q28 23 24 23 L14 23 L10 28 L10 23 Q4 23 4 19 Z" fill="url(#goldBubble)"/>
      <path d="M5.5 10 Q5.5 6.5 9 6.5 L23 6.5 Q26.5 6.5 26.5 10" stroke="rgba(255,240,200,0.6)" strokeWidth="0.8" fill="none"/>
      <path d="M12.5 9.5 L21 14 L12.5 18.5 Z" fill="url(#playGrad)" stroke="#8C7338" strokeWidth="0.4" strokeLinejoin="round"/>
      <g transform="translate(25, 2)">
        <circle cx="0" cy="0" r="5" fill="url(#navySpark)" stroke="#C4A050" strokeWidth="0.6"/>
        <path d="M0 -3 L0.8 -0.8 L3 0 L0.8 0.8 L0 3 L-0.8 0.8 L-3 0 L-0.8 -0.8 Z" fill="#C4A050"/>
        <circle cx="-1" cy="-1" r="0.6" fill="#FFFFFF" opacity="0.8"/>
      </g>
    </svg>
  );
}

export default MealsIcon;
