import { useEffect, useState } from 'react'
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react'
import useTimer from './useTimer'
import IntervalConfig from './IntervalConfig'
import { formatClock } from '../../lib/dates'
import { readLocal, writeLocal, keys } from '../../lib/db'

const PHASE_LABEL = {
  work: 'ΑΣΚΗΣΗ',
  rest: 'ΞΕΚΟΥΡΑΣΗ',
  done: 'ΤΕΛΟΣ',
  stopwatch: 'ΧΡΟΝΟΣ',
}

const PHASE_COLOR = {
  work: 'text-present',
  rest: 'text-excused',
  done: 'text-brand',
  stopwatch: 'text-text',
}

export default function TimerPanel({ presetLabel = null, presetMinutes = null }) {
  const [mode, setMode] = useState(presetMinutes ? 'interval' : 'stopwatch')
  const [config, setConfig] = useState(
    () => readLocal(keys.timerConfig(), null) ?? { work: 30, rest: 15, sets: 6 },
  )

  useEffect(() => {
    writeLocal(keys.timerConfig(), config)
  }, [config])

  // Αν το χρονόμετρο άνοιξε από άσκηση του πλάνου, προτείνουμε
  // ένα σετ με διάρκεια όση και η άσκηση.
  useEffect(() => {
    if (presetMinutes) {
      setConfig((prev) => ({ ...prev, work: presetMinutes * 60, rest: 60, sets: 1 }))
    }
  }, [presetMinutes])

  const timer = useTimer({ mode, ...config })
  const value = mode === 'interval' ? timer.remaining : timer.elapsed

  return (
    <div className="flex flex-col gap-5">
      {presetLabel && (
        <p className="text-center text-sm text-muted">
          Άσκηση: <span className="font-semibold text-text">{presetLabel}</span>
        </p>
      )}

      <div className="flex rounded-xl border border-line bg-surface p-1">
        {[
          ['stopwatch', 'Χρονόμετρο'],
          ['interval', 'Διαλειμματικό'],
        ].map(([value_, label]) => (
          <button
            key={value_}
            onClick={() => {
              timer.reset()
              setMode(value_)
            }}
            className={`min-h-12 flex-1 rounded-lg text-sm font-bold ${
              mode === value_ ? 'bg-brand text-bg' : 'text-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-line bg-surface py-8 text-center">
        <p className={`text-sm font-black tracking-widest ${PHASE_COLOR[timer.phase]}`}>
          {PHASE_LABEL[timer.phase]}
        </p>
        <p className="text-7xl leading-none font-black tnum">{formatClock(value)}</p>
        {mode === 'interval' && (
          <p className="mt-2 text-sm text-muted tnum">
            Σετ {timer.currentSet}/{timer.sets}
          </p>
        )}
      </div>

      {mode === 'interval' && !timer.running && timer.elapsed === 0 && (
        <IntervalConfig config={config} onChange={setConfig} />
      )}

      <div className="flex gap-3">
        <button
          onClick={timer.running ? timer.pause : timer.start}
          className="flex min-h-20 flex-2 items-center justify-center gap-2 rounded-2xl bg-brand text-xl font-black text-bg"
        >
          {timer.running ? <Pause size={28} /> : <Play size={28} />}
          {timer.running ? 'Παύση' : 'Έναρξη'}
        </button>

        {mode === 'interval' && (
          <button
            onClick={timer.skip}
            aria-label="Επόμενο διάστημα"
            className="flex min-h-20 flex-1 items-center justify-center rounded-2xl border border-line bg-surface-2"
          >
            <SkipForward size={26} />
          </button>
        )}

        <button
          onClick={timer.reset}
          aria-label="Μηδενισμός"
          className="flex min-h-20 flex-1 items-center justify-center rounded-2xl border border-line bg-surface-2"
        >
          <RotateCcw size={26} />
        </button>
      </div>
    </div>
  )
}
