import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Dumbbell } from 'lucide-react'
import TopBar from '../components/layout/TopBar'
import Sheet from '../components/ui/Sheet'
import Empty from '../components/ui/Empty'
import DrillCard from '../components/drills/DrillCard'
import DrillForm from '../components/drills/DrillForm'
import { useTeam } from '../context/TeamContext'
import { cachedDrills, deleteDrill, fetchDrills, saveDrill } from '../lib/repo'
import { CATEGORIES } from '../lib/drills'

export default function DrillLibrary() {
  const { activeTeamId } = useTeam()
  const navigate = useNavigate()
  const [drills, setDrills] = useState(() => cachedDrills(activeTeamId))
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    setDrills(cachedDrills(activeTeamId))
    fetchDrills(activeTeamId)
      .then(setDrills)
      .catch(() => {})
  }, [activeTeamId])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return drills.filter((d) => {
      if (category !== 'all' && d.category !== category) return false
      if (!q) return true
      return (
        d.title.toLowerCase().includes(q) || (d.description ?? '').toLowerCase().includes(q)
      )
    })
  }, [drills, category, query])

  function onSave(form) {
    saveDrill(activeTeamId, form)
    setDrills(cachedDrills(activeTeamId))
    setEditing(null)
  }

  function onDelete(id) {
    setDrills(deleteDrill(activeTeamId, id))
    setEditing(null)
  }

  // Αντιγραφή έτοιμης άσκησης στη βιβλιοθήκη της ομάδας, ώστε να γίνει επεξεργάσιμη
  function onCopy(drill) {
    setEditing({
      title: `${drill.title} (αντίγραφο)`,
      category: drill.category,
      description: drill.description,
      default_duration: drill.default_duration,
      intensity: drill.intensity,
      board_data: drill.board_data,
    })
  }

  return (
    <>
      <TopBar title="Βιβλιοθήκη ασκήσεων" subtitle={`${drills.length} ασκήσεις`} />

      <div className="px-4 py-4">
        <label className="mb-3 flex items-center gap-2 rounded-xl border border-line bg-surface px-4">
          <Search size={18} className="text-muted" />
          <input
            placeholder="Αναζήτηση"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-12 w-full bg-transparent outline-none"
          />
        </label>

        <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
          {[['all', 'Όλες'], ...Object.entries(CATEGORIES)].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setCategory(value)}
              className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold ${
                category === value ? 'bg-brand text-bg' : 'bg-surface-2 text-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <Empty
            icon={Dumbbell}
            title="Καμία άσκηση"
            hint="Άλλαξε φίλτρο ή πρόσθεσε δική σου άσκηση."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {visible.map((drill) => (
              <DrillCard
                key={drill.id}
                drill={drill}
                onEdit={setEditing}
                onCopy={onCopy}
                onBoard={
                  drill.is_preset ? undefined : (d) => navigate(`/drills/${d.id}/board`)
                }
              />
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setEditing({})}
        aria-label="Νέα άσκηση"
        className="fixed right-5 bottom-24 z-30 flex size-16 items-center justify-center rounded-full bg-brand text-bg shadow-lg shadow-black/40"
      >
        <Plus size={30} />
      </button>

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Επεξεργασία άσκησης' : 'Νέα άσκηση'}
      >
        {editing !== null && <DrillForm initial={editing} onSave={onSave} onDelete={onDelete} />}
      </Sheet>
    </>
  )
}
