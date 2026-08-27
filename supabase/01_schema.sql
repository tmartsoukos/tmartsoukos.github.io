-- ============================================================
-- CoachPad — Σχήμα βάσης δεδομένων
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Βοηθητικές συναρτήσεις
-- ------------------------------------------------------------

-- Παράγει κωδικό πρόσκλησης 6 χαρακτήρων (χωρίς I, O, 0, 1 για να μην μπερδεύονται)
create or replace function public.generate_invite_code()
returns text
language sql
volatile
as $$
  select string_agg(
           substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
                  floor(random() * 32)::int + 1, 1), '')
  from generate_series(1, 6);
$$;

-- Ενημερώνει αυτόματα το updated_at σε κάθε UPDATE
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- teams — οι ομάδες
-- ------------------------------------------------------------
create table if not exists public.teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text unique,
  created_by  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Δημιουργεί μοναδικό invite code πριν την εισαγωγή (με επανάληψη σε σύγκρουση)
create or replace function public.set_invite_code()
returns trigger
language plpgsql
as $$
declare
  c text;
begin
  if new.invite_code is null then
    loop
      c := public.generate_invite_code();
      exit when not exists (select 1 from public.teams where invite_code = c);
    end loop;
    new.invite_code := c;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_teams_invite_code on public.teams;
create trigger trg_teams_invite_code
  before insert on public.teams
  for each row execute function public.set_invite_code();

drop trigger if exists trg_teams_touch on public.teams;
create trigger trg_teams_touch
  before update on public.teams
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- team_members — ποιοι προπονητές διαχειρίζονται κάθε ομάδα
-- ------------------------------------------------------------
create table if not exists public.team_members (
  team_id      uuid not null references public.teams(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null default 'assistant' check (role in ('head_coach', 'assistant')),
  display_name text,
  joined_at    timestamptz not null default now(),
  primary key (team_id, user_id)
);

create index if not exists idx_team_members_user on public.team_members(user_id);

-- ------------------------------------------------------------
-- players — το ρόστερ
-- ------------------------------------------------------------
create table if not exists public.players (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  full_name  text not null,
  phone      text,
  position   text not null default 'MID' check (position in ('GK', 'DEF', 'MID', 'FWD')),
  notes      text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_players_team on public.players(team_id);

drop trigger if exists trg_players_touch on public.players;
create trigger trg_players_touch
  before update on public.players
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- sessions — μία προπόνηση ανά ημέρα και ομάδα
-- ------------------------------------------------------------
create table if not exists public.sessions (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null references public.teams(id) on delete cascade,
  session_date date not null default current_date,
  title        text,
  notes        text,
  is_locked    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (team_id, session_date)
);

create index if not exists idx_sessions_team_date on public.sessions(team_id, session_date desc);

drop trigger if exists trg_sessions_touch on public.sessions;
create trigger trg_sessions_touch
  before update on public.sessions
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- attendance — παρουσιολόγιο
-- Το unique (session_id, player_id) επιτρέπει idempotent upsert
-- από την offline ουρά εγγραφών.
-- ------------------------------------------------------------
create table if not exists public.attendance (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  player_id  uuid not null references public.players(id) on delete cascade,
  status     text not null check (status in ('present', 'absent', 'excused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, player_id)
);

create index if not exists idx_attendance_session on public.attendance(session_id);
create index if not exists idx_attendance_player on public.attendance(player_id);

drop trigger if exists trg_attendance_touch on public.attendance;
create trigger trg_attendance_touch
  before update on public.attendance
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- drills — βιβλιοθήκη ασκήσεων
-- team_id NULL + is_preset = true  -> προεγκατεστημένη, ορατή σε όλους
-- ------------------------------------------------------------
create table if not exists public.drills (
  id               uuid primary key default gen_random_uuid(),
  team_id          uuid references public.teams(id) on delete cascade,
  title            text not null,
  category         text not null check (category in
                     ('warmup', 'passing', 'rondo', 'tactics', 'fitness', 'finishing', 'cooldown')),
  description      text,
  default_duration integer not null default 10,
  intensity        text not null default 'medium' check (intensity in ('low', 'medium', 'high')),
  board_data       jsonb,
  is_preset        boolean not null default false,
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint drills_preset_scope check (
    (is_preset and team_id is null) or (not is_preset and team_id is not null)
  )
);

create index if not exists idx_drills_team on public.drills(team_id);
create index if not exists idx_drills_category on public.drills(category);

drop trigger if exists trg_drills_touch on public.drills;
create trigger trg_drills_touch
  before update on public.drills
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- session_drills — το πλάνο της ημέρας (4 φάσεις)
-- Ο τίτλος αποθηκεύεται ως αντίγραφο ώστε το πλάνο να μένει
-- διαβάσιμο ακόμη κι αν διαγραφεί αργότερα η άσκηση.
-- ------------------------------------------------------------
create table if not exists public.session_drills (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.sessions(id) on delete cascade,
  drill_id     uuid references public.drills(id) on delete set null,
  title        text not null,
  phase        smallint not null check (phase between 1 and 4),
  order_index  integer not null default 0,
  duration_min integer not null default 10,
  intensity    text not null default 'medium' check (intensity in ('low', 'medium', 'high')),
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_session_drills_session
  on public.session_drills(session_id, phase, order_index);

drop trigger if exists trg_session_drills_touch on public.session_drills;
create trigger trg_session_drills_touch
  before update on public.session_drills
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- splits — αποτέλεσμα του χωρισμού ομάδων
-- teams: { "a": [playerId], "b": [playerId], "joker": [playerId] }
-- ------------------------------------------------------------
create table if not exists public.splits (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.sessions(id) on delete cascade,
  format     text not null,
  teams      jsonb not null default '{"a":[],"b":[],"joker":[]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_splits_touch on public.splits;
create trigger trg_splits_touch
  before update on public.splits
  for each row execute function public.touch_updated_at();
