// ============================================================
// Σχεδίαση αντικειμένων και βελών πάνω στο γήπεδο
//
// Οι συντεταγμένες αποθηκεύονται κανονικοποιημένες (0..1) και
// μετατρέπονται σε pixel μόνο τη στιγμή της σχεδίασης.
// ============================================================

export const COLORS = {
  blue: '#3b82f6',
  red: '#ef4444',
  cone: '#f97316',
  ball: '#ffffff',
  arrow: '#ffffff',
}

/** Ακτίνα συμβόλου παίκτη σε pixel, ανάλογη του πλάτους του καμβά. */
export function symbolRadius(w) {
  return Math.max(12, w * 0.045)
}

export function drawObject(ctx, obj, w, h) {
  const x = obj.x * w
  const y = obj.y * h
  const r = symbolRadius(w)

  if (obj.type === 'cone') {
    ctx.beginPath()
    ctx.moveTo(x, y - r)
    ctx.lineTo(x + r * 0.85, y + r * 0.7)
    ctx.lineTo(x - r * 0.85, y + r * 0.7)
    ctx.closePath()
    ctx.fillStyle = COLORS.cone
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'
    ctx.stroke()
    return
  }

  if (obj.type === 'ball') {
    ctx.beginPath()
    ctx.arc(x, y, r * 0.6, 0, Math.PI * 2)
    ctx.fillStyle = COLORS.ball
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = '#111'
    ctx.stroke()
    // Μικρό κεντρικό σημάδι για να διαβάζεται ως μπάλα
    ctx.beginPath()
    ctx.arc(x, y, r * 0.22, 0, Math.PI * 2)
    ctx.fillStyle = '#111'
    ctx.fill()
    return
  }

  // Παίκτης
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = COLORS[obj.team] ?? COLORS.blue
  ctx.fill()
  ctx.lineWidth = 2.5
  ctx.strokeStyle = '#ffffff'
  ctx.stroke()

  if (obj.label) {
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${Math.round(r * 1.1)}px system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(obj.label), x, y + 1)
  }

  // Όνομα παίκτη κάτω από το σύμβολο, με μαύρο περίγραμμα ώστε να
  // διαβάζεται πάνω στο γρασίδι.
  if (obj.name) {
    ctx.font = `bold ${Math.round(r * 0.75)}px system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.lineWidth = Math.max(2, r * 0.22)
    ctx.strokeStyle = 'rgba(0,0,0,0.8)'
    ctx.lineJoin = 'round'
    ctx.strokeText(obj.name, x, y + r + 2)
    ctx.fillStyle = '#ffffff'
    ctx.fillText(obj.name, x, y + r + 2)
  }
}

export function drawArrow(ctx, arrow, w, h) {
  const points = arrow.points.map((p) => ({ x: p.x * w, y: p.y * h }))
  if (points.length < 2) return

  ctx.strokeStyle = COLORS.arrow
  ctx.lineWidth = Math.max(2.5, w * 0.008)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Κίνηση παίκτη = συνεχής γραμμή, πάσα = διακεκομμένη
  ctx.setLineDash(arrow.kind === 'pass' ? [ctx.lineWidth * 3, ctx.lineWidth * 2.5] : [])

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  points.slice(1).forEach((p) => ctx.lineTo(p.x, p.y))
  ctx.stroke()
  ctx.setLineDash([])

  // Αιχμή στο τέλος
  const last = points[points.length - 1]
  const prev = points[points.length - 2]
  const angle = Math.atan2(last.y - prev.y, last.x - prev.x)
  const size = Math.max(10, w * 0.03)

  ctx.beginPath()
  ctx.moveTo(last.x, last.y)
  ctx.lineTo(last.x - size * Math.cos(angle - Math.PI / 7), last.y - size * Math.sin(angle - Math.PI / 7))
  ctx.lineTo(last.x - size * Math.cos(angle + Math.PI / 7), last.y - size * Math.sin(angle + Math.PI / 7))
  ctx.closePath()
  ctx.fillStyle = COLORS.arrow
  ctx.fill()
}

/** Βρίσκει το αντικείμενο κάτω από το δάχτυλο (από πάνω προς τα κάτω). */
export function hitObject(objects, px, py, w, h) {
  const r = symbolRadius(w) * 1.3
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i]
    const dx = obj.x * w - px
    const dy = obj.y * h - py
    if (dx * dx + dy * dy <= r * r) return i
  }
  return -1
}

/** Βρίσκει βέλος κοντά στο δάχτυλο (για το σβήσιμο). */
export function hitArrow(arrows, px, py, w, h) {
  const threshold = Math.max(14, w * 0.045)
  for (let i = arrows.length - 1; i >= 0; i--) {
    const points = arrows[i].points
    for (const p of points) {
      const dx = p.x * w - px
      const dy = p.y * h - py
      if (dx * dx + dy * dy <= threshold * threshold) return i
    }
  }
  return -1
}
