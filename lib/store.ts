import { supabase, Event, Todo, ShoppingItem, Priority, Weekly, Recipe, DinnerPlan, PantryItem } from './supabase'

export type SyncStatus = 'online' | 'offline' | 'syncing'

export interface AppState {
  events: Event[]
  todos: Todo[]
  shopping: ShoppingItem[]
  priorities: Priority[]
  weeklys: Weekly[]
  recipes: Recipe[]
  dinnerPlan: Record<string, number | null>
  pantry: Record<number, Record<number, boolean>>
  syncStatus: SyncStatus
}

// ── LOAD FUNCTIONS ──

export async function loadEvents(): Promise<Event[]> {
  const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true })
  if (error) throw error
  return data || []
}

export async function loadTodos(): Promise<Todo[]> {
  const { data, error } = await supabase.from('todos').select('*').order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function loadShopping(): Promise<ShoppingItem[]> {
  const { data, error } = await supabase.from('shopping').select('*').order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function loadPriorities(): Promise<Priority[]> {
  const { data, error } = await supabase.from('priorities').select('*').order('sort_order', { ascending: true })
  if (error) throw error
  return data || []
}

export async function loadWeeklys(): Promise<Weekly[]> {
  const { data, error } = await supabase.from('weeklys').select('*').order('sort_order', { ascending: true })
  if (error) throw error
  return data || []
}

export async function loadRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase.from('recipes').select('*').order('name', { ascending: true })
  if (error) throw error
  return data || []
}

export async function loadDinnerPlan(): Promise<Record<string, number | null>> {
  const { data, error } = await supabase.from('dinner_plan').select('*')
  if (error) throw error
  const plan: Record<string, number | null> = {}
  ;(data || []).forEach((r: DinnerPlan) => { plan[r.date] = r.recipe_id })
  return plan
}

export async function loadPantry(): Promise<Record<number, Record<number, boolean>>> {
  const { data, error } = await supabase.from('pantry').select('*')
  if (error) throw error
  const p: Record<number, Record<number, boolean>> = {}
  ;(data || []).forEach((r: PantryItem) => {
    if (!p[r.recipe_id]) p[r.recipe_id] = {}
    p[r.recipe_id][r.ingredient_index] = r.have
  })
  return p
}

export async function loadAllData(): Promise<Omit<AppState, 'syncStatus'>> {
  const [events, todos, shopping, priorities, weeklys, recipes, dinnerPlan, pantry] =
    await Promise.all([
      loadEvents(),
      loadTodos(),
      loadShopping(),
      loadPriorities(),
      loadWeeklys(),
      loadRecipes(),
      loadDinnerPlan(),
      loadPantry(),
    ])
  return { events, todos, shopping, priorities, weeklys, recipes, dinnerPlan, pantry }
}

// ── CRUD OPERATIONS ──

export async function saveEvent(ev: Partial<Event>, editingId: number | null) {
  if (editingId) {
    const { error } = await supabase.from('events').update(ev).eq('id', editingId)
    if (error) throw error
  } else {
    const { error } = await supabase.from('events').insert(ev)
    if (error) throw error
  }
}

export async function deleteEvent(id: number) {
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
}

export async function addTodo(text: string) {
  const { error } = await supabase.from('todos').insert({ text, done: false, cat: 'personal' })
  if (error) throw error
}

export async function toggleTodo(id: number, done: boolean) {
  const { error } = await supabase.from('todos').update({ done: !done }).eq('id', id)
  if (error) throw error
}

export async function addShoppingItem(text: string) {
  const { error } = await supabase.from('shopping').insert({ text, done: false, cat: 'Groceries' })
  if (error) throw error
}

export async function toggleShoppingItem(id: number, done: boolean) {
  const { error } = await supabase.from('shopping').update({ done: !done }).eq('id', id)
  if (error) throw error
}

export async function togglePriority(id: number, done: boolean) {
  const { error } = await supabase.from('priorities').update({ done: !done }).eq('id', id)
  if (error) throw error
}

export async function addPriority(text: string, currentPriorities: Priority[]) {
  const maxOrder = currentPriorities.reduce((m, p) => Math.max(m, p.sort_order || 0), 0)
  const { error } = await supabase.from('priorities').insert({ text, done: false, sort_order: maxOrder + 1 })
  if (error) throw error
}

export async function toggleWeekly(id: number, done: boolean) {
  const { error } = await supabase.from('weeklys').update({ done: !done }).eq('id', id)
  if (error) throw error
}

export async function addWeekly(text: string, currentWeeklys: Weekly[]) {
  const maxOrder = currentWeeklys.reduce((m, w) => Math.max(m, w.sort_order || 0), 0)
  const { error } = await supabase.from('weeklys').insert({ text, done: false, sort_order: maxOrder + 1 })
  if (error) throw error
}

export async function saveDinnerPlan(tempPlan: Record<string, number | null>, weekDates: string[]) {
  for (const ds of weekDates) {
    const rid = tempPlan[ds]
    const existing = await supabase.from('dinner_plan').select('id').eq('date', ds).single()
    // PGRST116 = row not found, which is expected
    if (existing.error && existing.error.code !== 'PGRST116') {
      throw existing.error
    }
    if (existing.data) {
      if (rid) {
        const { error } = await supabase.from('dinner_plan').update({ recipe_id: rid }).eq('date', ds)
        if (error) throw error
      } else {
        const { error } = await supabase.from('dinner_plan').delete().eq('date', ds)
        if (error) throw error
      }
    } else if (rid) {
      const { error } = await supabase.from('dinner_plan').insert({ date: ds, recipe_id: rid })
      if (error) throw error
    }
  }
}

export async function saveRecipe(r: Partial<Recipe>, editingId: number | null) {
  if (editingId) {
    const { error } = await supabase.from('recipes').update(r).eq('id', editingId)
    if (error) throw error
  } else {
    const { error } = await supabase.from('recipes').insert(r)
    if (error) throw error
  }
}

export async function deleteRecipe(id: number) {
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) throw error
}

export async function togglePantryItem(recipeId: number, idx: number, current: boolean) {
  const existing = await supabase.from('pantry').select('id').eq('recipe_id', recipeId).eq('ingredient_index', idx).single()
  // PGRST116 = row not found, which is expected
  if (existing.error && existing.error.code !== 'PGRST116') {
    throw existing.error
  }
  if (existing.data) {
    const { error } = await supabase.from('pantry').update({ have: !current }).eq('id', existing.data.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('pantry').insert({ recipe_id: recipeId, ingredient_index: idx, have: true })
    if (error) throw error
  }
}

export async function addMissingToShopping(recipeId: number, recipes: Recipe[], pantry: Record<number, Record<number, boolean>>, shopping: ShoppingItem[]) {
  const r = recipes.find(x => x.id === recipeId)
  if (!r) return 0
  const p = pantry[recipeId] || {}
  const missing = r.ingredients.filter((_, i) => !p[i])
  for (const ing of missing) {
    if (!shopping.find(s => s.text.toLowerCase() === ing.toLowerCase())) {
      const { error } = await supabase.from('shopping').insert({ text: ing, done: false, cat: 'Groceries' })
      if (error) throw error
    }
  }
  return missing.length
}

// ── REALTIME SUBSCRIPTION ──

export function subscribeToChanges(onUpdate: (table: string) => void): () => void {
  let cancelled = false
  let currentChannel = supabase.channel('phfc-realtime-v2', {
    config: { broadcast: { self: true } },
  })

  const tables = ['events', 'todos', 'shopping', 'priorities', 'weeklys', 'dinner_plan', 'recipes']

  function setupChannel(channel: ReturnType<typeof supabase.channel>) {
    tables.forEach(table => {
      channel.on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table },
        () => {
          console.log(`[Realtime] ${table} changed`)
          onUpdate(table)
        }
      )
    })

    channel.subscribe((status: string, err?: Error) => {
      if (cancelled) return
      console.log('Supabase realtime status:', status, err || '')
      if (status === 'SUBSCRIBED') {
        console.log('Realtime connected!')
        onUpdate('__connected')
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        if (status === 'CHANNEL_ERROR') console.error('Realtime error:', err)
        onUpdate('__error')
        // Retry: unsubscribe old, create fresh channel
        setTimeout(() => {
          if (cancelled) return
          channel.unsubscribe()
          currentChannel = supabase.channel('phfc-realtime-v2-' + Date.now(), {
            config: { broadcast: { self: true } },
          })
          setupChannel(currentChannel)
        }, 5000)
      } else if (status === 'CLOSED') {
        onUpdate('__error')
      }
    })
  }

  setupChannel(currentChannel)

  return () => {
    cancelled = true
    currentChannel.unsubscribe()
  }
}
