'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Event } from '@/lib/supabase'
import { COLORS, DAYS, QUOTES, PLACEHOLDER_WEATHER, FAMILY_MEMBERS } from '@/lib/constants'
import { fmtDate, parseDate, fmtTime, fmtDateLong } from '@/lib/helpers'
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

  // UI State
  const [currentView, setCurrentView] = useState<ViewMode>('today')
  const [viewDate, setViewDate] = useState(new Date(now.current))
  const [todoInput, setTodoInput] = useState('')

  // Modal State
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [detailId, setDetailId] = useState<number | null>(null)

  // Event form
  const [evTitle, setEvTitle] = useState('')
  const [evDate, setEvDate] = useState('')
  const [evTime, setEvTime] = useState('')
  const [evWho, setEvWho] = useState('shane')
  const [evAddress, setEvAddress] = useState('')
  const [evNotes, setEvNotes] = useState('')

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

  // ── LOADING ──
  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner" />
        <div className="loading-text">Connecting to Mikayla...</div>
      </div>
    )
  }

  // ── DETAIL EVENT ──
  const detailEvent = detailId ? events.find(e => e.id === detailId) : null

  return (
    <>
      {/* ── HEADER ── */}
      <div className="header">
        <div>
          <div className="logo-name">Mikayla.ai</div>
          <div className="logo-sub">Your family, handled</div>
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
          {currentView === 'today' && <TodayView events={events} now={now.current} todayStr={todayStr} openDetail={openDetail} />}
          {currentView === 'month' && <MonthView events={events} viewDate={viewDate} now={now.current} openAddModal={openAddModal} openDetail={openDetail} />}
          {currentView === 'week' && <WeekView events={events} viewDate={viewDate} now={now.current} openAddModal={openAddModal} openDetail={openDetail} />}
          {currentView === 'agenda' && <AgendaView events={events} now={now.current} openDetail={openDetail} />}
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
    </>
  )
}

// ══════════════ VIEW COMPONENTS ══════════════

function TodayView({ events, now, todayStr, openDetail }: {
  events: Event[], now: Date, todayStr: string,
  openDetail: (id: number) => void
}) {
  const dayEvs = events.filter(e => e.date === todayStr).sort((a, b) => (a.time || '') > (b.time || '') ? 1 : -1)
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

function MonthView({ events, viewDate, now, openAddModal, openDetail }: {
  events: Event[], viewDate: Date, now: Date,
  openAddModal: (date?: string, time?: string) => void, openDetail: (id: number) => void
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
    cells.push(
      <div key={ds} className={`day-cell${isToday ? ' today' : ''}`} onClick={() => openAddModal(ds)}>
        <div className="day-num">{d}</div>
        {dayEvs.slice(0, 3).map(e => (
          <div key={e.id} className="day-event" style={{ background: COLORS[e.who] || COLORS.family }}
            onClick={ev => { ev.stopPropagation(); openDetail(e.id) }}>{e.title}</div>
        ))}
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

function WeekView({ events, viewDate, now, openAddModal, openDetail }: {
  events: Event[], viewDate: Date, now: Date,
  openAddModal: (date?: string, time?: string) => void, openDetail: (id: number) => void
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
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AgendaView({ events, now, openDetail }: {
  events: Event[], now: Date,
  openDetail: (id: number) => void
}) {
  const todayStr = fmtDate(now)
  const byDay: Record<string, Event[]> = {}

  events.filter(e => e.date >= todayStr).sort((a, b) => a.date > b.date ? 1 : a.date < b.date ? -1 : (a.time || '') > (b.time || '') ? 1 : -1)
    .forEach(e => { if (!byDay[e.date]) byDay[e.date] = []; byDay[e.date].push(e) })

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
            {byDay[ds].map((e) => (
              <div key={e.id} className="agenda-event" onClick={() => openDetail(e.id)}>
                <div className="agenda-dot" style={{ background: COLORS[e.who] || COLORS.family }} />
                <div className="agenda-time">{fmtTime(e.time) || 'All day'}</div>
                <div>
                  <div className="agenda-title">{e.title}</div>
                  <div className="agenda-who">{e.who}{e.address ? ' \u{1F4CD}' : ''}</div>
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
