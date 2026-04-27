// iOS PWA launch splash. iOS shows this static PNG between the user
// tapping the home-screen icon and the WebView finishing first paint —
// without it, iOS shows its default white screen for ~1-2 seconds
// before our Cold Boot can render. Each registered apple-touch-startup-
// image media query needs an exact-pixel match, so this route serves a
// navy PNG with the gold M centered at any (width, height) pair.

import { ImageResponse } from 'next/og';
import { loadOrbIconFonts, renderOrbIcon } from '@/lib/orb-icon';

export const runtime = 'edge';

const MAX_DIM = 4000;

interface Ctx {
  params: { width: string; height: string };
}

export async function GET(_req: Request, { params }: Ctx) {
  const w = clampDim(params.width, 1290);
  const h = clampDim(params.height, 2796);

  // Icon scaled to ~22% of the shorter device dimension. Lands the
  // M roughly where Cold Boot draws its signature, so the handoff
  // from static splash → live splash doesn't visibly jump.
  const iconSize = Math.round(Math.min(w, h) * 0.22);
  const fonts = await loadOrbIconFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#07090F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: iconSize, height: iconSize, display: 'flex' }}>
          {renderOrbIcon(iconSize)}
        </div>
      </div>
    ),
    { width: w, height: h, fonts },
  );
}

function clampDim(raw: string | undefined, fallback: number): number {
  const n = parseInt(raw ?? '', 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.max(320, Math.min(MAX_DIM, n));
}
