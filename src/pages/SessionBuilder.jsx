import { useEffect, useMemo, useState } from 'react'
import { Timer as TimerIcon } from 'lucide-react'
import TopBar from '../components/layout/TopBar'
import PhaseSection from '../components/session/PhaseSection'
import DrillPicker from '../components/session/DrillPicker'
import TimerOverlay from '../components/timer/TimerOverlay'
import { useTeam } from '../context/TeamContext'
import { PHASES } from '../lib/drills'
import { formatLong, todayISO } from '../lib/dates'
import {
  addSessionDrill,
  cachedDrills,
  cachedSessionDrills,
  fetchDrills,
  fetchSessionDrills,
  getOrCreateSession,
  removeSessionDrill,
  reorderSessionDrills,
  updateSessionDrill,
} from '../lib/repo'

export default function SessionBuilder() {
  const { activeTeamId, revisions } = useTeam()
  const [session, setSession] = useState(null)
  const [items, setItems] = useState([])
  const [drills, setDrills] = useState(() => cachedDrills(activeTeamId))
  const [pickerPhase, setPickerPhase] = useState(null)
  const [timerDrill, setTimerDrill] = useState(null)

  useEffect(() => {
    setDrills(cachedDrills(activeTeamId))
    fetchDrills(activeTeamId)
      .then(setDrills)
      .catch(() => {})
  }, [activeTeamId])

  useEffect(() => {
    let active = true
    getOrCreateSession(activeTeamId, todayISO()).then((s) => {
      if (!active) return
      setSession(s)
      setItems(cachedSessionDrills(s.id))
      fetchSessionDrills(s.id)
        .then(setItems)
        .catch(() => {})
    })
    return () => {
      active = false
    }
  }, [activeTeamId, revisions.session_drills])

  const byPhase = useMemo(() => {
    const map = Object.fromEntries(PHASES.map((p) => [p.id, []]))
    items.forEach((item) => map[item.phase]?.push(item))
    Object.values(map).forEach((list) => list.sort((x, y) => x.order_index - y.order_index))
    return map
  }, [items])

  const totalMinutes = items.reduce((sum, item) => sum + item.duration_min, 0)

  function onPick(drill) {
    setItems(addSessionDrill(session.id, drill, pickerPhase.id))
    setPickerPhase(null)
  }

  function onChange(item, patch) {
    setItems(updateSessionDrill(session.id, item, patch))
  }

  function onRemove(item) {
    setItems(removeSessionDrill(session.id, item.id))
  }

  function onMove(phaseId, index, delta) {
    const list = [...byPhase[phaseId]]
    const target = index + delta
    if (target < 0 || target >= list.length) return
    const [moved] = list.splice(index, 1)
    list.splice(target, 0, moved)
    setItems(reorderSessionDrills(session.id, phaseId, list.map((d) => d.id)))
  }

  return (
    <>
      <TopBar
        title="Πλάνο προπόνησης"
        subtitle={`${formatLong(todayISO())} · ${totalMinutes}′ συνολικά`}
        right={
          <button
            onClick={() => setTimerDrill({})}
            aria-label="Χρονόμετρο"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-2"
          >
            <TimerIcon size={20} />
          </button>
        }
      />

      <div className="flex flex-col gap-4 px-4 py-4">
        {PHASES.map((phase) => (
          <PhaseSection
            key={phase.id}
            phase={phase}
            items={byPhase[phase.id]}
            onAdd={setPickerPhase}
            onChange={onChange}
            onRemove={onRemove}
            onMove={onMove}
            onTimer={setTimerDrill}
          />
        ))}
      </div>

      <DrillPicker
        open={pickerPhase !== null}
        onClose={() => setPickerPhase(null)}
        drills={drills}
        phase={pickerPhase}
        onPick={onPick}
      />

      <TimerOverlay
        open={timerDrill !== null}
        onClose={() => setTimerDrill(null)}
        drill={timerDrill?.id ? timerDrill : null}
      />
    </>
  )
}
