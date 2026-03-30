'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Event, Recipe } from '@/lib/supabase'
import { COLORS, DAYS, QUOTES, PLACEHOLDER_WEATHER, FAMILY_MEMBERS } from '@/lib/constants'
import { fmtDate, parseDate, fmtTime, fmtDateLong, getWeekDates } from '@/lib/helpers'
import * as store from '@/lib/store'

type ViewMode = 'today' | 'week' | 'month' | 'agenda'

export default function Dashboard() {
  const now = useRef(new Date())
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<store.SyncStatus>('syncing')
  const [clockTime, setClockTime] = useState('')
  const [clockDate, setClockDate] = useState('')

  // Data
  const [events, setEvents] = useState<Event[]>([])
  const [todos, setTodos] = useState<store.AppState['todos']>([])
  const [shopping, setShopping] = useState<store.AppState['shopping']>([])
  const [priorities, setPriorities] = useState<store.AppState['priorities']>([])
  const [weeklys, setWeeklys] = useState<store.AppState['weeklys']>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [dinnerPlan, setDinnerPlan] = useState<Record<string, number | null>>({})
  const [pantry, setPantry] = useState<Record<number, Record<number, boolean>>>({})

  // UI State
  const [currentView, setCurrentView] = useState<ViewMode>('today')
  const [viewDate, setViewDate] = useState(new Date(now.current))
  const [todoInput, setTodoInput] = useState('')
  const [shopInput, setShopInput] = useState('')

  // Modal State
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [dinnerPlannerOpen, setDinnerPlannerOpen] = useState(false)
  const [dinnerDetailOpen, setDinnerDetailOpen] = useState(false)
  const [recipeModalOpen, setRecipeModalOpen] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null)
  const [currentDinnerDate, setCurrentDinnerDate] = useState<string | null>(null)
  const [tempDinnerPlan, setTempDinnerPlan] = useState<Record<string, number | null>>({})

  // Event form
  const [evTitle, setEvTitle] = useState('')
  const [evDate, setEvDate] = useState('')
  const [evTime, setEvTime] = useState('')
  const [evWho, setEvWho] = useState('shane')
  const [evAddress, setEvAddress] = useState('')
  const [evNotes, setEvNotes] = useState('')

  // Recipe form
  const [recName, setRecName] = useState('')
  const [recType, setRecType] = useState('homecook')
  const [recPhoto, setRecPhoto] = useState('')
  const [recIngredients, setRecIngredients] = useState('')
  const [recInstructions, setRecInstructions] = useState('')
  const [recPhone, setRecPhone] = useState('')
  const [recMenu, setRecMenu] = useState('')
  const [recOpentable, setRecOpentable] = useState('')

  // Voice
  const voiceRef = useRef<any>(null)
  const [isRecording, setIsRecording] = useState(false)

  // ── VOICE CLEANUP ──
  useEffect(() => {
    return () => {
      if (voiceRef.current) { voiceRef.current.stop(); voiceRef.current = null }
    }
  }, [])

  // ── CLOCK ──
  useEffect(() => {
    const tick = () => {
      const n = new Date()
      setClockTime(n.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setClockDate(n.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // ── REFRESH HELPER ──
  const refreshTable = useCallback(async (table: string) => {
    try {
      if (table === 'events' || table === '__all') setEvents(await store.loadEvents())
      if (table === 'todos' || table === '__all') setTodos(await store.loadTodos())
      if (table === 'shopping' || table === '__all') setShopping(await store.loadShopping())
      if (table === 'priorities' || table === '__all') setPriorities(await store.loadPriorities())
      if (table === 'weeklys' || table === '__all') setWeeklys(await store.loadWeeklys())
      if (table === 'recipes' || table === '__all') setRecipes(await store.loadRecipes())
      if (table === 'dinner_plan' || table === '__all') setDinnerPlan(await store.loadDinnerPlan())
      if (table === 'pantry' || table === '__all') setPantry(await store.loadPantry())
    } catch (e) {
      console.error('Refresh error:', e)
    }
  }, [])

  // ── INIT ──
  useEffect(() => {
    async function init() {
      try {
        setSyncStatus('syncing')
        const data = await store.loadAllData()
        setEvents(data.events)
        setTodos(data.todos)
        setShopping(data.shopping)
        setPriorities(data.priorities)
        setWeeklys(data.weeklys)
        setRecipes(data.recipes)
        setDinnerPlan(data.dinnerPlan)
        setPantry(data.pantry)
        setSyncStatus('online')
      } catch (e) {
        console.error('DB init error:', e)
        setSyncStatus('offline')
      }
      setLoading(false)
    }
    init()
  }, [])

  // ── REALTIME ──
  useEffect(() => {
    const unsub = store.subscribeToChanges((table) => {
      if (table === '__connected') { setSyncStatus('online'); return }
      if (table === '__error') { setSyncStatus('offline'); return }
      refreshTable(table)
    })
    return unsub
  }, [refreshTable])

  // ── HELPERS ──
  const todayStr = fmtDate(now.current)
  const weekDates = getWeekDates(now.current)

  function getDinnerForDate(ds: string): Recipe | null {
    const rid = dinnerPlan[ds]
    return rid ? recipes.find(r => r.id === rid) || null : null
  }

  // ── EVENT CRUD ──
  async function handleSaveEvent() {
    if (!evTitle.trim()) return
    setSyncStatus('syncing')
    try {
      await store.saveEvent(
        { title: evTitle.trim(), date: evDate, time: evTime, who: evWho, address: evAddress.trim(), notes: evNotes.trim() },
        editingId
      )
      setEvents(await store.loadEvents())
      setSyncStatus('online')
      closeAddModal()
    } catch (e) {
      console.error('Save event error:', e)
      setSyncStatus('offline')
    }
  }

  async function handleDeleteEvent(id: number) {
    if (!confirm('Delete?')) return
    setSyncStatus('syncing')
    try {
      await store.deleteEvent(id)
      setEvents(await store.loadEvents())
      setSyncStatus('online')
      setAddModalOpen(false)
      setDetailModalOpen(false)
    } catch (e) {
      console.error('Delete event error:', e)
      setSyncStatus('offline')
    }
  }

  // ── TODO CRUD ──
  async function handleAddTodo() {
    if (!todoInput.trim()) return
    setSyncStatus('syncing')
    try {
      await store.addTodo(todoInput.trim())
      setTodos(await store.loadTodos())
      setTodoInput('')
      setSyncStatus('online')
    } catch (e) { console.error('Add todo error:', e); setSyncStatus('offline') }
  }

  async function handleToggleTodo(id: number, done: boolean) {
    try {
      await store.toggleTodo(id, done)
      setTodos(await store.loadTodos())
    } catch (e) { console.error('Toggle todo error:', e); setSyncStatus('offline') }
  }

  // ── SHOPPING CRUD ──
  async function handleAddShop() {
    if (!shopInput.trim()) return
    setSyncStatus('syncing')
    try {
      await store.addShoppingItem(shopInput.trim())
      setShopping(await store.loadShopping())
      setShopInput('')
      setSyncStatus('online')
    } catch (e) { console.error('Add shop error:', e); setSyncStatus('offline') }
  }

  async function handleToggleShop(id: number, done: boolean) {
    try {
      await store.toggleShoppingItem(id, done)
      setShopping(await store.loadShopping())
    } catch (e) { console.error('Toggle shop error:', e); setSyncStatus('offline') }
  }

  // ── PRIORITY / WEEKLY CRUD ──
  async function handleAddPriority() {
    const t = prompt('New daily priority:')
    if (!t) return
    setSyncStatus('syncing')
    try {
      await store.addPriority(t, priorities)
      setPriorities(await store.loadPriorities())
      setSyncStatus('online')
    } catch (e) { console.error('Add priority error:', e); setSyncStatus('offline') }
  }

  async function handleTogglePriority(id: number, done: boolean) {
    try {
      await store.togglePriority(id, done)
      setPriorities(await store.loadPriorities())
    } catch (e) { console.error('Toggle priority error:', e); setSyncStatus('offline') }
  }

  async function handleAddWeekly() {
    const t = prompt('New weekly goal:')
    if (!t) return
    setSyncStatus('syncing')
    try {
      await store.addWeekly(t, weeklys)
      setWeeklys(await store.loadWeeklys())
      setSyncStatus('online')
    } catch (e) { console.error('Add weekly error:', e); setSyncStatus('offline') }
  }

  async function handleToggleWeekly(id: number, done: boolean) {
    try {
      await store.toggleWeekly(id, done)
      setWeeklys(await store.loadWeeklys())
    } catch (e) { console.error('Toggle weekly error:', e); setSyncStatus('offline') }
  }

  // ── DINNER PLAN ──
  async function handleSaveDinnerPlan() {
    setSyncStatus('syncing')
    try {
      await store.saveDinnerPlan(tempDinnerPlan, weekDates)
      setDinnerPlan(await store.loadDinnerPlan())
      setDinnerPlannerOpen(false)
      setSyncStatus('online')
    } catch (e) { console.error('Save dinner plan error:', e); setSyncStatus('offline') }
  }

  // ── RECIPE CRUD ──
  async function handleSaveRecipe() {
    if (!recName.trim()) return
    setSyncStatus('syncing')
    try {
      const r = {
        name: recName.trim(), type: recType, photo: recPhoto, emoji: recPhoto ? '' : '\u{1F37D}\u{FE0F}',
        ingredients: recIngredients.split('\n').map(s => s.trim()).filter(Boolean),
        instructions: recInstructions.trim(), phone: recPhone.trim(),
        menu: recMenu.trim(), opentable: recOpentable.trim(),
      }
      await store.saveRecipe(r, editingRecipeId)
      setRecipes(await store.loadRecipes())
      setRecipeModalOpen(false)
      setSyncStatus('online')
      // Reset form state
      setRecName(''); setRecType('homecook'); setRecPhoto('')
      setRecIngredients(''); setRecInstructions('')
      setRecPhone(''); setRecMenu(''); setRecOpentable('')
    } catch (e) { console.error('Save recipe error:', e); setSyncStatus('offline') }
  }

  async function handleDeleteRecipe() {
    if (!confirm('Delete recipe?') || !editingRecipeId) return
    setSyncStatus('syncing')
    try {
      await store.deleteRecipe(editingRecipeId)
      setRecipes(await store.loadRecipes())
      setRecipeModalOpen(false)
      setSyncStatus('online')
    } catch (e) { console.error('Delete recipe error:', e); setSyncStatus('offline') }
  }

  // ── PANTRY ──
  async function handleTogglePantry(recipeId: number, idx: number) {
    try {
      const current = pantry[recipeId]?.[idx] || false
      await store.togglePantryItem(recipeId, idx, current)
      setPantry(await store.loadPantry())
    } catch (e) { console.error('Toggle pantry error:', e); setSyncStatus('offline') }
  }

  async function handleAddMissingToShopping(recipeId: number) {
    setSyncStatus('syncing')
    try {
      const count = await store.addMissingToShopping(recipeId, recipes, pantry, shopping)
      setShopping(await store.loadShopping())
      setSyncStatus('online')
      alert(`Added ${count} item(s) to shopping list!`)
    } catch (e) { console.error('Add missing to shopping error:', e); setSyncStatus('offline') }
  }

  // ── VOICE ──
  function toggleVoice() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice input: use Chrome for best support.')
      return
    }
    if (isRecording) { voiceRef.current?.stop(); return }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.onresult = (e: any) => {
      let t = ''
      for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript + ' '
      setRecInstructions(prev => prev + t)
    }
    recognition.onend = () => { setIsRecording(false); voiceRef.current = null }
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsRecording(false)
      voiceRef.current = null
    }
    recognition.start()
    voiceRef.current = recognition
    setIsRecording(true)
  }

  // ── MODAL OPENERS ──
  function openAddModal(date?: string, time?: string) {
    setEditingId(null)
    setEvTitle(''); setEvDate(date || todayStr); setEvTime(time || '09:00')
    setEvWho('shane'); setEvAddress(''); setEvNotes('')
    setAddModalOpen(true)
  }

  function openEditModal(id: number) {
    const ev = events.find(e => e.id === id)
    if (!ev) return
    setEditingId(id)
    setEvTitle(ev.title); setEvDate(ev.date); setEvTime(ev.time || '')
    setEvWho(ev.who); setEvAddress(ev.address || ''); setEvNotes(ev.notes || '')
    setAddModalOpen(true)
  }

  function openDetail(id: number) {
    setDetailId(id)
    setDetailModalOpen(true)
  }

  function closeAddModal() { setAddModalOpen(false); setEditingId(null) }

  function openDinnerPlanner() {
    setTempDinnerPlan({ ...dinnerPlan })
    setDinnerPlannerOpen(true)
  }

  function openDinnerDetail(ds: string) {
    setCurrentDinnerDate(ds)
    setDinnerDetailOpen(true)
  }

  function openNewRecipe() {
    setEditingRecipeId(null)
    setRecName(''); setRecType('homecook'); setRecPhoto('')
    setRecIngredients(''); setRecInstructions('')
    setRecPhone(''); setRecMenu(''); setRecOpentable('')
    setRecipeModalOpen(true)
  }

  function openEditRecipe(id: number) {
    const r = recipes.find(x => x.id === id)
    if (!r) return
    setEditingRecipeId(id)
    setRecName(r.name); setRecType(r.type); setRecPhoto(r.photo || '')
    setRecIngredients((r.ingredients || []).join('\n'))
    setRecInstructions(r.instructions || '')
    setRecPhone(r.phone || ''); setRecMenu(r.menu || ''); setRecOpentable(r.opentable || '')
    setRecipeModalOpen(true)
  }

  // ── CALENDAR NAV ──
  function navCal(dir: number) {
    setViewDate(prev => {
      const d = new Date(prev)
      if (currentView === 'month') d.setMonth(d.getMonth() + dir)
      else d.setDate(d.getDate() + (currentView === 'week' ? dir * 7 : dir))
      return d
    })
  }

  function navToday() { setViewDate(new Date(now.current)) }

  // ── RECIPE PHOTO HANDLER ──
  function handleRecipePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = ev => { setRecPhoto(ev.target?.result as string) }
    reader.onerror = () => { console.error('Failed to read file'); alert('Failed to load image. Try again.') }
    reader.readAsDataURL(f)
  }

  // ── LOADING ──
  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner" />
        <div className="loading-text">Connecting to Peterson — Harvey...</div>
      </div>
    )
  }

  // ── DETAIL EVENT ──
  const detailEvent = detailId ? events.find(e => e.id === detailId) : null

  // ── DINNER DETAIL RECIPE ──
  const dinnerDetailRecipe = currentDinnerDate ? getDinnerForDate(currentDinnerDate) : null
  const dinnerDetailDateLabel = currentDinnerDate
    ? parseDate(currentDinnerDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : ''

  return (
    <>
      {/* ── HEADER ── */}
      <div className="header">
        <div>
          <div className="logo-name">Peterson — Harvey</div>
          <div className="logo-sub">Family Command Center</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className={`sync-status sync-${syncStatus}`}>
            {syncStatus === 'online' ? '\u25CF Live' : syncStatus === 'syncing' ? '\u21BB Syncing...' : '\u25CB Offline'}
          </span>
          <div>
            <div className="clock-time">{clockTime}</div>
            <div className="clock-date">{clockDate}</div>
          </div>
        </div>
      </div>

      {/* ── QUOTE BAR ── */}
      <div className="quote-bar">
        <span style={{ color: 'var(--gold)', fontSize: 12, flexShrink: 0 }}>{'\u2726'}</span>
        <div className="quote-text">{QUOTES[now.current.getDay() % QUOTES.length]}</div>
      </div>

      {/* ── WEATHER STRIP ── */}
      <div className="weather-strip">
        {PLACEHOLDER_WEATHER.map((w, i) => {
          const d = new Date(now.current)
          d.setDate(now.current.getDate() + i)
          return (
            <div key={i} className={`weather-day${i === 0 ? ' today' : ''}`}>
              <div className="wd-name">{i === 0 ? 'Today' : DAYS[d.getDay()]}</div>
              <div className="wd-icon">{w.icon}</div>
              <div className="wd-temp">{w.temp}&deg;</div>
              <div className="wd-cond">{w.condition}</div>
            </div>
          )
        })}
      </div>

      {/* ── MAIN ── */}
      <div className="main">
        {/* Calendar Area */}
        <div className="calendar-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div className="view-tabs">
              {(['today', 'week', 'month', 'agenda'] as ViewMode[]).map(v => (
                <button key={v} className={`view-tab${currentView === v ? ' active' : ''}`} onClick={() => setCurrentView(v)}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <button className="cal-btn" onClick={() => navCal(-1)}>{'\u2039'}</button>
              <button className="cal-btn" onClick={navToday} style={{ width: 'auto', padding: '0 8px', fontSize: 10, fontWeight: 600 }}>Today</button>
              <button className="cal-btn" onClick={() => navCal(1)}>{'\u203A'}</button>
              <button className="qa-btn" onClick={() => openAddModal()} style={{ fontSize: 10, padding: '5px 10px' }}>+ Event</button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="cal-title">
              {currentView === 'month'
                ? viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : currentView === 'week'
                  ? (() => {
                      const s = new Date(viewDate); s.setDate(viewDate.getDate() - viewDate.getDay())
                      const e = new Date(s); e.setDate(s.getDate() + 6)
                      return s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' \u2013 ' + e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    })()
                  : currentView === 'agenda'
                    ? 'Upcoming'
                    : now.current.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
              }
            </div>
          </div>

          {/* ── CALENDAR VIEWS ── */}
          {currentView === 'today' && <TodayView events={events} now={now.current} todayStr={todayStr} getDinnerForDate={getDinnerForDate} openDetail={openDetail} openDinnerDetail={openDinnerDetail} openDinnerPlanner={openDinnerPlanner} />}
          {currentView === 'month' && <MonthView events={events} viewDate={viewDate} now={now.current} getDinnerForDate={getDinnerForDate} openAddModal={openAddModal} openDetail={openDetail} openDinnerDetail={openDinnerDetail} />}
          {currentView === 'week' && <WeekView events={events} viewDate={viewDate} now={now.current} getDinnerForDate={getDinnerForDate} openAddModal={openAddModal} openDetail={openDetail} openDinnerDetail={openDinnerDetail} />}
          {currentView === 'agenda' && <AgendaView events={events} now={now.current} weekDates={weekDates} getDinnerForDate={getDinnerForDate} openDetail={openDetail} openDinnerDetail={openDinnerDetail} />}
        </div>

        {/* ── SIDEBAR ── */}
        <div className="sidebar">
          {/* Family */}
          <div className="sidebar-section">
            <div className="sidebar-title-plain">Family</div>
            <div className="legend">
              {FAMILY_MEMBERS.map(m => (
                <div key={m.name} className="legend-item">
                  <div className="legend-dot" style={{ background: m.color }} />
                  <div className="legend-name">{m.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Big 3 */}
          <div className="sidebar-section gold-section">
            <div className="sidebar-title">
              This Week — Big 3
              <button className="sidebar-add" onClick={handleAddWeekly}>+</button>
            </div>
            {weeklys.map((w, i) => (
              <div key={w.id} className={`priority-item${w.done ? ' done' : ''}`} onClick={() => handleToggleWeekly(w.id, w.done)}>
                <div className="priority-num">{i + 1}</div>
                <div className="priority-text">{w.text}</div>
              </div>
            ))}
          </div>

          {/* Today Top 3 */}
          <div className="sidebar-section gold-section">
            <div className="sidebar-title">
              Today — Top 3
              <button className="sidebar-add" onClick={handleAddPriority}>+</button>
            </div>
            {priorities.map((p, i) => (
              <div key={p.id} className={`priority-item${p.done ? ' done' : ''}`} onClick={() => handleTogglePriority(p.id, p.done)}>
                <div className="priority-num">{i + 1}</div>
                <div className="priority-text">{p.text}</div>
              </div>
            ))}
          </div>

          {/* Todos */}
          <div className="sidebar-section gold-section">
            <div className="sidebar-title">To-Do <button className="sidebar-add" onClick={() => document.getElementById('todo-input')?.focus()}>+</button></div>
            <div className="todo-list">
              {todos.map(t => (
                <div key={t.id} className={`todo-item${t.done ? ' done' : ''}`} onClick={() => handleToggleTodo(t.id, t.done)}>
                  <div className="todo-check">{t.done ? '\u2713' : ''}</div>
                  <div className="todo-text">{t.text}</div>
                  <span className={`todo-cat cat-${t.cat || 'personal'}`}>{t.cat || 'personal'}</span>
                </div>
              ))}
            </div>
            <div className="quick-add">
              <input className="qa-input" id="todo-input" placeholder="Add task..." value={todoInput}
                onChange={e => setTodoInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddTodo() }} />
              <button className="qa-btn" onClick={handleAddTodo}>Add</button>
            </div>
          </div>

          {/* Dinners */}
          <div className="sidebar-section dinner-section">
            <div className="sidebar-title-dinner">
              This Week&apos;s Dinners
              <button className="sidebar-add-purple" onClick={openDinnerPlanner}>{'\u270E'}</button>
            </div>
            <div className="dinner-week-list">
              {weekDates.map(ds => {
                const d = parseDate(ds)
                const r = getDinnerForDate(ds)
                const isToday = ds === todayStr
                return (
                  <div key={ds} className={`dinner-day-item${isToday ? ' today-dinner' : ''}`} onClick={() => openDinnerDetail(ds)}>
                    <div className="dinner-day-label">{DAYS[d.getDay()].substring(0, 3)}</div>
                    {r ? (
                      r.photo
                        ? <img src={r.photo} className="dinner-day-thumb" alt={r.name} />
                        : <div className="dinner-day-emoji">{r.emoji || '\u{1F37D}\u{FE0F}'}</div>
                    ) : (
                      <div style={{ width: 24, height: 24, border: '1px dashed #3d2060', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#3d2060' }}>?</div>
                    )}
                    <div><div className="dinner-day-name">{r ? r.name : 'Not planned'}</div></div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Shopping */}
          <div className="sidebar-section gold-section">
            <div className="sidebar-title">Shopping <button className="sidebar-add" onClick={() => document.getElementById('shop-input')?.focus()}>+</button></div>
            <div className="shop-list">
              {shopping.map(s => (
                <div key={s.id} className={`shop-item${s.done ? ' got' : ''}`} onClick={() => handleToggleShop(s.id, s.done)}>
                  <div className="shop-check">{s.done ? '\u2713' : ''}</div>
                  <div className="shop-text">{s.text}</div>
                  <span className="shop-cat">{s.cat || ''}</span>
                </div>
              ))}
            </div>
            <div className="quick-add">
              <input className="qa-input" id="shop-input" placeholder="Add item..." value={shopInput}
                onChange={e => setShopInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddShop() }} />
              <button className="qa-btn" onClick={handleAddShop}>Add</button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════ MODALS ══════════════ */}

      {/* ADD/EDIT EVENT */}
      <div className={`modal-overlay${addModalOpen ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) closeAddModal() }}>
        <div className="modal-box">
          <div className="modal-title">{editingId ? 'Edit Event' : 'Add Event'}</div>
          <label className="modal-label">Title</label>
          <input className="modal-input" placeholder="What's happening?" value={evTitle} onChange={e => setEvTitle(e.target.value)} autoFocus />
          <div className="modal-row">
            <div><label className="modal-label">Date</label><input className="modal-input" type="date" value={evDate} onChange={e => setEvDate(e.target.value)} /></div>
            <div><label className="modal-label">Time</label><input className="modal-input" type="time" value={evTime} onChange={e => setEvTime(e.target.value)} /></div>
          </div>
          <label className="modal-label">Who</label>
          <select className="modal-select" value={evWho} onChange={e => setEvWho(e.target.value)}>
            <option value="shane">Shane</option><option value="molly">Molly</option>
            <option value="evey">Evey</option><option value="jax">Jax</option>
            <option value="family">Whole Family</option>
          </select>
          <label className="modal-label">Address (optional)</label>
          <input className="modal-input" placeholder="123 Main St, Seattle WA" value={evAddress} onChange={e => setEvAddress(e.target.value)} />
          <label className="modal-label">Notes</label>
          <textarea className="modal-textarea" placeholder="Phone, confirmation, details..." value={evNotes} onChange={e => setEvNotes(e.target.value)} />
          <div className="modal-actions">
            {editingId && <button className="btn-delete" onClick={() => handleDeleteEvent(editingId)}>Delete</button>}
            <div style={{ display: 'flex', gap: 7, marginLeft: 'auto' }}>
              <button className="btn-cancel" onClick={closeAddModal}>Cancel</button>
              <button className="btn-save" onClick={handleSaveEvent}>Save</button>
            </div>
          </div>
        </div>
      </div>

      {/* EVENT DETAIL */}
      <div className={`modal-overlay${detailModalOpen ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) setDetailModalOpen(false) }}>
        {detailEvent && (
          <div className="detail-box">
            <div className="detail-header">
              <div className="detail-dot" style={{ background: COLORS[detailEvent.who] || COLORS.family }} />
              <div className="detail-title-text">{detailEvent.title}</div>
            </div>
            <div className="detail-meta">
              <div className="detail-row"><div className="detail-row-icon">{'\u{1F4C5}'}</div><div className="detail-row-text"><strong>{fmtDateLong(detailEvent.date)}</strong></div></div>
              {detailEvent.time && <div className="detail-row"><div className="detail-row-icon">{'\u{1F550}'}</div><div className="detail-row-text"><strong>{fmtTime(detailEvent.time)}</strong></div></div>}
              <div className="detail-row"><div className="detail-row-icon">{'\u{1F464}'}</div><div className="detail-row-text"><strong style={{ textTransform: 'capitalize' }}>{detailEvent.who}</strong></div></div>
              {detailEvent.address && <div className="detail-row"><div className="detail-row-icon">{'\u{1F4CD}'}</div><div className="detail-row-text">{detailEvent.address}</div></div>}
            </div>
            {detailEvent.notes && <div className="detail-notes">{detailEvent.notes}</div>}
            {detailEvent.address && (
              <a className="maps-btn" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(detailEvent.address)}`} target="_blank" rel="noopener noreferrer">
                {'\u25B9'} Open in Google Maps
              </a>
            )}
            <div style={{ display: 'flex', gap: 7, justifyContent: 'space-between' }}>
              <button className="btn-delete" onClick={() => handleDeleteEvent(detailEvent.id)}>Delete</button>
              <div style={{ display: 'flex', gap: 7 }}>
                <button className="btn-cancel" onClick={() => setDetailModalOpen(false)}>Close</button>
                <button className="btn-save" onClick={() => { setDetailModalOpen(false); openEditModal(detailEvent.id) }}>Edit</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DINNER PLANNER */}
      <div className={`modal-overlay${dinnerPlannerOpen ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) setDinnerPlannerOpen(false) }}>
        <div className="modal-box-wide">
          <div className="modal-title-purple">Plan This Week&apos;s Dinners</div>
          {weekDates.map(ds => {
            const d = parseDate(ds)
            const isToday = ds === todayStr
            return (
              <div key={ds} style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: isToday ? 'var(--purple3)' : 'var(--purple2)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 3 }}>
                  {DAYS[d.getDay()]} {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{isToday ? ' (Today)' : ''}
                </label>
                <select className="modal-input-purple" style={{ marginBottom: 0 }}
                  value={tempDinnerPlan[ds] || ''}
                  onChange={e => setTempDinnerPlan(prev => ({ ...prev, [ds]: e.target.value ? parseInt(e.target.value) : null }))}
                >
                  <option value="">-- None --</option>
                  {recipes.map(r => (
                    <option key={r.id} value={r.id}>{r.emoji || '\u{1F37D}\u{FE0F}'} {r.name}</option>
                  ))}
                </select>
              </div>
            )
          })}
          <div style={{ display: 'flex', gap: 7, justifyContent: 'space-between', marginTop: 14 }}>
            <button className="btn-purple" onClick={openNewRecipe} style={{ fontSize: 11 }}>+ New Recipe</button>
            <div style={{ display: 'flex', gap: 7 }}>
              <button className="btn-cancel" onClick={() => setDinnerPlannerOpen(false)}>Cancel</button>
              <button className="btn-purple" onClick={handleSaveDinnerPlan}>Save Week</button>
            </div>
          </div>
        </div>
      </div>

      {/* DINNER DETAIL */}
      <div className={`modal-overlay${dinnerDetailOpen ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) setDinnerDetailOpen(false) }}>
        <div className="modal-box-wide">
          {dinnerDetailRecipe ? (
            dinnerDetailRecipe.type === 'restaurant' ? (
              <>
                <div className="modal-title-purple">{dinnerDetailRecipe.emoji || '\u{1F37D}\u{FE0F}'} {dinnerDetailRecipe.name}</div>
                <div style={{ fontSize: 10, color: 'var(--purple2)', marginBottom: 12 }}>{dinnerDetailDateLabel} &middot; Restaurant Night</div>
                {dinnerDetailRecipe.photo && <img src={dinnerDetailRecipe.photo} className="recipe-photo" alt={dinnerDetailRecipe.name} />}
                {dinnerDetailRecipe.phone && <a className="rest-action-btn btn-call" href={`tel:${dinnerDetailRecipe.phone.replace(/\s/g, '')}`}>{'\u{1F4DE}'} Call {dinnerDetailRecipe.phone}</a>}
                {dinnerDetailRecipe.menu && <a className="rest-action-btn btn-menu" href={dinnerDetailRecipe.menu} target="_blank" rel="noopener noreferrer">{'\u{1F37D}\u{FE0F}'} View Menu</a>}
                {dinnerDetailRecipe.opentable && <a className="rest-action-btn btn-opentable" href={dinnerDetailRecipe.opentable} target="_blank" rel="noopener noreferrer">{'\u{1F4C5}'} Book on OpenTable</a>}
                <div style={{ display: 'flex', gap: 7, justifyContent: 'space-between' }}>
                  <button className="btn-delete" onClick={() => { setDinnerDetailOpen(false); openEditRecipe(dinnerDetailRecipe.id) }}>Edit</button>
                  <button className="btn-cancel" onClick={() => setDinnerDetailOpen(false)}>Close</button>
                </div>
              </>
            ) : (
              <>
                <div className="modal-title-purple">{dinnerDetailRecipe.emoji || '\u{1F37D}\u{FE0F}'} {dinnerDetailRecipe.name}</div>
                <div style={{ fontSize: 10, color: 'var(--purple2)', marginBottom: 10 }}>{dinnerDetailDateLabel} &middot; 5:00pm</div>
                {dinnerDetailRecipe.photo && <img src={dinnerDetailRecipe.photo} className="recipe-photo" alt={dinnerDetailRecipe.name} />}
                {/* Pantry check */}
                {(() => {
                  const ing = dinnerDetailRecipe.ingredients || []
                  const p = pantry[dinnerDetailRecipe.id] || {}
                  const missing = ing.filter((_, i) => !p[i])
                  return (
                    <>
                      {ing.length > 0 && (
                        <div className={missing.length === 0 ? 'pantry-summary' : 'pantry-missing'}>
                          {missing.length === 0 ? '\u2713 You have everything!' : 'Missing: ' + missing.join(', ')}
                        </div>
                      )}
                      {missing.length > 0 && (
                        <button className="btn-purple" onClick={() => handleAddMissingToShopping(dinnerDetailRecipe.id)} style={{ width: '100%', marginBottom: 10, padding: 7 }}>
                          + Add missing to shopping
                        </button>
                      )}
                      <div className="recipe-section-title">Ingredients — Pantry Check</div>
                      <div style={{ marginBottom: 12 }}>
                        {ing.length > 0 ? ing.map((x, i) => (
                          <div key={i} className={`ingredient-row${p[i] ? ' have' : ''}`} onClick={() => handleTogglePantry(dinnerDetailRecipe.id, i)}>
                            <div className="ingr-check">{p[i] ? '\u2713' : ''}</div>
                            <div className="ingr-text">{x}</div>
                          </div>
                        )) : <div style={{ color: 'var(--text3)', fontSize: 11 }}>No ingredients.</div>}
                      </div>
                    </>
                  )
                })()}
                <div className="recipe-section-title">Instructions</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 14 }}>
                  {dinnerDetailRecipe.instructions || 'No instructions yet.'}
                </div>
                <div style={{ display: 'flex', gap: 7, justifyContent: 'space-between' }}>
                  <button className="btn-delete" onClick={() => { setDinnerDetailOpen(false); openEditRecipe(dinnerDetailRecipe.id) }}>Edit Recipe</button>
                  <button className="btn-cancel" onClick={() => setDinnerDetailOpen(false)}>Close</button>
                </div>
              </>
            )
          ) : (
            <>
              <div className="modal-title-purple">Dinner — {dinnerDetailDateLabel}</div>
              <div style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 14 }}>No dinner planned.</div>
              <div style={{ display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
                <button className="btn-cancel" onClick={() => setDinnerDetailOpen(false)}>Close</button>
                <button className="btn-purple" onClick={() => { setDinnerDetailOpen(false); openDinnerPlanner() }}>Plan Dinners</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* NEW/EDIT RECIPE */}
      <div className={`modal-overlay${recipeModalOpen ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) setRecipeModalOpen(false) }}>
        <div className="modal-box-wide">
          <div className="modal-title-purple">{editingRecipeId ? 'Edit Recipe' : 'New Recipe'}</div>
          <label className="modal-label-purple">Recipe Name</label>
          <input className="modal-input-purple" placeholder="e.g. Chicken Stir Fry" value={recName} onChange={e => setRecName(e.target.value)} />
          <div className="modal-row" style={{ marginBottom: 10 }}>
            <div>
              <label className="modal-label-purple">Type</label>
              <select className="modal-input-purple" style={{ marginBottom: 0 }} value={recType} onChange={e => setRecType(e.target.value)}>
                <option value="homecook">Home Cook</option>
                <option value="restaurant">Restaurant</option>
              </select>
            </div>
            <div>
              <label className="modal-label-purple">Photo</label>
              <input type="file" accept="image/*" style={{ display: 'none' }} id="rec-photo-file" onChange={handleRecipePhoto} />
              <button className="modal-input-purple" onClick={() => document.getElementById('rec-photo-file')?.click()} style={{ cursor: 'pointer', textAlign: 'left', color: 'var(--text2)' }}>
                {'\u{1F4F7}'} Upload
              </button>
            </div>
          </div>
          {recPhoto && (
            <div style={{ marginBottom: 10 }}>
              <img src={recPhoto} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 7 }} alt="Recipe" />
            </div>
          )}
          {recType === 'homecook' && (
            <>
              <label className="modal-label-purple">Ingredients (one per line)</label>
              <textarea className="modal-input-purple" style={{ minHeight: 72, resize: 'vertical', lineHeight: 1.5, marginBottom: 10 }}
                placeholder={'2 cups chicken\n1 cup broccoli'} value={recIngredients} onChange={e => setRecIngredients(e.target.value)} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                <label className="modal-label-purple" style={{ marginBottom: 0 }}>Instructions</label>
                <button className={`voice-btn${isRecording ? ' recording' : ''}`} onClick={toggleVoice} style={{ padding: '3px 9px', fontSize: 10 }}>
                  {isRecording ? '\u23F9 Stop' : '\u{1F3A4} Voice'}
                </button>
              </div>
              <textarea className="modal-input-purple" style={{ minHeight: 90, resize: 'vertical', lineHeight: 1.5, marginBottom: 10 }}
                placeholder="Speak or type instructions..." value={recInstructions} onChange={e => setRecInstructions(e.target.value)} />
            </>
          )}
          {recType === 'restaurant' && (
            <>
              <label className="modal-label-purple">Phone</label>
              <input className="modal-input-purple" placeholder="+1 (555) 123-4567" value={recPhone} onChange={e => setRecPhone(e.target.value)} />
              <label className="modal-label-purple">Menu URL</label>
              <input className="modal-input-purple" placeholder="https://restaurant.com/menu" value={recMenu} onChange={e => setRecMenu(e.target.value)} />
              <label className="modal-label-purple">OpenTable / Reservation Link</label>
              <input className="modal-input-purple" placeholder="https://opentable.com/..." value={recOpentable} onChange={e => setRecOpentable(e.target.value)} />
            </>
          )}
          <div className="modal-actions">
            {editingRecipeId && <button className="btn-delete" onClick={handleDeleteRecipe}>Delete</button>}
            <div style={{ display: 'flex', gap: 7, marginLeft: 'auto' }}>
              <button className="btn-cancel" onClick={() => setRecipeModalOpen(false)}>Cancel</button>
              <button className="btn-purple" onClick={handleSaveRecipe}>Save Recipe</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ══════════════ VIEW COMPONENTS ══════════════

function TodayView({ events, now, todayStr, getDinnerForDate, openDetail, openDinnerDetail, openDinnerPlanner }: {
  events: Event[], now: Date, todayStr: string,
  getDinnerForDate: (ds: string) => Recipe | null,
  openDetail: (id: number) => void, openDinnerDetail: (ds: string) => void, openDinnerPlanner: () => void
}) {
  const dayEvs = events.filter(e => e.date === todayStr).sort((a, b) => (a.time || '') > (b.time || '') ? 1 : -1)
  const tdDinner = getDinnerForDate(todayStr)
  const upcoming = events.filter(e => e.date > todayStr).sort((a, b) => a.date > b.date ? 1 : (a.time || '') > (b.time || '') ? 1 : -1).slice(0, 4)

  return (
    <>
      <div className="today-top">
        <div className="today-hero">
          <div className="today-hero-label">Today</div>
          <div className="today-hero-day">{now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
          {dayEvs.length > 0 ? (
            <div className="today-events">
              {dayEvs.map(e => (
                <div key={e.id} className="today-event-item" onClick={() => openDetail(e.id)}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: COLORS[e.who] || COLORS.family, flexShrink: 0 }} />
                  <div style={{ fontSize: 11, color: 'var(--text2)', minWidth: 50, fontWeight: 500 }}>{fmtTime(e.time)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text)' }}>{e.title}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 10 }}>No events — clear day.</div>
          )}
        </div>
        {tdDinner ? (
          <div className="dinner-today-card" onClick={() => openDinnerDetail(todayStr)}>
            <div className="dinner-today-label">Tonight</div>
            {tdDinner.photo ? <img src={tdDinner.photo} className="dinner-today-img" alt={tdDinner.name} /> : <div className="dinner-today-emoji">{tdDinner.emoji || '\u{1F37D}\u{FE0F}'}</div>}
            <div className="dinner-today-name">{tdDinner.name}</div>
          </div>
        ) : (
          <div className="dinner-today-card" onClick={openDinnerPlanner} style={{ borderColor: '#3d2060' }}>
            <div className="dinner-today-label">Tonight</div>
            <div className="dinner-today-emoji">{'\u{1F37D}\u{FE0F}'}</div>
            <div style={{ fontSize: 9, color: 'var(--text3)' }}>Plan dinner</div>
          </div>
        )}
      </div>
      {upcoming.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Coming up</div>
          {upcoming.map(e => {
            const d = parseDate(e.date)
            return (
              <div key={e.id} className="agenda-event" onClick={() => openDetail(e.id)}>
                <div className="agenda-dot" style={{ background: COLORS[e.who] || COLORS.family }} />
                <div className="agenda-time" style={{ minWidth: 80 }}>{d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                <div>
                  <div className="agenda-title">{e.title}</div>
                  <div className="agenda-who">{fmtTime(e.time)} &middot; {e.who}{e.address ? ' \u{1F4CD}' : ''}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

function MonthView({ events, viewDate, now, getDinnerForDate, openAddModal, openDetail, openDinnerDetail }: {
  events: Event[], viewDate: Date, now: Date,
  getDinnerForDate: (ds: string) => Recipe | null,
  openAddModal: (date?: string, time?: string) => void, openDetail: (id: number) => void, openDinnerDetail: (ds: string) => void
}) {
  const y = viewDate.getFullYear(), m = viewDate.getMonth()
  const first = new Date(y, m, 1), last = new Date(y, m + 1, 0)
  const startDay = first.getDay()
  const todayStr = fmtDate(now)
  const cells: React.ReactNode[] = []

  // Day-of-week headers
  const dows = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  // Previous month fill
  for (let i = 0; i < startDay; i++) {
    const d = new Date(y, m, 1 - startDay + i)
    cells.push(<div key={`prev-${i}`} className="day-cell other-month"><div className="day-num">{d.getDate()}</div></div>)
  }
  // Current month
  for (let d = 1; d <= last.getDate(); d++) {
    const ds = fmtDate(new Date(y, m, d))
    const isToday = ds === todayStr
    const dayEvs = events.filter(e => e.date === ds)
    const dinner = getDinnerForDate(ds)
    cells.push(
      <div key={ds} className={`day-cell${isToday ? ' today' : ''}`} onClick={() => openAddModal(ds)}>
        <div className="day-num">{d}</div>
        {dayEvs.slice(0, 2).map(e => (
          <div key={e.id} className="day-event" style={{ background: COLORS[e.who] || COLORS.family }}
            onClick={ev => { ev.stopPropagation(); openDetail(e.id) }}>{e.title}</div>
        ))}
        {dinner && (
          <div className="day-event" style={{ background: 'var(--purple)' }}
            onClick={ev => { ev.stopPropagation(); openDinnerDetail(ds) }}>
            {dinner.emoji || '\u{1F37D}\u{FE0F}'} {dinner.name}
          </div>
        )}
      </div>
    )
  }
  // Next month fill
  const rem = (7 - (last.getDay() + 1) % 7) % 7
  for (let i = 1; i <= rem; i++) {
    cells.push(<div key={`next-${i}`} className="day-cell other-month"><div className="day-num">{i}</div></div>)
  }

  return (
    <div className="month-grid">
      {dows.map(d => <div key={d} className="dow">{d}</div>)}
      {cells}
    </div>
  )
}

function WeekView({ events, viewDate, now, getDinnerForDate, openAddModal, openDetail, openDinnerDetail }: {
  events: Event[], viewDate: Date, now: Date,
  getDinnerForDate: (ds: string) => Recipe | null,
  openAddModal: (date?: string, time?: string) => void, openDetail: (id: number) => void, openDinnerDetail: (ds: string) => void
}) {
  const s = new Date(viewDate); s.setDate(viewDate.getDate() - viewDate.getDay())
  const days: Date[] = []
  for (let i = 0; i < 7; i++) { const d = new Date(s); d.setDate(d.getDate() + i); days.push(d) }
  const hours: number[] = []
  for (let h = 6; h < 22; h++) hours.push(h)
  const todayStr = fmtDate(now)

  return (
    <div className="week-grid">
      {/* Time column header */}
      <div className="time-col">
        <div className="week-dow" style={{ height: 46 }} />
        {hours.map(h => <div key={h} className="time-slot">{h % 12 || 12}{h < 12 ? 'a' : 'p'}</div>)}
      </div>
      {/* Day columns */}
      {days.map(d => {
        const ds = fmtDate(d)
        const isToday = ds === todayStr
        const dayEvents = events.filter(e => e.date === ds && e.time)
        const dinner = getDinnerForDate(ds)
        return (
          <div key={ds}>
            <div className={`week-dow${isToday ? ' today-col' : ''}`}>
              <div className="week-dow-name">{DAYS[d.getDay()].substring(0, 2)}</div>
              <div className="week-dow-num">{d.getDate()}</div>
            </div>
            <div className="week-col" style={{ position: 'relative' }}>
              {hours.map(h => (
                <div key={h} className="week-slot" onClick={() => openAddModal(ds, `${String(h).padStart(2, '0')}:00`)} />
              ))}
              {dayEvents.map(ev => {
                const [eh, em] = (ev.time || '0:0').split(':')
                const top = (+eh - 6) * 40 + (+em / 60) * 40
                return (
                  <div key={ev.id} className="week-event" style={{ top: 46 + top, height: 36, background: COLORS[ev.who] || COLORS.family }}
                    onClick={e => { e.stopPropagation(); openDetail(ev.id) }}>
                    {fmtTime(ev.time)} {ev.title}
                  </div>
                )
              })}
              {dinner && (
                <div className="dinner-week-event" style={{ top: (17 - 6) * 40 + 46, height: 36 }}
                  onClick={e => { e.stopPropagation(); openDinnerDetail(ds) }}>
                  <span style={{ fontSize: 12 }}>{dinner.emoji || '\u{1F37D}\u{FE0F}'}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 9 }}>{dinner.name}</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AgendaView({ events, now, weekDates, getDinnerForDate, openDetail, openDinnerDetail }: {
  events: Event[], now: Date, weekDates: string[],
  getDinnerForDate: (ds: string) => Recipe | null,
  openDetail: (id: number) => void, openDinnerDetail: (ds: string) => void
}) {
  const todayStr = fmtDate(now)
  const byDay: Record<string, any[]> = {}

  events.filter(e => e.date >= todayStr).sort((a, b) => a.date > b.date ? 1 : a.date < b.date ? -1 : (a.time || '') > (b.time || '') ? 1 : -1)
    .forEach(e => { if (!byDay[e.date]) byDay[e.date] = []; byDay[e.date].push(e) })

  weekDates.forEach(ds => {
    const r = getDinnerForDate(ds)
    if (r && ds >= todayStr) {
      if (!byDay[ds]) byDay[ds] = []
      byDay[ds].push({ isDinner: true, date: ds, name: r.name, recipe: r })
    }
  })

  return (
    <div>
      {Object.keys(byDay).sort().map(ds => {
        const d = parseDate(ds)
        const isToday = ds === todayStr
        return (
          <div key={ds} className="agenda-day">
            <div className={`agenda-day-header${isToday ? ' today-header' : ''}`}>
              {isToday ? 'Today \u2014 ' : ''}{d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            {byDay[ds].map((e: any, i: number) =>
              e.isDinner ? (
                <div key={`dinner-${i}`} className="agenda-event" onClick={() => openDinnerDetail(ds)}>
                  <div className="agenda-dot" style={{ background: 'var(--purple)' }} />
                  <div className="agenda-time">5:00pm</div>
                  <div>
                    <div className="agenda-title">{e.recipe.emoji || '\u{1F37D}\u{FE0F}'} {e.name}</div>
                    <div className="agenda-who">{e.recipe.type === 'restaurant' ? 'Restaurant' : 'Home cook'}</div>
                  </div>
                </div>
              ) : (
                <div key={e.id} className="agenda-event" onClick={() => openDetail(e.id)}>
                  <div className="agenda-dot" style={{ background: COLORS[e.who] || COLORS.family }} />
                  <div className="agenda-time">{fmtTime(e.time) || 'All day'}</div>
                  <div>
                    <div className="agenda-title">{e.title}</div>
                    <div className="agenda-who">{e.who}{e.address ? ' \u{1F4CD}' : ''}</div>
                  </div>
                </div>
              )
            )}
          </div>
        )
      })}
    </div>
  )
}
