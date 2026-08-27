import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, Eraser } from 'lucide-react'
import TopBar from '../components/layout/TopBar'
import TacticalBoard from '../components/board/TacticalBoard'
import Sheet from '../components/ui/Sheet'
import Button from '../components/ui/Button'
import DrillForm from '../components/drills/DrillForm'
import { useTeam } from '../context/TeamContext'
import { readLocal, writeLocal } from '../lib/db'
import { cachedPlayers, fetchPlayers, saveDrill } from '../lib/repo'

const SCRATCH_KEY = 'board:scratch'
const EMPTY = { objects: [], arrows: [] }

// Πρόχειρο σχεδιαστήριο: ανοίγει αμέσως, χωρίς να χρειάζεται
// πρώτα άσκηση. Ό,τι σχεδιάζεται μένει τοπικά μέχρι να το
// αποθηκεύσει ο προπονητής ως άσκηση.
export default function Board() {
  const { activeTeamId } = useTeam()
  const navigate = useNavigate()
  const [board, setBoard] = useState(() => readLocal(SCRATCH_KEY, EMPTY) ?? EMPTY)
  const [saving, setSaving] = useState(false)
  const [players, setPlayers] = useState(() => cachedPlayers(activeTeamId))

  useEffect(() => {
    writeLocal(SCRATCH_KEY, board)
  }, [board])

  useEffect(() => {
    fetchPlayers(activeTeamId)
      .then(setPlayers)
      .catch(() => {})
  }, [activeTeamId])

  function onSaveAsDrill(form) {
    saveDrill(activeTeamId, { ...form, board_data: board })
    setSaving(false)
    navigate('/drills')
  }

  return (
    <>
      <TopBar
        title="Σχεδιαστήριο"
        subtitle="Πρόχειρο σχέδιο τακτικής"
        back
        right={
          <button
            onClick={() => setSaving(true)}
            aria-label="Αποθήκευση ως άσκηση"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand text-bg"
          >
            <Save size={20} />
          </button>
        }
      />

      <div className="px-4 py-4">
        <TacticalBoard value={board} onChange={setBoard} players={players} />

        <p className="mt-3 text-center text-xs text-muted">
          Κίνηση παίκτη = συνεχής γραμμή · Πάσα = διακεκομμένη.
        </p>

        <Button variant="ghost" className="mt-2 w-full" onClick={() => setBoard(EMPTY)}>
          <Eraser size={18} /> Νέο σχέδιο
        </Button>
      </div>

      <Sheet open={saving} onClose={() => setSaving(false)} title="Αποθήκευση ως άσκηση">
        {saving && (
          <DrillForm
            initial={{ category: 'tactics', board_data: board }}
            onSave={onSaveAsDrill}
            onDelete={() => setSaving(false)}
          />
        )}
      </Sheet>
    </>
  )
}
