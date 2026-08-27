// ============================================================
// Τοπική αποθήκευση (localStorage)
// Κάθε ανάγνωση/εγγραφή περνά από εδώ ώστε να υπάρχει ένα σημείο
// ελέγχου για το prefix, το JSON και τα σφάλματα (π.χ. γεμάτος
// αποθηκευτικός χώρος ή ιδιωτική περιήγηση όπου το localStorage
// πετάει εξαίρεση).
// ============================================================

const PREFIX = 'coachpad:'

export function readLocal(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeLocal(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeLocal(key) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    /* αγνοείται */
  }
}

// Καθαρίζει όλα τα δεδομένα της εφαρμογής (π.χ. στην αποσύνδεση)
export function clearAppData() {
  try {
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(PREFIX)) keys.push(k)
    }
    keys.forEach((k) => localStorage.removeItem(k))
  } catch {
    /* αγνοείται */
  }
}

// Κλειδιά cache ανά οντότητα
export const keys = {
  players: (teamId) => `cache:players:${teamId}`,
  sessions: (teamId) => `cache:sessions:${teamId}`,
  drills: (teamId) => `cache:drills:${teamId}`,
  attendance: (sessionId) => `cache:attendance:${sessionId}`,
  sessionDrills: (sessionId) => `cache:session_drills:${sessionId}`,
  split: (sessionId) => `cache:split:${sessionId}`,
  activeTeam: () => 'active_team',
  timerConfig: () => 'timer_config',
}
