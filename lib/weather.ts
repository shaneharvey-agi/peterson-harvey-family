// lib/weather.ts
// Open-Meteo integration (no API key required).
// Spec originally called for OpenWeatherMap; Steve approved swap to Open-Meteo.

export type WeatherCondition = 'clear' | 'cloudy' | 'rainy' | 'snowy';

export interface WeatherSnapshot {
  temp: number;             // integer Fahrenheit
  condition: WeatherCondition;
  ts: number;               // ms epoch
}

export interface WeatherDay {
  date: string;             // YYYY-MM-DD
  high: number;             // integer Fahrenheit
  low: number;              // integer Fahrenheit
  condition: WeatherCondition;
  precipChance: number;     // 0-100
}

export interface WeatherForecast {
  days: WeatherDay[];
  ts: number;
}

const CACHE_KEY = 'mikayla_weather_v1';
const FORECAST_CACHE_KEY = 'mikayla_weather_forecast_v1';
const CACHE_TTL_MS = 15 * 60 * 1000;       // 15 min for current
const FORECAST_TTL_MS = 60 * 60 * 1000;    // 1 hour for the 14-day strip

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

/* ─────────── 14-day forecast ─────────── */

function readForecastCache(): WeatherForecast | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(FORECAST_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeatherForecast;
    if (!parsed || typeof parsed.ts !== 'number' || !Array.isArray(parsed.days)) return null;
    if (Date.now() - parsed.ts > FORECAST_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeForecastCache(forecast: WeatherForecast): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FORECAST_CACHE_KEY, JSON.stringify(forecast));
  } catch {
    /* swallow */
  }
}

async function fetchOpenMeteoForecast(
  lat: number,
  lon: number,
  days: number,
): Promise<WeatherForecast> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max` +
    `&temperature_unit=fahrenheit` +
    `&forecast_days=${days}` +
    `&timezone=auto`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`open-meteo forecast ${res.status}`);
  const json = await res.json();
  const dates: string[] = json?.daily?.time ?? [];
  const highs: number[] = json?.daily?.temperature_2m_max ?? [];
  const lows: number[] = json?.daily?.temperature_2m_min ?? [];
  const codes: number[] = json?.daily?.weather_code ?? [];
  const precip: number[] = json?.daily?.precipitation_probability_max ?? [];
  if (!dates.length) throw new Error('empty forecast');

  const out: WeatherDay[] = dates.map((d, i) => ({
    date: d,
    high: Math.round(highs[i] ?? NaN),
    low: Math.round(lows[i] ?? NaN),
    condition: mapWmoCode(Number(codes[i] ?? 0)),
    precipChance: Math.max(0, Math.min(100, Math.round(precip[i] ?? 0))),
  }));
  return { days: out, ts: Date.now() };
}

/**
 * Get a multi-day daily forecast. Always resolves — never rejects.
 * Uses 1-hour cache. Falls back to Lake Stevens coords on geo failure.
 * Returns null only if both attempts fail.
 */
export async function getForecast(days = 14): Promise<WeatherForecast | null> {
  const cached = readForecastCache();
  if (cached && cached.days.length >= days) {
    return { days: cached.days.slice(0, days), ts: cached.ts };
  }

  try {
    const { lat, lon } = await getCoords();
    const forecast = await fetchOpenMeteoForecast(lat, lon, days);
    writeForecastCache(forecast);
    return forecast;
  } catch {
    try {
      const forecast = await fetchOpenMeteoForecast(
        FALLBACK_COORDS.lat,
        FALLBACK_COORDS.lon,
        days,
      );
      writeForecastCache(forecast);
      return forecast;
    } catch {
      return null;
    }
  }
}
