import { useState } from 'react'
import { Users } from 'lucide-react'
import Sheet from '../ui/Sheet'
import { FORMATIONS } from './formations'

// Τοποθετεί ολόκληρη ενδεκάδα με ένα πάτημα. Με τα ονόματα του
// ρόστερ, το σχέδιο παύει να είναι γενικό σκίτσο και γίνεται
// «η ενδεκάδα μου».
export default function FormationSheet({ open, onClose, players, onApply }) {
  const [team, setTeam] = useState('blue')
  const [withNames, setWithNames] = useState(true)

  const hasRoster = players.length > 0

  return (
    <Sheet open={open} onClose={onClose} title="Σχηματισμός">
      <div className="mb-4 flex rounded-xl border border-line bg-surface-2 p-1">
        {[
          ['blue', 'Μπλε', 'bg-[#3b82f6]'],
          ['red', 'Κόκκινοι', 'bg-[#ef4444]'],
        ].map(([value, label, color]) => (
          <button
            key={value}
            onClick={() => setTeam(value)}
            className={`min-h-12 flex-1 rounded-lg text-sm font-bold ${
              team === value ? `${color} text-white` : 'text-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        onClick={() => hasRoster && setWithNames((v) => !v)}
        disabled={!hasRoster}
        className="mb-4 flex w-full items-center gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3 text-left disabled:opacity-50"
      >
        <Users size={18} className="shrink-0 text-brand" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Ονόματα από το ρόστερ</span>
          <span className="block text-xs text-muted">
            {hasRoster
              ? `${players.length} παίκτες, τοποθέτηση κατά θέση`
              : 'Δεν υπάρχουν παίκτες στο ρόστερ'}
          </span>
        </span>
        <span
          className={`h-7 w-12 shrink-0 rounded-full p-1 transition-colors ${
            withNames && hasRoster ? 'bg-brand' : 'bg-line'
          }`}
        >
          <span
            className={`block size-5 rounded-full bg-white transition-transform ${
              withNames && hasRoster ? 'translate-x-5' : ''
            }`}
          />
        </span>
      </button>

      <div className="grid grid-cols-2 gap-2">
        {FORMATIONS.map((formation) => (
          <button
            key={formation.id}
            onClick={() => {
              onApply(formation, team, withNames && hasRoster)
              onClose()
            }}
            className="min-h-16 rounded-xl border border-line bg-surface-2 text-xl font-black tnum active:bg-surface"
          >
            {formation.label}
          </button>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted">
        Ο σχηματισμός αντικαθιστά τους παίκτες της ίδιας ομάδας στον καμβά. Κώνοι, μπάλες και
        βέλη μένουν όπως είναι.
      </p>
    </Sheet>
  )
}
