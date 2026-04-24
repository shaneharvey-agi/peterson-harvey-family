'use client';

import { useEffect, useState } from 'react';

/**
 * Streams the microphone's instantaneous RMS level as a 0–1 number.
 * Falls back to a gentle simulated pulse if the mic is denied or unavailable
 * (so the orb still feels alive on desktop/preview builds).
 */
export function useMicLevel(active: boolean): number {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!active) {
      setLevel(0);
      return;
    }

    let cancelled = false;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let raf: number | null = null;

    async function start() {
      try {
        if (
          typeof navigator === 'undefined' ||
          !navigator.mediaDevices?.getUserMedia
        ) {
          throw new Error('getUserMedia unsupported');
        }
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        ctx = new AudioCtx();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.75;
        src.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          if (cancelled) return;
          analyser.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          const avg = sum / data.length / 255;
          // Soft-knee curve so quiet room ≈ 0 and yelling ≈ 1
          const shaped = Math.min(1, Math.pow(avg * 1.8, 0.85));
          setLevel(shaped);
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        // Denied / unsupported — simulate a breathing baseline.
        const t0 = performance.now();
        const tick = () => {
          if (cancelled) return;
          const t = (performance.now() - t0) / 1000;
          setLevel(0.18 + 0.12 * (0.5 + 0.5 * Math.sin(t * 2.2)));
          raf = requestAnimationFrame(tick);
        };
        tick();
      }
    }

    start();

    return () => {
      cancelled = true;
      if (raf != null) cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (ctx) ctx.close().catch(() => {});
    };
  }, [active]);

  return level;
}

export default useMicLevel;
