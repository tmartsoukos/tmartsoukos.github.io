import { X } from 'lucide-react'
import TimerPanel from './TimerPanel'

// Το χρονόμετρο ανοίγει πάνω από το πλάνο της προπόνησης, ώστε ο
// προπονητής να μη χάνει τη θέση του στη λίστα των ασκήσεων.
export default function TimerOverlay({ open, onClose, drill }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      <div className="safe-top flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-lg font-bold">Χρονόμετρο</h2>
        <button
          onClick={onClose}
          aria-label="Κλείσιμο"
          className="flex size-11 items-center justify-center rounded-full bg-surface-2"
        >
          <X size={20} />
        </button>
      </div>

      <div className="safe-bottom flex-1 overflow-y-auto px-4 py-5">
        <TimerPanel presetLabel={drill?.title ?? null} presetMinutes={drill?.duration_min ?? null} />
      </div>
    </div>
  )
}
