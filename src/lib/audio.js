// ============================================================
// Ήχος και δόνηση για το χρονόμετρο
//
// Το AudioContext πρέπει να δημιουργείται μέσα σε χειρονομία του
// χρήστη (tap), αλλιώς το iOS Safari το κρατά σε κατάσταση
// 'suspended' και δεν ακούγεται τίποτα. Γι' αυτό το unlock()
// καλείται από το κουμπί «Έναρξη».
// ============================================================

let ctx = null

export function unlockAudio() {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext
      if (!Ctor) return false
      ctx = new Ctor()
    }
    if (ctx.state === 'suspended') ctx.resume()
    return true
  } catch {
    return false
  }
}

function tone(frequency, durationMs, { type = 'square', gain = 0.25, delayMs = 0 } = {}) {
  if (!ctx) return
  const start = ctx.currentTime + delayMs / 1000
  const stop = start + durationMs / 1000

  const osc = ctx.createOscillator()
  const amp = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(frequency, start)

  // Μικρή ράμπα στην αρχή και στο τέλος για να μην ακούγεται «κλικ»
  amp.gain.setValueAtTime(0, start)
  amp.gain.linearRampToValueAtTime(gain, start + 0.01)
  amp.gain.setValueAtTime(gain, stop - 0.02)
  amp.gain.linearRampToValueAtTime(0, stop)

  osc.connect(amp)
  amp.connect(ctx.destination)
  osc.start(start)
  osc.stop(stop + 0.02)
}

/** Σύντομο beep αντίστροφης μέτρησης (3, 2, 1). */
export function beep() {
  unlockAudio()
  tone(880, 120)
  vibrate(60)
}

/** Σφυρίχτρα λήξης διαστήματος: δύο ψηλοί τόνοι. */
export function whistle() {
  unlockAudio()
  tone(1200, 200, { type: 'sawtooth', gain: 0.3 })
  tone(1400, 260, { type: 'sawtooth', gain: 0.3, delayMs: 240 })
  vibrate([200, 100, 250])
}

/** Ήχος έναρξης νέου σετ: ένας χαμηλός τόνος. */
export function startTone() {
  unlockAudio()
  tone(600, 180)
  vibrate(120)
}

export function vibrate(pattern) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern)
  } catch {
    /* δεν υποστηρίζεται */
  }
}
