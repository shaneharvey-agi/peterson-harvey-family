import { supabase, Event, Todo } from './supabase'

export type SyncStatus = 'online' | 'offline' | 'syncing'

export interface AppState {
  events: Event[]
  todos: Todo[]
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

export async function loadAllData(): Promise<Omit<AppState, 'syncStatus'>> {
  const [events, todos] = await Promise.all([
    loadEvents(),
    loadTodos(),
  ])
  return { events, todos }
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

// ── REALTIME SUBSCRIPTION ──

export function subscribeToChanges(onUpdate: (table: string) => void): () => void {
  let cancelled = false
  let currentChannel = supabase.channel('mikayla-realtime-v1', {
    config: { broadcast: { self: true } },
  })

  const tables = ['events', 'todos']

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
          currentChannel = supabase.channel('mikayla-realtime-v1-' + Date.now(), {
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
