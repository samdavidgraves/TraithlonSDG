import { useMemo, useState } from 'react'
import { useStore } from '../store/context'
import { typeMeta } from '../data/plan'
import { PAIN_BY_ID, PAIN_OPTIONS } from '../data/kaz'
import { PHASE_BY_ID } from '../data/phases'
import { computeStreak, recentWeeks, totalsFor } from '../lib/derive'
import { fmtDuration, fmtLong, fmtClock, parseYmd } from '../lib/date'
import { EmptyState } from '../components/ui'

function PainDot({ pain }) {
  const p = PAIN_BY_ID[pain]
  if (!p) return null
  return (
    <span className="pill" style={{ background: `${p.color}18`, color: p.color, border: `1px solid ${p.color}33` }}>
      {p.short}
    </span>
  )
}

export default function HistoryView() {
  const { logs, overrides, today, removeLog } = useStore()
  const [expanded, setExpanded] = useState(null)
  const [typeFilter, setTypeFilter] = useState(null)

  const streak = useMemo(() => computeStreak(logs, overrides, today), [logs, overrides, today])
  const totals = useMemo(() => totalsFor(logs), [logs])
  const weeks = useMemo(() => recentWeeks(logs, overrides, today, 12), [logs, overrides, today])

  const filtered = useMemo(
    () => (typeFilter ? logs.filter((l) => l.type === typeFilter) : logs),
    [logs, typeFilter],
  )

  const byDate = useMemo(() => {
    const groups = new Map()
    for (const l of [...filtered].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))) {
      if (!groups.has(l.date)) groups.set(l.date, [])
      groups.get(l.date).push(l)
    }
    return [...groups.entries()]
  }, [filtered])

  const kazTimes = useMemo(
    () =>
      logs
        .filter((l) => l.type === 'kaz' && l.durationSec > 0)
        .slice(0, 10)
        .reverse(),
    [logs],
  )
  const maxKaz = Math.max(1, ...kazTimes.map((l) => l.durationSec))
  const maxPlanned = Math.max(1, ...weeks.map((w) => Math.max(w.planned, w.logged)))
  const types = useMemo(() => [...new Set(logs.map((l) => l.type))], [logs])

  return (
    <div className="space-y-5 px-4 pb-28 pt-4">
      <header>
        <h1 className="text-2xl font-black leading-none tracking-tight">History</h1>
        <p className="mt-1 text-xs text-white/40">Every session you’ve logged, and what it did to the knees.</p>
      </header>

      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="card p-4">
          <div className="tabnum text-4xl font-black leading-none text-acid">{streak}</div>
          <div className="label mt-2">Day streak</div>
          <div className="mt-0.5 text-[11px] text-white/35">Survival Mode never breaks it</div>
        </div>
        <div className="card p-4">
          <div className="tabnum text-4xl font-black leading-none">{totals.sessions}</div>
          <div className="label mt-2">Sessions logged</div>
          <div className="mt-0.5 text-[11px] text-white/35">{totals.kazSessions} of them KAZ</div>
        </div>
        <div className="card p-4">
          <div className="tabnum text-2xl font-black leading-none">{fmtDuration(totals.kazSeconds)}</div>
          <div className="label mt-2">KAZ time</div>
          <div className="mt-0.5 text-[11px] text-white/35">avg {fmtClock(totals.avgKazSeconds)} / session</div>
        </div>
        <div className="card p-4">
          <div className="tabnum text-2xl font-black leading-none text-acid">
            {totals.painFree}
            <span className="text-base text-white/25"> / {totals.painFree + totals.hurt + (logs.filter((l) => l.pain === 'mild').length)}</span>
          </div>
          <div className="label mt-2">Pain-free</div>
          <div className="mt-0.5 text-[11px] text-white/35">check-ins · {totals.hurt} flagged “it hurt”</div>
        </div>
      </div>

      {/* Weekly consistency */}
      {weeks.length > 0 && (
        <section className="card p-4">
          <div className="label">Last {weeks.length} weeks</div>
          <div className="mt-3 flex h-28 items-end gap-1.5">
            {weeks.map((w) => {
              const value = w.phase?.flexible ? w.logged : w.done
              const denom = w.phase?.flexible ? maxPlanned : Math.max(w.planned, 1)
              const h = Math.max(4, Math.round((value / Math.max(denom, 1)) * 100))
              return (
                <div key={w.start.toISOString()} className="flex h-full flex-1 flex-col justify-end gap-1.5">
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${Math.min(100, h)}%`,
                      background: w.phase?.color || '#333',
                      opacity: value === 0 ? 0.18 : 0.85,
                    }}
                  />
                  <span className="tabnum text-center text-[9px] text-white/30">{w.start.getDate()}</span>
                </div>
              )
            })}
          </div>
          <p className="mt-2 text-[11px] text-white/30">
            Bar height = sessions completed. Phase 3 weeks count everything logged, with no target.
          </p>
        </section>
      )}

      {/* KAZ workout times */}
      {kazTimes.length > 1 && (
        <section className="card p-4">
          <div className="label">KAZ workout time — last {kazTimes.length}</div>
          <div className="mt-3 space-y-1.5">
            {kazTimes.map((l) => (
              <div key={l.id} className="flex items-center gap-2">
                <span className="tabnum w-12 shrink-0 text-[10px] text-white/30">{l.date.slice(5)}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-800">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(l.durationSec / maxKaz) * 100}%`,
                      background: PAIN_BY_ID[l.pain]?.color || '#a8ff00',
                    }}
                  />
                </div>
                <span className="tabnum w-12 shrink-0 text-right text-[11px] font-bold text-white/50">
                  {fmtClock(l.durationSec)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {PAIN_OPTIONS.map((p) => (
              <span key={p.id} className="flex items-center gap-1.5 text-[10px] text-white/35">
                <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                {p.label}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Type filter */}
      {types.length > 1 && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <button
            onClick={() => setTypeFilter(null)}
            className={`pill shrink-0 ${typeFilter === null ? 'bg-white text-ink-950' : 'bg-ink-800 text-white/50'}`}
          >
            All
          </button>
          {types.map((t) => {
            const m = typeMeta(t)
            const on = typeFilter === t
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(on ? null : t)}
                className="pill shrink-0"
                style={on ? { background: m.color, color: '#0a0a0a' } : { background: `${m.color}18`, color: m.color }}
              >
                {m.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Log */}
      <section className="space-y-3">
        <h2 className="label px-1">Log</h2>
        {byDate.length === 0 ? (
          <EmptyState
            icon="◷"
            title="Nothing logged yet"
            body="Finish a session on the Today tab and it lands here — with its time, phase and pain check-in."
          />
        ) : (
          byDate.map(([date, entries]) => {
            const phase = PHASE_BY_ID[entries[0].phaseId]
            return (
              <div key={date}>
                <div className="mb-1.5 flex items-center gap-2 px-1">
                  <span className="text-xs font-bold text-white/60">{fmtLong(parseYmd(date))}</span>
                  {phase && (
                    <span
                      className="pill"
                      style={{ background: `${phase.color}15`, color: phase.color }}
                    >
                      P{phase.id} · wk {entries[0].phaseWeek}
                    </span>
                  )}
                </div>
                <div className="card divide-y divide-ink-800">
                  {entries.map((l) => {
                    const m = typeMeta(l.type)
                    const isOpen = expanded === l.id
                    return (
                      <div key={l.id}>
                        <button
                          className="flex w-full items-center gap-3 px-4 py-3 text-left"
                          onClick={() => setExpanded(isOpen ? null : l.id)}
                        >
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: m.color }} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold">{l.title}</span>
                            <span className="mt-0.5 flex items-center gap-1.5">
                              <span className="text-[11px] uppercase tracking-wider text-white/35">{m.label}</span>
                              {l.pain && <PainDot pain={l.pain} />}
                            </span>
                          </span>
                          {l.durationSec ? (
                            <span className="tabnum text-sm font-bold text-acid">{fmtClock(l.durationSec)}</span>
                          ) : l.minutes ? (
                            <span className="tabnum text-sm text-white/35">{l.minutes} min</span>
                          ) : null}
                        </button>

                        {isOpen && (
                          <div className="fade-up border-t border-ink-800 px-4 py-3">
                            {l.pain && (
                              <p
                                className="mb-3 rounded-xl p-3 text-xs leading-relaxed"
                                style={{
                                  background: `${PAIN_BY_ID[l.pain].color}12`,
                                  color: PAIN_BY_ID[l.pain].color,
                                }}
                              >
                                {PAIN_BY_ID[l.pain].blurb}
                              </p>
                            )}
                            {l.exercises?.length > 0 && (
                              <div className="space-y-1">
                                {l.exercises.map((e) => (
                                  <div key={e.id} className="flex items-center gap-2 text-xs">
                                    <span className={e.done ? 'text-acid' : 'text-white/20'}>{e.done ? '✓' : '—'}</span>
                                    <span className="min-w-0 flex-1 truncate text-white/60">{e.name}</span>
                                    <span className="tabnum text-white/35">{fmtClock(e.seconds)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <button
                              onClick={() => removeLog(l.id)}
                              className="mt-3 text-[11px] font-bold uppercase tracking-wider text-white/30"
                            >
                              Delete entry
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}
