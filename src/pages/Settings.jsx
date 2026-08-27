import { useState } from 'react'
import { Copy, Check, Share2, LogOut, RefreshCw, AlertTriangle, Users } from 'lucide-react'
import TopBar from '../components/layout/TopBar'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useTeam } from '../context/TeamContext'
import { useAuth } from '../context/AuthContext'
import { useSync } from '../context/SyncContext'

export default function Settings() {
  const { activeTeam, teams, members, selectTeam, isHeadCoach } = useTeam()
  const { user, signOut } = useAuth()
  const { online, pending, failed, syncing, flush, dismissFailed } = useSync()
  const [copied, setCopied] = useState(false)

  const code = activeTeam?.invite_code ?? ''

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* κάποια κινητά μπλοκάρουν το clipboard χωρίς https */
    }
  }

  async function shareCode() {
    const text = `Μπες στην ομάδα «${activeTeam?.name}» στο CoachPad με τον κωδικό: ${code}`
    try {
      if (navigator.share) await navigator.share({ text })
      else await copyCode()
    } catch {
      /* ο χρήστης ακύρωσε */
    }
  }

  return (
    <>
      <TopBar title="Ρυθμίσεις" back />

      <div className="flex flex-col gap-4 px-4 py-4">
        <Card>
          <h2 className="mb-1 font-bold">{activeTeam?.name}</h2>
          <p className="mb-3 text-xs text-muted">
            Ρόλος: {isHeadCoach ? 'Προπονητής' : 'Βοηθός προπονητή'}
          </p>

          <p className="mb-2 text-sm text-muted">Κωδικός πρόσκλησης</p>
          <p className="mb-3 rounded-xl border border-line bg-surface-2 py-4 text-center text-3xl font-black tracking-[0.3em]">
            {code}
          </p>

          <div className="flex gap-2">
            <Button variant="subtle" className="flex-1" onClick={copyCode}>
              {copied ? <Check size={18} className="text-brand" /> : <Copy size={18} />}
              {copied ? 'Αντιγράφηκε' : 'Αντιγραφή'}
            </Button>
            <Button variant="subtle" className="flex-1" onClick={shareCode}>
              <Share2 size={18} /> Κοινοποίηση
            </Button>
          </div>

          <p className="mt-3 text-xs text-muted">
            Δώσε τον κωδικό στον βοηθό σου. Θα βλέπει και θα αλλάζει τα ίδια δεδομένα σε πραγματικό χρόνο.
          </p>
        </Card>

        <Card>
          <h2 className="mb-3 flex items-center gap-2 font-bold">
            <Users size={18} className="text-brand" /> Προπονητές ({members.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {members.map((member) => (
              <li key={member.user_id} className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate">
                  {member.display_name ?? (member.user_id === user?.id ? user.email : 'Προπονητής')}
                </span>
                <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
                  {member.role === 'head_coach' ? 'Προπονητής' : 'Βοηθός'}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        {teams.length > 1 && (
          <Card>
            <h2 className="mb-3 font-bold">Οι ομάδες μου</h2>
            <div className="flex flex-col gap-2">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => selectTeam(team.id)}
                  className={`min-h-12 rounded-xl border px-4 text-left font-semibold ${
                    team.id === activeTeam?.id
                      ? 'border-brand bg-brand/15 text-brand'
                      : 'border-line bg-surface-2'
                  }`}
                >
                  {team.name}
                </button>
              ))}
            </div>
          </Card>
        )}

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
