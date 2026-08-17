import { useMemo, useState } from 'react'
import { useStore } from '../store/context'
import {
  phaseForDate,
  phaseWeekNumber,
  planWeekNumber,
  TOTAL_WEEKS,
  RACE_DATE,
  BABY_DUE_DATE,
  PLAN_START_DATE,
  PLAN_END_DATE,
} from '../data/phases'
import { MICRO_SESSIONS, typeMeta } from '../data/plan'
import { applyGate, computeStreak, monthLogCount, runGate, sessionsForDate, weekStats } from '../lib/derive'
import { daysBetween, fmtLong, startOfWeek, fmtDuration } from '../lib/date'
import { PhaseChip, ProgressRing, EmptyState } from '../components/ui'
import SessionRow from '../components/SessionRow'
import KazSession from '../components/KazSession'

export default function TodayView({ onGoCalendar }) {
  const store = useStore()
  const { today, todayKey, logs, overrides, toggleSession, addLog } = store
  const [kaz, setKaz] = useState(null) // {planId, subset, title}

  const phase = phaseForDate(today)
  const pWeek = phaseWeekNumber(today, phase)
  const planWeek = planWeekNumber(today)
  const gate = useMemo(() => runGate(logs, today), [logs, today])

  const sessions = useMemo(
    () => sessionsForDate(today, overrides).map((s) => applyGate(s, pWeek, gate)),
    [today, overrides, pWeek, gate],
  )
  const todaysLogs = logs.filter((l) => l.date === todayKey)
  const doneIds = new Set(todaysLogs.map((l) => l.planId).filter(Boolean))

  const wStats = useMemo(() => weekStats(startOfWeek(today), logs, overrides), [today, logs, overrides])
  const streak = useMemo(() => computeStreak(logs, overrides, today), [logs, overrides, today])
  const monthCount = useMemo(() => monthLogCount(logs, today), [logs, today])
  const toRace = daysBetween(today, RACE_DATE)
  const toBaby = daysBetween(today, BABY_DUE_DATE)

  const beforePlan = today < PLAN_START_DATE
  const afterPlan = today > PLAN_END_DATE

  const logMicro = (m) => {
    if (m.kazSubset) {
      setKaz({ subset: m.kazSubset, title: m.title })
      return
    }
    addLog({ date: todayKey, type: m.type, title: m.title, minutes: m.minutes, source: 'micro', microId: m.id })
  }

  return (
    <div className="space-y-4 px-4 pb-28 pt-3">
      {/* ---------------- Header ---------------- */}
      <header className="fade-up">
        <div className="flex items-center justify-between">
          <div>
            <div className="label">{fmtLong(today)}</div>
            <h1 className="mt-1 text-3xl font-black leading-none tracking-tight">
              {phase ? phase.name : beforePlan ? 'Pre-season' : 'Race complete'}
            </h1>
          </div>
          <ProgressRing
            size={72}
            stroke={7}
            value={phase?.flexible ? Math.min(100, monthCount * 8) : wStats.pct}
            color={phase?.color || '#a8ff00'}
          >
            <div className="text-center leading-none">
              <div className="tabnum text-lg font-black">{phase?.flexible ? monthCount : `${wStats.pct}%`}</div>
              <div className="mt-0.5 text-[8px] font-bold uppercase tracking-widest text-white/40">
                {phase?.flexible ? 'logged' : 'week'}
              </div>
            </div>
          </ProgressRing>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <PhaseChip phase={phase} week={pWeek} />
          {planWeek && <span className="pill bg-ink-800 text-white/50">Week {planWeek} / {TOTAL_WEEKS}</span>}
          <span className="pill bg-ink-800 text-white/50">{toRace} days to race</span>
        </div>
      </header>

      {/* ---------------- Phase framing ---------------- */}
      {phase && (
        <div
          className="fade-up rounded-2xl p-4"
          style={{ background: `${phase.color}12`, border: `1px solid ${phase.color}33` }}
        >
          <p className="text-[15px] font-bold leading-snug" style={{ color: phase.color }}>
            {phase.tagline}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-white/55">{phase.focus}</p>
          {phase.id === 2 && toBaby > 0 && (
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-white/40">
              {toBaby} days to the due date
            </p>
          )}
        </div>
      )}

      {/* ---------------- Run gate (Phase 1) ---------------- */}
      {phase?.id === 1 && sessions.some((s) => s.gated) && gate.status !== 'clear' && (
        <div className="fade-up rounded-2xl border border-[#ffd23f]/35 bg-[#ffd23f]/10 p-4">
          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#ffd23f]">{gate.title}</div>
          <p className="mt-1 text-sm leading-relaxed text-white/70">{gate.reason}</p>
        </div>
      )}

      {/* ---------------- Streak + quick stats ---------------- */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="card p-3">
          <div className="tabnum text-2xl font-black leading-none text-acid">{streak}</div>
          <div className="label mt-1.5">Day streak</div>
        </div>
        <div className="card p-3">
          <div className="tabnum text-2xl font-black leading-none">
            {wStats.done}
            {!phase?.flexible && <span className="text-white/30">/{wStats.planned}</span>}
          </div>
          <div className="label mt-1.5">{phase?.flexible ? 'This week' : 'Week done'}</div>
        </div>
        <div className="card p-3">
          <div className="tabnum text-2xl font-black leading-none">{monthCount}</div>
          <div className="label mt-1.5">This month</div>
        </div>
      </div>

      {phase?.flexible && streak > 0 && (
        <p className="-mt-1 px-1 text-xs text-white/35">Streak is paused during Survival Mode — quiet days don’t break it.</p>
      )}

      {/* ---------------- Today's sessions ---------------- */}
      {!phase?.flexible && (
        <section className="space-y-2.5">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="label">Today’s plan</h2>
            {sessions.length > 0 && (
              <button onClick={onGoCalendar} className="text-xs font-bold text-acid">
                Edit week →
              </button>
            )}
          </div>

          {sessions.length === 0 ? (
            <EmptyState
              icon="◍"
              title={beforePlan ? 'The plan starts 3 Aug 2026' : afterPlan ? 'You raced. Go and rest.' : 'Rest day'}
              body={
                beforePlan || afterPlan
                  ? 'Open the Calendar to look through the macrocycle.'
                  : 'Nothing scheduled. Walk, stretch, sleep — recovery is part of the plan.'
              }
            />
          ) : (
            sessions.map((sess) => (
              <SessionRow
                key={sess.id}
                session={sess}
                done={doneIds.has(sess.id)}
                onToggle={() => toggleSession(todayKey, sess)}
                onOpenKaz={
                  sess.type === 'kaz'
                    ? () => setKaz({ planId: sess.id, title: sess.title })
                    : undefined
                }
              />
            ))
          )}
        </section>
      )}

      {/* ---------------- Phase 3: micro-session menu ---------------- */}
      {phase?.flexible && (
        <section className="space-y-2.5">
          <div className="px-1">
            <h2 className="label">Micro-sessions</h2>
            <p className="mt-1 text-sm text-white/45">
              Fifteen minutes counts. Tap anything you managed today — there’s no target to hit.
            </p>
          </div>
          {MICRO_SESSIONS.map((m) => {
            const meta = typeMeta(m.type)
            const count = logs.filter((l) => l.microId === m.id && l.date === todayKey).length
            return (
              <button
                key={m.id}
                onClick={() => logMicro(m)}
                className="card flex w-full items-center gap-3 p-4 text-left active:scale-[0.99]"
                style={{ borderLeft: `3px solid ${meta.color}` }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{m.title}</span>
                    <span className="tabnum text-xs font-bold text-white/35">{m.minutes} min</span>
                    {count > 0 && <span className="pill bg-acid/15 text-acid">×{count} today</span>}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-white/50">{m.detail}</p>
                </div>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink-800 text-lg font-black text-acid">
                  +
                </span>
              </button>
            )
          })}
        </section>
      )}

      {/* ---------------- Logged today ---------------- */}
      {todaysLogs.length > 0 && (
        <section className="space-y-2">
          <h2 className="label px-1">Logged today</h2>
          <div className="card divide-y divide-ink-800">
            {todaysLogs.map((l) => (
              <div key={l.id} className="flex items-center gap-3 px-4 py-3">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: typeMeta(l.type).color }} />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{l.title}</span>
                {l.durationSec ? (
                  <span className="tabnum text-sm text-acid">{fmtDuration(l.durationSec)}</span>
                ) : l.minutes ? (
                  <span className="tabnum text-sm text-white/35">{l.minutes} min</span>
                ) : null}
                <button onClick={() => store.removeLog(l.id)} className="text-white/25 active:text-white/60">
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <KazSession
        open={!!kaz}
        onClose={() => setKaz(null)}
        dateKey={todayKey}
        planId={kaz?.planId}
        subset={kaz?.subset}
        title={kaz?.title || 'KAZ Session'}
      />
    </div>
  )
}
