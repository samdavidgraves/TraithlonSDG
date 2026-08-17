import { useEffect } from 'react'
import { typeMeta } from '../data/plan'

export function ProgressRing({
  value = 0,
  size = 96,
  stroke = 8,
  color = '#a8ff00',
  track = '#242424',
  children,
  label,
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-none">
        {children ?? (
          <div>
            <div className="tabnum text-2xl font-black">{Math.round(pct)}</div>
            {label && <div className="label mt-1">{label}</div>}
          </div>
        )}
      </div>
    </div>
  )
}

export function TypeDot({ type, size = 8 }) {
  const m = typeMeta(type)
  return (
    <span
      className="inline-block rounded-full shrink-0"
      style={{ width: size, height: size, background: m.color }}
      title={m.label}
    />
  )
}

export function TypeChip({ type, className = '' }) {
  const m = typeMeta(type)
  return (
    <span
      className={`pill ${className}`}
      style={{ background: `${m.color}1f`, color: m.color, border: `1px solid ${m.color}33` }}
    >
      {m.label}
    </span>
  )
}

export function PhaseChip({ phase, week, className = '' }) {
  if (!phase) return null
  return (
    <span
      className={`pill ${className}`}
      style={{ background: `${phase.color}1a`, color: phase.color, border: `1px solid ${phase.color}40` }}
    >
      P{phase.id} · {phase.short}
      {week ? ` · wk ${week}` : ''}
    </span>
  )
}

export function Sheet({ open, onClose, title, subtitle, children, footer, full = false }) {
  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div
        className={`sheet-up relative flex flex-col rounded-t-3xl border-t border-ink-700 bg-ink-950 ${
          full ? 'h-[96%]' : 'max-h-[90%]'
        }`}
      >
        <div className="flex items-start gap-3 px-5 pb-3 pt-4">
          <div className="min-w-0 flex-1">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink-600" />
            {title && <h2 className="text-xl font-black leading-tight">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-white/50">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="mt-2 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink-800 text-white/60"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">{children}</div>
        {footer && <div className="safe-bottom border-t border-ink-800 bg-ink-950 px-5 pt-3">{footer}</div>}
      </div>
    </div>
  )
}

export function Stat({ value, label, sub, color = '#ffffff' }) {
  return (
    <div className="card p-3.5">
      <div className="tabnum text-2xl font-black leading-none" style={{ color }}>
        {value}
      </div>
      <div className="label mt-2">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-white/35">{sub}</div>}
    </div>
  )
}

export function EmptyState({ icon = '◍', title, body }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-10 text-center">
      <div className="text-3xl text-white/20">{icon}</div>
      <div className="font-bold">{title}</div>
      {body && <p className="max-w-xs text-sm leading-relaxed text-white/45">{body}</p>}
    </div>
  )
}
