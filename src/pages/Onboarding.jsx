import { useState } from 'react'
import { Loader2, LogOut, Plus, KeyRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTeam } from '../context/TeamContext'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

export default function Onboarding() {
  const { createTeam, joinTeam } = useTeam()
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  async function onCreate(e) {
    e.preventDefault()
    setBusy('create')
    setError(null)
    try {
      await createTeam(name)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message?.includes('EMPTY_NAME') ? 'Δώσε όνομα ομάδας.' : 'Η δημιουργία απέτυχε.')
    } finally {
      setBusy(null)
    }
  }

  async function onJoin(e) {
    e.preventDefault()
    setBusy('join')
    setError(null)
    try {
      await joinTeam(code)
      navigate('/', { replace: true })
    } catch (err) {
      setError(
        err.message?.includes('INVALID_CODE')
          ? 'Ο κωδικός δεν αντιστοιχεί σε καμία ομάδα.'
          : 'Η είσοδος στην ομάδα απέτυχε.',
      )
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-10">
      <h1 className="text-2xl font-black">Καλώς ήρθες</h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        Δημιούργησε την ομάδα σου ή μπες σε υπάρχουσα με τον κωδικό πρόσκλησης.
      </p>

      {error && (
        <p className="mb-4 rounded-xl border border-absent/40 bg-absent/10 px-4 py-3 text-sm text-absent">
          {error}
        </p>
      )}

      <Card className="mb-4">
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          <Plus size={18} className="text-brand" /> Δημιουργία ομάδας
        </h2>
        <form onSubmit={onCreate} className="flex flex-col gap-3">
          <input
            required
            placeholder="π.χ. ΑΕ Παπάγου Κ14"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-h-14 rounded-xl border border-line bg-surface-2 px-4 text-base outline-none"
          />
          <Button type="submit" size="lg" disabled={busy !== null}>
            {busy === 'create' && <Loader2 size={18} className="animate-spin" />}
            Δημιουργία
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted">
          Γίνεσαι πρώτος προπονητής και παίρνεις κωδικό για να καλέσεις τον βοηθό σου.
        </p>
      </Card>

      <Card>
        <h2 className="mb-3 flex items-center gap-2 font-bold">
          <KeyRound size={18} className="text-brand" /> Έχω κωδικό πρόσκλησης
        </h2>
        <form onSubmit={onJoin} className="flex flex-col gap-3">
          <input
            required
            maxLength={6}
            placeholder="ABC123"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="min-h-14 rounded-xl border border-line bg-surface-2 px-4 text-center text-2xl font-black tracking-[0.3em] outline-none"
          />
          <Button type="submit" size="lg" variant="subtle" disabled={busy !== null}>
            {busy === 'join' && <Loader2 size={18} className="animate-spin" />}
            Είσοδος στην ομάδα
          </Button>
        </form>
      </Card>

      <button
        onClick={signOut}
        className="mx-auto mt-8 flex items-center gap-2 text-sm text-muted"
      >
        <LogOut size={16} /> Αποσύνδεση
      </button>
    </div>
  )
}
