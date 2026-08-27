import { ChevronLeft, ChevronRight, CheckCheck, Eraser, Lock, LockOpen } from 'lucide-react'
import { formatLong, isToday } from '../../lib/dates'

export default function AttendanceHeader({
  dateISO,
  counts,
  locked,
  onShift,
  onToday,
  onAllPresent,
  onClear,
  onToggleLock,
}) {
  return (
    <div className="sticky top-14 z-20 border-b border-line bg-bg/95 px-3 py-3 backdrop-blur">
      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={() => onShift(-1)}
          aria-label="Προηγούμενη ημέρα"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-2"
        >
          <ChevronLeft size={20} />
        </button>

        <button onClick={onToday} className="min-w-0 flex-1 text-center">
          <span className="block truncate font-bold">{formatLong(dateISO)}</span>
          {!isToday(dateISO) && <span className="text-xs text-brand">Επιστροφή στο σήμερα</span>}
        </button>

        <button
          onClick={() => onShift(1)}
          aria-label="Επόμενη ημέρα"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-2"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <p className="text-2xl font-black tnum">
          {counts.present}
          <span className="text-muted">/{counts.total}</span>
        </p>
        <p className="text-sm text-muted">
          Παρόντες
          {counts.excused > 0 && ` · ${counts.excused} δικαιολογημένοι`}
          {counts.absent > 0 && ` · ${counts.absent} απόντες`}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onAllPresent}
          disabled={locked}
          className="flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-xl bg-present text-sm font-bold text-bg disabled:opacity-40"
        >
          <CheckCheck size={18} /> Όλοι Παρόντες
        </button>

        <button
          onClick={onClear}
          disabled={locked}
          aria-label="Καθαρισμός"
          className="flex min-h-12 w-14 items-center justify-center rounded-xl border border-line bg-surface-2 disabled:opacity-40"
        >
          <Eraser size={18} />
        </button>

        <button
          onClick={onToggleLock}
          aria-label={locked ? 'Ξεκλείδωμα' : 'Κλείδωμα'}
          className={`flex min-h-12 w-14 items-center justify-center rounded-xl border ${
            locked ? 'border-excused bg-excused/20 text-excused' : 'border-line bg-surface-2'
          }`}
        >
          {locked ? <Lock size={18} /> : <LockOpen size={18} />}
        </button>
      </div>
    </div>
  )
}
