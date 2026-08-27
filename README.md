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
└─ pages/        Login, Dashboard, Attendance, AttendanceStats, Roster, Split,
                 SessionBuilder, DrillLibrary, DrillBoard, Board, Timer, Settings
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

### Μοντέλο πρόσβασης και ασφάλεια

**Μία ομάδα ανά λογαριασμό.** Κάθε χρήστης που κάνει εγγραφή αποκτά τη δική του,
απομονωμένη ομάδα — δεν βλέπει και δεν αγγίζει τα δεδομένα κανενός άλλου. Δεν υπάρχουν
κωδικοί πρόσκλησης ούτε ρόλοι: αν ο βοηθός προπονητή πρέπει να δουλέψει στην ίδια ομάδα,
συνδέεται με **τα ίδια credentials**. Η ομάδα δημιουργείται μόνη της στην πρώτη σύνδεση,
μέσω του RPC `default_team()`.

Το publishable/anon key ενσωματώνεται στο bundle του browser — αυτό είναι αναμενόμενο. Η
προστασία στηρίζεται στα RLS policies:

- Όλα τα policies αφορούν αποκλειστικά τον ρόλο `authenticated`. Ο `anon` (μη συνδεδεμένος
  επισκέπτης) δεν έχει κανένα, άρα δεν διαβάζει και δεν γράφει τίποτα.
- Η ιδιοκτησία κρέμεται από το `teams.created_by`. Οι πίνακες με `team_id` το ελέγχουν
  απευθείας· οι πίνακες που κρέμονται από προπόνηση (`attendance`, `session_drills`,
  `splits`) περνούν από τη `SECURITY DEFINER` συνάρτηση `private.session_owner()`, η οποία
  ζει σε schema που **δεν εκτίθεται** από το REST API.
- Οι έτοιμες ασκήσεις (`is_preset`) είναι κοινές για όλους και μόνο για ανάγνωση.

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
  Στο διαλειμματικό, **πάτημα πάνω στον χρόνο** ανοίγει τρία καρουζέλ (άσκηση / ξεκούραση /
  σετ). Το «κούμπωμα» γίνεται με CSS `scroll-snap`, όχι με JavaScript, ώστε η κίνηση να
  ακολουθεί το δάχτυλο χωρίς καθυστέρηση.
- **Σχεδιαστήριο:** ανοίγει είτε αυτόνομα από την αρχική (πρόχειρο σχέδιο, με δυνατότητα
  αποθήκευσης ως άσκηση) είτε μέσα από μια δική σου άσκηση στη βιβλιοθήκη. Όλες οι
  συντεταγμένες αποθηκεύονται κανονικοποιημένες (0..1) στο `drills.board_data` (jsonb),
  οπότε το σχέδιο δείχνει σωστά σε κάθε μέγεθος οθόνης. Κίνηση παίκτη = συνεχής γραμμή,
  πάσα = διακεκομμένη.
- **Χωρισμός ομάδων:** οι παίκτες ταξινομούνται ανά θέση και μοιράζονται στην ομάδα με τους
  λιγότερους παίκτες (ισοπαλία → χαμηλότερο άθροισμα συνέπειας), ώστε να ισορροπούν
  ταυτόχρονα πλήθος, θέσεις και επίπεδο. Σε μονό αριθμό, μπαλαντέρ γίνεται ο μεσαίος σε
  συνέπεια παίκτης. Η χειροκίνητη αλλαγή γίνεται με **tap-to-swap** (το HTML5 drag & drop
  είναι αναξιόπιστο στα κινητά).
- **Παρουσιολόγιο:** κάθε κατάσταση έχει και εικονίδιο εκτός από χρώμα, για ορατότητα στον
  ήλιο και για αχρωματοψία.
