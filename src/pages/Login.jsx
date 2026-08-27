import { useState } from 'react'
import { Loader2, Mail, Lock, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'

// Μετάφραση των συνηθισμένων μηνυμάτων του Supabase Auth
function greekError(message = '') {
  const m = message.toLowerCase()
  if (m.includes('invalid login')) return 'Λάθος email ή κωδικός.'
  if (m.includes('already registered')) return 'Υπάρχει ήδη λογαριασμός με αυτό το email.'
  if (m.includes('password should be')) return 'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.'
  if (m.includes('email')) return 'Μη έγκυρο email.'
  if (m.includes('failed to fetch')) return 'Δεν υπάρχει σύνδεση στο διαδίκτυο.'
  return 'Κάτι πήγε στραβά. Δοκίμασε ξανά.'
}

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        const { needsConfirmation } = await signUp(email, password)
        if (needsConfirmation) {
          setInfo('Στάλθηκε email επιβεβαίωσης. Άνοιξέ το και μετά συνδέσου.')
          setMode('signin')
        }
      }
    } catch (err) {
      setError(greekError(err.message))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-2xl bg-brand">
          <ShieldCheck size={34} className="text-bg" />
        </div>
        <h1 className="text-3xl font-black">CoachPad</h1>
        <p className="mt-1 text-sm text-muted">Παρουσιολόγιο, ομάδες και πλάνο προπόνησης.</p>
      </div>

      <div className="mb-5 flex rounded-xl border border-line bg-surface p-1">
        {[
          ['signin', 'Σύνδεση'],
          ['signup', 'Εγγραφή'],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => {
              setMode(value)
              setError(null)
            }}
            className={`min-h-11 flex-1 rounded-lg text-sm font-bold ${
              mode === value ? 'bg-brand text-bg' : 'text-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4">
          <Mail size={18} className="shrink-0 text-muted" />
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-14 w-full bg-transparent text-base outline-none"
          />
        </label>

        <label className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4">
          <Lock size={18} className="shrink-0 text-muted" />
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            placeholder="Κωδικός"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-h-14 w-full bg-transparent text-base outline-none"
          />
        </label>

        {error && (
          <p className="rounded-xl border border-absent/40 bg-absent/10 px-4 py-3 text-sm text-absent">
            {error}
          </p>
        )}
        {info && (
          <p className="rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm text-brand">
            {info}
          </p>
        )}

        <Button type="submit" size="lg" disabled={busy} className="mt-2">
          {busy && <Loader2 size={18} className="animate-spin" />}
          {mode === 'signin' ? 'Σύνδεση' : 'Δημιουργία λογαριασμού'}
        </Button>
      </form>
    </div>
  )
}
