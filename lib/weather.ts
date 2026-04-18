// lib/weather.ts
// Open-Meteo integration (no API key required).
// Spec originally called for OpenWeatherMap; Steve approved swap to Open-Meteo.

export type WeatherCondition = 'clear' | 'cloudy' | 'rainy' | 'snowy';

export interface WeatherSnapshot {
  temp: number;             // integer Fahrenheit
  condition: WeatherCondition;
  ts: number;               // ms epoch
}

const CACHE_KEY = 'mikayla_weather_v1';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 min

// Lake Stevens, WA fallback
const FALLBACK_COORDS = { lat: 47.9746, lon: -122.0635 };

function mapWmoCode(code: number): WeatherCondition {
  if (code === 0 || code === 1) return 'clear';
  if (code === 2 || code === 3 || code === 45 || code === 48) return 'cloudy';
  if (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    (code >= 95 && code <= 99)
  ) {
    return 'rainy';
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snowy';
  return 'cloudy';
}

function readCache(): WeatherSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeatherSnapshot;
    if (!parsed || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(snap: WeatherSnapshot): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(snap));
  } catch {
    /* swallow */
  }
}

function getCoords(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve) => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.geolocation ||
      typeof navigator.geolocation.getCurrentPosition !== 'function'
    ) {
      resolve(FALLBACK_COORDS);
      return;
    }
    let settled = false;
    const done = (val: { lat: number; lon: number }) => {
      if (settled) return;
      settled = true;
      resolve(val);
    };
    // Hard timeout in case the browser hangs on the permission prompt
    const timer = setTimeout(() => done(FALLBACK_COORDS), 7000);
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timer);
          done({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        () => {
          clearTimeout(timer);
          done(FALLBACK_COORDS);
        },
        { timeout: 6000, maximumAge: 10 * 60 * 1000 }
      );
    } catch {
      clearTimeout(timer);
      done(FALLBACK_COORDS);
    }
  });
}

async function fetchOpenMeteo(
  lat: number,
  lon: number
): Promise<WeatherSnapshot> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code` +
    `&temperature_unit=fahrenheit`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`open-meteo ${res.status}`);
  const json = await res.json();
  const temp = Math.round(json?.current?.temperature_2m ?? NaN);
  const code = Number(json?.current?.weather_code ?? 0);
  if (!Number.isFinite(temp)) throw new Error('bad temp');
  return {
    temp,
    condition: mapWmoCode(code),
    ts: Date.now(),
  };
}

/**
 * Get current weather. Always resolves — never rejects.
 * Uses 15-min localStorage cache, geolocation with Lake Stevens fallback.
 * Returns null only if we somehow cannot produce any snapshot (shouldn't happen).
 */
export async function getWeather(): Promise<WeatherSnapshot | null> {
  const cached = readCache();
  if (cached) return cached;

  try {
    const { lat, lon } = await getCoords();
    const snap = await fetchOpenMeteo(lat, lon);
    writeCache(snap);
    return snap;
  } catch {
    // Silent fallback — try fallback coords once more if we never even tried
    try {
      const snap = await fetchOpenMeteo(FALLBACK_COORDS.lat, FALLBACK_COORDS.lon);
      writeCache(snap);
      return snap;
    } catch {
      return null;
    }
  }
}
