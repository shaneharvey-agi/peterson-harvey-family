export function fmtDate(d: Date): string {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  )
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-')
  return new Date(+y, +m - 1, +d)
}

export function fmtTime(t: string | null): string {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hr = +h
  return (hr % 12 || 12) + ':' + (m || '00') + (hr < 12 ? 'am' : 'pm')
}

export function fmtDateLong(s: string): string {
  return parseDate(s).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function getWeekDates(now: Date): string[] {
  const d: string[] = []
  const s = new Date(now)
  s.setDate(now.getDate() - now.getDay())
  for (let i = 0; i < 7; i++) {
    const x = new Date(s)
    x.setDate(s.getDate() + i)
    d.push(fmtDate(x))
  }
  return d
}
