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

export interface ShoppingItem {
  id: number
  text: string
  done: boolean
  cat: string
  created_at: string
}

export interface Priority {
  id: number
  text: string
  done: boolean
  sort_order: number
  created_at: string
}

export interface Weekly {
  id: number
  text: string
  done: boolean
  sort_order: number
  created_at: string
}

export interface Recipe {
  id: number
  name: string
  type: string
  photo: string
  emoji: string
  ingredients: string[]
  instructions: string
  phone: string
  menu: string
  opentable: string
  created_at: string
}

export interface DinnerPlan {
  id: number
  date: string
  recipe_id: number | null
  created_at: string
}

export interface PantryItem {
  id: number
  recipe_id: number
  ingredient_index: number
  have: boolean
  created_at: string
}
