import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import Button from '../ui/Button'
import { POSITIONS } from '../../lib/splitter'

export default function PlayerForm({ initial, onSave, onDelete }) {
  const [form, setForm] = useState({
    id: initial?.id,
    full_name: initial?.full_name ?? '',
    phone: initial?.phone ?? '',
    position: initial?.position ?? 'MID',
    notes: initial?.notes ?? '',
  })

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function submit(e) {
    e.preventDefault()
    if (!form.full_name.trim()) return
    onSave(form)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm text-muted">Ονοματεπώνυμο</label>
        <input
          required
          value={form.full_name}
          onChange={(e) => set('full_name', e.target.value)}
          className="min-h-14 w-full rounded-xl border border-line bg-surface-2 px-4 text-base outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-muted">Θέση</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(POSITIONS).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => set('position', value)}
              className={`min-h-14 rounded-xl border text-sm font-bold ${
                form.position === value
                  ? 'border-brand bg-brand text-bg'
                  : 'border-line bg-surface-2 text-text'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">Τηλέφωνο</label>
        <input
          type="tel"
          inputMode="tel"
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
          className="min-h-14 w-full rounded-xl border border-line bg-surface-2 px-4 text-base outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">Σημειώσεις</label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="π.χ. τραυματισμός, ιδιαιτερότητες"
          className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 text-base outline-none"
        />
      </div>

      <Button type="submit" size="lg">
        Αποθήκευση
      </Button>

      {initial?.id && (
        <Button type="button" variant="ghost" size="md" onClick={() => onDelete(initial.id)}>
          <Trash2 size={18} className="text-absent" />
          <span className="text-absent">Διαγραφή παίκτη</span>
        </Button>
      )}
    </form>
  )
}
