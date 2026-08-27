import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import Button from '../ui/Button'
import { CATEGORIES, INTENSITY } from '../../lib/drills'

export default function DrillForm({ initial, onSave, onDelete }) {
  const [form, setForm] = useState({
    id: initial?.id,
    title: initial?.title ?? '',
    category: initial?.category ?? 'passing',
    description: initial?.description ?? '',
    default_duration: initial?.default_duration ?? 10,
    intensity: initial?.intensity ?? 'medium',
    board_data: initial?.board_data ?? null,
  })

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function submit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    onSave(form)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm text-muted">Τίτλος</label>
        <input
          required
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          className="min-h-14 w-full rounded-xl border border-line bg-surface-2 px-4 text-base outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-muted">Κατηγορία</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(CATEGORIES).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => set('category', value)}
              className={`min-h-12 rounded-xl border text-sm font-bold ${
                form.category === value
                  ? 'border-brand bg-brand text-bg'
                  : 'border-line bg-surface-2'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">Περιγραφή</label>
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-base outline-none"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-sm text-muted">Διάρκεια (λεπτά)</label>
          <input
            type="number"
            min={1}
            max={90}
            inputMode="numeric"
            value={form.default_duration}
            onChange={(e) => set('default_duration', e.target.value)}
            className="min-h-14 w-full rounded-xl border border-line bg-surface-2 px-4 text-base tnum outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm text-muted">Ένταση</label>
        <div className="flex gap-2">
          {Object.entries(INTENSITY).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => set('intensity', value)}
              className={`min-h-12 flex-1 rounded-xl border text-sm font-bold ${
                form.intensity === value
                  ? 'border-brand bg-brand text-bg'
                  : 'border-line bg-surface-2'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" size="lg">
        Αποθήκευση
      </Button>

      {initial?.id && (
        <Button type="button" variant="ghost" onClick={() => onDelete(initial.id)}>
          <Trash2 size={18} className="text-absent" />
          <span className="text-absent">Διαγραφή άσκησης</span>
        </Button>
      )}
    </form>
  )
}
