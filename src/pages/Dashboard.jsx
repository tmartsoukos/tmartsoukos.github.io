import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Shuffle, ListChecks, Timer, BarChart3, LayoutGrid } from 'lucide-react'
import TopBar from '../components/layout/TopBar'
import Card from '../components/ui/Card'
import { useTeam } from '../context/TeamContext'
import { formatLong, todayISO } from '../lib/dates'
import {
  cachedAttendance,
  cachedPlayers,
  cachedSessionDrills,
  fetchAttendance,
  fetchPlayers,
  fetchSessionDrills,
  getOrCreateSession,
} from '../lib/repo'

const ACTIONS = [
  { to: '/attendance', label: 'Παρουσιολόγιο', icon: ClipboardList },
  { to: '/split', label: 'Χωρισμός ομάδων', icon: Shuffle },
  { to: '/session', label: 'Πλάνο ημέρας', icon: ListChecks },
  { to: '/board', label: 'Σχεδιαστήριο', icon: LayoutGrid },
  { to: '/timer', label: 'Χρονόμετρο', icon: Timer },
  { to: '/stats', label: 'Στατιστικά', icon: BarChart3 },
]

export default function Dashboard() {
  const { activeTeam, activeTeamId, revisions } = useTeam()
  const [players, setPlayers] = useState(() => cachedPlayers(activeTeamId))
  const [present, setPresent] = useState(0)
  const [minutes, setMinutes] = useState(0)

  useEffect(() => {
    let active = true

    fetchPlayers(activeTeamId)
      .then(setPlayers)
      .catch(() => setPlayers(cachedPlayers(activeTeamId)))

    getOrCreateSession(activeTeamId, todayISO()).then((session) => {
      if (!active) return

      const countPresent = (rows) => rows.filter((r) => r.status === 'present').length
      setPresent(countPresent(cachedAttendance(session.id)))
      setMinutes(cachedSessionDrills(session.id).reduce((sum, d) => sum + d.duration_min, 0))

      fetchAttendance(session.id)
        .then((rows) => active && setPresent(countPresent(rows)))
        .catch(() => {})
      fetchSessionDrills(session.id)
        .then((rows) => active && setMinutes(rows.reduce((sum, d) => sum + d.duration_min, 0)))
        .catch(() => {})
    })

    return () => {
      active = false
    }
  }, [activeTeamId, revisions.attendance, revisions.session_drills, revisions.players])

  return (
    <>
      <TopBar title={activeTeam?.name ?? 'CoachPad'} subtitle={formatLong(todayISO())} />

      <div className="px-4 py-4">
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Card>
            <p className="text-xs text-muted">Παρόντες σήμερα</p>
            <p className="text-3xl font-black tnum">
              {present}
              <span className="text-lg text-muted">/{players.length}</span>
            </p>
          </Card>
          <Card>
            <p className="text-xs text-muted">Διάρκεια πλάνου</p>
            <p className="text-3xl font-black tnum">
              {minutes}
              <span className="text-lg text-muted">′</span>
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ACTIONS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-surface p-3 text-center font-bold active:bg-surface-2"
            >
              <Icon size={28} className="text-brand" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
