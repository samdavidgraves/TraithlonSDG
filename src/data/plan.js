import { ymd, parseYmd, mondayIndex, addDays } from '../lib/date'
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
// The available week: two weeknights and one weekend day. Everything —
// including KAZ — has to fit inside these three slots, so the templates are
// built per slot rather than per day. Change the days or lengths here and the
// whole plan follows.
// ---------------------------------------------------------------------------

export const SLOTS = {
  night1: 1, // Tuesday   (Monday = 0)
  night2: 3, // Thursday
  weekend: 6, // Sunday
  nightMinutes: 45,
  weekendMinutes: 90,
}

/** 'n1' | 'n2' | 'w' for a training slot, null for a rest day. */
function slotRole(dayIdx) {
  if (dayIdx === SLOTS.night1) return 'n1'
  if (dayIdx === SLOTS.night2) return 'n2'
  if (dayIdx === SLOTS.weekend) return 'w'
  return null
}

export const SLOT_DAY_LABELS = ['Tue', 'Thu', 'Sun']

// ---------------------------------------------------------------------------
// Phase 1 — walk-run progression, introduced in phase week 5 on the weekend
// slot and advanced one step a week, but only while the KAZ pain check-ins
// stay clean (see `runGate` in lib/derive.js — a failing gate holds the step).
// Sized to share the 90-minute weekend slot with the bike.
// ---------------------------------------------------------------------------

export const RUN_PROGRESSION = [
  { week: 5, label: '1 min run / 2 min walk × 7', minutes: 21 },
  { week: 6, label: '1 min run / 2 min walk × 8', minutes: 24 },
  { week: 7, label: '2 min run / 2 min walk × 6', minutes: 24 },
  { week: 8, label: '2 min run / 2 min walk × 7', minutes: 28 },
  { week: 9, label: '3 min run / 2 min walk × 6', minutes: 30 },
  { week: 10, label: '3 min run / 1 min walk × 7', minutes: 28 },
  { week: 11, label: '4 min run / 1 min walk × 6', minutes: 30 },
  { week: 12, label: '5 min run / 1 min walk × 5', minutes: 30 },
  { week: 13, label: '6 min run / 1 min walk × 4', minutes: 28 },
  { week: 14, label: '8 min run / 1 min walk × 3', minutes: 27 },
  { week: 15, label: '10 min run / 1 min walk × 3', minutes: 33 },
  { week: 16, label: '12 min run / 1 min walk × 2', minutes: 26 },
  { week: 17, label: '15 min run / 1 min walk × 2', minutes: 32 },
  { week: 18, label: '25 min continuous, easy', minutes: 25 },
]

export const RUN_START_WEEK = RUN_PROGRESSION[0].week

/** Progression step for a phase-1 week, optionally held back `hold` steps. */
export function runStepFor(phaseWeek, hold = 0) {
  if (phaseWeek < RUN_START_WEEK) return null
  const idx = Math.max(0, Math.min(RUN_PROGRESSION.length - 1, phaseWeek - RUN_START_WEEK) - hold)
  return RUN_PROGRESSION[idx]
}

// ---------------------------------------------------------------------------
// Phase 4 — race build. The weeknight run rebuilds week by week; the weekend
// slot alternates a long ride with a bike→run brick.
// ---------------------------------------------------------------------------

const P4_NIGHT_RUN = [22, 25, 28, 30, 30, 30, 20, 12]
const P4_TAPER = { 7: 0.7, 8: 0.5 } // phase week → volume multiplier

/**
 * Weekend slot rotation. With one long session a week, a brick every 10 days
 * isn't available — this alternates instead, which lands 4 bricks in 8 weeks.
 */
export const BRICK_WEEKS = [2, 4, 6, 7]

/**
 * Taper scaling, floored at 15 min — a taper shortens sessions, it doesn't
 * turn them into 5-minute tokens that aren't worth changing kit for.
 */
const scale = (phaseWeek, minutes) =>
  Math.max(15, Math.round((minutes * (P4_TAPER[phaseWeek] ?? 1)) / 5) * 5)

// ---------------------------------------------------------------------------
// Phase 3 — micro-session menu (no weekly template, no fixed slots)
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
// Weekly templates, one per slot
// ---------------------------------------------------------------------------

function phase1Slot(role, phaseWeek) {
  const step = runStepFor(phaseWeek)
  if (role === 'n1') {
    return [
      s('kaz', 'KAZ — full routine', 'All 10 steps at home. No travel, no kit — this is the knee investment.', 45, {
        kaz: true,
      }),
    ]
  }
  if (role === 'n2') {
    return [
      s('kaz', 'KAZ Express', 'Steps 1–4 before you leave: tib raise → FHL → tib raise → KOT calf.', 10, {
        kaz: true,
        kazSubset: 'express',
      }),
      s('swim', 'Swim — technique', 'Drills: catch-up, single-arm, 6-kick switch. Short reps, long rests.', 35),
    ]
  }
  // Weekend: mobility, then run on fresh legs, then whatever bike time is left.
  const mobility = 15
  const runMinutes = step ? step.minutes : 0
  const bike = Math.max(30, SLOTS.weekendMinutes - mobility - runMinutes)
  const out = [
    s('mobility', 'KAZ Mobility', 'Elephant walk, couch stretch, figure-4. Warm-up, not an afterthought.', mobility, {
      kaz: true,
      kazSubset: 'mobility',
    }),
  ]
  if (step) {
    out.push(
      s('run', 'Run — walk/run intervals', step.label, runMinutes, { runStep: phaseWeek, gated: true }),
    )
  }
  out.push(
    s(
      'bike',
      'Bike — easy aerobic',
      step
        ? 'Straight after the run. Zone 2, spin high cadence — this doubles as brick practice.'
        : 'Zone 2, spin high cadence. Running starts in week 5.',
      bike,
    ),
  )
  return out
}

function phase2Slot(role) {
  if (role === 'n1') {
    return [
      s('kaz', 'KAZ — full routine', 'All 10 steps. This is the one that never gets dropped.', 45, { kaz: true }),
    ]
  }
  if (role === 'n2') {
    return [s('swim', 'Swim — easy', 'Continuous easy laps. No sets, no watch.', 35)]
  }
  return [
    s('mobility', 'KAZ Mobility', 'Elephant walk, couch stretch, figure-4.', 15, { kaz: true, kazSubset: 'mobility' }),
    s('bike', 'Bike — easy', 'Steady aerobic spin, flat route. Nothing hard.', 60),
    s('run', 'Run — optional, short & easy', '15 min very easy, or swap for a walk. Skip it freely.', 15, {
      optional: true,
    }),
  ]
}

function phase4Slot(role, phaseWeek, isRaceDay) {
  if (isRaceDay) {
    return [
      s('race', 'RACE DAY — Quarter Triathlon', 'Swim, bike, run. Ten months of work. Go and collect it.', 180, {
        race: true,
      }),
    ]
  }
  const nightRun = P4_NIGHT_RUN[phaseWeek - 1] ?? 25

  if (role === 'n1') {
    return [
      s('kaz', 'KAZ — maintenance', 'All 10 steps, brisk. Never dropped, even in taper.', 15, { kaz: true }),
      s('run', 'Run — steady', `${scale(phaseWeek, nightRun)} min continuous, controlled.`, scale(phaseWeek, nightRun)),
    ]
  }
  if (role === 'n2') {
    return [
      s('swim', 'Swim — race pace', '8–12 × 100 m at race effort, 20 sec rest. Practise sighting.', scale(phaseWeek, 45)),
    ]
  }

  const mobility = 10
  if (BRICK_WEEKS.includes(phaseWeek)) {
    const bike = scale(phaseWeek, 55)
    const run = scale(phaseWeek, 25)
    return [
      s('mobility', 'KAZ Mobility', 'Ten minutes on the mat before you ride.', mobility, {
        kaz: true,
        kazSubset: 'mobility',
      }),
      s('brick', 'Brick — bike → run', `${bike} min bike straight into ${run} min run. Under 2 min in transition.`, bike + run, {
        brick: true,
      }),
    ]
  }
  return [
    s('mobility', 'KAZ Mobility', 'Ten minutes on the mat before you ride.', mobility, {
      kaz: true,
      kazSubset: 'mobility',
    }),
    s('bike', 'Bike — long aerobic', 'Race-course terrain if you can. Practise fuelling and drinking on the move.', scale(phaseWeek, 80)),
  ]
}

// ---------------------------------------------------------------------------
// Public: the default plan for a date
// ---------------------------------------------------------------------------

/**
 * Default (un-edited) planned sessions for a date. Returns [] for the four
 * non-slot days and for Phase 3, which is deliberately template-free.
 */
export function defaultSessionsFor(date) {
  const phase = phaseForDate(date)
  if (!phase) return []
  if (phase.id === 3) return []

  const role = slotRole(mondayIndex(date))
  const isRaceDay = ymd(date) === RACE_DAY
  if (!role && !isRaceDay) return []

  const pWeek = phaseWeekNumber(date, phase)
  if (phase.id === 1) return phase1Slot(role, pWeek)
  if (phase.id === 2) return phase2Slot(role)
  return phase4Slot(role, pWeek, isRaceDay)
}

/** Stable ids so completions survive re-renders: `2026-08-11#0`. */
export function withIds(sessions, dateKey) {
  return sessions.map((x, i) => ({ ...x, id: `${dateKey}#${i}` }))
}

export function weekDates(weekStart) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

/** All plan weeks, grouped for the calendar view. */
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
