-- ============================================================
-- CoachPad — Row Level Security και RPC
-- ============================================================
--
-- Μοντέλο πρόσβασης: μία κοινή ομάδα. Όποιος συνδεθεί βλέπει και
-- αλλάζει τα ίδια δεδομένα — δεν υπάρχουν κωδικοί πρόσκλησης ούτε
-- ρόλοι. Το φράγμα είναι η ίδια η σύνδεση: ο ρόλος `anon` (δηλαδή
-- ο μη συνδεδεμένος επισκέπτης) δεν έχει κανένα policy, άρα δεν
-- διαβάζει και δεν γράφει τίποτα.
--
-- ΣΗΜΑΝΤΙΚΟ: το publishable key ενσωματώνεται στο bundle του
-- browser. Το ότι ο anon δεν έχει policies είναι αυτό ακριβώς που
-- κρατά τα δεδομένα κλειστά.
-- ============================================================

alter table public.teams          enable row level security;
alter table public.players        enable row level security;
alter table public.sessions       enable row level security;
alter table public.attendance     enable row level security;
alter table public.drills         enable row level security;
alter table public.session_drills enable row level security;
alter table public.splits         enable row level security;

-- ------------------------------------------------------------
-- teams — η μοναδική ομάδα· δεν διαγράφεται από τον client
-- ------------------------------------------------------------
drop policy if exists teams_select on public.teams;
create policy teams_select on public.teams
  for select to authenticated using (true);

drop policy if exists teams_insert on public.teams;
create policy teams_insert on public.teams
  for insert to authenticated with check (created_by = auth.uid());

drop policy if exists teams_update on public.teams;
create policy teams_update on public.teams
  for update to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- Δεδομένα προπόνησης — κοινά για όλους τους συνδεδεμένους
-- ------------------------------------------------------------
drop policy if exists players_all on public.players;
create policy players_all on public.players
  for all to authenticated using (true) with check (true);

drop policy if exists sessions_all on public.sessions;
create policy sessions_all on public.sessions
  for all to authenticated using (true) with check (true);

drop policy if exists attendance_all on public.attendance;
create policy attendance_all on public.attendance
  for all to authenticated using (true) with check (true);

drop policy if exists session_drills_all on public.session_drills;
create policy session_drills_all on public.session_drills
  for all to authenticated using (true) with check (true);

drop policy if exists splits_all on public.splits;
create policy splits_all on public.splits
  for all to authenticated using (true) with check (true);

-- ------------------------------------------------------------
-- drills — οι έτοιμες ασκήσεις μένουν αμετάβλητες
-- ------------------------------------------------------------
drop policy if exists drills_select on public.drills;
create policy drills_select on public.drills
  for select to authenticated using (true);

drop policy if exists drills_insert on public.drills;
create policy drills_insert on public.drills
  for insert to authenticated with check (not is_preset);

drop policy if exists drills_update on public.drills;
create policy drills_update on public.drills
  for update to authenticated using (not is_preset) with check (not is_preset);

drop policy if exists drills_delete on public.drills;
create policy drills_delete on public.drills
  for delete to authenticated using (not is_preset);

-- ------------------------------------------------------------
-- RPC: η κοινή ομάδα, με δημιουργία στην πρώτη σύνδεση
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

  select * into t from public.teams order by created_at limit 1;

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
-- Realtime — αλλαγές από άλλη συσκευή φαίνονται αμέσως
-- ------------------------------------------------------------
do $$
begin
  begin alter publication supabase_realtime add table public.attendance;     exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.players;        exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.session_drills; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.splits;         exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.sessions;       exception when duplicate_object then null; end;
end $$;
