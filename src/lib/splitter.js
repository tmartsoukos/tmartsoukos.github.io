// ============================================================
// Έξυπνος χωρισμός ομάδων
//
// Καθαρή λογική, χωρίς React και χωρίς πρόσβαση στη βάση, ώστε να
// μπορεί να ελεγχθεί μεμονωμένα.
// ============================================================

export const POSITIONS = {
  GK: 'Τερματοφύλακας',
  DEF: 'Αμυντικός',
  MID: 'Μέσος',
  FWD: 'Επιθετικός',
}

export const POSITION_SHORT = {
  GK: 'ΤΕΡ',
  DEF: 'ΑΜΥ',
  MID: 'ΜΕΣ',
  FWD: 'ΕΠΙ',
}

const POSITION_ORDER = ['GK', 'DEF', 'MID', 'FWD']

/** Ψευδοτυχαία γεννήτρια με σπόρο — ίδιος σπόρος, ίδιο αποτέλεσμα. */
function mulberry32(seed) {
  let a = seed >>> 0
  return function random() {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Προτείνει φορμά παιχνιδιού για n παρόντες παίκτες.
 * 14 -> 7v7, 15 -> 7v7 + 1 Μπαλαντέρ, 16 -> 8v8 κ.ο.κ.
 */
export function suggestFormat(n) {
  const perSide = Math.floor(n / 2)
  const jokers = n % 2
  if (n < 4) {
    return { perSide: 0, jokers: 0, label: 'Λίγοι παίκτες', note: 'Χρειάζονται τουλάχιστον 4 παρόντες.' }
  }
  const label = `${perSide}v${perSide}${jokers ? ' + 1 Μπαλαντέρ' : ''}`
  const note =
    n < 8
      ? 'Μικρό παιχνίδι σε περιορισμένο χώρο.'
      : jokers
        ? 'Ο μπαλαντέρ παίζει πάντα με την ομάδα που έχει την μπάλα.'
        : 'Ισάριθμες ομάδες.'
  return { perSide, jokers, label, note }
}

/** Βαθμός «αξιοπιστίας» του παίκτη — προς το παρόν το ποσοστό παρουσιών. */
function scoreOf(player) {
  const pct = typeof player.attendance_pct === 'number' ? player.attendance_pct : 50
  return pct
}

/**
 * Χωρίζει τους παρόντες σε δύο ισορροπημένες ομάδες.
 *
 * Στρατηγική: οι παίκτες ταξινομούνται ανά θέση (πρώτα οι
 * τερματοφύλακες) και μέσα σε κάθε θέση κατά συνέπεια. Κάθε παίκτης
 * πηγαίνει στην ομάδα με τους λιγότερους παίκτες και, σε ισοπαλία,
 * στην ομάδα με το χαμηλότερο άθροισμα βαθμών. Έτσι εξισορροπούνται
 * ταυτόχρονα το πλήθος, οι θέσεις και το επίπεδο.
 *
 * @param {Array} players παρόντες παίκτες
 * @param {number} seed σπόρος για το «Ανακάτεμα»
 */
export function splitTeams(players, seed = 1) {
  const random = mulberry32(seed)
  const list = [...players]

  const format = suggestFormat(list.length)
  if (list.length < 4) {
    return { format, a: [], b: [], joker: [] }
  }

  // Ο μπαλαντέρ (όταν οι παίκτες είναι μονός αριθμός) είναι ο μεσαίος
  // σε συνέπεια: ούτε ο καλύτερος ούτε ο χειρότερος, ώστε να μην
  // αλλοιώνει την ισορροπία όποια ομάδα κι αν βοηθήσει.
  let joker = []
  if (list.length % 2 === 1) {
    const sorted = [...list].sort((x, y) => scoreOf(y) - scoreOf(x))
    const middle = sorted[Math.floor(sorted.length / 2)]
    joker = [middle]
    const idx = list.findIndex((p) => p.id === middle.id)
    list.splice(idx, 1)
  }

  const ordered = [...list].sort((x, y) => {
    const posDiff = POSITION_ORDER.indexOf(x.position) - POSITION_ORDER.indexOf(y.position)
    if (posDiff !== 0) return posDiff
    const scoreDiff = scoreOf(y) - scoreOf(x)
    if (scoreDiff !== 0) return scoreDiff
    return random() - 0.5
  })

  const a = []
  const b = []
  let sumA = 0
  let sumB = 0

  for (const player of ordered) {
    let target
    if (a.length !== b.length) {
      target = a.length < b.length ? 'a' : 'b'
    } else if (sumA !== sumB) {
      target = sumA < sumB ? 'a' : 'b'
    } else {
      target = random() < 0.5 ? 'a' : 'b'
    }

    if (target === 'a') {
      a.push(player)
      sumA += scoreOf(player)
    } else {
      b.push(player)
      sumB += scoreOf(player)
    }
  }

  return { format, a, b, joker }
}

/** Πλήθος παικτών ανά θέση — για την ένδειξη ισορροπίας κάθε ομάδας. */
export function countByPosition(players) {
  const counts = { GK: 0, DEF: 0, MID: 0, FWD: 0 }
  players.forEach((p) => {
    if (counts[p.position] !== undefined) counts[p.position]++
  })
  return counts
}

/** Ανταλλάσσει δύο παίκτες ανάμεσα στις λίστες (tap-to-swap). */
export function swapPlayers(groups, idA, idB) {
  const next = { a: [...groups.a], b: [...groups.b], joker: [...groups.joker] }
  const locate = (id) => {
    for (const key of ['a', 'b', 'joker']) {
      const index = next[key].findIndex((p) => p.id === id)
      if (index !== -1) return { key, index }
    }
    return null
  }

  const first = locate(idA)
  const second = locate(idB)
  if (!first || !second) return next
  if (first.key === second.key) return next

  const temp = next[first.key][first.index]
  next[first.key][first.index] = next[second.key][second.index]
  next[second.key][second.index] = temp
  return next
}
