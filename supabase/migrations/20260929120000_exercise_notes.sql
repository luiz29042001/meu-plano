-- ============================================================================
-- 004 — Anotações por exercício (uma por usuário + exercício)
-- ============================================================================
create table if not exists public.exercise_notes (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  exercise_id int  not null references public.exercises(id) on delete cascade,
  note        text not null check (char_length(note) <= 2000),
  updated_at  timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

alter table public.exercise_notes enable row level security;

drop policy if exists notes_select_own on public.exercise_notes;
drop policy if exists notes_insert_own on public.exercise_notes;
drop policy if exists notes_update_own on public.exercise_notes;
drop policy if exists notes_delete_own on public.exercise_notes;

create policy notes_select_own on public.exercise_notes
  for select to authenticated using (user_id = (select auth.uid()));
create policy notes_insert_own on public.exercise_notes
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy notes_update_own on public.exercise_notes
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy notes_delete_own on public.exercise_notes
  for delete to authenticated using (user_id = (select auth.uid()));
