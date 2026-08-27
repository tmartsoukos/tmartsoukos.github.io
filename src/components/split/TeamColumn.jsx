import { POSITION_SHORT, countByPosition } from '../../lib/splitter'

// Οι δύο ομάδες ξεχωρίζουν από το χρώμα των διακριτικών: πράσινα και πορτοκαλί.
const THEME = {
  a: { ring: 'border-team-a', chip: 'bg-team-a text-bg', title: 'text-team-a' },
  b: { ring: 'border-team-b', chip: 'bg-team-b text-bg', title: 'text-team-b' },
  joker: { ring: 'border-line', chip: 'bg-surface-2 text-text', title: 'text-muted' },
}

export default function TeamColumn({ side, title, players, selectedId, onSelect }) {
  const theme = THEME[side]
  const counts = countByPosition(players)

  return (
    <section className={`overflow-hidden rounded-2xl border-2 bg-surface ${theme.ring}`}>
      <header className="border-b border-line px-3 py-2">
        <h2 className={`font-black ${theme.title}`}>
          {title} <span className="tnum">({players.length})</span>
        </h2>
        <p className="text-[11px] text-muted">
          {Object.entries(counts)
            .filter(([, n]) => n > 0)
            .map(([pos, n]) => `${POSITION_SHORT[pos]} ${n}`)
            .join(' · ') || '—'}
        </p>
      </header>

      <ul>
        {players.map((player) => {
          const selected = selectedId === player.id
          return (
            <li key={player.id}>
              <button
                onClick={() => onSelect(player.id)}
                className={`flex min-h-14 w-full items-center gap-2 border-b border-line px-2 text-left last:border-0 ${
                  selected ? 'bg-brand/20 ring-2 ring-brand ring-inset' : ''
                }`}
              >
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${theme.chip}`}>
                  {POSITION_SHORT[player.position]}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {player.full_name}
                </span>
              </button>
            </li>
          )
        })}
        {players.length === 0 && <li className="px-3 py-4 text-sm text-muted">—</li>}
      </ul>
    </section>
  )
}
