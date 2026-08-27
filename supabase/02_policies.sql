-- ============================================================
-- CoachPad — Row Level Security, βοηθητικές συναρτήσεις, RPC
-- ============================================================
--
-- ΣΗΜΑΝΤΙΚΟ: το κλειδί anon/publishable ενσωματώνεται στο bundle
-- του browser. Όλη η ασφάλεια στηρίζεται σε αυτά τα policies.
--
-- Δύο σχεδιαστικές αποφάσεις:
--
-- 1) Οι έλεγχοι συμμετοχής γίνονται με SECURITY DEFINER συναρτήσεις.
--    Χωρίς αυτές, ένα policy πάνω στο team_members που κάνει select
--    στο ίδιο το team_members θα προκαλούσε άπειρη αναδρομή.
--
-- 2) Οι συναρτήσεις αυτές ζουν στο schema `private`, το οποίο ΔΕΝ
--    εκτίθεται από το PostgREST. Αν έμεναν στο `public`, ο καθένας
--    θα μπορούσε να τις καλέσει ως /rest/v1/rpc/is_team_member.
-- ============================================================

-- ------------------------------------------------------------
-- Ιδιωτικό schema — μη προσβάσιμο μέσω του REST API
-- ------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_team_member(t uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.team_members
    where team_id = t and user_id = auth.uid()
  );
$$;

create or replace function private.is_head_coach(t uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.team_members
    where team_id = t and user_id = auth.uid() and role = 'head_coach'
  );
$$;

-- Ο δημιουργός της ομάδας (χρειάζεται για να γραφτεί ως πρώτο μέλος)
create or replace function private.team_owner(t uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select created_by from public.teams where id = t;
$$;

-- Η ομάδα στην οποία ανήκει μια προπόνηση (για τους πίνακες-παιδιά)
create or replace function private.session_team(s uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select team_id from public.sessions where id = s;
$$;

revoke all on function private.is_team_member(uuid) from public;
revoke all on function private.is_head_coach(uuid)  from public;
revoke all on function private.team_owner(uuid)     from public;
revoke all on function private.session_team(uuid)   from public;
grant execute on function private.is_team_member(uuid) to authenticated;
grant execute on function private.is_head_coach(uuid)  to authenticated;
grant execute on function private.team_owner(uuid)     to authenticated;
grant execute on function private.session_team(uuid)   to authenticated;

-- Σταθερό search_path και στις συναρτήσεις του σχήματος
alter function public.generate_invite_code() set search_path = public;
alter function public.touch_updated_at()     set search_path = public;
alter function public.set_invite_code()      set search_path = public;

-- ------------------------------------------------------------
-- Ενεργοποίηση RLS σε όλους τους πίνακες
-- ------------------------------------------------------------
alter table public.teams          enable row level security;
alter table public.team_members   enable row level security;
alter table public.players        enable row level security;
alter table public.sessions       enable row level security;
alter table public.attendance     enable row level security;
alter table public.drills         enable row level security;
alter table public.session_drills enable row level security;
alter table public.splits         enable row level security;

-- ------------------------------------------------------------
-- teams
-- ------------------------------------------------------------
drop policy if exists teams_select on public.teams;
create policy teams_select on public.teams
  for select to authenticated
  using (private.is_team_member(id));

drop policy if exists teams_insert on public.teams;
create policy teams_insert on public.teams
  for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists teams_update on public.teams;
create policy teams_update on public.teams
  for update to authenticated
  using (private.is_head_coach(id))
  with check (private.is_head_coach(id));

drop policy if exists teams_delete on public.teams;
create policy teams_delete on public.teams
  for delete to authenticated
  using (private.is_head_coach(id));

-- ------------------------------------------------------------
-- team_members
-- ------------------------------------------------------------
drop policy if exists team_members_select on public.team_members;
create policy team_members_select on public.team_members
  for select to authenticated
  using (private.is_team_member(team_id));

-- Ο δημιουργός γράφει τον εαυτό του ως πρώτο μέλος·
-- ο head coach μπορεί να προσθέσει και άλλους.
drop policy if exists team_members_insert on public.team_members;
create policy team_members_insert on public.team_members
  for insert to authenticated
  with check (
    (user_id = auth.uid() and private.team_owner(team_id) = auth.uid())
    or private.is_head_coach(team_id)
  );

drop policy if exists team_members_update on public.team_members;
create policy team_members_update on public.team_members
  for update to authenticated
  using (private.is_head_coach(team_id))
  with check (private.is_head_coach(team_id));

-- Ο head coach διώχνει μέλη· ο καθένας μπορεί να αποχωρήσει μόνος του.
drop policy if exists team_members_delete on public.team_members;
create policy team_members_delete on public.team_members
  for delete to authenticated
  using (private.is_head_coach(team_id) or user_id = auth.uid());

-- ------------------------------------------------------------
-- players / sessions — πλήρης πρόσβαση στα μέλη της ομάδας
-- ------------------------------------------------------------
drop policy if exists players_all on public.players;
create policy players_all on public.players
  for all to authenticated
  using (private.is_team_member(team_id))
  with check (private.is_team_member(team_id));

drop policy if exists sessions_all on public.sessions;
create policy sessions_all on public.sessions
  for all to authenticated
  using (private.is_team_member(team_id))
  with check (private.is_team_member(team_id));

-- ------------------------------------------------------------
-- attendance / session_drills / splits — μέσω της γονικής προπόνησης
-- ------------------------------------------------------------
drop policy if exists attendance_all on public.attendance;
create policy attendance_all on public.attendance
  for all to authenticated
  using (private.is_team_member(private.session_team(session_id)))
  with check (private.is_team_member(private.session_team(session_id)));

drop policy if exists session_drills_all on public.session_drills;
create policy session_drills_all on public.session_drills
  for all to authenticated
  using (private.is_team_member(private.session_team(session_id)))
  with check (private.is_team_member(private.session_team(session_id)));

drop policy if exists splits_all on public.splits;
create policy splits_all on public.splits
  for all to authenticated
  using (private.is_team_member(private.session_team(session_id)))
  with check (private.is_team_member(private.session_team(session_id)));

-- ------------------------------------------------------------
-- drills — τα presets είναι ορατά σε όλους αλλά μόνο για ανάγνωση
-- ------------------------------------------------------------
drop policy if exists drills_select on public.drills;
create policy drills_select on public.drills
  for select to authenticated
  using (is_preset or private.is_team_member(team_id));

drop policy if exists drills_insert on public.drills;
create policy drills_insert on public.drills
  for insert to authenticated
  with check (not is_preset and private.is_team_member(team_id));

drop policy if exists drills_update on public.drills;
create policy drills_update on public.drills
  for update to authenticated
  using (not is_preset and private.is_team_member(team_id))
  with check (not is_preset and private.is_team_member(team_id));

drop policy if exists drills_delete on public.drills;
create policy drills_delete on public.drills
  for delete to authenticated
  using (not is_preset and private.is_team_member(team_id));

-- ------------------------------------------------------------
-- RPC: δημιουργία ομάδας (ομάδα + πρώτο μέλος σε μία συναλλαγή)
-- ------------------------------------------------------------
create or replace function public.create_team(p_name text)
returns public.teams
language plpgsql security definer set search_path = public
as $$
declare
  t public.teams;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'EMPTY_NAME';
  end if;

  insert into public.teams (name, created_by)
  values (trim(p_name), auth.uid())
  returning * into t;

  insert into public.team_members (team_id, user_id, role)
  values (t.id, auth.uid(), 'head_coach');

  return t;
end;
$$;

-- ------------------------------------------------------------
-- RPC: είσοδος σε ομάδα με κωδικό πρόσκλησης
-- Χρειάζεται SECURITY DEFINER: ο μη-μέλος δεν βλέπει τη γραμμή
-- στο teams, άρα δεν μπορεί να αναζητήσει μόνος του τον κωδικό.
-- Γράφει αποκλειστικά τη δική του συμμετοχή (auth.uid()).
-- ------------------------------------------------------------
create or replace function public.join_team_by_code(p_code text)
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
  where upper(invite_code) = upper(trim(p_code));

  if t.id is null then
    raise exception 'INVALID_CODE';
  end if;

  insert into public.team_members (team_id, user_id, role)
  values (t.id, auth.uid(), 'assistant')
  on conflict (team_id, user_id) do nothing;

  return t;
end;
$$;

revoke all on function public.create_team(text)        from public, anon;
revoke all on function public.join_team_by_code(text)  from public, anon;
grant execute on function public.create_team(text)       to authenticated;
grant execute on function public.join_team_by_code(text) to authenticated;

-- ------------------------------------------------------------
-- Realtime — κοινή διαχείριση head coach / βοηθού σε πραγματικό χρόνο
-- ------------------------------------------------------------
do $$
begin
  begin alter publication supabase_realtime add table public.attendance;     exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.players;        exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.session_drills; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.splits;         exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.sessions;       exception when duplicate_object then null; end;
end $$;
