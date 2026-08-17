import { parseYmd, ymd, daysBetween, mondayIndex, addDays } from '../lib/date'
import { PHASES, phaseForDate, phaseWeekNumber, RACE_DAY } from './phases'

// ---------------------------------------------------------------------------
// Session types
// ---------------------------------------------------------------------------

export const SESSION_TYPES = {
  kaz: { label: 'KAZ', color: '#a8ff00', icon: '◈' },
  swim: { label: 'Swim', color: '#4fc3f7', icon: '≈' },
  bike: { label: 'Bike', color: '#ff9f45', icon: '◎' },
  run: { label: 'Run', color: '#ff5c8a', icon: '➤' },
  brick: { label: 'Brick', color: '#c792ea', icon: '⚡' },
  walk: { label: 'Walk', color: '#9ccc65', icon: '⤳' },
  mobility: { label: 'Mobility', color: '#80cbc4', icon: '◇' },
  core: { label: 'Core', color: '#ffd23f', icon: '▣' },
  race: { label: 'Race', color: '#ffffff', icon: '★' },
}

export function typeMeta(type) {
  return SESSION_TYPES[type] || { label: type, color: '#888888', icon: '•' }
}

const s = (type, title, detail, minutes, extra = {}) => ({
  type,
  title,
  detail,
  minutes,
  ...extra,
})

// ---------------------------------------------------------------------------
// Phase 1 — walk-run progression. Running is introduced in phase week 5 and
// advances one step per week, but only while the KAZ pain check-ins stay
// clean (see `runGateFor` in lib/gate.js — a failing gate holds the step).
// ---------------------------------------------------------------------------

export const RUN_PROGRESSION = [
  { week: 5, label: '1 min run / 2 min walk × 8', minutes: 24 },
  { week: 6, label: '1 min run / 2 min walk × 10', minutes: 30 },
  { week: 7, label: '2 min run / 2 min walk × 8', minutes: 32 },
  { week: 8, label: '2 min run / 2 min walk × 9', minutes: 36 },
  { week: 9, label: '3 min run / 2 min walk × 7', minutes: 35 },
  { week: 10, label: '3 min run / 1 min walk × 8', minutes: 32 },
  { week: 11, label: '4 min run / 1 min walk × 7', minutes: 35 },
  { week: 12, label: '5 min run / 1 min walk × 6', minutes: 36 },
  { week: 13, label: '6 min run / 1 min walk × 5', minutes: 35 },
  { week: 14, label: '8 min run / 1 min walk × 4', minutes: 36 },
  { week: 15, label: '10 min run / 1 min walk × 3', minutes: 33 },
  { week: 16, label: '12 min run / 1 min walk × 3', minutes: 39 },
  { week: 17, label: '15 min run / 1 min walk × 2', minutes: 32 },
  { week: 18, label: '20 min run / 1 min walk × 2', minutes: 42 },
  { week: 19, label: '25 min continuous, easy', minutes: 25 },
  { week: 20, label: '30 min continuous, easy', minutes: 30 },
  { week: 21, label: '30 min continuous + 4 × 20 sec strides', minutes: 34 },
  { week: 22, label: '35 min continuous, easy', minutes: 35 },
]

export const RUN_START_WEEK = RUN_PROGRESSION[0].week

/** Progression step for a phase-1 week, optionally held back `hold` steps. */
export function runStepFor(phaseWeek, hold = 0) {
  if (phaseWeek < RUN_START_WEEK) return null
  const idx = Math.max(0, Math.min(RUN_PROGRESSION.length - 1, phaseWeek - RUN_START_WEEK) - hold)
  return RUN_PROGRESSION[idx]
}

// ---------------------------------------------------------------------------
// Phase 4 — run rebuild + taper
// ---------------------------------------------------------------------------

const P4_LONG_RUN = [30, 35, 40, 45, 50, 55, 60, 60, 40, 25]
const P4_MID_RUN = [20, 25, 25, 30, 30, 35, 35, 35, 25, 20]
const P4_TAPER = { 9: 0.7, 10: 0.5 } // phase week → volume multiplier

const taperScale = (phaseWeek, minutes) =>
  Math.round((minutes * (P4_TAPER[phaseWeek] ?? 1)) / 5) * 5

/** Bricks land every 10 days through the build, none inside the last 13 days. */
export const BRICK_OFFSETS = [6, 16, 26, 36, 46, 56]

// ---------------------------------------------------------------------------
// Phase 3 — micro-session menu (no weekly template)
// ---------------------------------------------------------------------------

export const MICRO_SESSIONS = [
  {
    id: 'kaz-express',
    type: 'kaz',
    title: 'KAZ Express',
    detail: 'Tib raise → FHL → tib raise → KOT calf. Straight through.',
    minutes: 15,
    kazSubset: 'express',
  },
  {
    id: 'kaz-knees',
    type: 'kaz',
    title: 'Knee Strength Mini',
    detail: 'Patrick step + ATG split squat, pain-free range only.',
    minutes: 15,
    kazSubset: 'knees',
  },
  {
    id: 'kaz-mobility',
    type: 'mobility',
    title: 'KAZ Mobility',
    detail: 'Elephant walk, couch stretch, figure-4. Do it on the floor next to the cot.',
    minutes: 15,
    kazSubset: 'mobility',
  },
  {
    id: 'pram-walk',
    type: 'walk',
    title: 'Pram Walk',
    detail: 'Easy walk with the buggy. Counts. Fully counts.',
    minutes: 20,
  },
  {
    id: 'short-spin',
    type: 'bike',
    title: 'Short Spin',
    detail: 'Turbo or road, easy gear, conversational.',
    minutes: 20,
  },
  {
    id: 'core-lsit',
    type: 'core',
    title: 'Core + L-Sit',
    detail: 'L-sit holds and dead bugs. Ten minutes on the mat.',
    minutes: 10,
  },
  {
    id: 'micro-swim',
    type: 'swim',
    title: 'Pool Window',
    detail: 'If a window opens: easy technique laps, no set to finish.',
    minutes: 20,
  },
]

export const MICRO_BY_ID = Object.fromEntries(MICRO_SESSIONS.map((m) => [m.id, m]))

// ---------------------------------------------------------------------------
// Weekly templates
// ---------------------------------------------------------------------------

function phase1Day(dayIdx, phaseWeek) {
  const step = runStepFor(phaseWeek)
  switch (dayIdx) {
    case 0:
      return [s('kaz', 'KAZ — full routine', 'All 10 steps, unhurried.', 45, { kaz: true })]
    case 1:
      return [s('swim', 'Swim — technique', 'Drills: catch-up, single-arm, 6-kick switch. Short reps, long rests.', 45)]
    case 2:
      return [
        s('kaz', 'KAZ — full routine', 'All 10 steps.', 45, { kaz: true }),
        s('bike', 'Bike — easy aerobic', 'Zone 2, spin high cadence. Nothing hard.', 45),
      ]
    case 3:
      return [s('swim', 'Swim — technique', 'Drills + 8–10 × 50 m easy on form.', 45)]
    case 4:
      return [s('kaz', 'KAZ — full routine', 'All 10 steps.', 45, { kaz: true })]
    case 5:
      return [s('bike', 'Bike — long easy', 'Aerobic ride, flat to rolling, fuel every 45 min.', phaseWeek < 8 ? 75 : 90)]
    case 6:
      return step
        ? [s('run', 'Run — walk/run intervals', step.label, step.minutes, { runStep: phaseWeek, gated: true })]
        : [
            s('walk', 'Walk — brisk', 'Running starts in week 5. Brisk walk, easy on the knees.', 40, {
              optional: true,
            }),
          ]
    default:
      return []
  }
}

function phase2Day(dayIdx) {
  switch (dayIdx) {
    case 0:
      return [s('kaz', 'KAZ — full routine', 'All 10 steps. This is the one that never gets dropped.', 40, { kaz: true })]
    case 2:
      return [s('swim', 'Swim — easy', 'Continuous easy laps. No sets, no watch.', 35)]
    case 3:
      return [s('kaz', 'KAZ — full routine', 'All 10 steps.', 40, { kaz: true })]
    case 5:
      return [s('bike', 'Bike — easy', 'Steady aerobic spin, flat route.', 60)]
    case 6:
      return [
        s('run', 'Run — optional, short & easy', '15–20 min very easy, or swap for a walk. Skip it freely.', 20, {
          optional: true,
        }),
      ]
    default:
      return []
  }
}

function phase4Day(dayIdx, phaseWeek, isRaceDay) {
  const longRun = P4_LONG_RUN[phaseWeek - 1] ?? 40
  const midRun = P4_MID_RUN[phaseWeek - 1] ?? 25
  if (isRaceDay) {
    return [
      s('race', 'RACE DAY — Quarter Triathlon', 'Swim, bike, run. Ten months of work. Go and collect it.', 180, {
        race: true,
      }),
    ]
  }
  switch (dayIdx) {
    case 0:
      return [s('kaz', 'KAZ — maintenance', 'All 10 steps. Never dropped, even in taper.', 40, { kaz: true })]
    case 1:
      return [s('swim', 'Swim — intervals', '8–12 × 100 m at race effort, 20 sec rest.', taperScale(phaseWeek, 45))]
    case 2:
      return [s('bike', 'Bike — tempo', '3 × 10 min at steady-hard, 5 min easy between.', taperScale(phaseWeek, 60))]
    case 3:
      return [
        s('kaz', 'KAZ — maintenance', 'All 10 steps.', 40, { kaz: true }),
        s('run', 'Run — steady', `${taperScale(phaseWeek, midRun)} min continuous, controlled.`, taperScale(phaseWeek, midRun)),
      ]
    case 4:
      return [s('swim', 'Swim — continuous', 'Straight swim at race pace, sighting practice.', taperScale(phaseWeek, 45))]
    case 5:
      return [s('bike', 'Bike — long aerobic', 'Race-course terrain if you can. Practise fuelling.', taperScale(phaseWeek, 90))]
    case 6:
      return [s('run', 'Run — long continuous', `${taperScale(phaseWeek, longRun)} min easy-steady.`, taperScale(phaseWeek, longRun))]
    default:
      return []
  }
}

// ---------------------------------------------------------------------------
// Public: the default plan for a date
// ---------------------------------------------------------------------------

/**
 * Default (un-edited) planned sessions for a date. Returns [] for rest days
 * and for Phase 3, which is deliberately template-free.
 */
export function defaultSessionsFor(date) {
  const phase = phaseForDate(date)
  if (!phase) return []
  const dayIdx = mondayIndex(date)
  const pWeek = phaseWeekNumber(date, phase)

  if (phase.id === 1) return phase1Day(dayIdx, pWeek)
  if (phase.id === 2) return phase2Day(dayIdx)
  if (phase.id === 3) return []

  // Phase 4 — apply the brick overlay on top of the weekly template.
  const offset = daysBetween(parseYmd(phase.start), date)
  const isRaceDay = ymd(date) === RACE_DAY
  let sessions = phase4Day(dayIdx, pWeek, isRaceDay)
  if (!isRaceDay && BRICK_OFFSETS.includes(offset)) {
    const kaz = sessions.filter((x) => x.type === 'kaz')
    sessions = [
      ...kaz,
      s(
        'brick',
        'Brick — bike → run',
        `${taperScale(pWeek, 50)} min bike straight into ${taperScale(pWeek, 20)} min run. Rack the bike and go — under 2 min transition.`,
        taperScale(pWeek, 70),
        { brick: true },
      ),
    ]
  }
  return sessions
}

/** Stable ids so completions survive re-renders: `2026-08-11#0`. */
export function withIds(sessions, dateKey) {
  return sessions.map((x, i) => ({ ...x, id: `${dateKey}#${i}` }))
}

export function weekDates(weekStart) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

/** All 46 plan weeks, grouped for the calendar view. */
export function allPlanWeeks() {
  const out = []
  for (const phase of PHASES) {
    const start = parseYmd(phase.start)
    for (let w = 0; w < phase.weeks; w += 1) {
      const ws = addDays(start, w * 7)
      out.push({ phase, phaseWeek: w + 1, start: ws, end: addDays(ws, 6), key: ymd(ws) })
    }
  }
  return out
}
