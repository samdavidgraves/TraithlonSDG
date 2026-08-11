import { useState } from 'react'
import { StoreProvider } from './store/store'
import { useStore } from './store/context'
import TodayView from './views/TodayView'
import CalendarView from './views/CalendarView'
import HistoryView from './views/HistoryView'
import { PHASES } from './data/phases'
import { Sheet } from './components/ui'
import { ymd } from './lib/date'

const TABS = [
  { id: 'today', label: 'Today', icon: '◉' },
  { id: 'calendar', label: 'Calendar', icon: '▤' },
  { id: 'history', label: 'History', icon: '◷' },
]

function TabBar({ tab, setTab }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-800 bg-ink-950/95 backdrop-blur">
      <div className="safe-bottom mx-auto flex max-w-md pt-1.5">
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex flex-1 flex-col items-center gap-1 py-1.5 transition-colors"
            >
              <span className={`text-lg leading-none ${active ? 'text-acid' : 'text-white/30'}`}>{t.icon}</span>
              <span
                className={`text-[10px] font-bold uppercase tracking-[0.12em] ${
                  active ? 'text-acid' : 'text-white/30'
                }`}
              >
                {t.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

/** Jump the app's idea of "today" to preview any phase, plus a hard reset. */
function SettingsSheet({ open, onClose }) {
  const { settings, setDebugDate, resetAll, logs } = useStore()
  const [confirm, setConfirm] = useState(false)

  return (
    <Sheet open={open} onClose={onClose} title="Settings" subtitle="Preview the plan and manage your data">
      <div className="space-y-4 pb-4">
        <div>
          <div className="label mb-2">Preview date</div>
          <p className="mb-3 text-sm leading-relaxed text-white/45">
            Jump “today” into any phase to see how the plan behaves. Your logs are untouched.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PHASES.map((p) => {
              const target = p.start
              const active = settings.debugDate === target
              return (
                <button
                  key={p.id}
                  onClick={() => setDebugDate(active ? null : target)}
                  className="card p-3 text-left"
                  style={active ? { borderColor: p.color, background: `${p.color}14` } : undefined}
                >
                  <div className="text-xs font-black" style={{ color: p.color }}>
                    Phase {p.id}
                  </div>
                  <div className="mt-0.5 text-sm font-bold leading-tight">{p.short}</div>
                  <div className="mt-0.5 text-[11px] text-white/35">{p.start}</div>
                </button>
              )
            })}
          </div>
          <button className="btn-ghost mt-3 w-full" onClick={() => setDebugDate(null)}>
            Back to real today ({ymd(new Date())})
          </button>
        </div>

        <div className="border-t border-ink-800 pt-4">
          <div className="label mb-2">Data</div>
          <p className="mb-3 text-sm text-white/45">{logs.length} sessions stored locally on this device.</p>
          {confirm ? (
            <div className="flex gap-2">
              <button className="btn-ghost flex-1" onClick={() => setConfirm(false)}>
                Cancel
              </button>
              <button
                className="btn flex-1 bg-[#ff5c5c] px-4 py-2.5 text-ink-950"
                onClick={() => {
                  resetAll()
                  setConfirm(false)
                  onClose()
                }}
              >
                Erase everything
              </button>
            </div>
          ) : (
            <button className="btn-ghost w-full" onClick={() => setConfirm(true)}>
              Reset all data
            </button>
          )}
        </div>
      </div>
    </Sheet>
  )
}

function Shell() {
  const [tab, setTab] = useState('today')
  const [settings, setSettings] = useState(false)
  const { settings: st } = useStore()

  return (
    <div className="mx-auto min-h-full max-w-md bg-ink-950">
      <div className="safe-top" />
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-acid text-xs font-black text-ink-950">K</span>
          <span className="text-sm font-black uppercase tracking-[0.18em]">KneesUp Tri</span>
        </div>
        <button
          onClick={() => setSettings(true)}
          className={`grid h-8 w-8 place-items-center rounded-full bg-ink-800 text-sm ${
            st.debugDate ? 'text-acid' : 'text-white/40'
          }`}
        >
          ⚙
        </button>
      </div>

      {st.debugDate && (
        <div className="mx-4 mt-2 rounded-xl border border-acid/40 bg-acid/10 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-acid">
          Previewing {st.debugDate}
        </div>
      )}

      {tab === 'today' && <TodayView onGoCalendar={() => setTab('calendar')} />}
      {tab === 'calendar' && <CalendarView />}
      {tab === 'history' && <HistoryView />}

      <SettingsSheet open={settings} onClose={() => setSettings(false)} />
      <TabBar tab={tab} setTab={setTab} />
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
