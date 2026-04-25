/**
 * Thin wrapper around the Web Speech API (`SpeechRecognition` /
 * `webkitSpeechRecognition`). Phase C of the Active Bloom: we capture
 * speech locally in the browser while the user holds an avatar, and
 * surface interim + final transcripts via callbacks.
 *
 * iOS Safari (14.5+) supports `webkitSpeechRecognition` but ships its own
 * quirks (auto-stops after silence, requires user gesture). The wrapper
 * falls back to a no-op when the API is missing so the rest of the UI
 * still works.
 */

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

type Ctor = new () => SpeechRecognitionLike;

function getCtor(): Ctor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: Ctor;
    webkitSpeechRecognition?: Ctor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechSupported(): boolean {
  return getCtor() !== null;
}

export interface SpeechSession {
  /** Stop capture. Calls onFinal one last time with whatever's accumulated. */
  stop: () => void;
  /** Hard cancel — no final callback fires. */
  abort: () => void;
}

interface SpeechOptions {
  onInterim?: (text: string) => void;
  onFinal?: (text: string) => void;
  onError?: (kind: string) => void;
  lang?: string;
}

export function startSpeech(opts: SpeechOptions = {}): SpeechSession | null {
  const Ctor = getCtor();
  if (!Ctor) {
    opts.onError?.('unsupported');
    return null;
  }

  const recog = new Ctor();
  recog.continuous = true;
  recog.interimResults = true;
  recog.lang = opts.lang ?? 'en-US';

  let finalText = '';
  let stopped = false;

  recog.onresult = (event: any) => {
    let interim = '';
    for (let i = event.resultIndex ?? 0; i < event.results.length; i += 1) {
      const result = event.results[i];
      const piece = result[0]?.transcript ?? '';
      if (result.isFinal) {
        finalText = `${finalText} ${piece}`.trim();
      } else {
        interim += piece;
      }
    }
    const display = `${finalText} ${interim}`.trim();
    opts.onInterim?.(display);
  };

  recog.onerror = (event: any) => {
    opts.onError?.(String(event?.error ?? 'unknown'));
  };

  recog.onend = () => {
    if (stopped) return;
    // iOS Safari auto-ends on silence — emit whatever we have so the UI
    // can hand off to intent classification even if the user is still
    // technically holding.
    opts.onFinal?.(finalText);
  };

  try {
    recog.start();
  } catch (err) {
    opts.onError?.('start_failed');
    return null;
  }

  return {
    stop: () => {
      stopped = true;
      try {
        recog.stop();
      } catch {
        /* ignore */
      }
      opts.onFinal?.(finalText);
    },
    abort: () => {
      stopped = true;
      try {
        recog.abort();
      } catch {
        /* ignore */
      }
    },
  };
}
