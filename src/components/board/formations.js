// ============================================================
// Σχηματισμοί
//
// Οι θέσεις είναι κανονικοποιημένες (0..1) πάνω στο κάθετο γήπεδο
// του σχεδιαστηρίου: ο τερματοφύλακας κάτω, οι επιθετικοί πάνω.
// ============================================================

const GK = { x: 0.5, y: 0.89, position: 'GK' }

export const FORMATIONS = [
  {
    id: '4-4-2',
    label: '4-4-2',
    slots: [
      GK,
      { x: 0.18, y: 0.75, position: 'DEF' },
      { x: 0.39, y: 0.77, position: 'DEF' },
      { x: 0.61, y: 0.77, position: 'DEF' },
      { x: 0.82, y: 0.75, position: 'DEF' },
      { x: 0.18, y: 0.52, position: 'MID' },
      { x: 0.39, y: 0.54, position: 'MID' },
      { x: 0.61, y: 0.54, position: 'MID' },
      { x: 0.82, y: 0.52, position: 'MID' },
      { x: 0.38, y: 0.28, position: 'FWD' },
      { x: 0.62, y: 0.28, position: 'FWD' },
    ],
  },
  {
    id: '4-3-3',
    label: '4-3-3',
    slots: [
      GK,
      { x: 0.18, y: 0.76, position: 'DEF' },
      { x: 0.39, y: 0.78, position: 'DEF' },
      { x: 0.61, y: 0.78, position: 'DEF' },
      { x: 0.82, y: 0.76, position: 'DEF' },
      { x: 0.27, y: 0.55, position: 'MID' },
      { x: 0.5, y: 0.58, position: 'MID' },
      { x: 0.73, y: 0.55, position: 'MID' },
      { x: 0.2, y: 0.28, position: 'FWD' },
      { x: 0.5, y: 0.24, position: 'FWD' },
      { x: 0.8, y: 0.28, position: 'FWD' },
    ],
  },
  {
    id: '4-2-3-1',
    label: '4-2-3-1',
    slots: [
      GK,
      { x: 0.18, y: 0.78, position: 'DEF' },
      { x: 0.39, y: 0.8, position: 'DEF' },
      { x: 0.61, y: 0.8, position: 'DEF' },
      { x: 0.82, y: 0.78, position: 'DEF' },
      { x: 0.35, y: 0.62, position: 'MID' },
      { x: 0.65, y: 0.62, position: 'MID' },
      { x: 0.2, y: 0.43, position: 'MID' },
      { x: 0.5, y: 0.4, position: 'MID' },
      { x: 0.8, y: 0.43, position: 'MID' },
      { x: 0.5, y: 0.21, position: 'FWD' },
    ],
  },
  {
    id: '3-5-2',
    label: '3-5-2',
    slots: [
      GK,
      { x: 0.28, y: 0.77, position: 'DEF' },
      { x: 0.5, y: 0.79, position: 'DEF' },
      { x: 0.72, y: 0.77, position: 'DEF' },
      { x: 0.12, y: 0.55, position: 'MID' },
      { x: 0.32, y: 0.57, position: 'MID' },
      { x: 0.5, y: 0.53, position: 'MID' },
      { x: 0.68, y: 0.57, position: 'MID' },
      { x: 0.88, y: 0.55, position: 'MID' },
      { x: 0.38, y: 0.27, position: 'FWD' },
      { x: 0.62, y: 0.27, position: 'FWD' },
    ],
  },
  {
    id: '5-3-2',
    label: '5-3-2',
    slots: [
      GK,
      { x: 0.12, y: 0.74, position: 'DEF' },
      { x: 0.31, y: 0.79, position: 'DEF' },
      { x: 0.5, y: 0.81, position: 'DEF' },
      { x: 0.69, y: 0.79, position: 'DEF' },
      { x: 0.88, y: 0.74, position: 'DEF' },
      { x: 0.27, y: 0.55, position: 'MID' },
      { x: 0.5, y: 0.57, position: 'MID' },
      { x: 0.73, y: 0.55, position: 'MID' },
      { x: 0.38, y: 0.27, position: 'FWD' },
      { x: 0.62, y: 0.27, position: 'FWD' },
    ],
  },
]

/** Επώνυμο ή μοναδικό όνομα, κομμένο ώστε να χωρά κάτω από το σύμβολο. */
export function shortName(fullName = '') {
  const parts = fullName.trim().split(/\s+/)
  const name = parts.length > 1 ? parts[parts.length - 1] : parts[0] || ''
  return name.length > 11 ? `${name.slice(0, 10)}.` : name
}

/**
 * Μοιράζει τους παίκτες του ρόστερ στις θέσεις του σχηματισμού.
 * Πρώτα ταιριάζει θέση με θέση· ό,τι μείνει ακάλυπτο συμπληρώνεται
 * από τους υπόλοιπους διαθέσιμους παίκτες.
 */
export function assignRoster(slots, players) {
  const pool = { GK: [], DEF: [], MID: [], FWD: [] }
  players.forEach((p) => pool[p.position]?.push(p))

  const used = new Set()
  const assigned = slots.map((slot) => {
    const candidate = pool[slot.position]?.find((p) => !used.has(p.id))
    if (candidate) used.add(candidate.id)
    return { slot, player: candidate ?? null }
  })

  const leftovers = players.filter((p) => !used.has(p.id))
  return assigned.map((entry) => {
    if (entry.player) return entry
    const filler = leftovers.shift() ?? null
    return { ...entry, player: filler }
  })
}

/** Δημιουργεί τα αντικείμενα του καμβά για έναν σχηματισμό. */
export function buildFormationObjects(formation, team, players, withNames) {
  const entries = withNames
    ? assignRoster(formation.slots, players)
    : formation.slots.map((slot) => ({ slot, player: null }))

  return entries.map(({ slot, player }, index) => ({
    id: crypto.randomUUID(),
    type: 'player',
    team,
    label: index + 1,
    name: player ? shortName(player.full_name) : null,
    x: slot.x,
    y: slot.y,
  }))
}
