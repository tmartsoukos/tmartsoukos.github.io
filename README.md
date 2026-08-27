# CoachPad — PWA για προπονητές ποδοσφαίρου

Παρουσιολόγιο, έξυπνος χωρισμός ομάδων, πλάνο προπόνησης, σχεδιαστήριο τακτικής και
διαλειμματικό χρονόμετρο. Σχεδιασμένο για χρήση **στο γήπεδο**: σκούρο θέμα υψηλής
αντίθεσης, μεγάλα κουμπιά για χειρισμό με το ένα χέρι και πλήρης λειτουργία **εκτός σύνδεσης**.

Live: <https://tmartsoukos.github.io/>

---

## Τεχνολογίες

| Τομέας | Επιλογή |
|---|---|
| Build | Vite + React 19 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`, CSS-first) |
| Εικονίδια | lucide-react |
| Routing | react-router-dom (**HashRouter** — απαραίτητο για GitHub Pages) |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| PWA | vite-plugin-pwa (Workbox) |
| Σχεδιαστήριο | Canvas 2D API, χωρίς εξωτερική βιβλιοθήκη |

---

## Δομή

```
src/
├─ lib/          supabase, db (localStorage), outbox (ουρά offline), repo (data layer),
│                splitter, stats, audio, dates, drills
├─ context/      AuthContext, TeamContext (+realtime), SyncContext
├─ components/   layout/ ui/ roster/ attendance/ split/ session/ drills/ board/ timer/
└─ pages/        Login, Onboarding, Dashboard, Attendance, AttendanceStats, Roster,
                 Split, SessionBuilder, DrillLibrary, DrillBoard, Timer, Settings
supabase/        01_schema.sql, 02_policies.sql, 03_seed_drills.sql
```

### Κανόνας του data layer

Καμία σελίδα δεν καλεί το `supabase` απευθείας — **όλα** περνούν από το `src/lib/repo.js`:

- **Ανάγνωση:** επιστρέφει αμέσως την τοπική cache και ανανεώνει στο παρασκήνιο.
- **Εγγραφή:** γράφει τοπικά, μπαίνει στην ουρά (`src/lib/outbox.js`), συγχρονίζεται όταν
  υπάρχει δίκτυο (γεγονός `online`, επιστροφή στην εφαρμογή, ή κάθε 30″).

Τα `id` παράγονται στον client. Όπου μια γραμμή προσδιορίζεται φυσικά (παρουσία παίκτη σε
συγκεκριμένη προπόνηση) το `id` υπολογίζεται ντετερμινιστικά με SHA-256 από τα συστατικά της.
Έτσι δύο συσκευές που δουλεύουν ταυτόχρονα εκτός σύνδεσης παράγουν το **ίδιο** `id` και ο
συγχρονισμός καταλήγει σε ενημέρωση, όχι σε διπλότυπο. Πολιτική συγκρούσεων: last-write-wins.

---

## Τοπική εκτέλεση

```bash
npm install
```

Αντίγραψε το `.env.example` σε `.env` και συμπλήρωσε τα στοιχεία του Supabase project:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

```bash
npm run dev
```

---

## Setup του Supabase

1. Νέο project στο [supabase.com](https://supabase.com) (free tier αρκεί).
2. SQL Editor → τρέξε με τη σειρά: `supabase/01_schema.sql`, `02_policies.sql`, `03_seed_drills.sql`.
3. Authentication → URL Configuration:
   - **Site URL:** `https://tmartsoukos.github.io`
   - **Redirect URLs:** `https://tmartsoukos.github.io/**` και `http://localhost:5173/**`
4. Project Settings → API → αντίγραψε το URL και το publishable key στο `.env`.

### Ασφάλεια

Το publishable/anon key ενσωματώνεται στο bundle του browser — αυτό είναι αναμενόμενο. Η
προστασία των δεδομένων στηρίζεται **εξ ολοκλήρου στα RLS policies**:

- Κάθε πίνακας έχει RLS και επιτρέπει πρόσβαση μόνο στα μέλη της ομάδας.
- Οι έλεγχοι συμμετοχής γίνονται με `SECURITY DEFINER` συναρτήσεις στο schema `private`,
  το οποίο **δεν εκτίθεται** από το REST API (αποφυγή αναδρομής στα policies και αποφυγή
  δημόσιας κλήσης τους ως RPC).
- Η είσοδος με κωδικό πρόσκλησης γίνεται μέσω του RPC `join_team_by_code`, γιατί ο
  μη-μέλος δεν βλέπει τη γραμμή της ομάδας για να αναζητήσει τον κωδικό μόνος του.

---

## Deployment στο GitHub Pages

Το `vite.config.js` έχει `base: '/'` γιατί η εφαρμογή ανεβαίνει ως **user page**
(repo `tmartsoukos.github.io`). Για project page άλλαξέ το σε `'/<repo-name>/'`.

```bash
git init
git add -A
git commit -m "CoachPad: αρχική έκδοση"
git branch -M main
gh repo create tmartsoukos.github.io --public --source=. --push
```

Μετά το push:

1. **Settings → Pages → Source: GitHub Actions**
2. **Settings → Secrets and variables → Actions → New repository secret**, δύο μυστικά:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Κάθε push στο `main` τρέχει το `.github/workflows/deploy.yml` και ανεβάζει το `dist/`.

Επειδή χρησιμοποιείται **HashRouter**, δεν χρειάζεται `404.html` fallback: όλες οι
διαδρομές ζουν μέσα στο `#`, το οποίο ο server δεν βλέπει ποτέ.

### Εγκατάσταση στο κινητό

Άνοιξε το URL σε Chrome (Android) ή Safari (iOS) και «Προσθήκη στην αρχική οθόνη».
Η εφαρμογή ανοίγει fullscreen και λειτουργεί χωρίς δίκτυο.

---

## Σημειώσεις υλοποίησης

- **Χρονόμετρο:** ο χρόνος υπολογίζεται από `Date.now()` και όχι με άθροιση tick, ώστε να
  παραμένει σωστός όταν ο browser «παγώνει» το tab στο παρασκήνιο. Το `AudioContext`
  ξεκλειδώνει στο πρώτο tap (απαίτηση iOS Safari) και ενεργοποιείται Screen Wake Lock.
- **Σχεδιαστήριο:** όλες οι συντεταγμένες αποθηκεύονται κανονικοποιημένες (0..1) στο
  `drills.board_data` (jsonb), οπότε το σχέδιο δείχνει σωστά σε κάθε μέγεθος οθόνης.
  Κίνηση παίκτη = συνεχής γραμμή, πάσα = διακεκομμένη.
- **Χωρισμός ομάδων:** οι παίκτες ταξινομούνται ανά θέση και μοιράζονται στην ομάδα με τους
  λιγότερους παίκτες (ισοπαλία → χαμηλότερο άθροισμα συνέπειας), ώστε να ισορροπούν
  ταυτόχρονα πλήθος, θέσεις και επίπεδο. Σε μονό αριθμό, μπαλαντέρ γίνεται ο μεσαίος σε
  συνέπεια παίκτης. Η χειροκίνητη αλλαγή γίνεται με **tap-to-swap** (το HTML5 drag & drop
  είναι αναξιόπιστο στα κινητά).
- **Παρουσιολόγιο:** κάθε κατάσταση έχει και εικονίδιο εκτός από χρώμα, για ορατότητα στον
  ήλιο και για αχρωματοψία.
