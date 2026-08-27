import { useState } from 'react'
import { LogOut, RefreshCw, AlertTriangle, Check, Users } from 'lucide-react'
import TopBar from '../components/layout/TopBar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useTeam } from '../context/TeamContext'
import { useAuth } from '../context/AuthContext'
import { useSync } from '../context/SyncContext'

export default function Settings() {
  const { activeTeam, renameTeam } = useTeam()
  const { user, signOut } = useAuth()
  const { online, pending, failed, syncing, flush, dismissFailed } = useSync()
  const [name, setName] = useState(activeTeam?.name ?? '')
  const [savedName, setSavedName] = useState(false)

  async function onRename(e) {
    e.preventDefault()
    await renameTeam(name)
    setSavedName(true)
    setTimeout(() => setSavedName(false), 1500)
  }

  return (
    <>
      <TopBar title="Ρυθμίσεις" back />

      <div className="flex flex-col gap-4 px-4 py-4">
        <Card>
          <h2 className="mb-3 font-bold">Ονομασία ομάδας</h2>
          <form onSubmit={onRename} className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-12 min-w-0 flex-1 rounded-xl border border-line bg-surface-2 px-4 outline-none"
            />
            <Button type="submit" variant="subtle">
              {savedName ? <Check size={18} className="text-brand" /> : 'Αλλαγή'}
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-2 flex items-center gap-2 font-bold">
            <Users size={18} className="text-brand" /> Πρόσβαση
          </h2>
          <p className="text-sm text-muted">
            Η ομάδα σου είναι δεμένη με τον λογαριασμό σου: κανένας άλλος χρήστης δεν
            βλέπει ούτε αλλάζει τα δεδομένα σου. Για να δουλέψει μαζί σου ο βοηθός
            προπονητή, συνδέεται με τα ίδια στοιχεία με εσένα — οι αλλαγές εμφανίζονται
            και στις δύο συσκευές σε πραγματικό χρόνο.
          </p>
        </Card>

        <Card>
          <h2 className="mb-2 font-bold">Συγχρονισμός</h2>
          <p className="text-sm text-muted">
            {online ? 'Συνδεδεμένο' : 'Εκτός σύνδεσης'}
            {pending > 0 && ` · ${pending} αλλαγές σε αναμονή`}
          </p>

          <Button variant="subtle" className="mt-3 w-full" onClick={flush} disabled={!online}>
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} /> Συγχρονισμός τώρα
          </Button>

          {failed > 0 && (
            <div className="mt-3 rounded-xl border border-absent/40 bg-absent/10 p-3">
              <p className="flex items-center gap-2 text-sm text-absent">
                <AlertTriangle size={16} /> {failed} αλλαγές απέτυχαν οριστικά.
              </p>
              <button onClick={dismissFailed} className="mt-2 text-xs font-bold text-absent underline">
                Απόρριψη
              </button>
            </div>
          )}
        </Card>

        <Button variant="ghost" size="lg" onClick={signOut}>
          <LogOut size={18} /> Αποσύνδεση ({user?.email})
        </Button>
      </div>
    </>
  )
}
