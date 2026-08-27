import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function AppShell() {
  return (
    <div className="min-h-full bg-bg">
      <div className="pb-nav mx-auto max-w-2xl">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
