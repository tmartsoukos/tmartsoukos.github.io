import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { readLocal, writeLocal } from '../lib/db'
import { useAuth } from './AuthContext'

const TeamContext = createContext(null)

const WATCHED_TABLES = ['players', 'sessions', 'attendance', 'session_drills', 'splits']
const CACHE_KEY = 'cache:team'

// Η εφαρμογή δουλεύει με μία κοινή ομάδα: όποιος συνδεθεί βλέπει
// και αλλάζει τα ίδια δεδομένα. Η ομάδα δημιουργείται μόνη της
// στην πρώτη σύνδεση, μέσω του RPC default_team().
export function TeamProvider({ children }) {
  const { user } = useAuth()
  const [team, setTeam] = useState(() => readLocal(CACHE_KEY, null))
  const [loading, setLoading] = useState(true)

  // Μετρητές που αυξάνονται σε κάθε αλλαγή από άλλη συσκευή.
  // Οι σελίδες τους παρακολουθούν και ξαναφορτώνουν τα δεδομένα τους.
  const [revisions, setRevisions] = useState(() =>
    Object.fromEntries(WATCHED_TABLES.map((t) => [t, 0])),
  )

  const refreshTeam = useCallback(async () => {
    if (!user) {
      setTeam(null)
      setLoading(false)
      return null
    }
    try {
      const { data, error } = await supabase.rpc('default_team')
      if (error) throw error
      const row = Array.isArray(data) ? data[0] : data
      if (row) {
        setTeam(row)
        writeLocal(CACHE_KEY, row)
      }
      return row
    } catch {
      // Εκτός σύνδεσης: συνεχίζουμε με την τοπική εικόνα.
      return readLocal(CACHE_KEY, null)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refreshTeam()
  }, [refreshTeam])

  useEffect(() => {
    if (!team?.id || !user) return

    const channel = supabase.channel(`team:${team.id}`)
    WATCHED_TABLES.forEach((table) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        setRevisions((prev) => ({ ...prev, [table]: prev[table] + 1 }))
      })
    })
    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [team?.id, user])

  const value = useMemo(
    () => ({
      activeTeam: team,
      activeTeamId: team?.id ?? null,
      loading,
      revisions,
      refreshTeam,

      async renameTeam(name) {
        const trimmed = name.trim()
        if (!trimmed || !team) return
        const next = { ...team, name: trimmed }
        setTeam(next)
        writeLocal(CACHE_KEY, next)
        await supabase.from('teams').update({ name: trimmed }).eq('id', team.id)
      },
    }),
    [team, loading, revisions, refreshTeam],
  )

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>
}

export function useTeam() {
  const ctx = useContext(TeamContext)
  if (!ctx) throw new Error('useTeam εκτός TeamProvider')
  return ctx
}
