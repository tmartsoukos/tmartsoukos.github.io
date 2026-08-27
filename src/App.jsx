import { Navigate, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import { useTeam } from './context/TeamContext'
import AppShell from './components/layout/AppShell'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Attendance from './pages/Attendance'
import AttendanceStats from './pages/AttendanceStats'
import Roster from './pages/Roster'
import Split from './pages/Split'
import SessionBuilder from './pages/SessionBuilder'
import DrillLibrary from './pages/DrillLibrary'
import DrillBoard from './pages/DrillBoard'
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
  const { teams, loading: teamLoading } = useTeam()

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

  // Συνδεδεμένος αλλά χωρίς ομάδα: δημιουργία ή είσοδος με κωδικό.
  if (teams.length === 0) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
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
        <Route path="timer" element={<Timer />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="login" element={<Navigate to="/" replace />} />
      <Route path="onboarding" element={<Onboarding />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
