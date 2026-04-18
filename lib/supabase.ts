import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: { eventsPerSecond: 10 },
  },
  db: { schema: 'public' },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

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
