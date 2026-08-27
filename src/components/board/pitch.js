// ============================================================
// Σχεδίαση του γηπέδου στον καμβά
//
// Κάθετος προσανατολισμός (εστίες πάνω-κάτω): σε κινητό σε όρθια
// θέση δίνει πολύ περισσότερο ωφέλιμο χώρο από το οριζόντιο.
// Όλες οι διαστάσεις είναι αναλογίες του πλάτους/ύψους, ώστε το
// γήπεδο να δείχνει σωστό σε κάθε οθόνη.
// ============================================================

const GRASS_DARK = '#14532d'
const GRASS_LIGHT = '#166534'
const LINE = 'rgba(255,255,255,0.75)'

export function drawPitch(ctx, w, h) {
  // Ρίγες γρασιδιού
  const stripes = 9
  const stripeHeight = h / stripes
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? GRASS_DARK : GRASS_LIGHT
    ctx.fillRect(0, i * stripeHeight, w, stripeHeight + 1)
  }

  const m = Math.min(w, h) * 0.05 // περιθώριο μέχρι τις γραμμές
  const fieldW = w - m * 2
  const fieldH = h - m * 2

  ctx.strokeStyle = LINE
  ctx.lineWidth = Math.max(1.5, w * 0.006)
  ctx.lineCap = 'round'

  // Περίμετρος
  ctx.strokeRect(m, m, fieldW, fieldH)

  // Σέντρα
  ctx.beginPath()
  ctx.moveTo(m, h / 2)
  ctx.lineTo(m + fieldW, h / 2)
  ctx.stroke()

  const centerR = fieldW * 0.14
  ctx.beginPath()
  ctx.arc(w / 2, h / 2, centerR, 0, Math.PI * 2)
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(w / 2, h / 2, ctx.lineWidth * 1.6, 0, Math.PI * 2)
  ctx.fillStyle = LINE
  ctx.fill()

  // Περιοχές, μικρές περιοχές, σημεία πέναλτι — συμμετρικά πάνω και κάτω
  const boxW = fieldW * 0.58
  const boxH = fieldH * 0.15
  const smallW = fieldW * 0.26
  const smallH = fieldH * 0.06
  const goalW = fieldW * 0.18
  const goalDepth = m * 0.55

  for (const top of [true, false]) {
    const yBox = top ? m : m + fieldH - boxH
    const ySmall = top ? m : m + fieldH - smallH
    const yGoal = top ? m - goalDepth : m + fieldH
    const spotY = top ? m + boxH * 0.72 : m + fieldH - boxH * 0.72

    ctx.strokeRect((w - boxW) / 2, yBox, boxW, boxH)
    ctx.strokeRect((w - smallW) / 2, ySmall, smallW, smallH)

    // Εστία
    ctx.strokeRect((w - goalW) / 2, yGoal, goalW, goalDepth)

    // Σημείο πέναλτι
    ctx.beginPath()
    ctx.arc(w / 2, spotY, ctx.lineWidth * 1.4, 0, Math.PI * 2)
    ctx.fill()

    // Ημικύκλιο της περιοχής
    ctx.beginPath()
    if (top) {
      ctx.arc(w / 2, spotY, centerR * 0.85, 0.15 * Math.PI, 0.85 * Math.PI)
    } else {
      ctx.arc(w / 2, spotY, centerR * 0.85, 1.15 * Math.PI, 1.85 * Math.PI)
    }
    ctx.stroke()
  }

  // Γωνιαία τόξα
  const cornerR = fieldW * 0.045
  const corners = [
    [m, m, 0, 0.5 * Math.PI],
    [m + fieldW, m, 0.5 * Math.PI, Math.PI],
    [m + fieldW, m + fieldH, Math.PI, 1.5 * Math.PI],
    [m, m + fieldH, 1.5 * Math.PI, 2 * Math.PI],
  ]
  corners.forEach(([cx, cy, start, end]) => {
    ctx.beginPath()
    ctx.arc(cx, cy, cornerR, start, end)
    ctx.stroke()
  })
}
