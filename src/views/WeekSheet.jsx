import { useMemo, useState } from 'react'
import { useStore } from '../store/context'
import { SESSION_TYPES, weekDates } from '../data/plan'
import { applyGate, runGate, sessionsForDate } from '../lib/derive'
import { phaseWeekNumber } from '../data/phases'
import { fmtRange, fmtShort, ymd } from '../lib/date'
import { Sheet } from '../components/ui'
import SessionRow from '../components/SessionRow'
import KazSession from '../components/KazSession'

const TYPE_KEYS = ['kaz', 'swim', 'bike', 'run', 'brick', 'walk', 'mobility', 'core']

function AddSessionForm({ onAdd, onCancel }) {
  const [type, setType] = useState('swim')
  const [title, setTitle] = useState('')
  const [minutes, setMinutes] = useState(45)

  return (
    <div className="fade-up card space-y-3 p-3">
      <div className="flex flex-wrap gap-1.5">
        {TYPE_KEYS.map((t) => {
          const m = SESSION_TYPES[t]
          const active = type === t
          return (
            <button
              key={t}
              onClick={() => setType(t)}
              className="pill"
              style={{
                background: active ? m.color : `${m.color}14`,
                color: active ? '#0a0a0a' : m.color,
                border: `1px solid ${m.color}44`,
              }}
            >
              {m.label}
            </button>
          )
        })}
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={`${SESSION_TYPES[type].label} session`}
        className="w-full rounded-xl border border-ink-700 bg-ink-850 px-3 py-2.5 text-sm outline-none placeholder:text-white/25 focus:border-acid/60"
      />
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="5"
          step="5"
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
          className="tabnum w-24 rounded-xl border border-ink-700 bg-ink-850 px-3 py-2.5 text-sm outline-none focus:border-acid/60"
        />
        <span className="text-sm text-white/40">minutes</span>
        <button onClick={onCancel} className="btn-ghost ml-auto py-2 text-xs">
          Cancel
        </button>
        <button
          className="btn-primary py-2 text-xs"
          onClick={() =>
            onAdd({
              type,
              title: title.trim() || `${SESSION_TYPES[type].label} session`,
              detail: '',
              minutes: Number(minutes) || 30,
              kaz: type === 'kaz',
            })
          }
        >
          Add
        </button>
      </div>
    </div>
  )
}

export default function WeekSheet({ week, onClose }) {
  const { logs, overrides, toggleSession, setDayOverride, today } = useStore()
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(null) // dateKey
  const [kaz, setKaz] = useState(null)

  const gate = useMemo(() => runGate(logs, today), [logs, today])
  const days = week ? weekDates(week.start) : []
  const doneIds = useMemo(() => new Set(logs.map((l) => l.planId).filter(Boolean)), [logs])

  if (!week) return null
  const { phase } = week

  const daySessions = (d) =>
    sessionsForDate(d, overrides).map((s) => applyGate(s, phaseWeekNumber(d, phase), gate))

  const addTo = (d, session) => {
    const key = ymd(d)
    setDayOverride(key, [...daySessions(d), session])
    setAdding(null)
  }

  const removeFrom = (d, index) => {
    const key = ymd(d)
    const next = daySessions(d).filter((_, i) => i !== index)
    setDayOverride(key, next)
  }

  const resetDay = (d) => setDayOverride(ymd(d), null)

  return (
    <>
      <Sheet
        open={!!week}
        onClose={onClose}
        full
        title={`Week ${week.phaseWeek} · ${phase.short}`}
        subtitle={`${fmtRange(week.start, week.end)} · Phase ${phase.id} — ${phase.name}`}
        footer={
          <div className="flex items-center gap-2 pb-1">
            <span className="text-xs text-white/35">
              {editing ? 'Tap ✕ to remove a session, or add your own.' : 'Tap a circle to log a session.'}
            </span>
            <button className={editing ? 'btn-primary ml-auto py-2 text-xs' : 'btn-ghost ml-auto py-2 text-xs'} onClick={() => setEditing((e) => !e)}>
              {editing ? 'Done editing' : 'Edit week'}
            </button>
          </div>
        }
      >
        <div
          className="mb-4 rounded-2xl p-3.5 text-sm leading-relaxed"
          style={{ background: `${phase.color}12`, border: `1px solid ${phase.color}30`, color: `${phase.color}` }}
        >
          {phase.tagline}
        </div>

        <div className="space-y-4 pb-2">
          {days.map((d) => {
            const key = ymd(d)
            const sessions = daySessions(d)
            const edited = !!overrides[key]
            return (
              <div key={key}>
                <div className="mb-1.5 flex items-center gap-2 px-1">
                  <span className="text-sm font-black">{fmtShort(d)}</span>
                  {edited && <span className="pill bg-ink-800 text-white/40">Edited</span>}
                  {editing && (
                    <span className="ml-auto flex gap-2">
                      {edited && (
                        <button onClick={() => resetDay(d)} className="text-[11px] font-bold text-white/40">
                          Reset
                        </button>
                      )}
                      <button onClick={() => setAdding(adding === key ? null : key)} className="text-[11px] font-bold text-acid">
                        + Add
                      </button>
                    </span>
                  )}
                </div>

                {sessions.length === 0 && adding !== key && (
                  <div className="rounded-xl border border-dashed border-ink-700 px-4 py-3 text-sm text-white/25">
                    {phase.flexible ? 'Flexible — log micro-sessions from Today' : 'Rest'}
                  </div>
                )}

                <div className="space-y-2">
                  {sessions.map((sess, i) => (
                    <div key={sess.id} className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <SessionRow
                          session={sess}
                          compact
                          done={doneIds.has(sess.id)}
                          onToggle={() => toggleSession(key, sess)}
                          onOpenKaz={
                            sess.type === 'kaz' ? () => setKaz({ dateKey: key, planId: sess.id, title: sess.title }) : undefined
                          }
                        />
                      </div>
                      {editing && (
                        <button
                          onClick={() => removeFrom(d, i)}
                          className="mt-3 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink-800 text-white/40"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {adding === key && (
                  <div className="mt-2">
                    <AddSessionForm onAdd={(s) => addTo(d, s)} onCancel={() => setAdding(null)} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Sheet>

      <KazSession
        open={!!kaz}
        onClose={() => setKaz(null)}
        dateKey={kaz?.dateKey}
        planId={kaz?.planId}
        title={kaz?.title || 'KAZ Session'}
      />
    </>
  )
}
