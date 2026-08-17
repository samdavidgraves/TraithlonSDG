// Date helpers. Everything is handled as a local-midnight Date plus an
// ISO 'YYYY-MM-DD' key so nothing shifts across timezones.

export const DAY_MS = 86400000

export function ymd(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseYmd(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date, n) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() + n)
  return d
}

export function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Whole days between two dates (b - a), ignoring DST wobble. */
export function daysBetween(a, b) {
  return Math.round((startOfDay(b) - startOfDay(a)) / DAY_MS)
}

/** Monday-based index: Mon = 0 … Sun = 6 */
export function mondayIndex(date) {
  return (date.getDay() + 6) % 7
}

export function startOfWeek(date) {
  return addDays(startOfDay(date), -mondayIndex(date))
}

export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function fmtShort(date) {
  return `${DAY_LABELS[mondayIndex(date)]} ${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3)}`
}

export function fmtLong(date) {
  return `${DAY_LABELS[mondayIndex(date)]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

export function fmtRange(a, b) {
  const sameMonth = a.getMonth() === b.getMonth()
  const left = `${a.getDate()} ${sameMonth ? '' : MONTHS[a.getMonth()].slice(0, 3)}`.trim()
  return `${left} – ${b.getDate()} ${MONTHS[b.getMonth()].slice(0, 3)}`
}

/** Seconds → m:ss (or h:mm:ss past an hour). */
export function fmtClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

/** Seconds → "42 min" / "1h 05" for summaries. */
export function fmtDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0))
  if (s < 60) return `${s}s`
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}`
}
