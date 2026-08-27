import {
  MousePointer2,
  Circle,
  Triangle,
  Dot,
  MoveUpRight,
  Eraser,
  Undo2,
  Trash,
  Users,
} from 'lucide-react'

export const TOOLS = [
  { id: 'select', label: 'Μετακίνηση', icon: MousePointer2 },
  { id: 'player-blue', label: 'Μπλε', icon: Circle, color: '#3b82f6' },
  { id: 'player-red', label: 'Κόκκινος', icon: Circle, color: '#ef4444' },
  { id: 'cone', label: 'Κώνος', icon: Triangle, color: '#f97316' },
  { id: 'ball', label: 'Μπάλα', icon: Dot },
  { id: 'run', label: 'Κίνηση', icon: MoveUpRight },
  { id: 'pass', label: 'Πάσα', icon: MoveUpRight, dashed: true },
  { id: 'erase', label: 'Σβήσιμο', icon: Eraser },
]

export default function BoardToolbar({ tool, onTool, onUndo, onClear, onFormation, canUndo }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {TOOLS.map(({ id, label, icon: Icon, color, dashed }) => (
          <button
            key={id}
            onClick={() => onTool(id)}
            className={`flex min-h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border text-[10px] font-bold ${
              tool === id ? 'border-brand bg-brand/20 text-brand' : 'border-line bg-surface text-muted'
            }`}
          >
            <Icon
              size={20}
              style={color ? { color } : undefined}
              fill={id.startsWith('player') ? color : 'none'}
              strokeDasharray={dashed ? '3 3' : undefined}
            />
            {label}
          </button>
        ))}
      </div>

      <button
        onClick={onFormation}
        className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-brand bg-brand/15 text-sm font-bold text-brand"
      >
        <Users size={18} /> Σχηματισμός με ένα tap
      </button>

      <div className="flex gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface text-sm font-bold disabled:opacity-40"
        >
          <Undo2 size={18} /> Αναίρεση
        </button>
        <button
          onClick={onClear}
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface text-sm font-bold"
        >
          <Trash size={18} /> Καθαρισμός
        </button>
      </div>
    </div>
  )
}
