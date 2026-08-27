import { CloudOff, RefreshCw, CloudUpload } from 'lucide-react'
import { useSync } from '../../context/SyncContext'

// Ένδειξη κατάστασης συγχρονισμού. Στο γήπεδο ο προπονητής πρέπει
// να βλέπει με μια ματιά ότι οι αλλαγές του δεν χάθηκαν.
export default function OfflineBadge() {
  const { online, pending, syncing, flush } = useSync()

  if (online && pending === 0) return null

  const label = !online ? 'Εκτός σύνδεσης' : 'Συγχρονισμός'

  return (
    <button
      onClick={() => flush()}
      className="flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-xs font-semibold"
    >
      {!online ? (
        <CloudOff size={14} className="text-excused" />
      ) : syncing ? (
        <RefreshCw size={14} className="animate-spin text-brand" />
      ) : (
        <CloudUpload size={14} className="text-brand" />
      )}
      <span>{label}</span>
      {pending > 0 && (
        <span className="rounded-full bg-excused px-1.5 text-bg tnum">{pending}</span>
      )}
    </button>
  )
}
