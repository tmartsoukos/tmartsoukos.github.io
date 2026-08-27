// ============================================================
// Data layer
//
// Καμία σελίδα δεν καλεί το supabase απευθείας. Όλα περνούν από εδώ:
//   - οι αναγνώσεις επιστρέφουν πρώτα την τοπική cache και μετά
//     ανανεώνονται από το δίκτυο (stale-while-revalidate)
//   - οι εγγραφές γράφονται τοπικά και μπαίνουν στην ουρά
//
// Τα id παράγονται στον client. Όπου μια γραμμή προσδιορίζεται
// φυσικά (π.χ. «παρουσία του παίκτη Χ στην προπόνηση Υ») το id
// υπολογίζεται ντετερμινιστικά από τα συστατικά του. Έτσι δύο
// συσκευές που δουλεύουν ταυτόχρονα εκτός σύνδεσης παράγουν το
// ΙΔΙΟ id και ο συγχρονισμός καταλήγει σε ενημέρωση, όχι σε
// διπλότυπο ή σε παραβίαση του unique constraint.
// ============================================================

import { supabase } from './supabase'
import { readLocal, writeLocal, keys } from './db'
import { enqueue, flushOutbox } from './outbox'

// ------------------------------------------------------------
// Βοηθητικά
// ------------------------------------------------------------

const idCache = new Map()

/** Ντετερμινιστικό UUID (v5-style) από σταθερά συστατικά. */
export async function stableId(...parts) {
  const key = parts.join('|')
  if (idCache.has(key)) return idCache.get(key)

  const bytes = new TextEncoder().encode(key)
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
  digest[6] = (digest[6] & 0x0f) | 0x50 // έκδοση 5
  digest[8] = (digest[8] & 0x3f) | 0x80 // variant RFC 4122

  const hex = [...digest.slice(0, 16)].map((b) => b.toString(16).padStart(2, '0')).join('')
  const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
  idCache.set(key, uuid)
  return uuid
}

function upsertInList(list, row) {
  const idx = list.findIndex((r) => r.id === row.id)
  if (idx === -1) return [...list, row]
  const copy = [...list]
  copy[idx] = { ...copy[idx], ...row }
  return copy
}

function byName(a, b) {
  return a.full_name.localeCompare(b.full_name, 'el')
}

/** Γράφει τοπικά, βάζει στην ουρά και προσπαθεί άμεσο συγχρονισμό. */
function queue(table, row, onConflict = 'id') {
  enqueue({ table, kind: 'upsert', row, onConflict })
  flushOutbox().catch(() => {})
}

function queueDelete(table, id) {
  enqueue({ table, kind: 'delete', row: { id } })
  flushOutbox().catch(() => {})
}

// ------------------------------------------------------------
// Παίκτες
// ------------------------------------------------------------

export function cachedPlayers(teamId) {
  return readLocal(keys.players(teamId), []) ?? []
}

export async function fetchPlayers(teamId) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', teamId)
    .order('full_name')
  if (error) throw error
  writeLocal(keys.players(teamId), data)
  return data
}

export function savePlayer(teamId, input) {
  const row = {
    id: input.id ?? crypto.randomUUID(),
    team_id: teamId,
    full_name: input.full_name.trim(),
    phone: input.phone?.trim() || null,
    position: input.position || 'MID',
    notes: input.notes?.trim() || null,
    is_active: input.is_active !== false,
  }
  const next = upsertInList(cachedPlayers(teamId), row).sort(byName)
  writeLocal(keys.players(teamId), next)
  queue('players', row)
  return next
}

export function deletePlayer(teamId, id) {
  const next = cachedPlayers(teamId).filter((p) => p.id !== id)
  writeLocal(keys.players(teamId), next)
  queueDelete('players', id)
  return next
}

// ------------------------------------------------------------
// Προπονήσεις (μία ανά ημέρα)
// ------------------------------------------------------------

export function cachedSessions(teamId) {
  return readLocal(keys.sessions(teamId), []) ?? []
}

export async function fetchSessions(teamId, limit = 120) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('team_id', teamId)
    .order('session_date', { ascending: false })
    .limit(limit)
  if (error) throw error
  writeLocal(keys.sessions(teamId), data)
  return data
}

/**
 * Επιστρέφει την προπόνηση της ημέρας, δημιουργώντας την αν λείπει.
 * Λειτουργεί και εκτός σύνδεσης χάρη στο ντετερμινιστικό id.
 */
export async function getOrCreateSession(teamId, dateISO) {
  const list = cachedSessions(teamId)
  const existing = list.find((s) => s.session_date === dateISO)
  if (existing) return existing

  const row = {
    id: await stableId('session', teamId, dateISO),
    team_id: teamId,
    session_date: dateISO,
    title: null,
    notes: null,
    is_locked: false,
  }
  writeLocal(keys.sessions(teamId), [row, ...list])
  queue('sessions', row)
  return row
}

export function updateSession(teamId, session, patch) {
  const row = { ...session, ...patch }
  const next = upsertInList(cachedSessions(teamId), row)
  writeLocal(keys.sessions(teamId), next)
  queue('sessions', row)
  return row
}

// ------------------------------------------------------------
// Παρουσιολόγιο
// ------------------------------------------------------------

export function cachedAttendance(sessionId) {
  return readLocal(keys.attendance(sessionId), []) ?? []
}

export async function fetchAttendance(sessionId) {
  const { data, error } = await supabase.from('attendance').select('*').eq('session_id', sessionId)
  if (error) throw error
  writeLocal(keys.attendance(sessionId), data)
  return data
}

/** Όλες οι παρουσίες της ομάδας — για τα στατιστικά. */
export async function fetchTeamAttendance(teamId) {
  const { data, error } = await supabase
    .from('attendance')
    .select('id, session_id, player_id, status, sessions!inner(team_id, session_date)')
    .eq('sessions.team_id', teamId)
  if (error) throw error
  const flat = (data ?? []).map((r) => ({
    id: r.id,
    session_id: r.session_id,
    player_id: r.player_id,
    status: r.status,
    session_date: r.sessions?.session_date ?? null,
  }))
  writeLocal(`cache:attendance_all:${teamId}`, flat)
  return flat
}

export function cachedTeamAttendance(teamId) {
  return readLocal(`cache:attendance_all:${teamId}`, []) ?? []
}

export async function setAttendance(sessionId, playerId, status) {
  const row = {
    id: await stableId('attendance', sessionId, playerId),
    session_id: sessionId,
    player_id: playerId,
    status,
  }
  const next = upsertInList(cachedAttendance(sessionId), row)
  writeLocal(keys.attendance(sessionId), next)
  queue('attendance', row, 'session_id,player_id')
  return next
}

/** Θέτει την ίδια κατάσταση σε πολλούς παίκτες («Όλοι Παρόντες»). */
export async function setAttendanceBulk(sessionId, playerIds, status) {
  let list = cachedAttendance(sessionId)
  for (const playerId of playerIds) {
    const row = {
      id: await stableId('attendance', sessionId, playerId),
      session_id: sessionId,
      player_id: playerId,
      status,
    }
    list = upsertInList(list, row)
    enqueue({ table: 'attendance', kind: 'upsert', row, onConflict: 'session_id,player_id' })
  }
  writeLocal(keys.attendance(sessionId), list)
  flushOutbox().catch(() => {})
  return list
}

/** Σβήνει όλες τις καταχωρήσεις της ημέρας («Καθαρισμός»). */
export function clearAttendance(sessionId) {
  cachedAttendance(sessionId).forEach((row) => {
    enqueue({ table: 'attendance', kind: 'delete', row: { id: row.id } })
  })
  writeLocal(keys.attendance(sessionId), [])
  flushOutbox().catch(() => {})
  return []
}

// ------------------------------------------------------------
// Ασκήσεις (presets + custom της ομάδας)
// ------------------------------------------------------------

export function cachedDrills(teamId) {
  return readLocal(keys.drills(teamId), []) ?? []
}

export async function fetchDrills(teamId) {
  const { data, error } = await supabase
    .from('drills')
    .select('*')
    .or(`is_preset.eq.true,team_id.eq.${teamId}`)
    .order('is_preset', { ascending: false })
    .order('title')
  if (error) throw error
  writeLocal(keys.drills(teamId), data)
  return data
}

export function saveDrill(teamId, input) {
  const row = {
    id: input.id ?? crypto.randomUUID(),
    team_id: teamId,
    title: input.title.trim(),
    category: input.category,
    description: input.description?.trim() || null,
    default_duration: Number(input.default_duration) || 10,
    intensity: input.intensity || 'medium',
    board_data: input.board_data ?? null,
    is_preset: false,
  }
  const next = upsertInList(cachedDrills(teamId), row)
  writeLocal(keys.drills(teamId), next)
  queue('drills', row)
  return row
}

export function deleteDrill(teamId, id) {
  const next = cachedDrills(teamId).filter((d) => d.id !== id)
  writeLocal(keys.drills(teamId), next)
  queueDelete('drills', id)
  return next
}

// ------------------------------------------------------------
// Πλάνο προπόνησης
// ------------------------------------------------------------

export function cachedSessionDrills(sessionId) {
  return readLocal(keys.sessionDrills(sessionId), []) ?? []
}

export async function fetchSessionDrills(sessionId) {
  const { data, error } = await supabase
    .from('session_drills')
    .select('*')
    .eq('session_id', sessionId)
    .order('phase')
    .order('order_index')
  if (error) throw error
  writeLocal(keys.sessionDrills(sessionId), data)
  return data
}

export function addSessionDrill(sessionId, drill, phase) {
  const current = cachedSessionDrills(sessionId)
  const inPhase = current.filter((d) => d.phase === phase)
  const row = {
    id: crypto.randomUUID(),
    session_id: sessionId,
    drill_id: drill.id ?? null,
    title: drill.title,
    phase,
    order_index: inPhase.length,
    duration_min: drill.default_duration ?? 10,
    intensity: drill.intensity ?? 'medium',
    notes: null,
  }
  const next = [...current, row]
  writeLocal(keys.sessionDrills(sessionId), next)
  queue('session_drills', row)
  return next
}

export function updateSessionDrill(sessionId, row, patch) {
  const updated = { ...row, ...patch }
  const next = upsertInList(cachedSessionDrills(sessionId), updated)
  writeLocal(keys.sessionDrills(sessionId), next)
  queue('session_drills', updated)
  return next
}

export function removeSessionDrill(sessionId, id) {
  const next = cachedSessionDrills(sessionId).filter((d) => d.id !== id)
  writeLocal(keys.sessionDrills(sessionId), next)
  queueDelete('session_drills', id)
  return next
}

/** Αναδιάταξη μέσα σε μια φάση (κουμπιά ↑ / ↓). */
export function reorderSessionDrills(sessionId, phase, orderedIds) {
  let list = cachedSessionDrills(sessionId)
  orderedIds.forEach((id, index) => {
    const row = list.find((d) => d.id === id)
    if (!row || row.order_index === index) return
    const updated = { ...row, order_index: index }
    list = upsertInList(list, updated)
    enqueue({ table: 'session_drills', kind: 'upsert', row: updated, onConflict: 'id' })
  })
  writeLocal(keys.sessionDrills(sessionId), list)
  flushOutbox().catch(() => {})
  return list
}

// ------------------------------------------------------------
// Χωρισμός ομάδων
// ------------------------------------------------------------

export function cachedSplit(sessionId) {
  return readLocal(keys.split(sessionId), null)
}

export async function fetchSplit(sessionId) {
  const { data, error } = await supabase
    .from('splits')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle()
  if (error) throw error
  writeLocal(keys.split(sessionId), data)
  return data
}

export async function saveSplit(sessionId, format, teams) {
  const row = {
    id: await stableId('split', sessionId),
    session_id: sessionId,
    format,
    teams,
  }
  writeLocal(keys.split(sessionId), row)
  queue('splits', row, 'session_id')
  return row
}
