-- ============================================================================
-- 005 — Segurança: perfil protegido, RLS explícita, conta nova sem dieta alheia
-- Origem: docs/review/revisao-geral-2026-10-05.md (I1, I2, I3, I6, S1, S2)
-- Explicação para o Luiz: docs/tech/correcoes-revisao-2026-10-05-backend.md
--
-- Idempotente: pode rodar mais de uma vez sem efeito colateral.
-- NÃO apaga nem altera: workout_completions, exercise_checks, exercise_notes.
-- Tudo roda numa transação (o CLI já envolve cada migração em transação).
-- ============================================================================

-- Passo 1: deixa registrado em código que o RLS está ligado nas 9 tabelas do app. `enable` é seguro repetir.
-- ─── 1. RLS ligada explicitamente em todas as tabelas do app (I3) ───────────
-- Em produção ela já deve estar ligada em workout_days/exercises (foi feito
-- pelo painel). Aqui fica registrado no repositório. "enable" é idempotente.
-- Uma linha por tabela: perfis, programas, dias, exercícios, conclusões, marcações, anotações, estatísticas e planos de dieta.
alter table public.profiles            enable row level security;
alter table public.workout_programs    enable row level security;
alter table public.workout_days        enable row level security;
alter table public.exercises           enable row level security;
alter table public.workout_completions enable row level security;
alter table public.exercise_checks     enable row level security;
alter table public.exercise_notes      enable row level security;
alter table public.user_stats          enable row level security;
alter table public.diet_plans          enable row level security;

-- Passo 2: cria a coluna `diet_fixed`. Antes, "sem plano no banco" significava "mostrar a dieta fixa do código". Se o perfil falhasse ao carregar, outra pessoa poderia ver a dieta errada. Agora só vê a dieta fixa quem tem `diet_fixed = true`.
-- ─── 2. Critério explícito para a dieta fixa (do código) (I6) ───────────────
-- Antes: "sem diet_plan_id" = mostrar a dieta fixa do Luiz. Se o perfil
-- falhasse ao carregar, a Usuária 2 via a dieta do Luiz. Agora só vê a dieta fixa
-- quem tem diet_fixed = true.
-- Cria a coluna (padrão `false`).
alter table public.profiles
  add column if not exists diet_fixed boolean not null default false;

-- Marca quem hoje usa a dieta fixa: programa ppl-6x, dieta ativa e sem plano
-- no banco. Hoje isso é só a conta do Luiz (ver doc). Não mexe em mais nada.
-- Marca como `true` apenas quem hoje usa a dieta fixa (programa PPL, dieta ativa e sem plano no banco).
update public.profiles
   set diet_fixed = true
 where diet_fixed = false
   and diet_enabled = true
   and diet_plan_id is null
   and program_id = (select id from public.workout_programs where slug = 'ppl-6x');

-- Passo 3: o usuário **não consegue alterar** os campos que controlam acesso (programa, dieta). Duas barreiras:
-- a) permissão por coluna; b) um gatilho de defesa.
-- ─── 3. Usuário não altera os campos que controlam acesso (I2) ──────────────
-- 3a. Privilégio por coluna: o app só grava diet_variant (+ updated_at).
--     full_name fica liberado (inofensivo). O resto, inclusive program_id,
--     diet_plan_id, diet_enabled e diet_fixed, fica bloqueado.
-- 3a. Retira todo o direito de escrita no perfil e devolve **só** o de alterar `full_name`, `diet_variant` e `updated_at`. Assim o app não consegue se dar acesso a outra dieta.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, diet_variant, updated_at) on public.profiles to authenticated;

-- O perfil é criado só pelo trigger handle_new_user (no cadastro). O app
-- nunca insere perfil, então a política de INSERT sai.
-- O perfil é criado só pelo gatilho do cadastro; o app nunca insere. Por isso a política de inserção é removida.
drop policy if exists "Users can insert own profile" on public.profiles;

-- 3b. Trigger de defesa (segunda barreira): mesmo que alguém volte a dar
--     "grant update" na tabela inteira pelo painel, o banco recusa mudanças
--     nesses campos vindas do app (papéis anon/authenticated). Migrações,
--     SQL Editor (postgres), triggers security definer e service_role
--     (Edge Functions) continuam podendo alterar.
-- 3b. Função do gatilho de defesa (segunda barreira): se alguém devolver o direito de escrita por engano (pelo painel), o banco ainda **recusa** mudanças nesses campos vindas do app. Migrações, o SQL Editor e Edge Functions continuam podendo alterar.
create or replace function public.protect_profile_access_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Só vale para as funções de "app" (`anon` e `authenticated`).
  if current_user in ('anon', 'authenticated') then
    -- Na criação do perfil: se o app tentar definir programa, plano ou flags de dieta, lança erro `42501` (permissão negada).
    if tg_op = 'INSERT' then
      if new.program_id is not null
         or new.diet_plan_id is not null
         or coalesce(new.diet_enabled, false)
         or coalesce(new.diet_fixed, false) then
        raise exception 'Campos de acesso do perfil não podem ser definidos pelo app'
          using errcode = '42501';
      end if;
    -- Na alteração: compara valor novo com o antigo (`is distinct from` trata `null` corretamente); mudou algo protegido → erro.
    elsif new.id           is distinct from old.id
       or new.program_id   is distinct from old.program_id
       or new.diet_plan_id is distinct from old.diet_plan_id
       or new.diet_enabled is distinct from old.diet_enabled
       or new.diet_fixed   is distinct from old.diet_fixed then
      raise exception 'Campos de acesso do perfil não podem ser alterados pelo app'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_access_columns on public.profiles;
-- Liga o gatilho: roda **antes** de cada inserção ou alteração no perfil.
create trigger protect_profile_access_columns
  before insert or update on public.profiles
  for each row execute function public.protect_profile_access_columns();

-- Passo 4: conta nova **não recebe dieta**. Mantém o programa de treino padrão e deixa a dieta desligada ("Dieta em criação") até alguém liberar.
-- ─── 4. Conta nova NÃO recebe a dieta da Usuária 2 (I1) ─────────────────────────
-- Mantém o programa de treino fem-5x (conteúdo genérico, sem dado pessoal;
-- o app ainda não tem tela de "sem programa"/onboarding). Dieta: nenhuma
-- (diet_enabled = false → o app mostra "Dieta em criação").
-- Roadmap item 1 troca isto por program_id = null + onboarding.
-- Recria o gatilho de cadastro: perfil com programa `fem-5x`, dieta desligada, sem plano e sem dieta fixa. `on conflict do nothing` torna o cadastro seguro mesmo se disparado duas vezes.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url,
                               program_id, diet_enabled, diet_plan_id, diet_fixed)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    (select id from public.workout_programs where slug = 'fem-5x'),
    false,
    null,
    false
  )
  on conflict (id) do nothing;

  insert into public.user_stats (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Passo 5: só o banco recalcula as estatísticas; o usuário apenas **lê**.
-- ─── 5. Estatísticas: só o banco recalcula (S1, S2) ─────────────────────────
-- Fixa o `search_path` das funções (mesma proteção do passo 4).
alter function public.refresh_user_stats(uuid) set search_path = public;
alter function public.trigger_refresh_stats()  set search_path = public;

-- Ninguém do app chama esta função diretamente; o trigger de conclusões
-- (security definer, dono da função) continua chamando normalmente.
-- Ninguém do app pode chamar a função de recálculo diretamente; apenas o gatilho (que é `security definer`).
revoke execute on function public.refresh_user_stats(uuid) from public, anon, authenticated;

-- O usuário só LÊ as próprias estatísticas; quem grava é o trigger.
-- Remove as políticas que deixavam o usuário **escrever** nas estatísticas. Restou só a de leitura.
drop policy if exists "Users upsert own stats" on public.user_stats;
drop policy if exists "Users update own stats" on public.user_stats;

-- Consultas de conferência (somente leitura) para rodar depois e comprovar: RLS ligado, flags dos perfis e permissões por coluna.
-- ─── Conferência (somente leitura; rodar depois, no SQL Editor) ─────────────
-- select relname, relrowsecurity from pg_class
--  where relnamespace = 'public'::regnamespace and relkind = 'r' order by 1;
-- select id, email, program_id, diet_enabled, diet_plan_id, diet_fixed
--   from public.profiles order by created_at;
-- select grantee, privilege_type, column_name
--   from information_schema.column_privileges
--  where table_schema = 'public' and table_name = 'profiles'
--    and grantee in ('anon', 'authenticated') and privilege_type <> 'SELECT';
