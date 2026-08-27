import { useEffect, useRef } from 'react'
import { vibrate } from '../../lib/audio'

// Καρουζέλ επιλογής τιμής.
//
// Η ολίσθηση και το «κούμπωμα» γίνονται από το ίδιο το CSS
// (scroll-snap), όχι από JavaScript: έτσι η κίνηση είναι ομαλή
// στο κινητό και ακολουθεί το δάχτυλο χωρίς καθυστέρηση.
const ITEM = 48
const HEIGHT = 192
const PAD = (HEIGHT - ITEM) / 2

export default function WheelPicker({ label, values, value, onChange, format = String }) {
  const ref = useRef(null)
  const settle = useRef(null)

  // Αρχική θέση: μόνο στο άνοιγμα, ώστε να μη «τραβιέται» η λίστα
  // κάτω από το δάχτυλο του χρήστη ενώ κυλάει.
  useEffect(() => {
    const index = values.indexOf(value)
    if (ref.current && index >= 0) ref.current.scrollTop = index * ITEM
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onScroll() {
    clearTimeout(settle.current)
    settle.current = setTimeout(() => {
      if (!ref.current) return
      const index = Math.min(
        values.length - 1,
        Math.max(0, Math.round(ref.current.scrollTop / ITEM)),
      )
      if (values[index] !== value) {
        onChange(values[index])
        vibrate(8)
      }
    }, 100)
  }

  return (
    <div className="min-w-0 flex-1">
      <p className="mb-2 text-center text-xs font-bold tracking-wide text-muted uppercase">
        {label}
      </p>

      <div className="relative" style={{ height: HEIGHT }}>
        {/* Ζώνη επιλογής */}
        <div
          className="pointer-events-none absolute inset-x-0 rounded-xl border-y-2 border-brand bg-brand/10"
          style={{ top: PAD, height: ITEM }}
        />

        <div
          ref={ref}
          onScroll={onScroll}
          className="no-scrollbar h-full snap-y snap-mandatory overflow-y-auto"
        >
          <div style={{ height: PAD }} />
          {values.map((v) => (
            <div
              key={v}
              className={`flex snap-center items-center justify-center text-2xl font-black tnum transition-colors ${
                v === value ? 'text-text' : 'text-muted/60'
              }`}
              style={{ height: ITEM }}
            >
              {format(v)}
            </div>
          ))}
          <div style={{ height: PAD }} />
        </div>
      </div>
    </div>
  )
}
