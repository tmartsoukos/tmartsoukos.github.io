// ============================================================
// Ουρά εγγραφών εκτός σύνδεσης (outbox)
//
// Κάθε αλλαγή γράφεται πρώτα τοπικά και μπαίνει στην ουρά.
// Όταν υπάρχει δίκτυο, η ουρά αδειάζει με τη σειρά που μπήκε.
//
// Το id κάθε γραμμής παράγεται στον client (crypto.randomUUID),
// άρα η επανάληψη μιας εγγραφής είναι ακίνδυνη: το upsert πάνω
// στο ίδιο id (ή στο unique ζευγάρι) απλώς ξαναγράφει τα ίδια.
// ============================================================

import { supabase } from './supabase'
import { readLocal, writeLocal } from './db'

const OUTBOX_KEY = 'outbox'
const FAILED_KEY = 'outbox:failed'

const listeners = new Set()

export function subscribeOutbox(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function notify() {
  const count = listOutbox().length
  listeners.forEach((fn) => fn(count))
}

export function listOutbox() {
  const items = readLocal(OUTBOX_KEY, [])
  return Array.isArray(items) ? items : []
}

export function listFailed() {
  const items = readLocal(FAILED_KEY, [])
  return Array.isArray(items) ? items : []
}

export function clearFailed() {
  writeLocal(FAILED_KEY, [])
  notify()
}

export function pendingCount() {
  return listOutbox().length
}

/**
 * Ποιες γραμμές ενός πίνακα περιμένουν ακόμη να σταλούν.
 * Χρησιμεύει ώστε μια απάντηση του server να μην πατήσει πάνω σε
 * νεότερη τοπική αλλαγή που δεν έχει προλάβει να συγχρονιστεί.
 */
export function pendingOps(table) {
  const upserts = new Set()
  const deletes = new Set()
  listOutbox().forEach((op) => {
    if (op.table !== table) return
    if (op.kind === 'delete') deletes.add(op.row.id)
    else upserts.add(op.row.id)
  })
  return { upserts, deletes }
}

/**
 * Προσθέτει μια αλλαγή στην ουρά.
 * @param {{table: string, kind: 'upsert'|'delete', row: object, onConflict?: string}} op
 */
export function enqueue(op) {
  const queue = listOutbox()
  queue.push({
    opId: crypto.randomUUID(),
    ts: Date.now(),
    onConflict: 'id',
    ...op,
  })
  writeLocal(OUTBOX_KEY, queue)
  notify()
}

function removeOp(opId) {
  writeLocal(
    OUTBOX_KEY,
    listOutbox().filter((o) => o.opId !== opId),
  )
}

function moveToFailed(op, message) {
  const failed = listFailed()
  failed.push({ ...op, error: message, failedAt: Date.now() })
  writeLocal(FAILED_KEY, failed)
  removeOp(op.opId)
}

// Τα σφάλματα της Postgres έχουν πενταψήφιο SQLSTATE (π.χ. 42501 =
// άρνηση πρόσβασης από RLS). Αυτά δεν πρόκειται να διορθωθούν με
// επανάληψη, οπότε βγαίνουν από την ουρά για να μην την μπλοκάρουν.
function isPermanent(error) {
  if (!error) return false
  if (typeof error.code === 'string' && /^[0-9A-Z]{5}$/.test(error.code)) return true
  if (typeof error.status === 'number' && error.status >= 400 && error.status < 500) {
    return error.status !== 408 && error.status !== 429
  }
  return false
}

async function runOp(op) {
  if (op.kind === 'delete') {
    return supabase.from(op.table).delete().eq('id', op.row.id)
  }
  return supabase.from(op.table).upsert(op.row, { onConflict: op.onConflict })
}

let flushing = false

/**
 * Αδειάζει την ουρά. Σειριακά και με τη σειρά εισαγωγής, ώστε
 * μια εξάρτηση (π.χ. προπόνηση πριν από τις παρουσίες της) να μη
 * φτάσει ποτέ πριν από αυτό που την προϋποθέτει.
 */
export async function flushOutbox() {
  if (flushing) return { sent: 0, skipped: true }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { sent: 0, offline: true }
  }

  flushing = true
  let sent = 0
  let failed = 0

  try {
    for (const op of listOutbox()) {
      let error = null
      try {
        const res = await runOp(op)
        error = res.error
      } catch (e) {
        error = e
      }

      if (!error) {
        removeOp(op.opId)
        sent++
        continue
      }

      if (isPermanent(error)) {
        moveToFailed(op, error.message || 'Άγνωστο σφάλμα')
        failed++
        continue
      }

      // Προσωρινό σφάλμα (χαμένο δίκτυο): σταματάμε και ξαναδοκιμάζουμε αργότερα.
      break
    }
  } finally {
    flushing = false
    notify()
  }

  return { sent, failed, remaining: listOutbox().length }
}
