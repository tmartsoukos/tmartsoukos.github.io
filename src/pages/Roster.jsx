import { useEffect, useMemo, useState } from 'react'
import { Plus, Users } from 'lucide-react'
import TopBar from '../components/layout/TopBar'
import Sheet from '../components/ui/Sheet'
import Empty from '../components/ui/Empty'
import Button from '../components/ui/Button'
import PlayerRow from '../components/roster/PlayerRow'
import PlayerForm from '../components/roster/PlayerForm'
import { useTeam } from '../context/TeamContext'
import { cachedPlayers, fetchPlayers, savePlayer, deletePlayer } from '../lib/repo'
import { POSITIONS } from '../lib/splitter'

const GROUP_ORDER = ['GK', 'DEF', 'MID', 'FWD']

export default function Roster() {
  const { activeTeamId, activeTeam, revisions } = useTeam()
  const [players, setPlayers] = useState(() => cachedPlayers(activeTeamId))
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    setPlayers(cachedPlayers(activeTeamId))
    fetchPlayers(activeTeamId)
      .then(setPlayers)
      .catch(() => {
        /* εκτός σύνδεσης: μένει η τοπική εικόνα */
      })
  }, [activeTeamId, revisions.players])

  const grouped = useMemo(() => {
    const map = Object.fromEntries(GROUP_ORDER.map((g) => [g, []]))
    players.forEach((p) => map[p.position]?.push(p))
    return map
  }, [players])

  function onSave(form) {
    setPlayers(savePlayer(activeTeamId, form))
    setEditing(null)
  }

  function onDelete(id) {
    setPlayers(deletePlayer(activeTeamId, id))
    setEditing(null)
  }

  return (
    <>
      <TopBar
        title="Ρόστερ"
        subtitle={`${activeTeam?.name ?? ''} · ${players.length} παίκτες`}
      />

      <div className="px-4 py-4">
        {players.length === 0 ? (
          <Empty
            icon={Users}
            title="Άδειο ρόστερ"
            hint="Πρόσθεσε τους παίκτες σου για να ξεκινήσεις παρουσιολόγιο και χωρισμό ομάδων."
            action={
              <Button onClick={() => setEditing({})} size="lg">
                <Plus size={20} /> Προσθήκη παίκτη
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            {GROUP_ORDER.filter((g) => grouped[g].length > 0).map((group) => (
              <section key={group} className="overflow-hidden rounded-2xl border border-line bg-surface">
                <h2 className="border-b border-line px-4 py-2 text-xs font-bold tracking-wide text-muted uppercase">
                  {POSITIONS[group]} ({grouped[group].length})
                </h2>
                {grouped[group].map((player) => (
                  <PlayerRow key={player.id} player={player} onEdit={setEditing} />
                ))}
              </section>
            ))}
          </div>
        )}
      </div>

      {players.length > 0 && (
        <button
          onClick={() => setEditing({})}
          aria-label="Προσθήκη παίκτη"
          className="fixed right-5 bottom-24 z-30 flex size-16 items-center justify-center rounded-full bg-brand text-bg shadow-lg shadow-black/40"
        >
          <Plus size={30} />
        </button>
      )}

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Επεξεργασία παίκτη' : 'Νέος παίκτης'}
      >
        {editing !== null && (
          <PlayerForm initial={editing} onSave={onSave} onDelete={onDelete} />
        )}
      </Sheet>
    </>
  )
}
