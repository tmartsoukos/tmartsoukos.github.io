import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Shuffle, BarChart3 } from 'lucide-react'
import TopBar from '../components/layout/TopBar'
import Empty from '../components/ui/Empty'
import StatusToggle from '../components/attendance/StatusToggle'
import AttendanceHeader from '../components/attendance/AttendanceHeader'
import { useTeam } from '../context/TeamContext'
import { addDays, todayISO } from '../lib/dates'
import {
  cachedAttendance,
  cachedPlayers,
  clearAttendance,
  fetchAttendance,
  fetchPlayers,
  getOrCreateSession,
  setAttendance,
  setAttendanceBulk,
  updateSession,
} from '../lib/repo'

export default function Attendance() {
  const { activeTeamId, activeTeam, revisions } = useTeam()
  const [dateISO, setDateISO] = useState(todayISO())
  const [session, setSession] = useState(null)
  const [players, setPlayers] = useState(() => cachedPlayers(activeTeamId))
  const [rows, setRows] = useState([])

  // Παίκτες
  useEffect(() => {
    setPlayers(cachedPlayers(activeTeamId))
    fetchPlayers(activeTeamId)
      .then(setPlayers)
      .catch(() => {})
  }, [activeTeamId, revisions.players])

  // Προπόνηση της ημέρας (δημιουργείται αυτόματα, ακόμη κι εκτός σύνδεσης)
  useEffect(() => {
    let active = true
    getOrCreateSession(activeTeamId, dateISO).then((s) => {
      if (!active) return
      setSession(s)
      setRows(cachedAttendance(s.id))
      fetchAttendance(s.id)
        .then(setRows)
        .catch(() => {})
    })
    return () => {
      active = false
    }
  }, [activeTeamId, dateISO, revisions.attendance, revisions.sessions])

  const statusOf = useCallback(
    (playerId) => rows.find((r) => r.player_id === playerId)?.status ?? null,
    [rows],
  )

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, excused: 0, total: players.length }
    players.forEach((p) => {
      const status = statusOf(p.id)
      if (status) c[status]++
    })
    return c
  }, [players, statusOf])

  const locked = session?.is_locked ?? false

  async function onSet(playerId, status) {
    if (!session || locked) return
    setRows(await setAttendance(session.id, playerId, status))
  }

  async function onAllPresent() {
    if (!session) return
    setRows(await setAttendanceBulk(session.id, players.map((p) => p.id), 'present'))
  }

  function onClear() {
    if (!session) return
    setRows(clearAttendance(session.id))
  }

  function onToggleLock() {
    if (!session) return
    setSession(updateSession(activeTeamId, session, { is_locked: !locked }))
  }

  return (
    <>
      <TopBar title="Παρουσιολόγιο" subtitle={activeTeam?.name} />

      <AttendanceHeader
        dateISO={dateISO}
        counts={counts}
        locked={locked}
        onShift={(delta) => setDateISO((d) => addDays(d, delta))}
        onToday={() => setDateISO(todayISO())}
        onAllPresent={onAllPresent}
        onClear={onClear}
        onToggleLock={onToggleLock}
      />

      <div className="px-4 py-4">
        {players.length === 0 ? (
          <Empty
            icon={Users}
            title="Δεν υπάρχουν παίκτες"
            hint="Πρόσθεσε πρώτα το ρόστερ σου."
            action={
              <Link to="/roster" className="font-bold text-brand">
                Άνοιγμα ρόστερ
              </Link>
            }
          />
        ) : (
          <>
            {locked && (
              <p className="mb-3 rounded-xl border border-excused/40 bg-excused/10 px-4 py-2 text-sm text-excused">
                Το παρουσιολόγιο είναι κλειδωμένο.
              </p>
            )}

            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              {players.map((player) => (
                <StatusToggle
                  key={player.id}
                  player={player}
                  status={statusOf(player.id)}
                  onSet={(status) => onSet(player.id, status)}
                />
              ))}
            </div>

            <p className="mt-3 text-center text-xs text-muted">
              Ένα πάτημα αλλάζει κατάσταση. Παρατεταμένο πάτημα για άμεση επιλογή.
            </p>

            <div className="mt-5 flex gap-3">
              <Link
                to="/split"
                className="flex min-h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-brand font-bold text-bg"
              >
                <Shuffle size={20} /> Χωρισμός Ομάδων
              </Link>
              <Link
                to="/stats"
                aria-label="Στατιστικά"
                className="flex min-h-14 w-16 items-center justify-center rounded-xl border border-line bg-surface-2"
              >
                <BarChart3 size={20} />
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  )
}
