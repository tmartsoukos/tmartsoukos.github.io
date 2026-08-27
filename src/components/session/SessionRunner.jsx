import { useEffect, useRef, useState } from 'react'
import { X, Play, Pause, SkipForward, SkipBack, CheckCircle2 } from 'lucide-react'
import useTimer from '../timer/useTimer'
import ProgressBar from '../ui/ProgressBar'
import { formatClock } from '../../lib/dates'
import { PHASES, INTENSITY, INTENSITY_COLOR } from '../../lib/drills'

// Τρέχει ολόκληρο το πλάνο σαν αλυσίδα: σφυρίζει στη λήξη κάθε
// άσκησης και περνά μόνο του στην επόμενη. Ο προπονητής δεν
// χρειάζεται να ξαναπιάσει το κινητό μέχρι να τελειώσει.
export default function SessionRunner({ items, onClose }) {
  const [index, setIndex] = useState(0)
  const [finished, setFinished] = useState(false)

  const firstRender = useRef(true)
  const resume = useRef(false)

  const item = items[index] ?? null
  const next = items[index + 1] ?? null

  const timer = useTimer({
    mode: 'interval',
    work: Math.max(1, (item?.duration_min ?? 1) * 60),
    rest: 0,
    sets: 1,
    onComplete: handleComplete,
  })

  function handleComplete() {
    if (index < items.length - 1) {
      resume.current = true
      setIndex((i) => i + 1)
    } else {
      setFinished(true)
    }
  }

  function go(delta) {
    const target = index + delta
    if (target < 0 || target >= items.length) return
    resume.current = timer.running
    setFinished(false)
    setIndex(target)
  }

  // Σε κάθε αλλαγή άσκησης μηδενίζουμε τον χρόνο και συνεχίζουμε
  // αυτόματα, εφόσον το χρονόμετρο έτρεχε.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    timer.reset()
    if (resume.current) timer.start()
    resume.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  const totalMinutes = items.reduce((sum, i) => sum + i.duration_min, 0)
  const doneMinutes = items.slice(0, index).reduce((sum, i) => sum + i.duration_min, 0)
  const currentDone = item ? item.duration_min * 60 - timer.remaining : 0
  const progress = totalMinutes === 0 ? 0 : ((doneMinutes * 60 + currentDone) / (totalMinutes * 60)) * 100

  const phaseTitle = PHASES.find((p) => p.id === item?.phase)?.title ?? ''

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      <div className="safe-top flex items-center justify-between border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-lg leading-tight font-bold">Προπόνηση σε εξέλιξη</h2>
          <p className="text-xs text-muted tnum">
            Άσκηση {Math.min(index + 1, items.length)}/{items.length} · {totalMinutes}′ συνολικά
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Κλείσιμο"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-2"
        >
          <X size={20} />
        </button>
      </div>

      <div className="safe-bottom flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-5">
        <ProgressBar value={progress} />

        {finished ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <CheckCircle2 size={64} className="text-brand" />
            <p className="text-2xl font-black">Τέλος προπόνησης</p>
            <p className="text-sm text-muted">
              {items.length} ασκήσεις · {totalMinutes}′
            </p>
            <button
              onClick={onClose}
              className="mt-2 min-h-14 rounded-2xl bg-brand px-8 font-black text-bg"
            >
              Κλείσιμο
            </button>
          </div>
        ) : (
          <>
            <div className="rounded-3xl border border-line bg-surface px-4 py-6 text-center">
              <p className="text-xs font-black tracking-widest text-muted uppercase">{phaseTitle}</p>
              <p className="mt-1 text-xl leading-tight font-bold">{item?.title}</p>
              <p className={`mt-1 text-xs ${INTENSITY_COLOR[item?.intensity ?? 'medium']}`}>
                Ένταση: {INTENSITY[item?.intensity ?? 'medium']}
              </p>

              <p className="mt-4 text-7xl leading-none font-black tnum">
                {formatClock(timer.remaining)}
              </p>
            </div>

            <p className="text-center text-sm text-muted">
              {next ? (
                <>
                  Επόμενη: <span className="font-semibold text-text">{next.title}</span> ·{' '}
                  {next.duration_min}′
                </>
              ) : (
                'Τελευταία άσκηση'
              )}
            </p>

            <div className="mt-auto flex gap-3">
              <button
                onClick={() => go(-1)}
                disabled={index === 0}
                aria-label="Προηγούμενη άσκηση"
                className="flex min-h-20 flex-1 items-center justify-center rounded-2xl border border-line bg-surface-2 disabled:opacity-30"
              >
                <SkipBack size={26} />
              </button>

              <button
                onClick={timer.running ? timer.pause : timer.start}
                className="flex min-h-20 flex-2 items-center justify-center gap-2 rounded-2xl bg-brand text-xl font-black text-bg"
              >
                {timer.running ? <Pause size={28} /> : <Play size={28} />}
                {timer.running ? 'Παύση' : 'Έναρξη'}
              </button>

              <button
                onClick={() => go(1)}
                disabled={index >= items.length - 1}
                aria-label="Επόμενη άσκηση"
                className="flex min-h-20 flex-1 items-center justify-center rounded-2xl border border-line bg-surface-2 disabled:opacity-30"
              >
                <SkipForward size={26} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
