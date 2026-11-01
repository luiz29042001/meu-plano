-- ============================================================================
-- 004 — Anotações por exercício (uma por usuário + exercício)
-- ============================================================================
-- Tabela `exercise_notes`: uma anotação por **pessoa + exercício** (a chave primária composta impede duplicar). `check (char_length(note) <= 2000)` limita o tamanho do texto. `on delete cascade` apaga as anotações junto com a conta.
create table if not exists public.exercise_notes (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  exercise_id int  not null references public.exercises(id) on delete cascade,
  note        text not null check (char_length(note) <= 2000),
  updated_at  timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

-- RLS ligado: sem política, ninguém lê nem escreve.
alter table public.exercise_notes enable row level security;

-- Remove políticas antigas (se existirem) antes de recriar, para a migração poder rodar de novo sem erro.
drop policy if exists notes_select_own on public.exercise_notes;
drop policy if exists notes_insert_own on public.exercise_notes;
drop policy if exists notes_update_own on public.exercise_notes;
drop policy if exists notes_delete_own on public.exercise_notes;

-- Quatro políticas, uma por operação (ver, criar, alterar, apagar), todas com a mesma regra: `user_id = auth.uid()`, ou seja, **só as próprias anotações**. `with check` impede criar ou mover uma anotação para outra pessoa.
create policy notes_select_own on public.exercise_notes
  for select to authenticated using (user_id = (select auth.uid()));
create policy notes_insert_own on public.exercise_notes
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy notes_update_own on public.exercise_notes
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy notes_delete_own on public.exercise_notes
  for delete to authenticated using (user_id = (select auth.uid()));
