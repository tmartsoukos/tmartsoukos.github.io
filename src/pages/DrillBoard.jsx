import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, Save } from 'lucide-react'
import TopBar from '../components/layout/TopBar'
import TacticalBoard from '../components/board/TacticalBoard'
import { useTeam } from '../context/TeamContext'
import { cachedDrills, cachedPlayers, fetchDrills, fetchPlayers, saveDrill } from '../lib/repo'

export default function DrillBoard() {
  const { drillId } = useParams()
  const { activeTeamId } = useTeam()
  const navigate = useNavigate()

  const [drills, setDrills] = useState(() => cachedDrills(activeTeamId))
  const [board, setBoard] = useState(null)
  const [saved, setSaved] = useState(false)
  const [players, setPlayers] = useState(() => cachedPlayers(activeTeamId))

  useEffect(() => {
    fetchDrills(activeTeamId)
      .then(setDrills)
      .catch(() => {})
    fetchPlayers(activeTeamId)
      .then(setPlayers)
      .catch(() => {})
  }, [activeTeamId])

  const drill = useMemo(() => drills.find((d) => d.id === drillId), [drills, drillId])

  useEffect(() => {
    if (drill && board === null) setBoard(drill.board_data ?? { objects: [], arrows: [] })
  }, [drill, board])

  function onSave() {
    if (!drill) return
    saveDrill(activeTeamId, { ...drill, board_data: board })
    setSaved(true)
    setTimeout(() => navigate(-1), 600)
  }

  if (!drill) {
    return (
      <>
        <TopBar title="Σχέδιο τακτικής" back />
        <p className="px-4 py-6 text-muted">Η άσκηση δεν βρέθηκε.</p>
      </>
    )
  }

  return (
    <>
      <TopBar
        title={drill.title}
        subtitle="Σχέδιο τακτικής"
        back
        right={
          <button
            onClick={onSave}
            aria-label="Αποθήκευση"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand text-bg"
          >
            {saved ? <Check size={20} /> : <Save size={20} />}
          </button>
        }
      />

      <div className="px-4 py-4">
        {board !== null && <TacticalBoard value={board} onChange={setBoard} players={players} />}
        <p className="mt-3 text-center text-xs text-muted">
          Κίνηση παίκτη = συνεχής γραμμή · Πάσα = διακεκομμένη. Το σχέδιο αποθηκεύεται μέσα στην άσκηση.
        </p>
      </div>
    </>
  )
}
