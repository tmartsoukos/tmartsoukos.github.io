import { useEffect, useState } from 'react'
import Sheet from '../ui/Sheet'
import Button from '../ui/Button'
import WheelPicker from './WheelPicker'
import { formatClock } from '../../lib/dates'

const range = (from, to, step) => {
  const out = []
  for (let v = from; v <= to; v += step) out.push(v)
  return out
}

const WORK = range(10, 900, 5) // 10″ έως 15′
const REST = range(5, 300, 5) // 5″ έως 5′
const SETS = range(1, 30, 1)

// Ρύθμιση διαστημάτων με τρία καρουζέλ. Ανοίγει με πάτημα πάνω
// στον χρόνο: στο γήπεδο είναι πολύ πιο γρήγορο από το να πατάς
// δεκάδες φορές + και −.
export default function IntervalPicker({ open, onClose, config, onApply }) {
  const [draft, setDraft] = useState(config)

  useEffect(() => {
    if (open) setDraft(config)
  }, [open, config])

  return (
    <Sheet open={open} onClose={onClose} title="Διαστήματα">
      <div className="flex gap-2">
        <WheelPicker
          label="Άσκηση"
          values={WORK}
          value={draft.work}
          format={formatClock}
          onChange={(work) => setDraft((d) => ({ ...d, work }))}
        />
        <WheelPicker
          label="Ξεκούραση"
          values={REST}
          value={draft.rest}
          format={formatClock}
          onChange={(rest) => setDraft((d) => ({ ...d, rest }))}
        />
        <WheelPicker
          label="Σετ"
          values={SETS}
          value={draft.sets}
          onChange={(sets) => setDraft((d) => ({ ...d, sets }))}
        />
      </div>

      <p className="mt-3 text-center text-sm text-muted">
        Συνολική διάρκεια: {formatClock((draft.work + draft.rest) * draft.sets)}
      </p>

      <Button
        size="lg"
        className="mt-4 w-full"
        onClick={() => {
          onApply(draft)
          onClose()
        }}
      >
        Εφαρμογή
      </Button>
    </Sheet>
  )
}
