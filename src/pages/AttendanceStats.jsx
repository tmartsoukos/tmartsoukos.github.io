import { useEffect, useMemo, useState } from 'react'
import { BarChart3, TrendingDown } from 'lucide-react'
import TopBar from '../components/layout/TopBar'
import Empty from '../components/ui/Empty'
import ProgressBar from '../components/ui/ProgressBar'
import { useTeam } from '../context/TeamContext'
import { cachedPlayers, cachedTeamAttendance, fetchPlayers, fetchTeamAttendance } from '../lib/repo'
import { availableMonths, buildStats, consistencyColor } from '../lib/stats'
import { formatMonth, monthKey, todayISO } from '../lib/dates'

export default function AttendanceStats() {
  const { activeTeamId, revisions } = useTeam()
  const [players, setPlayers] = useState(() => cachedPlayers(activeTeamId))
  const [rows, setRows] = useState(() => cachedTeamAttendance(activeTeamId))
  const [scope, setScope] = useState(monthKey(todayISO()))

  useEffect(() => {
    setPlayers(cachedPlayers(activeTeamId))
    setRows(cachedTeamAttendance(activeTeamId))
    fetchPlayers(activeTeamId)
      .then(setPlayers)
      .catch(() => {})
    fetchTeamAttendance(activeTeamId)
      .then(setRows)
      .catch(() => {})
  }, [activeTeamId, revisions.attendance])

  const months = useMemo(() => availableMonths(rows), [rows])
  const stats = useMemo(
    () => buildStats(players, rows, scope === 'season' ? null : scope),
    [players, rows, scope],
  )

  return (
    <>
      <TopBar title="Στατιστικά παρουσιών" back />

      <div className="px-4 py-4">
        <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setScope('season')}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold ${
              scope === 'season' ? 'bg-brand text-bg' : 'bg-surface-2 text-muted'
            }`}
          >
            Όλη η σεζόν
          </button>
          {months.map((m) => (
            <button
              key={m}
              onClick={() => setScope(m)}
              className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold ${
                scope === m ? 'bg-brand text-bg' : 'bg-surface-2 text-muted'
              }`}
            >
              {formatMonth(`${m}-01`)}
            </button>
          ))}
        </div>

        {stats.total === 0 ? (
          <Empty
            icon={BarChart3}
            title="Δεν υπάρχουν δεδομένα"
            hint="Μόλις κρατήσεις το πρώτο παρουσιολόγιο θα εμφανιστούν εδώ ποσοστά και κατάταξη συνέπειας."
          />
        ) : (
          <>
            <p className="mb-4 text-sm text-muted">
              {stats.total} {stats.total === 1 ? 'προπόνηση' : 'προπονήσεις'} στο διάστημα.
            </p>

            <ol className="flex flex-col gap-3">
              {stats.rows.map((entry, index) => (
                <li key={entry.player.id} className="rounded-2xl border border-line bg-surface p-4">
                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="w-6 shrink-0 text-sm font-bold text-muted tnum">{index + 1}.</span>
                    <span className="min-w-0 flex-1 truncate font-semibold">
                      {entry.player.full_name}
                    </span>
                    {entry.pct < 60 && <TrendingDown size={16} className="text-absent" />}
                    <span className="text-lg font-black tnum">{entry.pct}%</span>
                  </div>

                  <ProgressBar value={entry.pct} color={consistencyColor(entry.pct)} />

                  <p className="mt-2 text-xs text-muted">
                    {entry.present} παρών · {entry.excused} δικαιολογημένος · {entry.absent} απών
                    {entry.missing > 0 && ` · ${entry.missing} χωρίς καταχώρηση`}
                  </p>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </>
  )
}
