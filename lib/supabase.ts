import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Lazy client. Env vars may legitimately be absent at build time on
// Vercel preview branches; in that case we expose a stub whose method
// calls throw *only on use*, so the query layer's try/catch falls back
// to mock data and the build doesn't choke during prerender.

function buildClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    // Proxy stub: every property access throws. Query callers already
    // wrap Supabase calls in try/catch and fall back to mocks on error.
    return new Proxy({} as SupabaseClient, {
      get() {
        throw new Error(
          'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and ' +
            'NEXT_PUBLIC_SUPABASE_ANON_KEY to enable live data.',
        )
      },
    })
  }
  return createClient(url, anonKey, {
    realtime: {
      params: { eventsPerSecond: 10 },
    },
    db: { schema: 'public' },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export const supabase: SupabaseClient = buildClient()

// Database types
export interface Event {
  id: number
  title: string
  date: string
  time: string | null
  end_time: string | null
  who: string
  address: string
  notes: string
  created_at: string
}

export interface Todo {
  id: number
  text: string
  done: boolean
  cat: string
  created_at: string
}

export interface NotificationRow {
  id: number
  kind: string
  severity: string
  title: string
  body: string | null
  action_url: string | null
  action_label: string | null
  read_at: string | null
  created_at: string
}

export interface ChoreRow {
  id: number
  assignee: string
  title: string
  due_date: string | null
  done_at: string | null
  created_by: string | null
  notes: string | null
  created_at: string
}

export interface ChatMessageRow {
  id: number
  thread_key: string
  sender: string
  body: string
  read_at: string | null
  created_at: string
}

export interface MemoryRow {
  id: number
  author: string
  content: string
  source: string
  created_at: string
}

export interface TaskRow {
  id: number
  assignee: string
  title: string
  due_date: string | null
  done_at: string | null
  notes: string | null
  created_by: string | null
  created_at: string
}
