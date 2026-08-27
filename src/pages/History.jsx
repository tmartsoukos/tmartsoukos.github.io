import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Users, Clock, Copy, ListChecks, AlertTriangle } from 'lucide-react'
import TopBar from '../components/layout/TopBar'
import Sheet from '../components/ui/Sheet'
import Empty from '../components/ui/Empty'
import Button from '../components/ui/Button'
import { useTeam } from '../context/TeamContext'
import { formatLong, todayISO, isToday } from '../lib/dates'
import { PHASES, INTENSITY, INTENSITY_COLOR } from '../lib/drills'
import {
  cachedSessionDrills,
  cachedSessions,
  cachedTeamAttendance,
  cachedTeamSessionDrills,
  fetchSessions,
  fetchTeamAttendance,
  fetchTeamSessionDrills,
  getOrCreateSession,
  replaceSessionPlan,
} from '../lib/repo'

export default function History() {
  const { activeTeamId, revisions } = useTeam()
  const navigate = useNavigate()

  const [sessions, setSessions] = useState(() => cachedSessions(activeTeamId))
  const [attendance, setAttendance] = useState(() => cachedTeamAttendance(activeTeamId))
  const [planItems, setPlanItems] = useState(() => cachedTeamSessionDrills(activeTeamId))
  const [selected, setSelected] = useState(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    setSessions(cachedSessions(activeTeamId))
    setAttendance(cachedTeamAttendance(activeTeamId))
    setPlanItems(cachedTeamSessionDrills(activeTeamId))

    fetchSessions(activeTeamId)
      .then(setSessions)
      .catch(() => {})
    fetchTeamAttendance(activeTeamId)
      .then(setAttendance)
      .catch(() => {})
    fetchTeamSessionDrills(activeTeamId)
      .then(setPlanItems)
      .catch(() => {})
  }, [activeTeamId, revisions.sessions, revisions.attendance, revisions.session_drills])

  // Σύνοψη ανά προπόνηση: παρόντες, λεπτά, πλήθος ασκήσεων
  const rows = useMemo(() => {
    const presentBySession = new Map()
    attendance.forEach((r) => {
      if (r.status !== 'present') return
      presentBySession.set(r.session_id, (presentBySession.get(r.session_id) ?? 0) + 1)
    })

    const planBySession = new Map()
    planItems.forEach((item) => {
      const list = planBySession.get(item.session_id) ?? []
      list.push(item)
      planBySession.set(item.session_id, list)
    })

    return [...sessions]
      .sort((a, b) => b.session_date.localeCompare(a.session_date))
      .map((session) => {
        const plan = (planBySession.get(session.id) ?? []).sort(
          (x, y) => x.phase - y.phase || x.order_index - y.order_index,
        )
        return {
          session,
          present: presentBySession.get(session.id) ?? 0,
          plan,
          minutes: plan.reduce((sum, item) => sum + item.duration_min, 0),
        }
      })
      // Μια προπόνηση χωρίς τίποτα καταχωρημένο δεν έχει νόημα στο ιστορικό
      .filter((row) => row.present > 0 || row.plan.length > 0)
  }, [sessions, attendance, planItems])

  async function applyPlan() {
    const target = await getOrCreateSession(activeTeamId, todayISO())
    replaceSessionPlan(target.id, selected.plan)
    setConfirming(false)
    setSelected(null)
    navigate('/session')
  }

  async function onCopyRequest() {
    const target = await getOrCreateSession(activeTeamId, todayISO())
    // Αν το σημερινό πλάνο έχει ήδη ασκήσεις, ζητάμε επιβεβαίωση
    if (cachedSessionDrills(target.id).length > 0) {
      setConfirming(true)
      return
    }
    applyPlan()
  }

  return (
    <>
      <TopBar title="Ιστορικό προπονήσεων" subtitle={`${rows.length} καταγραφές`} back />

      <div className="px-4 py-4">
        {rows.length === 0 ? (
          <Empty
            icon={CalendarDays}
            title="Κανένα ιστορικό ακόμη"
            hint="Μόλις κρατήσεις παρουσιολόγιο ή φτιάξεις πλάνο, οι προπονήσεις θα εμφανίζονται εδώ."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((row) => (
              <li key={row.session.id}>
                <button
                  onClick={() => setSelected(row)}
                  className="w-full rounded-2xl border border-line bg-surface p-4 text-left active:bg-surface-2"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="min-w-0 flex-1 truncate font-bold">
                      {formatLong(row.session.session_date)}
                    </span>
                    {isToday(row.session.session_date) && (
                      <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[10px] font-black text-bg">
                        ΣΗΜΕΡΑ
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Users size={14} /> {row.present} παρόντες
                    </span>
                    <span className="flex items-center gap-1">
                      <ListChecks size={14} /> {row.plan.length} ασκήσεις
                    </span>
                    <span className="flex items-center gap-1 tnum">
                      <Clock size={14} /> {row.minutes}′
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Sheet
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? formatLong(selected.session.session_date) : ''}
      >
        {selected && (
          <>
            <p className="mb-4 text-sm text-muted">
              {selected.present} παρόντες · {selected.plan.length} ασκήσεις · {selected.minutes}′
            </p>

            {selected.plan.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">
                Δεν είχε καταχωρηθεί πλάνο για αυτή την ημέρα.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {PHASES.filter((phase) => selected.plan.some((i) => i.phase === phase.id)).map(
                  (phase) => (
                    <section key={phase.id}>
                      <h3 className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">
                        {phase.title}
                      </h3>
                      <ul className="flex flex-col gap-2">
                        {selected.plan
                          .filter((i) => i.phase === phase.id)
                          .map((item) => (
                            <li
                              key={item.id}
                              className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2"
                            >
                              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                                {item.title}
                              </span>
                              <span className={`text-[11px] ${INTENSITY_COLOR[item.intensity]}`}>
                                {INTENSITY[item.intensity]}
                              </span>
                              <span className="text-sm font-bold tnum">{item.duration_min}′</span>
                            </li>
                          ))}
                      </ul>
                    </section>
                  ),
                )}
              </div>
            )}

            {selected.plan.length > 0 && !isToday(selected.session.session_date) && (
              <Button size="lg" className="mt-5 w-full" onClick={onCopyRequest}>
                <Copy size={20} /> Αντιγραφή πλάνου σε σήμερα
              </Button>
            )}
          </>
        )}
      </Sheet>

      <Sheet open={confirming} onClose={() => setConfirming(false)} title="Αντικατάσταση πλάνου">
        <p className="flex items-start gap-2 text-sm text-muted">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-excused" />
          Το σημερινό πλάνο έχει ήδη ασκήσεις. Θα αντικατασταθεί από αυτό που διάλεξες.
        </p>
        <div className="mt-4 flex gap-3">
          <Button variant="subtle" className="flex-1" onClick={() => setConfirming(false)}>
            Άκυρο
          </Button>
          <Button className="flex-1" onClick={applyPlan}>
            Αντικατάσταση
          </Button>
        </div>
      </Sheet>
    </>
  )
}
