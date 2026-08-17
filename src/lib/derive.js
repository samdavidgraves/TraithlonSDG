import { ymd, parseYmd, addDays, startOfDay, daysBetween, startOfWeek } from './date'
import { PHASES, phaseForDate, PLAN_START_DATE } from '../data/phases'
import { defaultSessionsFor, withIds, weekDates, runStepFor } from '../data/plan'

/**
 * The run-progression gate. Phase 1 only advances the walk-run intervals while
 * KAZ is going in clean — "only if KAZ sessions are consistently pain-free".
 * Looks back 14 days over KAZ check-ins.
 */
export function runGate(logs, today = new Date()) {
  const since = addDays(startOfDay(today), -13)
  const recent = logs.filter(
    (l) => l.pain && l.type === 'kaz' && parseYmd(l.date) >= since && parseYmd(l.date) <= startOfDay(today),
  )
  const hurt = recent.filter((l) => l.pain === 'hurt').length
  const mild = recent.filter((l) => l.pain === 'mild').length

  if (hurt > 0)
    return {
      status: 'regress',
      hold: 1,
      title: 'Run progression held back',
      reason: `You logged pain in the last 14 days. Drop back one step and regress the KAZ session — elevate, shorten the range, or assist — before adding run time.`,
    }
  if (recent.length < 2)
    return {
      status: 'unproven',
      hold: 1,
      title: 'Progression paused',
      reason: 'Fewer than 2 KAZ check-ins in the last 14 days. Repeat last week’s intervals until the knees are proven again.',
    }
  if (mild >= 2)
    return {
      status: 'repeat',
      hold: 0,
      title: 'Repeat, don’t advance',
      reason: 'Two or more sessions with mild discomfort. Hold this week’s intervals again next week rather than stepping up.',
    }
  return { status: 'clear', hold: 0, title: 'Progression on track', reason: 'KAZ check-ins are clean — step up as planned.' }
}

/**
 * Apply the gate to a gated (walk-run) session: when progression is held the
 * displayed prescription drops back to the earlier step.
 */
export function applyGate(session, phaseWeek, gate) {
  if (!session.gated || !gate || !gate.hold) return session
  const step = runStepFor(phaseWeek, gate.hold)
  if (!step) return session
  return { ...session, detail: step.label, minutes: step.minutes, held: true }
}

/** Planned sessions for a date, with any user edits applied. */
export function sessionsForDate(date, overrides) {
  const key = ymd(date)
  const base = overrides?.[key] ?? defaultSessionsFor(date)
  return withIds(base, key)
}

export function logsByDate(logs) {
  const map = {}
  for (const l of logs) (map[l.date] ||= []).push(l)
  return map
}

export function isSessionDone(logs, sessionId) {
  return logs.some((l) => l.planId === sessionId)
}

/** Week roll-up: planned vs done, for the progress ring. */
export function weekStats(weekStart, logs, overrides) {
  const days = weekDates(weekStart)
  let planned = 0
  let done = 0
  const byDate = logsByDate(logs)
  for (const d of days) {
    const key = ymd(d)
    const sessions = sessionsForDate(d, overrides).filter((x) => !x.optional)
    planned += sessions.length
    for (const sess of sessions) {
      if ((byDate[key] || []).some((l) => l.planId === sess.id)) done += 1
    }
  }
  const logged = days.reduce((n, d) => n + (byDate[ymd(d)] || []).length, 0)
  return { planned, done, logged, pct: planned ? Math.round((done / planned) * 100) : 0 }
}

/**
 * Phase-aware streak. A day keeps the streak alive if something was logged,
 * if nothing was planned (a rest day), or if it falls in Phase 3 — Newborn
 * Survival Mode never breaks a streak.
 */
export function computeStreak(logs, overrides, today = new Date()) {
  const byDate = logsByDate(logs)
  let streak = 0
  let cursor = startOfDay(today)
  let guard = 0
  while (cursor >= PLAN_START_DATE && guard < 500) {
    guard += 1
    const key = ymd(cursor)
    const logged = (byDate[key] || []).length > 0
    const phase = phaseForDate(cursor)
    const isToday = key === ymd(startOfDay(today))

    if (logged) {
      streak += 1
    } else if (phase?.flexible) {
      // neutral — survival mode doesn't punish
    } else if (sessionsForDate(cursor, overrides).filter((x) => !x.optional).length === 0) {
      // rest day — neutral
    } else if (isToday) {
      // today isn't over yet
    } else {
      break
    }
    cursor = addDays(cursor, -1)
  }
  return streak
}

export function monthLogCount(logs, date = new Date()) {
  const y = date.getFullYear()
  const m = date.getMonth()
  return logs.filter((l) => {
    const d = parseYmd(l.date)
    return d.getFullYear() === y && d.getMonth() === m
  }).length
}

export function totalsFor(logs) {
  const kaz = logs.filter((l) => l.type === 'kaz')
  const kazSeconds = kaz.reduce((n, l) => n + (l.durationSec || 0), 0)
  const timed = kaz.filter((l) => l.durationSec > 0)
  return {
    sessions: logs.length,
    kazSessions: kaz.length,
    kazSeconds,
    avgKazSeconds: timed.length ? Math.round(kazSeconds / timed.length) : 0,
    painFree: logs.filter((l) => l.pain === 'pain-free').length,
    hurt: logs.filter((l) => l.pain === 'hurt').length,
  }
}

/** Rolling 12-week bars for the history view. */
export function recentWeeks(logs, overrides, today = new Date(), count = 12) {
  const thisWeek = startOfWeek(startOfDay(today))
  const out = []
  for (let i = count - 1; i >= 0; i -= 1) {
    const ws = addDays(thisWeek, -i * 7)
    if (ws < PLAN_START_DATE) continue
    const phase = phaseForDate(ws)
    out.push({ start: ws, phase, ...weekStats(ws, logs, overrides) })
  }
  return out
}

export function phaseProgress(date = new Date()) {
  const phase = phaseForDate(date)
  if (!phase) return null
  const start = parseYmd(phase.start)
  const end = parseYmd(phase.end)
  const total = daysBetween(start, end) + 1
  const gone = Math.min(total, Math.max(0, daysBetween(start, date) + 1))
  return { phase, total, gone, pct: Math.round((gone / total) * 100) }
}

export const PHASE_LIST = PHASES
