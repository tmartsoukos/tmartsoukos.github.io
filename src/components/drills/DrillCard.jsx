import { Clock, Flame, PenLine, Copy, LayoutGrid } from 'lucide-react'
import { CATEGORIES, INTENSITY, INTENSITY_COLOR } from '../../lib/drills'

export default function DrillCard({ drill, onEdit, onCopy, onBoard, action }) {
  return (
    <article className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold">{drill.title}</h3>
          <p className="mt-0.5 text-xs text-muted">
            {CATEGORIES[drill.category]}
            {drill.is_preset && ' · έτοιμη'}
          </p>
        </div>
        {action}
      </div>

      {drill.description && (
        <p className="mt-2 text-sm leading-snug text-muted">{drill.description}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <span className="flex items-center gap-1 text-muted">
          <Clock size={14} /> {drill.default_duration}′
        </span>
        <span className={`flex items-center gap-1 ${INTENSITY_COLOR[drill.intensity]}`}>
          <Flame size={14} /> {INTENSITY[drill.intensity]}
        </span>
        {drill.board_data && (
          <span className="flex items-center gap-1 text-brand">
            <LayoutGrid size={14} /> με σχέδιο
          </span>
        )}

        <span className="ml-auto flex gap-2">
          {onBoard && (
            <button
              onClick={() => onBoard(drill)}
              className="flex min-h-10 items-center gap-1 rounded-lg bg-surface-2 px-3 font-semibold"
            >
              <LayoutGrid size={14} /> Σχέδιο
            </button>
          )}
          {onEdit && !drill.is_preset && (
            <button
              onClick={() => onEdit(drill)}
              className="flex min-h-10 items-center gap-1 rounded-lg bg-surface-2 px-3 font-semibold"
            >
              <PenLine size={14} /> Επεξεργασία
            </button>
          )}
          {onCopy && drill.is_preset && (
            <button
              onClick={() => onCopy(drill)}
              className="flex min-h-10 items-center gap-1 rounded-lg bg-surface-2 px-3 font-semibold"
            >
              <Copy size={14} /> Αντιγραφή
            </button>
          )}
        </span>
      </div>
    </article>
  )
}
