-- ============================================================
-- CoachPad — Row Level Security και RPC
-- ============================================================
--
-- Μοντέλο πρόσβασης: μία ομάδα ανά λογαριασμό.
--
-- Κάθε χρήστης βλέπει και αλλάζει ΜΟΝΟ τα δικά του δεδομένα. Δεν
-- υπάρχουν κωδικοί πρόσκλησης ούτε ρόλοι: αν δύο προπονητές θέλουν
-- να δουλέψουν στην ίδια ομάδα, συνδέονται με τον ίδιο λογαριασμό.
--
-- Η ιδιοκτησία κρέμεται από το teams.created_by. Οι πίνακες με
-- team_id το ελέγχουν απευθείας· οι πίνακες που κρέμονται από
-- προπόνηση (attendance, session_drills, splits) περνούν από τη
-- συνάρτηση private.session_owner().
--
-- ΣΗΜΑΝΤΙΚΟ: το publishable key ενσωματώνεται στο bundle του
-- browser. Όλα τα policies αφορούν αποκλειστικά τον ρόλο
-- `authenticated` — ο `anon` δεν έχει κανένα, άρα ο μη συνδεδεμένος
-- επισκέπτης δεν διαβάζει και δεν γράφει τίποτα.
-- ============================================================

alter table public.teams          enable row level security;
alter table public.players        enable row level security;
alter table public.sessions       enable row level security;
alter table public.attendance     enable row level security;
alter table public.drills         enable row level security;
alter table public.session_drills enable row level security;
alter table public.splits         enable row level security;

-- ------------------------------------------------------------
-- Ιδιωτικό schema — μη προσβάσιμο μέσω του REST API
-- ------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- Ο ιδιοκτήτης της ομάδας στην οποία ανήκει μια προπόνηση
create or replace function private.session_owner(s uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select t.created_by
  from public.sessions s2
  join public.teams t on t.id = s2.team_id
  where s2.id = s;
$$;

revoke all on function private.session_owner(uuid) from public;
grant execute on function private.session_owner(uuid) to authenticated;

-- ------------------------------------------------------------
-- teams — η ομάδα του χρήστη· δεν διαγράφεται από τον client
-- ------------------------------------------------------------
drop policy if exists teams_select on public.teams;
create policy teams_select on public.teams
  for select to authenticated
  using (created_by = auth.uid());

drop policy if exists teams_insert on public.teams;
create policy teams_insert on public.teams
  for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists teams_update on public.teams;
create policy teams_update on public.teams
  for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- ------------------------------------------------------------
-- players / sessions — μέσω του team_id
-- ------------------------------------------------------------
drop policy if exists players_all on public.players;
create policy players_all on public.players
  for all to authenticated
  using (team_id in (select id from public.teams where created_by = auth.uid()))
  with check (team_id in (select id from public.teams where created_by = auth.uid()));

drop policy if exists sessions_all on public.sessions;
create policy sessions_all on public.sessions
  for all to authenticated
  using (team_id in (select id from public.teams where created_by = auth.uid()))
  with check (team_id in (select id from public.teams where created_by = auth.uid()));

-- ------------------------------------------------------------
-- attendance / session_drills / splits — μέσω της γονικής προπόνησης
-- ------------------------------------------------------------
drop policy if exists attendance_all on public.attendance;
create policy attendance_all on public.attendance
  for all to authenticated
  using (private.session_owner(session_id) = auth.uid())
  with check (private.session_owner(session_id) = auth.uid());

drop policy if exists session_drills_all on public.session_drills;
create policy session_drills_all on public.session_drills
  for all to authenticated
  using (private.session_owner(session_id) = auth.uid())
  with check (private.session_owner(session_id) = auth.uid());

drop policy if exists splits_all on public.splits;
create policy splits_all on public.splits
  for all to authenticated
  using (private.session_owner(session_id) = auth.uid())
  with check (private.session_owner(session_id) = auth.uid());

-- ------------------------------------------------------------
-- drills — οι έτοιμες ασκήσεις είναι κοινές και μόνο για ανάγνωση
-- ------------------------------------------------------------
drop policy if exists drills_select on public.drills;
create policy drills_select on public.drills
  for select to authenticated
  using (is_preset or team_id in (select id from public.teams where created_by = auth.uid()));

drop policy if exists drills_insert on public.drills;
create policy drills_insert on public.drills
  for insert to authenticated
  with check (not is_preset and team_id in (select id from public.teams where created_by = auth.uid()));

drop policy if exists drills_update on public.drills;
create policy drills_update on public.drills
  for update to authenticated
  using (not is_preset and team_id in (select id from public.teams where created_by = auth.uid()))
  with check (not is_preset and team_id in (select id from public.teams where created_by = auth.uid()));

drop policy if exists drills_delete on public.drills;
create policy drills_delete on public.drills
  for delete to authenticated
  using (not is_preset and team_id in (select id from public.teams where created_by = auth.uid()));

-- ------------------------------------------------------------
-- RPC: η ομάδα του χρήστη, με δημιουργία στην πρώτη σύνδεση
-- ------------------------------------------------------------
create or replace function public.default_team()
returns public.teams
language plpgsql security definer set search_path = public
as $$
declare
  t public.teams;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into t
  from public.teams
  where created_by = auth.uid()
  order by created_at
  limit 1;

  if t.id is null then
    insert into public.teams (name, created_by)
    values ('Η ομάδα μου', auth.uid())
    returning * into t;
  end if;

  return t;
end;
$$;

revoke all on function public.default_team() from public, anon;
grant execute on function public.default_team() to authenticated;

-- ------------------------------------------------------------
-- Realtime — αλλαγές από άλλη συσκευή του ίδιου λογαριασμού
-- φαίνονται αμέσως
-- ------------------------------------------------------------
do $$
begin
  begin alter publication supabase_realtime add table public.attendance;     exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.players;        exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.session_drills; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.splits;         exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.sessions;       exception when duplicate_object then null; end;
end $$;
