import { useState } from 'react'
import { Loader2, Lock, KeyRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'

// Οθόνη νέου κωδικού. Εμφανίζεται όταν ο χρήστης έρθει από τον
// σύνδεσμο επαναφοράς — ό,τι διαδρομή κι αν είχε ανοιχτή.
export default function ResetPassword() {
  const { updatePassword, cancelRecovery, user } = useAuth()
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function onSubmit(e) {
    e.preventDefault()
    if (password !== repeat) {
      setError('Οι δύο κωδικοί δεν είναι ίδιοι.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await updatePassword(password)
    } catch (err) {
      setError(
        err.message?.toLowerCase().includes('should be')
          ? 'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.'
          : 'Η αλλαγή απέτυχε. Ζήτησε νέο σύνδεσμο επαναφοράς.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-2xl bg-brand">
          <KeyRound size={32} className="text-bg" />
        </div>
        <h1 className="text-2xl font-black">Νέος κωδικός</h1>
        {user?.email && <p className="mt-1 text-sm text-muted">{user.email}</p>}
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4">
          <Lock size={18} className="shrink-0 text-muted" />
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Νέος κωδικός"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-h-14 w-full bg-transparent text-base outline-none"
          />
        </label>

        <label className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4">
          <Lock size={18} className="shrink-0 text-muted" />
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Επανάληψη κωδικού"
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
            className="min-h-14 w-full bg-transparent text-base outline-none"
          />
        </label>

        {error && (
          <p className="rounded-xl border border-absent/40 bg-absent/10 px-4 py-3 text-sm text-absent">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={busy} className="mt-2">
          {busy && <Loader2 size={18} className="animate-spin" />}
          Αποθήκευση κωδικού
        </Button>
      </form>

      <button onClick={cancelRecovery} className="mx-auto mt-6 text-sm text-muted">
        Άκυρο
      </button>
    </div>
  )
}
