import { Plus } from 'lucide-react'
import SessionDrillCard from './SessionDrillCard'

export default function PhaseSection({ phase, items, onAdd, onChange, onRemove, onMove, onTimer }) {
  const minutes = items.reduce((sum, item) => sum + item.duration_min, 0)

  return (
    <section className="rounded-2xl border border-line bg-surface p-3">
      <header className="mb-3 flex items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-black">
          {phase.id}
        </span>
        <h3 className="min-w-0 flex-1 truncate font-bold">{phase.title}</h3>
        <span className="text-sm text-muted tnum">{minutes}′</span>
      </header>

      <div className="flex flex-col gap-3">
        {items.map((item, index) => (
          <SessionDrillCard
            key={item.id}
            item={item}
            first={index === 0}
            last={index === items.length - 1}
            onChange={(patch) => onChange(item, patch)}
            onRemove={() => onRemove(item)}
            onMove={(delta) => onMove(phase.id, index, delta)}
            onTimer={() => onTimer(item)}
          />
        ))}

        <button
          onClick={() => onAdd(phase)}
          className="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-dashed border-line text-sm font-bold text-muted"
        >
          <Plus size={18} /> Προσθήκη άσκησης
        </button>
      </div>
    </section>
  )
}
