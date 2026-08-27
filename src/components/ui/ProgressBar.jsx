export default function ProgressBar({ value, color = 'var(--color-brand)', height = 10 }) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-surface-2"
      style={{ height }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${clamped}%`, background: color }}
      />
    </div>
  )
}
