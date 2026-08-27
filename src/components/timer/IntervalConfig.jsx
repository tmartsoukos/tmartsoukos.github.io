import { Minus, Plus } from 'lucide-react'

function Stepper({ label, value, onChange, step = 5, min = 5, max = 900, suffix = '"' }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 text-sm text-muted">{label}</span>
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        aria-label={`Μείωση ${label}`}
        className="flex size-12 items-center justify-center rounded-xl bg-surface-2"
      >
        <Minus size={20} />
      </button>
      <span className="flex-1 text-center text-2xl font-black tnum">
        {value}
        {suffix}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        aria-label={`Αύξηση ${label}`}
        className="flex size-12 items-center justify-center rounded-xl bg-surface-2"
      >
        <Plus size={20} />
      </button>
    </div>
  )
}

export default function IntervalConfig({ config, onChange }) {
  return (
    <div className="flex flex-col gap-3">
      <Stepper
        label="Άσκηση"
        value={config.work}
        onChange={(work) => onChange({ ...config, work })}
      />
      <Stepper
        label="Ξεκούραση"
        value={config.rest}
        onChange={(rest) => onChange({ ...config, rest })}
      />
      <Stepper
        label="Σετ"
        value={config.sets}
        step={1}
        min={1}
        max={30}
        suffix=""
        onChange={(sets) => onChange({ ...config, sets })}
      />
    </div>
  )
}
