import { useRef, useState } from 'react'
import { Check, X, Clock, Circle } from 'lucide-react'
import { POSITION_SHORT } from '../../lib/splitter'

// Οι τρεις καταστάσεις ξεχωρίζουν ΚΑΙ από εικονίδιο, όχι μόνο από
// χρώμα: στον ήλιο τα χρώματα ξεπλένονται και υπάρχει και το
// ενδεχόμενο αχρωματοψίας.
export const STATUS = {
  present: { label: 'Παρών', icon: Check, color: 'present' },
  absent: { label: 'Απών', icon: X, color: 'absent' },
  excused: { label: 'Δικαιολογημένος', icon: Clock, color: 'excused' },
}

const CYCLE = ['present', 'absent', 'excused']

const RING = {
  present: 'border-present bg-present/15',
  absent: 'border-absent bg-absent/15',
  excused: 'border-excused bg-excused/15',
}

const DOT = {
  present: 'bg-present text-bg',
  absent: 'bg-absent text-white',
  excused: 'bg-excused text-bg',
}

export default function StatusToggle({ player, status, onSet }) {
  const [picking, setPicking] = useState(false)
  const longPress = useRef(false)
  const timer = useRef(null)

  const current = status ? STATUS[status] : null
  const Icon = current?.icon ?? Circle

  function down() {
    longPress.current = false
    timer.current = setTimeout(() => {
      longPress.current = true
      setPicking(true)
    }, 450)
  }

  function up() {
    clearTimeout(timer.current)
  }

  function click() {
    // Μετά από παρατεταμένο πάτημα άνοιξε ο επιλογέας — δεν κάνουμε και κύκλο.
    if (longPress.current) return
    const index = status ? CYCLE.indexOf(status) : -1
    onSet(CYCLE[(index + 1) % CYCLE.length])
  }

  if (picking) {
    return (
      <div className="flex items-center gap-2 border-b border-line px-3 py-2 last:border-0">
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{player.full_name}</span>
        {Object.entries(STATUS).map(([value, meta]) => {
          const MetaIcon = meta.icon
          return (
            <button
              key={value}
              onClick={() => {
                onSet(value)
                setPicking(false)
              }}
              aria-label={meta.label}
              className={`flex size-14 items-center justify-center rounded-xl ${DOT[meta.color]}`}
            >
              <MetaIcon size={24} strokeWidth={3} />
            </button>
          )
        })}
        <button
          onClick={() => setPicking(false)}
          aria-label="Άκυρο"
          className="flex size-14 items-center justify-center rounded-xl bg-surface-2 text-muted"
        >
          ←
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={click}
      onPointerDown={down}
      onPointerUp={up}
      onPointerLeave={up}
      onContextMenu={(e) => e.preventDefault()}
      className={`flex min-h-16 w-full items-center gap-3 border-b border-l-4 border-b-line px-3 text-left last:border-b-0 ${
        current ? RING[current.color] : 'border-l-line'
      }`}
    >
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
          current ? DOT[current.color] : 'bg-surface-2 text-muted'
        }`}
      >
        <Icon size={22} strokeWidth={3} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{player.full_name}</span>
        <span className="block text-xs text-muted">
          {POSITION_SHORT[player.position]} · {current?.label ?? 'Χωρίς καταχώρηση'}
        </span>
      </span>
    </button>
  )
}
