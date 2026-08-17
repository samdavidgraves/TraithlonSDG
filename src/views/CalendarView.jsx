import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store/context'
import { allPlanWeeks, typeMeta } from '../data/plan'
import { PHASES, RACE_DAY, BABY_DUE, TOTAL_WEEKS } from '../data/phases'
import { sessionsForDate, weekStats } from '../lib/derive'
import { DAY_LABELS, fmtRange, MONTHS, parseYmd, startOfWeek, ymd } from '../lib/date'
import WeekSheet from './WeekSheet'

function WeekRow({ week, logs, overrides, isCurrent, onOpen }) {
  const stats = useMemo(() => weekStats(week.start, logs, overrides), [week.start, logs, overrides])
  const doneIds = useMemo(() => new Set(logs.map((l) => l.planId).filter(Boolean)), [logs])

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(week.start.getFullYear(), week.start.getMonth(), week.start.getDate() + i)
      const key = ymd(d)
      const sessions = sessionsForDate(d, overrides)
      const logged = logs.filter((l) => l.date === key)
      const done = sessions.filter((sx) => doneIds.has(sx.id)).length
      return { d, key, sessions, logged, done }
    })
  }, [week.start, overrides, logs, doneIds])

  const isRaceWeek = days.some((x) => x.key === RACE_DAY)
  const hasBaby = days.some((x) => x.key === BABY_DUE)

  return (
    <button
      onClick={onOpen}
      className={`card w-full p-3 text-left active:scale-[0.99] ${isCurrent ? 'card-active' : ''}`}
    >
      <div className="flex items-center gap-2">
        <span className="tabnum text-sm font-black" style={{ color: week.phase.color }}>
          W{week.phaseWeek}
        </span>
        <span className="text-xs font-semibold text-white/45">{fmtRange(week.start, week.end)}</span>
        {isCurrent && <span className="pill bg-acid text-ink-950">Now</span>}
        {isRaceWeek && <span className="pill bg-white/15 text-white">★ Race</span>}
        {hasBaby && <span className="pill bg-[#c792ea]/20 text-[#c792ea]">Due date</span>}
        <span className="tabnum ml-auto text-xs font-bold text-white/35">
          {week.phase.flexible ? `${stats.logged} logged` : `${stats.done}/${stats.planned}`}
        </span>
      </div>

      <div className="mt-2.5 grid grid-cols-7 gap-1">
        {days.map(({ key, sessions, logged, done }, i) => {
          const complete = sessions.length > 0 && done === sessions.length
          const partial = done > 0 || logged.length > 0
          return (
            <div
              key={key}
              className={`flex h-11 flex-col items-center justify-center gap-1 rounded-lg border ${
                complete
                  ? 'border-acid/50 bg-acid/10'
                  : partial
                    ? 'border-ink-600 bg-ink-800'
                    : 'border-ink-800 bg-ink-850/60'
              }`}
            >
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/30">{DAY_LABELS[i][0]}</span>
              <span className="flex gap-0.5">
                {sessions.length === 0 && logged.length === 0 && <span className="h-1 w-1 rounded-full bg-ink-600" />}
                {(sessions.length ? sessions : logged).slice(0, 3).map((sx, j) => (
                  <span
                    key={j}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: typeMeta(sx.type).color, opacity: complete ? 1 : 0.75 }}
                  />
                ))}
              </span>
            </div>
          )
        })}
      </div>
    </button>
  )
}

export default function CalendarView() {
  const { logs, overrides, today } = useStore()
  const [openWeek, setOpenWeek] = useState(null)
  const weeks = useMemo(() => allPlanWeeks(), [])
  const currentKey = ymd(startOfWeek(today))
  const currentRef = useRef(null)
  const [filter, setFilter] = useState(null) // phase id

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center' })
  }, [])

  const grouped = useMemo(() => {
    const out = []
    for (const phase of PHASES) {
      if (filter && phase.id !== filter) continue
      out.push({ phase, weeks: weeks.filter((w) => w.phase.id === phase.id) })
    }
    return out
  }, [weeks, filter])

  return (
    <div className="pb-28">
      <div className="sticky top-0 z-20 border-b border-ink-800 bg-ink-950/95 px-4 pb-3 pt-3 backdrop-blur">
        <h1 className="text-2xl font-black leading-none tracking-tight">Macrocycle</h1>
        <p className="mt-1 text-xs text-white/40">
          Aug 2026 → June 2027 · {TOTAL_WEEKS} weeks · race Sun 6 June
        </p>
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          <button
            onClick={() => setFilter(null)}
            className={`pill shrink-0 ${filter === null ? 'bg-white text-ink-950' : 'bg-ink-800 text-white/50'}`}
          >
            All
          </button>
          {PHASES.map((p) => (
            <button
              key={p.id}
              onClick={() => setFilter(filter === p.id ? null : p.id)}
              className="pill shrink-0"
              style={
                filter === p.id
                  ? { background: p.color, color: '#0a0a0a' }
                  : { background: `${p.color}18`, color: p.color, border: `1px solid ${p.color}33` }
              }
            >
              P{p.id} {p.short}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6 px-4 pt-4">
        {grouped.map(({ phase, weeks: pw }) => (
          <section key={phase.id} className="space-y-2">
            <div className="rounded-2xl p-3.5" style={{ background: `${phase.color}10`, border: `1px solid ${phase.color}30` }}>
              <div className="flex items-baseline gap-2">
                <span className="tabnum text-xs font-black" style={{ color: phase.color }}>
                  PHASE {phase.id}
                </span>
                <span className="text-xs text-white/35">
                  {MONTHS[parseYmd(phase.start).getMonth()].slice(0, 3)} → {MONTHS[parseYmd(phase.end).getMonth()].slice(0, 3)} ·{' '}
                  {phase.weeks} wks
                </span>
              </div>
              <h2 className="mt-0.5 text-lg font-black leading-tight">{phase.name}</h2>
              <p className="mt-1 text-sm leading-relaxed text-white/50">{phase.focus}</p>
            </div>

            {pw.map((w) => {
              const isCurrent = w.key === currentKey
              return (
                <div key={w.key} ref={isCurrent ? currentRef : null}>
                  <WeekRow
                    week={w}
                    logs={logs}
                    overrides={overrides}
                    isCurrent={isCurrent}
                    onOpen={() => setOpenWeek(w)}
                  />
                </div>
              )
            })}
          </section>
        ))}
      </div>

      <WeekSheet week={openWeek} onClose={() => setOpenWeek(null)} />
    </div>
  )
}
