import { Navigate, Route, Routes } from 'react-router-dom'
import { Loader2, WifiOff } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import { useTeam } from './context/TeamContext'
import AppShell from './components/layout/AppShell'
import Button from './components/ui/Button'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Attendance from './pages/Attendance'
import AttendanceStats from './pages/AttendanceStats'
import Roster from './pages/Roster'
import Split from './pages/Split'
import SessionBuilder from './pages/SessionBuilder'
import DrillLibrary from './pages/DrillLibrary'
import DrillBoard from './pages/DrillBoard'
import Board from './pages/Board'
import Timer from './pages/Timer'
import Settings from './pages/Settings'

function FullScreenLoader() {
  return (
    <div className="flex min-h-full items-center justify-center">
      <Loader2 size={36} className="animate-spin text-brand" />
    </div>
  )
}

export default function App() {
  const { user, loading: authLoading } = useAuth()
  const { activeTeamId, loading: teamLoading, refreshTeam } = useTeam()

  if (authLoading) return <FullScreenLoader />

  // Χωρίς σύνδεση δεν υπάρχει τίποτα άλλο διαθέσιμο.
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  if (teamLoading) return <FullScreenLoader />

  // Πρώτη σύνδεση χωρίς δίκτυο: δεν προλάβαμε να φέρουμε την ομάδα
  // και δεν υπάρχει τίποτα στην τοπική cache.
  if (!activeTeamId) {
    return (
      <div className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center gap-4 px-6 text-center">
        <WifiOff size={40} className="text-muted" />
        <p className="font-semibold">Δεν ήταν δυνατή η φόρτωση των δεδομένων.</p>
        <p className="text-sm text-muted">
          Χρειάζεται σύνδεση στο διαδίκτυο την πρώτη φορά που ανοίγει η εφαρμογή.
        </p>
        <Button onClick={refreshTeam}>Δοκίμασε ξανά</Button>
      </div>
    )
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="stats" element={<AttendanceStats />} />
        <Route path="roster" element={<Roster />} />
        <Route path="split" element={<Split />} />
        <Route path="session" element={<SessionBuilder />} />
        <Route path="drills" element={<DrillLibrary />} />
        <Route path="drills/:drillId/board" element={<DrillBoard />} />
        <Route path="board" element={<Board />} />
        <Route path="timer" element={<Timer />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
