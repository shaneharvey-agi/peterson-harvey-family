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
