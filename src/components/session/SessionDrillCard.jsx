import { ChevronUp, ChevronDown, Minus, Plus, Trash2, Timer } from 'lucide-react'
import { INTENSITY, INTENSITY_COLOR } from '../../lib/drills'

export default function SessionDrillCard({ item, first, last, onChange, onRemove, onMove, onTimer }) {
  return (
    <article className="rounded-2xl border border-line bg-surface-2 p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold">{item.title}</h4>
        </div>

        <div className="flex shrink-0 flex-col gap-1">
          <button
            onClick={() => onMove(-1)}
            disabled={first}
            aria-label="Πάνω"
            className="flex size-9 items-center justify-center rounded-lg bg-surface disabled:opacity-30"
          >
            <ChevronUp size={16} />
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={last}
            aria-label="Κάτω"
            className="flex size-9 items-center justify-center rounded-lg bg-surface disabled:opacity-30"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => onChange({ duration_min: Math.max(1, item.duration_min - 5) })}
          aria-label="Λιγότερα λεπτά"
          className="flex size-11 items-center justify-center rounded-xl bg-surface"
        >
          <Minus size={18} />
        </button>
        <span className="w-16 text-center text-xl font-black tnum">{item.duration_min}′</span>
        <button
          onClick={() => onChange({ duration_min: Math.min(90, item.duration_min + 5) })}
          aria-label="Περισσότερα λεπτά"
          className="flex size-11 items-center justify-center rounded-xl bg-surface"
        >
          <Plus size={18} />
        </button>

        <button
          onClick={onTimer}
          aria-label="Χρονόμετρο"
          className="ml-auto flex size-11 items-center justify-center rounded-xl bg-brand text-bg"
        >
          <Timer size={20} />
        </button>
        <button
          onClick={onRemove}
          aria-label="Αφαίρεση"
          className="flex size-11 items-center justify-center rounded-xl bg-surface"
        >
          <Trash2 size={18} className="text-absent" />
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        {Object.entries(INTENSITY).map(([value, label]) => (
          <button
            key={value}
            onClick={() => onChange({ intensity: value })}
            className={`min-h-10 flex-1 rounded-lg border text-xs font-bold ${
              item.intensity === value
                ? `border-line bg-surface ${INTENSITY_COLOR[value]}`
                : 'border-transparent bg-surface text-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </article>
  )
}
