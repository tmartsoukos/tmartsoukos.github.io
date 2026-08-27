import { useMemo, useState } from 'react'
import { Search, Clock, Plus } from 'lucide-react'
import Sheet from '../ui/Sheet'
import { CATEGORIES } from '../../lib/drills'

// Επιλογή άσκησης με ΕΝΑ πάτημα: το tap πάνω στη γραμμή προσθέτει
// αμέσως την άσκηση στη φάση, με την προεπιλεγμένη της διάρκεια.
export default function DrillPicker({ open, onClose, drills, phase, onPick }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')

  const suggested = phase?.suggested ?? []

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = drills.filter((d) => {
      if (category !== 'all' && d.category !== category) return false
      if (!q) return true
      return d.title.toLowerCase().includes(q)
    })
    // Πρώτα οι κατηγορίες που ταιριάζουν στη φάση
    return filtered.sort((x, y) => {
      const sx = suggested.includes(x.category) ? 0 : 1
      const sy = suggested.includes(y.category) ? 0 : 1
      return sx - sy || x.title.localeCompare(y.title, 'el')
    })
  }, [drills, query, category, suggested])

  return (
    <Sheet open={open} onClose={onClose} title={`Άσκηση · ${phase?.title ?? ''}`}>
      <label className="mb-3 flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-4">
        <Search size={18} className="text-muted" />
        <input
          placeholder="Αναζήτηση"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-h-12 w-full bg-transparent outline-none"
        />
      </label>

      <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
        {[['all', 'Όλες'], ...Object.entries(CATEGORIES)].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setCategory(value)}
            className={`min-h-10 shrink-0 rounded-full px-3 text-xs font-bold ${
              category === value ? 'bg-brand text-bg' : 'bg-surface-2 text-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ul className="flex flex-col">
        {visible.map((drill) => (
          <li key={drill.id}>
            <button
              onClick={() => onPick(drill)}
              className="flex min-h-16 w-full items-center gap-3 border-b border-line px-1 text-left last:border-0"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{drill.title}</span>
                <span className="block text-xs text-muted">
                  {CATEGORIES[drill.category]} · <Clock size={11} className="inline" />{' '}
                  {drill.default_duration}′
                </span>
              </span>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand text-bg">
                <Plus size={22} />
              </span>
            </button>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="py-6 text-center text-sm text-muted">Καμία άσκηση.</li>
        )}
      </ul>
    </Sheet>
  )
}
