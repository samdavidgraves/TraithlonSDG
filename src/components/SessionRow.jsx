import { typeMeta } from '../data/plan'

/**
 * One planned session. Tapping the check circle marks it complete; KAZ rows
 * get a second action that opens the exercise tracker.
 */
export default function SessionRow({ session, done, onToggle, onOpenKaz, compact = false }) {
  const meta = typeMeta(session.type)
  const isKaz = session.type === 'kaz' || session.kaz

  return (
    <div
      className={`card overflow-hidden transition-colors ${done ? 'border-acid/40 bg-acid/[0.04]' : ''}`}
      style={!done ? { borderLeft: `3px solid ${meta.color}` } : { borderLeft: '3px solid #a8ff00' }}
    >
      <div className={`flex items-start gap-3 ${compact ? 'p-3' : 'p-4'}`}>
        <button
          onClick={onToggle}
          aria-label={done ? 'Mark not done' : 'Mark done'}
          className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-xs font-black transition-all active:scale-90 ${
            done ? 'border-acid bg-acid text-ink-950' : 'border-ink-600 text-transparent'
          }`}
        >
          ✓
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="pill"
              style={{ background: `${meta.color}1f`, color: meta.color, border: `1px solid ${meta.color}33` }}
            >
              {meta.label}
            </span>
            {session.optional && <span className="pill bg-ink-800 text-white/40">Optional</span>}
            {session.held && <span className="pill bg-[#ffd23f]/15 text-[#ffd23f]">Held</span>}
            {session.race && <span className="pill bg-white/15 text-white">Race day</span>}
            {session.minutes ? (
              <span className="tabnum ml-auto text-xs font-bold text-white/40">{session.minutes} min</span>
            ) : null}
          </div>

          <div className={`mt-1.5 font-bold leading-tight ${done ? 'text-white/50 line-through decoration-white/25' : ''}`}>
            {session.title}
          </div>
          {session.detail && <p className="mt-1 text-sm leading-relaxed text-white/50">{session.detail}</p>}

          {isKaz && onOpenKaz && (
            <button
              onClick={onOpenKaz}
              className="btn mt-3 w-full border border-acid/40 bg-acid/10 px-4 py-2.5 text-sm text-acid"
            >
              Open KAZ tracker →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
