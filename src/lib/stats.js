// ============================================================
// Στατιστικά παρουσιών (καθαρή λογική)
//
// Ως «προπόνηση που έγινε» μετρά κάθε προπόνηση για την οποία
// υπάρχει έστω μία καταχώρηση παρουσίας. Έτσι μια μελλοντική ή
// άδεια ημερομηνία δεν ρίχνει άδικα τα ποσοστά όλων.
// ============================================================

import { monthKey, todayISO } from './dates'

/**
 * @param {Array} players ρόστερ
 * @param {Array} rows γραμμές παρουσίας με πεδίο session_date
 * @param {string} [month] κλειδί μήνα «2026-08»· αν λείπει, όλη η σεζόν
 */
export function buildStats(players, rows, month = null) {
  const relevant = month ? rows.filter((r) => r.session_date && monthKey(r.session_date) === month) : rows

  const heldSessions = new Set(relevant.map((r) => r.session_id))
  const total = heldSessions.size

  const perPlayer = new Map()
  players.forEach((p) => {
    perPlayer.set(p.id, { player: p, present: 0, absent: 0, excused: 0, missing: 0 })
  })

  relevant.forEach((r) => {
    const entry = perPlayer.get(r.player_id)
    if (!entry) return
    if (r.status === 'present') entry.present++
    else if (r.status === 'absent') entry.absent++
    else if (r.status === 'excused') entry.excused++
  })

  const result = []
  perPlayer.forEach((entry) => {
    const recorded = entry.present + entry.absent + entry.excused
    entry.missing = Math.max(0, total - recorded)
    const pct = total === 0 ? 0 : Math.round((entry.present / total) * 100)
    result.push({ ...entry, total, pct })
  })

  result.sort((x, y) => y.pct - x.pct || x.player.full_name.localeCompare(y.player.full_name, 'el'))
  return { total, rows: result }
}

/** Οι μήνες που έχουν δεδομένα, από τον πιο πρόσφατο. */
export function availableMonths(rows) {
  const set = new Set(rows.filter((r) => r.session_date).map((r) => monthKey(r.session_date)))
  set.add(monthKey(todayISO()))
  return [...set].sort().reverse()
}

/** Χρώμα ένδειξης ανάλογα με τη συνέπεια. */
export function consistencyColor(pct) {
  if (pct >= 80) return 'var(--color-present)'
  if (pct >= 60) return 'var(--color-excused)'
  return 'var(--color-absent)'
}
