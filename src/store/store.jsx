import { useCallback, useEffect, useMemo, useState } from 'react'
import { ymd, startOfDay, parseYmd } from '../lib/date'
import { StoreContext } from './context'
import { phaseForDate, planWeekNumber, phaseWeekNumber } from '../data/phases'

const KEY = 'kneesup-tri.v1'

const EMPTY = {
  version: 1,
  logs: [],
  overrides: {},
  settings: { debugDate: null },
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw)
    return { ...EMPTY, ...parsed, settings: { ...EMPTY.settings, ...(parsed.settings || {}) } }
  } catch {
    return EMPTY
  }
}

function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* quota / private mode — the app still works for the session */
  }
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(load)

  useEffect(() => save(state), [state])

  /**
   * `today` is normally the real date. The plan runs Aug 2026 → Jun 2027, so a
   * debug date lets you look at the app from inside any phase without waiting.
   */
  const today = useMemo(
    () => (state.settings.debugDate ? parseYmd(state.settings.debugDate) : startOfDay(new Date())),
    [state.settings.debugDate],
  )

  const addLog = useCallback((entry) => {
    const date = entry.date || ymd(startOfDay(new Date()))
    const dt = parseYmd(date)
    const phase = phaseForDate(dt)
    const log = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      date,
      phaseId: phase?.id ?? null,
      weekNumber: planWeekNumber(dt),
      phaseWeek: phaseWeekNumber(dt),
      ...entry,
    }
    setState((st) => ({ ...st, logs: [log, ...st.logs] }))
    return log
  }, [])

  const removeLog = useCallback((id) => {
    setState((st) => ({ ...st, logs: st.logs.filter((l) => l.id !== id) }))
  }, [])

  const updateLog = useCallback((id, patch) => {
    setState((st) => ({ ...st, logs: st.logs.map((l) => (l.id === id ? { ...l, ...patch } : l)) }))
  }, [])

  /** Toggle a planned session complete/incomplete for a date. */
  const toggleSession = useCallback(
    (dateKey, session) => {
      setState((st) => {
        const existing = st.logs.find((l) => l.planId === session.id)
        if (existing) return { ...st, logs: st.logs.filter((l) => l.id !== existing.id) }
        const dt = parseYmd(dateKey)
        const phase = phaseForDate(dt)
        const log = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
          date: dateKey,
          planId: session.id,
          type: session.type,
          title: session.title,
          minutes: session.minutes,
          source: 'plan',
          phaseId: phase?.id ?? null,
          weekNumber: planWeekNumber(dt),
          phaseWeek: phaseWeekNumber(dt),
        }
        return { ...st, logs: [log, ...st.logs] }
      })
    },
    [],
  )

  /** Replace a day's sessions (week editor). Pass null to restore the default. */
  const setDayOverride = useCallback((dateKey, sessions) => {
    setState((st) => {
      const overrides = { ...st.overrides }
      if (sessions === null) delete overrides[dateKey]
      else overrides[dateKey] = sessions.map(({ id: _id, ...rest }) => rest)
      return { ...st, overrides }
    })
  }, [])

  const setDebugDate = useCallback((iso) => {
    setState((st) => ({ ...st, settings: { ...st.settings, debugDate: iso } }))
  }, [])

  const resetAll = useCallback(() => {
    setState({ ...EMPTY, settings: { ...EMPTY.settings } })
  }, [])

  /** Everything worth keeping, as JSON — phone browsers do evict localStorage. */
  const exportData = useCallback(
    () => JSON.stringify({ ...state, app: 'kneesup-tri', exportedAt: new Date().toISOString() }, null, 2),
    [state],
  )

  /** Restore a backup. Returns { ok, message } rather than throwing at the UI. */
  const importData = useCallback((json) => {
    let parsed
    try {
      parsed = JSON.parse(json)
    } catch {
      return { ok: false, message: 'That file isn’t valid JSON.' }
    }
    if (!parsed || !Array.isArray(parsed.logs)) {
      return { ok: false, message: 'No session log found in that file.' }
    }
    setState({
      version: 1,
      logs: parsed.logs,
      overrides: parsed.overrides && typeof parsed.overrides === 'object' ? parsed.overrides : {},
      settings: { ...EMPTY.settings, ...(parsed.settings || {}) },
    })
    return { ok: true, message: `Restored ${parsed.logs.length} sessions.` }
  }, [])

  const value = useMemo(
    () => ({
      ...state,
      today,
      todayKey: ymd(today),
      addLog,
      removeLog,
      updateLog,
      toggleSession,
      setDayOverride,
      setDebugDate,
      resetAll,
      exportData,
      importData,
    }),
    [
      state,
      today,
      addLog,
      removeLog,
      updateLog,
      toggleSession,
      setDayOverride,
      setDebugDate,
      resetAll,
      exportData,
      importData,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
