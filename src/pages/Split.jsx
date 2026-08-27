import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shuffle, Save, Check, ClipboardList } from 'lucide-react'
import TopBar from '../components/layout/TopBar'
import Empty from '../components/ui/Empty'
import Button from '../components/ui/Button'
import TeamColumn from '../components/split/TeamColumn'
import { useTeam } from '../context/TeamContext'
import { todayISO } from '../lib/dates'
import { splitTeams, suggestFormat, swapPlayers } from '../lib/splitter'
import { buildStats } from '../lib/stats'
import {
  cachedAttendance,
  cachedPlayers,
  cachedSplit,
  cachedTeamAttendance,
  fetchAttendance,
  fetchPlayers,
  fetchSplit,
  fetchTeamAttendance,
  getOrCreateSession,
  saveSplit,
} from '../lib/repo'

export default function Split() {
  const { activeTeamId, revisions } = useTeam()
  const [session, setSession] = useState(null)
  const [players, setPlayers] = useState(() => cachedPlayers(activeTeamId))
  const [attendance, setAttendance] = useState([])
  const [history, setHistory] = useState(() => cachedTeamAttendance(activeTeamId))
  const [groups, setGroups] = useState(null)
  const [seed, setSeed] = useState(1)
  const [selectedId, setSelectedId] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setPlayers(cachedPlayers(activeTeamId))
    fetchPlayers(activeTeamId)
      .then(setPlayers)
      .catch(() => {})
    fetchTeamAttendance(activeTeamId)
      .then(setHistory)
      .catch(() => {})
  }, [activeTeamId, revisions.players])

  useEffect(() => {
    let active = true
    getOrCreateSession(activeTeamId, todayISO()).then((s) => {
      if (!active) return
      setSession(s)
      setAttendance(cachedAttendance(s.id))
      fetchAttendance(s.id)
        .then(setAttendance)
        .catch(() => {})
      fetchSplit(s.id).catch(() => {})
    })
    return () => {
      active = false
    }
  }, [activeTeamId, revisions.attendance])

  // Οι παρόντες, με το ποσοστό συνέπειάς τους ως βάρος ισορροπίας
  const present = useMemo(() => {
    const stats = buildStats(players, history, null)
    const pctById = new Map(stats.rows.map((r) => [r.player.id, r.pct]))
    const presentIds = new Set(
      attendance.filter((r) => r.status === 'present').map((r) => r.player_id),
    )
    return players
      .filter((p) => presentIds.has(p.id))
      .map((p) => ({ ...p, attendance_pct: pctById.get(p.id) ?? 50 }))
  }, [players, attendance, history])

  const format = useMemo(() => suggestFormat(present.length), [present.length])

  // Επαναφορά αποθηκευμένου χωρισμού, αν αφορά ακριβώς τους ίδιους παρόντες
  useEffect(() => {
    if (!session || present.length === 0) {
      setGroups(null)
      return
    }
    const stored = cachedSplit(session.id)
    const byId = new Map(present.map((p) => [p.id, p]))
    if (stored?.teams) {
      const pick = (ids) => (ids ?? []).map((id) => byId.get(id)).filter(Boolean)
      const restored = { a: pick(stored.teams.a), b: pick(stored.teams.b), joker: pick(stored.teams.joker) }
      const count = restored.a.length + restored.b.length + restored.joker.length
      if (count === present.length) {
        setGroups(restored)
        return
      }
    }
    const result = splitTeams(present, seed)
    setGroups({ a: result.a, b: result.b, joker: result.joker })
  }, [session, present, seed])

  function reshuffle() {
    const next = seed + 1
    setSeed(next)
    const result = splitTeams(present, next)
    setGroups({ a: result.a, b: result.b, joker: result.joker })
    setSaved(false)
  }

  function onSelect(id) {
    if (!selectedId) {
      setSelectedId(id)
      return
    }
    if (selectedId === id) {
      setSelectedId(null)
      return
    }
    setGroups((prev) => swapPlayers(prev, selectedId, id))
    setSelectedId(null)
    setSaved(false)
  }

  async function onSave() {
    if (!session || !groups) return
    await saveSplit(session.id, format.label, {
      a: groups.a.map((p) => p.id),
      b: groups.b.map((p) => p.id),
      joker: groups.joker.map((p) => p.id),
    })
    setSaved(true)
  }

  return (
    <>
      <TopBar title="Χωρισμός ομάδων" back />

      <div className="px-4 py-4">
        {present.length < 4 ? (
          <Empty
            icon={ClipboardList}
            title="Λίγοι παρόντες"
            hint="Χρειάζονται τουλάχιστον 4 παρόντες παίκτες. Συμπλήρωσε πρώτα το παρουσιολόγιο της ημέρας."
            action={
              <Link to="/attendance" className="font-bold text-brand">
                Άνοιγμα παρουσιολογίου
              </Link>
            }
          />
        ) : (
          <>
            <div className="mb-4 rounded-2xl border border-line bg-surface p-4 text-center">
              <p className="text-3xl font-black">{format.label}</p>
              <p className="mt-1 text-sm text-muted">
                {present.length} παρόντες · {format.note}
              </p>
            </div>

            {groups && (
              <div className="grid grid-cols-2 gap-3">
                <TeamColumn
                  side="a"
                  title="Πράσινα"
                  players={groups.a}
                  selectedId={selectedId}
                  onSelect={onSelect}
                />
                <TeamColumn
                  side="b"
                  title="Πορτοκαλί"
                  players={groups.b}
                  selectedId={selectedId}
                  onSelect={onSelect}
                />
              </div>
            )}

            {groups?.joker.length > 0 && (
              <div className="mt-3">
                <TeamColumn
                  side="joker"
                  title="Μπαλαντέρ"
                  players={groups.joker}
                  selectedId={selectedId}
                  onSelect={onSelect}
                />
              </div>
            )}

            <p className="mt-3 text-center text-xs text-muted">
              Πάτησε έναν παίκτη και μετά έναν άλλο για να τους ανταλλάξεις.
            </p>

            <div className="mt-5 flex gap-3">
              <Button variant="subtle" size="lg" className="flex-1" onClick={reshuffle}>
                <Shuffle size={20} /> Ανακάτεμα
              </Button>
              <Button size="lg" className="flex-1" onClick={onSave}>
                {saved ? <Check size={20} /> : <Save size={20} />}
                {saved ? 'Αποθηκεύτηκε' : 'Αποθήκευση'}
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
