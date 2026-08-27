import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { readLocal, writeLocal, keys } from '../lib/db'
import { useAuth } from './AuthContext'

const TeamContext = createContext(null)

const WATCHED_TABLES = ['players', 'sessions', 'attendance', 'session_drills', 'splits']

export function TeamProvider({ children }) {
  const { user } = useAuth()
  const [teams, setTeams] = useState(() => readLocal('cache:teams', []) ?? [])
  const [activeTeamId, setActiveTeamId] = useState(() => readLocal(keys.activeTeam(), null))
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  // Μετρητές που αυξάνονται σε κάθε αλλαγή από άλλη συσκευή.
  // Οι σελίδες τους παρακολουθούν και ξαναφορτώνουν τα δεδομένα τους.
  const [revisions, setRevisions] = useState(() =>
    Object.fromEntries(WATCHED_TABLES.map((t) => [t, 0])),
  )

  const refreshTeams = useCallback(async () => {
    if (!user) {
      setTeams([])
      setLoading(false)
      return []
    }
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('role, team:teams(*)')
        .eq('user_id', user.id)
      if (error) throw error

      const list = (data ?? [])
        .filter((row) => row.team)
        .map((row) => ({ ...row.team, role: row.role }))

      setTeams(list)
      writeLocal('cache:teams', list)
      return list
    } catch {
      // Εκτός σύνδεσης: μένουμε στην τοπική εικόνα.
      return readLocal('cache:teams', []) ?? []
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refreshTeams()
  }, [refreshTeams])

  // Αν δεν υπάρχει επιλεγμένη ομάδα (ή έχει πάψει να ισχύει), πάρε την πρώτη.
  useEffect(() => {
    if (teams.length === 0) return
    if (!activeTeamId || !teams.some((t) => t.id === activeTeamId)) {
      setActiveTeamId(teams[0].id)
      writeLocal(keys.activeTeam(), teams[0].id)
    }
  }, [teams, activeTeamId])

  const activeTeam = useMemo(
    () => teams.find((t) => t.id === activeTeamId) ?? null,
    [teams, activeTeamId],
  )

  // Μέλη της ενεργής ομάδας
  useEffect(() => {
    if (!activeTeamId) {
      setMembers([])
      return
    }
    let active = true
    supabase
      .from('team_members')
      .select('user_id, role, display_name, joined_at')
      .eq('team_id', activeTeamId)
      .then(({ data }) => {
        if (active && data) setMembers(data)
      })
    return () => {
      active = false
    }
  }, [activeTeamId])

  // Realtime: κοινή διαχείριση με τον βοηθό προπονητή
  useEffect(() => {
    if (!activeTeamId || !user) return

    const channel = supabase.channel(`team:${activeTeamId}`)
    WATCHED_TABLES.forEach((table) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        setRevisions((prev) => ({ ...prev, [table]: prev[table] + 1 }))
      })
    })
    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeTeamId, user])

  const value = useMemo(
    () => ({
      teams,
      activeTeam,
      activeTeamId,
      members,
      loading,
      revisions,
      role: activeTeam?.role ?? null,
      isHeadCoach: activeTeam?.role === 'head_coach',

      selectTeam(id) {
        setActiveTeamId(id)
        writeLocal(keys.activeTeam(), id)
      },

      async createTeam(name) {
        const { data, error } = await supabase.rpc('create_team', { p_name: name })
        if (error) throw error
        const list = await refreshTeams()
        const created = Array.isArray(data) ? data[0] : data
        if (created?.id) {
          setActiveTeamId(created.id)
          writeLocal(keys.activeTeam(), created.id)
        }
        return list
      },

      async joinTeam(code) {
        const { data, error } = await supabase.rpc('join_team_by_code', { p_code: code })
        if (error) throw error
        const list = await refreshTeams()
        const joined = Array.isArray(data) ? data[0] : data
        if (joined?.id) {
          setActiveTeamId(joined.id)
          writeLocal(keys.activeTeam(), joined.id)
        }
        return list
      },

      refreshTeams,
    }),
    [teams, activeTeam, activeTeamId, members, loading, revisions, refreshTeams],
  )

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>
}

export function useTeam() {
  const ctx = useContext(TeamContext)
  if (!ctx) throw new Error('useTeam εκτός TeamProvider')
  return ctx
}
