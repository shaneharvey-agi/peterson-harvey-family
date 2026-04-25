/**
 * Tiny haptics helpers. `navigator.vibrate` is iOS-Safari-no-op (Apple disallows
 * it from the web), but Android Chrome + PWAs honor it. We keep the shapes
 * consistent so when we wrap this in a native haptic bridge later, the call
 * sites don't change.
 */

function vibrate(pattern: number | number[]): void {
  if (typeof navigator === 'undefined') return;
  if (typeof (navigator as Navigator).vibrate !== 'function') return;
  try {
    (navigator as Navigator).vibrate(pattern);
  } catch {
    /* swallow — older browsers throw on some patterns */
  }
}

/** "Soft Bloom" — when the voice orb rises from the M button. */
export function softBloom(): void {
  vibrate([8, 24, 14]);
}

/** "Pulse" — a brief tap that mirrors AI speaking cadence. */
export function pulseHaptic(): void {
  vibrate(6);
}

/** Single quick tick — used when long-press threshold is met. */
export function tick(): void {
  vibrate(4);
}

/**
 * iOS UIImpactFeedbackGenerator-style impact tap. Maps to scaled vibrate
 * durations so the call site reads the same as native Swift code; the
 * actual feel is best-effort on browsers (Android Chrome + PWAs honor;
 * iOS-Safari is a no-op until we wrap this in a Capacitor bridge).
 */
export type ImpactLevel = 'light' | 'medium' | 'heavy';

const IMPACT_MS: Record<ImpactLevel, number> = {
  light: 6,
  medium: 12,
  heavy: 22,
};

export function impact(level: ImpactLevel = 'medium'): void {
  vibrate(IMPACT_MS[level]);
}

/**
 * "Flutter" — three short 15ms pulses with brief gaps. Mirrors the
 * flag-wave gesture the M signature performs on activation.
 */
export function flutter(): void {
  vibrate([15, 55, 15, 55, 15]);
}
