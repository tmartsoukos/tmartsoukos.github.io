import { ChevronLeft, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import OfflineBadge from './OfflineBadge'

export default function TopBar({ title, subtitle, back = false, right = null }) {
  const navigate = useNavigate()

  return (
    <header className="safe-top sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
      <div className="flex items-center gap-2 px-3 py-2">
        {back && (
          <button
            onClick={() => navigate(-1)}
            aria-label="Πίσω"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-2"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg leading-tight font-bold">{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
        </div>

        <OfflineBadge />
        {right}
        {!back && (
          <button
            onClick={() => navigate('/settings')}
            aria-label="Ρυθμίσεις"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-2"
          >
            <Settings size={20} />
          </button>
        )}
      </div>
    </header>
  )
}
