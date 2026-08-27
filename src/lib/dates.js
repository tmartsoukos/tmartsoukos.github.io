// ============================================================
// Ημερομηνίες στα ελληνικά
// Παντού χρησιμοποιείται τοπική ημερομηνία (όχι UTC): η προπόνηση
// «σήμερα» πρέπει να είναι σήμερα για τον προπονητή, όχι για τη UTC.
// ============================================================

export function todayISO() {
  return toISO(new Date())
}

export function toISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromISO(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso, days) {
  const date = fromISO(iso)
  date.setDate(date.getDate() + days)
  return toISO(date)
}

/** π.χ. «Πέμπτη 27 Αυγούστου» */
export function formatLong(iso) {
  return new Intl.DateTimeFormat('el-GR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(fromISO(iso))
}

/** π.χ. «27/08» */
export function formatShort(iso) {
  return new Intl.DateTimeFormat('el-GR', { day: '2-digit', month: '2-digit' }).format(fromISO(iso))
}

/** π.χ. «Αύγουστος 2026» */
export function formatMonth(iso) {
  return new Intl.DateTimeFormat('el-GR', { month: 'long', year: 'numeric' }).format(fromISO(iso))
}

/** Κλειδί μήνα «2026-08» για ομαδοποίηση στα στατιστικά. */
export function monthKey(iso) {
  return iso.slice(0, 7)
}

export function isToday(iso) {
  return iso === todayISO()
}

/** Χρόνος σε μορφή mm:ss (ή h:mm:ss αν ξεπεράσει την ώρα). */
export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}
