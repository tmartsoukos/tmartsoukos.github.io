import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { clearAppData } from '../lib/db'

const AuthContext = createContext(null)

// Το ?recovery=1 μπαίνει από εμάς στον σύνδεσμο του email. Ο κωδικός
// του Supabase (?code=...) καταναλώνεται αυτόματα από τη βιβλιοθήκη,
// αλλά αυτό το σημάδι μένει και μας λέει με βεβαιότητα ότι ο χρήστης
// ήρθε για να αλλάξει κωδικό — χωρίς να εξαρτιόμαστε από το όνομα
// του γεγονότος του Supabase.
function urlHasRecoveryFlag() {
  try {
    return new URLSearchParams(window.location.search).get('recovery') === '1'
  } catch {
    return false
  }
}

function stripRecoveryFlag() {
  try {
    window.history.replaceState({}, '', window.location.pathname + window.location.hash)
  } catch {
    /* αγνοείται */
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recovery, setRecovery] = useState(() => urlHasRecoveryFlag())

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session ?? null)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      setSession(next ?? null)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const endRecovery = useCallback(() => {
    setRecovery(false)
    stripRecoveryFlag()
  }, [])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      recovery,

      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
      },

      async signUp(email, password) {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
        if (error) throw error
        // Αν είναι ενεργή η επιβεβαίωση email, δεν επιστρέφει session.
        return { needsConfirmation: !data.session }
      },

      async requestPasswordReset(email) {
        const redirectTo = `${window.location.origin}${window.location.pathname}?recovery=1`
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
        if (error) throw error
      },

      async updatePassword(password) {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        endRecovery()
      },

      cancelRecovery: endRecovery,

      async signOut() {
        endRecovery()
        await supabase.auth.signOut()
        clearAppData()
      },
    }),
    [session, loading, recovery, endRecovery],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth εκτός AuthProvider')
  return ctx
}
