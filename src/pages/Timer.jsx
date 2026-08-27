import TopBar from '../components/layout/TopBar'
import TimerPanel from '../components/timer/TimerPanel'

export default function Timer() {
  return (
    <>
      <TopBar title="Χρονόμετρο" back />
      <div className="px-4 py-5">
        <TimerPanel />
      </div>
    </>
  )
}
