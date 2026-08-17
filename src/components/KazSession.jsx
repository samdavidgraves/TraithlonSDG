import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { KAZ_EXERCISES, KAZ_SUBSETS, PAIN_OPTIONS } from '../data/kaz'
import { fmtClock, fmtDuration } from '../lib/date'
import { useStore } from '../store/context'
import { Sheet } from './ui'

const now = () => Date.now()

/**
 * Full KAZ session flow: per-exercise stopwatches, a total workout timer
 * running from the first exercise start to the last DONE, then the pain
 * check-in. `subset` runs a short variant (Phase 3 micro-sessions).
 */
export default function KazSession({ open, onClose, dateKey, planId, subset = null, title = 'KAZ Session' }) {
  const { addLog } = useStore()
  const exercises = useMemo(() => {
    if (!subset) return KAZ_EXERCISES
    const ids = KAZ_SUBSETS[subset] || []
    return KAZ_EXERCISES.filter((e) => ids.includes(e.id))
  }, [subset])

  const [startedAt, setStartedAt] = useState(null)
  const [finishedAt, setFinishedAt] = useState(null)
  const [openId, setOpenId] = useState(null)
  const [openSince, setOpenSince] = useState(null)
  const [times, setTimes] = useState({}) // exerciseId -> accumulated seconds
  const [done, setDone] = useState({}) // exerciseId -> true
  const [phase, setPhase] = useState('work') // work | checkin | saved
  const [pain, setPain] = useState(null)
  const [, setTick] = useState(0)
  const listRef = useRef(null)

  // Reset whenever the sheet is opened fresh.
  useEffect(() => {
    if (!open) return
    setStartedAt(null)
    setFinishedAt(null)
    setOpenId(null)
    setOpenSince(null)
    setTimes({})
    setDone({})
    setPhase('work')
    setPain(null)
  }, [open])

  // 200 ms tick keeps every visible clock live without a per-card interval.
  useEffect(() => {
    if (!open || phase !== 'work') return undefined
    const t = setInterval(() => setTick((n) => n + 1), 200)
    return () => clearInterval(t)
  }, [open, phase])

  const doneCount = Object.keys(done).length
  const allDone = doneCount === exercises.length

  const elapsedFor = useCallback(
    (id) => {
      const base = times[id] || 0
      if (openId === id && openSince) return base + (now() - openSince) / 1000
      return base
    },
    [times, openId, openSince],
  )

  // Recomputed every render (the 200 ms tick drives those) so the total clock
  // keeps moving — memoising it would freeze it at the first value.
  const totalElapsed = startedAt ? ((finishedAt || now()) - startedAt) / 1000 : 0

  const openExercise = useCallback(
    (id) => {
      const ts = now()
      setStartedAt((s) => s ?? ts)
      if (openId && openSince) {
        const prev = openId
        const delta = (ts - openSince) / 1000
        setTimes((t) => ({ ...t, [prev]: (t[prev] || 0) + delta }))
      }
      if (openId === id) {
        // Tapping the open card collapses it and banks the running time.
        setOpenId(null)
        setOpenSince(null)
        return
      }
      setOpenId(id)
      setOpenSince(ts)
    },
    [openId, openSince],
  )

  const markDone = useCallback(
    (id) => {
      const ts = now()
      const banked = (times[id] || 0) + (openId === id && openSince ? (ts - openSince) / 1000 : 0)
      const nextTimes = { ...times, [id]: banked }
      const nextDone = { ...done, [id]: true }
      setTimes(nextTimes)
      setDone(nextDone)
      setStartedAt((s) => s ?? ts)

      const isLast = Object.keys(nextDone).length === exercises.length
      if (isLast) {
        setFinishedAt(ts)
        setOpenId(null)
        setOpenSince(null)
        setPhase('checkin')
        return
      }
      // Auto-advance to the next undone exercise and start its clock.
      const idx = exercises.findIndex((e) => e.id === id)
      const next = exercises.slice(idx + 1).find((e) => !nextDone[e.id]) || exercises.find((e) => !nextDone[e.id])
      if (next) {
        setOpenId(next.id)
        setOpenSince(ts)
        requestAnimationFrame(() => {
          listRef.current?.querySelector(`[data-ex="${next.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        })
      } else {
        setOpenId(null)
        setOpenSince(null)
      }
    },
    [times, done, openId, openSince, exercises],
  )

  const finishEarly = () => {
    const ts = now()
    if (openId && openSince) {
      setTimes((t) => ({ ...t, [openId]: (t[openId] || 0) + (ts - openSince) / 1000 }))
    }
    setOpenId(null)
    setOpenSince(null)
    setStartedAt((sv) => sv ?? ts)
    setFinishedAt(ts)
    setPhase('checkin')
  }

  const saveSession = () => {
    const durationSec = Math.round(startedAt ? ((finishedAt || now()) - startedAt) / 1000 : 0)
    addLog({
      date: dateKey,
      type: 'kaz',
      title: subset ? title : 'KAZ — full routine',
      source: subset ? 'micro' : 'kaz',
      planId: planId || undefined,
      durationSec,
      pain,
      completedCount: Object.keys(done).length,
      totalCount: exercises.length,
      exercises: exercises.map((e) => ({
        id: e.id,
        name: e.name,
        seconds: Math.round(times[e.id] || 0),
        done: !!done[e.id],
      })),
    })
    setPhase('saved')
  }

  const painOption = PAIN_OPTIONS.find((p) => p.id === pain)

  return (
    <Sheet
      open={open}
      onClose={onClose}
      full
      title={phase === 'work' ? title : phase === 'checkin' ? 'How did that feel?' : 'Logged'}
      subtitle={
        phase === 'work'
          ? `${doneCount}/${exercises.length} done · tap a card to start its clock`
          : phase === 'checkin'
            ? 'Pain check-in — be honest, it drives the plan.'
            : undefined
      }
      footer={
        phase === 'work' ? (
          <div className="flex items-center gap-3 pb-1">
            <div className="min-w-0 flex-1">
              <div className="label">Total</div>
              <div className="tabnum text-3xl font-black leading-none text-acid">{fmtClock(totalElapsed)}</div>
            </div>
            <button className="btn-ghost" onClick={finishEarly} disabled={!startedAt}>
              {allDone ? 'Check in' : 'Finish early'}
            </button>
          </div>
        ) : phase === 'checkin' ? (
          <div className="pb-1">
            <button className="btn-primary w-full py-4 text-base disabled:opacity-30" disabled={!pain} onClick={saveSession}>
              Save session
            </button>
          </div>
        ) : (
          <div className="pb-1">
            <button className="btn-primary w-full py-4 text-base" onClick={onClose}>
              Done
            </button>
          </div>
        )
      }
    >
      {phase === 'work' && (
        <div ref={listRef} className="space-y-2.5 pb-2">
          {exercises.map((ex, i) => {
            const isOpen = openId === ex.id
            const isDone = !!done[ex.id]
            const t = elapsedFor(ex.id)
            return (
              <div
                key={ex.id}
                data-ex={ex.id}
                className={`card overflow-hidden transition-colors ${isOpen ? 'card-active' : ''} ${
                  isDone ? 'opacity-60' : ''
                }`}
              >
                <button className="flex w-full items-center gap-3 p-4 text-left" onClick={() => !isDone && openExercise(ex.id)}>
                  <span
                    className={`tabnum grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-black ${
                      isDone ? 'bg-acid text-ink-950' : 'bg-ink-800 text-white/50'
                    }`}
                  >
                    {isDone ? '✓' : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate font-bold ${isDone ? 'line-through decoration-white/30' : ''}`}>
                      {ex.name}
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold uppercase tracking-wider text-white/40">
                      {ex.target}
                    </span>
                  </span>
                  {(t > 0 || isOpen) && (
                    <span className={`tabnum text-lg font-black ${isOpen ? 'text-acid' : 'text-white/40'}`}>
                      {fmtClock(t)}
                    </span>
                  )}
                </button>

                {isOpen && !isDone && (
                  <div className="fade-up border-t border-ink-700/70 px-4 pb-4 pt-3">
                    <p className="text-sm leading-relaxed text-white/70">{ex.cue}</p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="tabnum text-4xl font-black text-acid">{fmtClock(t)}</div>
                      <button className="btn-primary ml-auto px-8 py-3.5 text-base" onClick={() => markDone(ex.id)}>
                        DONE
                      </button>
                    </div>
                  </div>
                )}

                {isDone && (
                  <div className="border-t border-ink-800 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-white/30">
                    Logged {fmtClock(times[ex.id] || 0)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {phase === 'checkin' && (
        <div className="space-y-3 pb-2">
          <div className="card flex items-center gap-4 p-4">
            <div>
              <div className="label">Workout time</div>
              <div className="tabnum text-4xl font-black text-acid">{fmtClock(totalElapsed)}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="label">Exercises</div>
              <div className="tabnum text-2xl font-black">
                {Object.keys(done).length}
                <span className="text-white/30">/{exercises.length}</span>
              </div>
            </div>
          </div>

          {PAIN_OPTIONS.map((opt) => {
            const active = pain === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => setPain(opt.id)}
                className={`card flex w-full items-center gap-3 p-4 text-left transition-all ${
                  active ? 'border-2' : 'border'
                }`}
                style={active ? { borderColor: opt.color, background: `${opt.color}14` } : undefined}
              >
                <span
                  className="h-3.5 w-3.5 shrink-0 rounded-full"
                  style={{ background: active ? opt.color : 'transparent', border: `2px solid ${opt.color}` }}
                />
                <span className="font-bold" style={{ color: active ? opt.color : undefined }}>
                  {opt.label}
                </span>
              </button>
            )
          })}

          {painOption && (
            <div
              className="fade-up rounded-2xl p-4 text-sm leading-relaxed"
              style={{
                background: `${painOption.color}14`,
                border: `1px solid ${painOption.color}40`,
                color: painOption.color,
              }}
            >
              {pain === 'hurt' && <div className="mb-1 font-black uppercase tracking-wider">Regress next session</div>}
              {painOption.blurb}
            </div>
          )}
        </div>
      )}

      {phase === 'saved' && (
        <div className="fade-up space-y-3 pb-2">
          <div className="card p-5 text-center">
            <div className="label">Session logged</div>
            <div className="tabnum mt-1 text-5xl font-black text-acid">{fmtClock(totalElapsed)}</div>
            <p className="mt-3 text-sm text-white/50">
              {Object.keys(done).length}/{exercises.length} exercises ·{' '}
              {PAIN_OPTIONS.find((p) => p.id === pain)?.label}
            </p>
          </div>
          <div className="card divide-y divide-ink-800">
            {exercises.map((ex) => (
              <div key={ex.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className={done[ex.id] ? 'text-acid' : 'text-white/20'}>{done[ex.id] ? '✓' : '—'}</span>
                <span className="min-w-0 flex-1 truncate text-white/70">{ex.name}</span>
                <span className="tabnum text-white/40">{fmtDuration(times[ex.id] || 0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Sheet>
  )
}
