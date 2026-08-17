import { parseYmd, daysBetween, addDays } from '../lib/date'

// ---------------------------------------------------------------------------
// The macrocycle: Mon 3 Aug 2026 → race day Sun 6 June 2027 (44 weeks).
//
// Counted backwards from race day, with two fixed anchors: the first weekend
// of June, and the due date at the end of February. Phases are contiguous so
// no week of the calendar is left unplanned.
// ---------------------------------------------------------------------------

export const PLAN_START = '2026-08-03' // Monday
export const RACE_DAY = '2027-06-06' // Sunday of the first weekend in June
export const BABY_DUE = '2027-02-28'

export const PHASES = [
  {
    id: 1,
    key: 'foundation',
    name: 'Foundation & Base',
    short: 'Foundation',
    start: '2026-08-03',
    end: '2026-12-06',
    weeks: 18,
    color: '#a8ff00',
    tagline: 'Build the knees, then build the engine.',
    focus:
      'KAZ three times a week, technique swimming, easy aerobic biking, and a walk-run progression that only advances while the knees stay quiet.',
  },
  {
    id: 2,
    key: 'taper-fatherhood',
    name: 'Taper into Fatherhood',
    short: 'Taper',
    start: '2026-12-07',
    end: '2027-02-14',
    weeks: 10,
    color: '#4fc3f7',
    tagline: 'Consistency over fitness — this phase is about staying injury-free and ready, not building.',
    focus:
      'Volume comes down on purpose, through the holidays and the third trimester. Two KAZ sessions, one easy swim, one easy bike. Running is optional and short. Bank sleep, not mileage.',
  },
  {
    id: 3,
    key: 'newborn',
    name: 'Newborn Survival Mode',
    short: 'Survival',
    start: '2027-02-15',
    end: '2027-04-11',
    weeks: 8,
    color: '#c792ea',
    tagline: 'Anything you log is a win. There is no target to miss.',
    focus:
      'No weekly template. A menu of 15–20 minute micro-sessions you log whenever a window opens. Streaks are paused for this phase.',
    flexible: true,
  },
  {
    id: 4,
    key: 'race-build',
    name: 'Race Build',
    short: 'Build',
    start: '2027-04-12',
    end: '2027-06-06',
    weeks: 8,
    color: '#ff9f45',
    tagline: 'Eight weeks. Rebuild, then sharpen.',
    focus:
      'Swim and bike twice a week, run volume rebuilt continuously, a brick every 10 days, and KAZ twice a week — maintenance that never gets dropped. Final two weeks taper.',
  },
]

export const PHASE_BY_ID = Object.fromEntries(PHASES.map((p) => [p.id, p]))

export const PLAN_START_DATE = parseYmd(PLAN_START)
export const PLAN_END_DATE = parseYmd(RACE_DAY)
export const RACE_DATE = parseYmd(RACE_DAY)
export const BABY_DUE_DATE = parseYmd(BABY_DUE)
export const TOTAL_WEEKS = PHASES.reduce((n, p) => n + p.weeks, 0)

export function phaseForDate(date) {
  for (const p of PHASES) {
    if (date >= parseYmd(p.start) && date <= parseYmd(p.end)) return p
  }
  return null
}

/** 1-based week number within the whole plan; null when outside it. */
export function planWeekNumber(date) {
  const d = daysBetween(PLAN_START_DATE, date)
  if (d < 0) return null
  const w = Math.floor(d / 7) + 1
  return w <= TOTAL_WEEKS ? w : null
}

/** 1-based week number within its own phase. */
export function phaseWeekNumber(date, phase = phaseForDate(date)) {
  if (!phase) return null
  return Math.floor(daysBetween(parseYmd(phase.start), date) / 7) + 1
}

export function weekStartForNumber(weekNumber) {
  return addDays(PLAN_START_DATE, (weekNumber - 1) * 7)
}

export function isInPlan(date) {
  return date >= PLAN_START_DATE && date <= PLAN_END_DATE
}

export function daysToRace(from = new Date()) {
  return daysBetween(from, RACE_DATE)
}
