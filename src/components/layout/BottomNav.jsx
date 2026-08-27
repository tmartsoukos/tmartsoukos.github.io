import { NavLink } from 'react-router-dom'
import { CalendarDays, ClipboardList, ListChecks, Dumbbell, Users } from 'lucide-react'

const ITEMS = [
  { to: '/', label: 'Σήμερα', icon: CalendarDays, end: true },
  { to: '/attendance', label: 'Παρουσίες', icon: ClipboardList },
  { to: '/session', label: 'Πλάνο', icon: ListChecks },
  { to: '/drills', label: 'Ασκήσεις', icon: Dumbbell },
  { to: '/roster', label: 'Ρόστερ', icon: Users },
]

export default function BottomNav() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface">
      <ul className="mx-auto flex max-w-2xl">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
                  isActive ? 'text-brand' : 'text-muted'
                }`
              }
            >
              <Icon size={22} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
