export default function Empty({ icon: Icon, title, hint, action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-10 text-center">
      {Icon && <Icon size={40} className="text-muted" />}
      <p className="text-lg font-semibold">{title}</p>
      {hint && <p className="max-w-xs text-sm text-muted">{hint}</p>}
      {action}
    </div>
  )
}
