import { useEffect } from 'react'
import { X } from 'lucide-react'

// Φύλλο που ανεβαίνει από κάτω: πιο βολικό από modal στο κέντρο,
// γιατί τα κουμπιά μένουν στη ζώνη του αντίχειρα.
export default function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        aria-label="Κλείσιμο"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <div className="safe-bottom relative max-h-[88vh] overflow-y-auto rounded-t-3xl border-t border-line bg-surface">
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-surface px-4 py-3">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Κλείσιμο"
            className="flex size-11 items-center justify-center rounded-full bg-surface-2"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
