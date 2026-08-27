import { useCallback, useEffect, useRef, useState } from 'react'
import { beep, startTone, unlockAudio, whistle } from '../../lib/audio'

// ============================================================
// Χρονόμετρο και διαλειμματικός χρονομετρητής
//
// Ο χρόνος ΔΕΝ μετριέται με άθροιση tick. Κρατάμε τη στιγμή
// εκκίνησης και υπολογίζουμε τη διαφορά από το Date.now() σε κάθε
// ανανέωση. Έτσι, όταν ο browser «παγώνει» το tab στο παρασκήνιο,
// ο χρόνος επιστρέφει σωστός μόλις η οθόνη ξαναανοίξει.
// ============================================================

export default function useTimer({ mode = 'stopwatch', work = 30, rest = 15, sets = 6 }) {
  const [running, setRunning] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const startedAt = useRef(null)
  const accumulated = useRef(0)
  const lastPhase = useRef(null)
  const lastWholeSecond = useRef(null)
  const wakeLock = useRef(null)

  const elapsedMs = accumulated.current + (running && startedAt.current ? now - startedAt.current : 0)
  const elapsed = elapsedMs / 1000

  // Παράγωγη κατάσταση για τον διαλειμματικό χρονομετρητή
  const cycle = work + rest
  const totalPlanned = cycle * sets
  let phase = 'stopwatch'
  let remaining = 0
  let currentSet = 1

  if (mode === 'interval') {
    if (elapsed >= totalPlanned) {
      phase = 'done'
      remaining = 0
      currentSet = sets
    } else {
      currentSet = Math.floor(elapsed / cycle) + 1
      const within = elapsed % cycle
      phase = within < work ? 'work' : 'rest'
      remaining = within < work ? work - within : cycle - within
    }
  }

  // Ρολόι ανανέωσης. 200ms είναι αρκετά για ομαλή ένδειξη δευτερολέπτων
  // χωρίς να ξοδεύει μπαταρία.
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(id)
  }, [running])

  // Ηχητικά σήματα: αντίστροφη μέτρηση 3-2-1 και σφυρίχτρα στην αλλαγή φάσης
  useEffect(() => {
    if (!running || mode !== 'interval') return

    if (phase === 'done') {
      if (lastPhase.current !== 'done') {
        whistle()
        lastPhase.current = 'done'
        setRunning(false)
      }
      return
    }

    if (lastPhase.current !== null && lastPhase.current !== phase) {
      whistle()
    } else if (lastPhase.current === null) {
      startTone()
    }
    lastPhase.current = phase

    const whole = Math.ceil(remaining)
    if (whole !== lastWholeSecond.current) {
      lastWholeSecond.current = whole
      if (whole <= 3 && whole > 0) beep()
    }
  }, [running, mode, phase, remaining])

  // Η οθόνη δεν πρέπει να σβήνει όσο τρέχει το χρονόμετρο
  useEffect(() => {
    let cancelled = false

    async function acquire() {
      try {
        if ('wakeLock' in navigator && running) {
          wakeLock.current = await navigator.wakeLock.request('screen')
        }
      } catch {
        /* δεν υποστηρίζεται ή απορρίφθηκε */
      }
    }

    if (running) acquire()
    else if (wakeLock.current) {
      wakeLock.current.release().catch(() => {})
      wakeLock.current = null
    }

    return () => {
      if (cancelled) return
      cancelled = true
    }
  }, [running])

  const start = useCallback(() => {
    unlockAudio() // πρέπει να γίνει μέσα στη χειρονομία του χρήστη
    startedAt.current = Date.now()
    setNow(Date.now())
    setRunning(true)
  }, [])

  const pause = useCallback(() => {
    if (startedAt.current) {
      accumulated.current += Date.now() - startedAt.current
      startedAt.current = null
    }
    setRunning(false)
  }, [])

  const reset = useCallback(() => {
    accumulated.current = 0
    startedAt.current = null
    lastPhase.current = null
    lastWholeSecond.current = null
    setNow(Date.now())
    setRunning(false)
  }, [])

  /** Πηδά στο επόμενο διάστημα (χρήσιμο όταν η άσκηση τελείωσε νωρίτερα). */
  const skip = useCallback(() => {
    if (mode !== 'interval') return
    const current = accumulated.current + (startedAt.current ? Date.now() - startedAt.current : 0)
    const seconds = current / 1000
    const within = seconds % cycle
    const jump = within < work ? work - within : cycle - within
    accumulated.current = (seconds + jump + 0.01) * 1000
    startedAt.current = running ? Date.now() : null
    setNow(Date.now())
  }, [mode, cycle, work, running])

  return {
    running,
    elapsed,
    phase,
    remaining,
    currentSet,
    sets,
    start,
    pause,
    reset,
    skip,
  }
}
