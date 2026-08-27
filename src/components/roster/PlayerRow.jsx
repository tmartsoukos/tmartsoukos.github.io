import { Phone, ChevronRight } from 'lucide-react'
import { POSITION_SHORT } from '../../lib/splitter'

export default function PlayerRow({ player, onEdit }) {
  return (
    <div className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-muted">
        {POSITION_SHORT[player.position]}
      </span>

      <button onClick={() => onEdit(player)} className="min-w-0 flex-1 text-left">
        <p className="truncate font-semibold">{player.full_name}</p>
        {player.notes && <p className="truncate text-xs text-muted">{player.notes}</p>}
      </button>

      {player.phone && (
        <a
          href={`tel:${player.phone}`}
          aria-label={`Κλήση ${player.full_name}`}
          className="flex size-11 items-center justify-center rounded-full bg-surface-2"
        >
          <Phone size={18} className="text-brand" />
        </a>
      )}

      <ChevronRight size={18} className="text-muted" />
    </div>
  )
}
