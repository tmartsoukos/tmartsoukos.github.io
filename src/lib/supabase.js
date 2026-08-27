import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Χωρίς αυτά η εφαρμογή δεν μπορεί να συνδεθεί πουθενά — καλύτερα
  // να φανεί αμέσως στην κονσόλα παρά να αποτύχει σιωπηλά κάθε κλήση.
  console.error('Λείπουν οι μεταβλητές VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.')
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // PKCE: το token επιστρέφει ως ?code=... στο query string.
    // Με HashRouter το hash είναι δεσμευμένο για τη διαδρομή, οπότε
    // η παλιά ροή (#access_token=...) θα δημιουργούσε σύγκρουση.
    flowType: 'pkce',
  },
})
