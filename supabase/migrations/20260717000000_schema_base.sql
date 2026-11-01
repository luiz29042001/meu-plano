-- ==============================================================================
-- MIGRAÇÃO 1/6 — SCHEMA BASE (17/07/2026)
-- Cria o banco inicial: perfis, dias de treino, exercícios, conclusões, marcações,
-- estatísticas e os gatilhos automáticos.
--
-- Convenções deste arquivo:
-- - RLS (Row Level Security): cada tabela com dado de usuário só deixa a pessoa
--   ver e alterar as PRÓPRIAS linhas (`auth.uid() = user_id`).
-- - Esta migração é a BASE; as seguintes ajustam o banco (multi-programa, dieta,
--   anotações, segurança...). O estado real é a soma de todas.
-- ==============================================================================
-- ─── EXTENSIONS ──────────────────────────────────────────────────────────────
-- Extensão que gera identificadores únicos (UUID) usados como chave das tabelas.
create extension if not exists "uuid-ossp";

-- ─── PROFILES ─────────────────────────────────────────────────────────────────
-- Tabela `profiles`: um registro por pessoa (a chave é o mesmo `id` do login, em `auth.users`). `on delete cascade` apaga o perfil junto com a conta. `diet_variant` só aceita 'A' ou 'B' (`check`).
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  full_name     text,
  avatar_url    text,
  weight_kg     numeric(5,2) default 85,
  height_cm     numeric(5,1) default 180,
  age           int          default 25,
  diet_variant  char(1)      default 'A' check (diet_variant in ('A','B')),
  created_at    timestamptz  default now(),
  updated_at    timestamptz  default now()
);

-- Liga o RLS: sem uma política (policy) que permita, ninguém acessa a tabela.
alter table public.profiles enable row level security;

-- Políticas do perfil: cada pessoa só enxerga (select), cria (insert) e altera (update) o PRÓPRIO perfil.
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ─── WORKOUT DAYS (seed data, shared) ────────────────────────────────────────
-- Tabela `workout_days`: os dias da rotina (ex.: PUSH A). `slug` é o identificador de texto único; `weekday_index` é a ordem na sequência. Dados de "semente" (seed), iguais para todos.
create table public.workout_days (
  id         serial primary key,
  slug       text not null unique,   -- 'push-a', 'pull-a', etc.
  label      text not null,          -- 'PUSH A'
  weekday    text not null,          -- 'Segunda'
  weekday_index int not null,        -- 0=Segunda..5=Sábado, 6=Domingo
  color      text not null,
  muscles    text not null,
  is_rest    boolean default false
);

-- ─── EXERCISES (seed data, shared) ───────────────────────────────────────────
-- Tabela `exercises`: exercícios de cada dia, com posição, séries, repetições, descanso e dica. Um dia tem muitos exercícios (`workout_day_id`).
create table public.exercises (
  id             serial primary key,
  workout_day_id int not null references public.workout_days(id),
  position       int not null,
  name           text not null,
  sets           text not null,
  reps           text not null,
  rest_seconds   int  not null,
  tip            text
);

-- Índice: acelera a busca dos exercícios de um dia.
create index idx_exercises_workout_day on public.exercises(workout_day_id);

-- ─── WORKOUT COMPLETIONS ──────────────────────────────────────────────────────
-- Tabela `workout_completions`: registra que a pessoa concluiu um treino numa data. `unique(user_id, completed_date)` garante **um treino por dia por pessoa**.
create table public.workout_completions (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  workout_day_id int  not null references public.workout_days(id),
  completed_date date not null,
  duration_min   int,
  notes          text,
  created_at     timestamptz default now(),
  unique(user_id, completed_date)   -- one workout per day
);

-- Índice: acelera a busca por pessoa e data (mais recentes primeiro), usada no calendário.
create index idx_completions_user_date on public.workout_completions(user_id, completed_date desc);


-- RLS ligado nas conclusões.
alter table public.workout_completions enable row level security;

-- Políticas das conclusões: ver, criar, apagar e atualizar somente as próprias.
create policy "Users see own completions"
  on public.workout_completions for select using (auth.uid() = user_id);
create policy "Users insert own completions"
  on public.workout_completions for insert with check (auth.uid() = user_id);
create policy "Users delete own completions"
  on public.workout_completions for delete using (auth.uid() = user_id);
create policy "Users update own completions"
  on public.workout_completions for update using (auth.uid() = user_id);

-- ─── EXERCISE CHECKS (per session) ───────────────────────────────────────────
-- Tabela `exercise_checks`: "exercício feito" em uma data. `unique(user_id, exercise_id, check_date)` impede marcar o mesmo exercício duas vezes no dia.
create table public.exercise_checks (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  exercise_id    int  not null references public.exercises(id),
  check_date     date not null,
  checked        boolean default true,
  created_at     timestamptz default now(),
  unique(user_id, exercise_id, check_date)
);

-- Índice para buscar as marcações de uma pessoa em uma data.
create index idx_checks_user_date on public.exercise_checks(user_id, check_date);

-- RLS ligado nas marcações.
alter table public.exercise_checks enable row level security;

-- Políticas das marcações: ver, criar, atualizar e apagar as próprias.
create policy "Users see own checks"
  on public.exercise_checks for select using (auth.uid() = user_id);
create policy "Users upsert own checks"
  on public.exercise_checks for insert with check (auth.uid() = user_id);
create policy "Users update own checks"
  on public.exercise_checks for update using (auth.uid() = user_id);
create policy "Users delete own checks"
  on public.exercise_checks for delete using (auth.uid() = user_id);

-- ─── USER STATS (denormalized for dashboard) ─────────────────────────────────
-- Tabela `user_stats`: totais da pessoa (treinos, sequências), para a tela de calendário/Início ler rápido sem recalcular.
create table public.user_stats (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade unique,
  total_workouts  int  default 0,
  current_streak  int  default 0,
  longest_streak  int  default 0,
  last_workout_date date,
  updated_at      timestamptz default now()
);

-- RLS ligado nas estatísticas.
alter table public.user_stats enable row level security;

-- Políticas das estatísticas (depois endurecidas na migração de segurança: só o gatilho escreve).
create policy "Users see own stats"
  on public.user_stats for select using (auth.uid() = user_id);
create policy "Users upsert own stats"
  on public.user_stats for insert with check (auth.uid() = user_id);
create policy "Users update own stats"
  on public.user_stats for update using (auth.uid() = user_id);

-- ─── FUNCTION: update stats after completion ──────────────────────────────────
-- Função `refresh_user_stats(p_user_id)`: recalcula as estatísticas de uma pessoa. `security definer` = roda com os poderes do dono da função (necessário para o gatilho escrever na tabela).
create or replace function public.refresh_user_stats(p_user_id uuid)
returns void language plpgsql security definer as $$
declare
  v_total int;
  v_streak int := 0;
  v_longest int := 0;
  v_current int := 0;
  v_last date;
  v_prev date;
  v_row record;
begin
  -- 1. Conta os treinos e acha a data do último.
  select count(*), max(completed_date)
  into v_total, v_last
  from public.workout_completions
  where user_id = p_user_id;

  -- Calculate streak
  -- 2. Calcula a sequência atual: percorre as conclusões da mais recente para a mais antiga; a sequência só existe se o último treino foi hoje ou ontem, e continua enquanto o intervalo entre treinos for de até 2 dias.
  v_prev := null;
  for v_row in
    select completed_date
    from public.workout_completions
    where user_id = p_user_id
    order by completed_date desc
  loop
    if v_prev is null then
      if v_row.completed_date >= current_date - 1 then
        v_current := 1;
      end if;
      v_prev := v_row.completed_date;
    elsif v_prev - v_row.completed_date <= 2 then
      if v_current > 0 then v_current := v_current + 1; end if;
      v_prev := v_row.completed_date;
    else
      exit;
    end if;
  end loop;

  -- Longest streak
  -- 3. Calcula a maior sequência histórica agrupando datas consecutivas (técnica: data menos número da linha forma o mesmo "grupo" para dias seguidos).
  select coalesce(max(streak_len), 0) into v_longest from (
    select count(*) as streak_len
    from (
      select completed_date,
             completed_date - (row_number() over (order by completed_date))::int as grp
      from public.workout_completions
      where user_id = p_user_id
    ) t group by grp
  ) s;

  -- 4. Grava (ou atualiza, via `on conflict`) a linha de estatísticas.
  insert into public.user_stats(user_id, total_workouts, current_streak, longest_streak, last_workout_date, updated_at)
  values (p_user_id, v_total, v_current, v_longest, v_last, now())
  on conflict(user_id) do update set
    total_workouts    = excluded.total_workouts,
    current_streak    = excluded.current_streak,
    longest_streak    = excluded.longest_streak,
    last_workout_date = excluded.last_workout_date,
    updated_at        = excluded.updated_at;
end;
$$;

-- ─── TRIGGER: refresh stats on completion change ──────────────────────────────
-- Função do gatilho: chama o recálculo para a pessoa afetada pela mudança.
create or replace function public.trigger_refresh_stats()
returns trigger language plpgsql security definer as $$
begin
  perform public.refresh_user_stats(coalesce(new.user_id, old.user_id));
  return coalesce(new, old);
end;
$$;

-- Gatilho (trigger): a cada inserção, atualização ou exclusão de conclusão, recalcula as estatísticas automaticamente. Por isso o app nunca escreve em `user_stats`.
create trigger on_completion_change
  after insert or update or delete on public.workout_completions
  for each row execute function public.trigger_refresh_stats();

-- ─── TRIGGER: auto-create profile on signup ───────────────────────────────────
-- Função do cadastro: quando alguém cria conta, gera o perfil (copiando nome e foto do Google) e a linha de estatísticas.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles(id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into public.user_stats(user_id) values (new.id);
  return new;
end;
$$;

-- Gatilho que dispara a função acima a cada novo usuário em `auth.users`.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── SEED: workout days ───────────────────────────────────────────────────────
-- Dados iniciais: os 7 dias da primeira rotina (PUSH/PULL/LEGS A e B + descanso), com cor e músculos.
insert into public.workout_days(slug, label, weekday, weekday_index, color, muscles, is_rest) values
  ('push-a', 'PUSH A',    'Segunda', 0, '#E8572A', 'Peito · Ombro · Tríceps',          false),
  ('pull-a', 'PULL A',    'Terça',   1, '#2A7BE8', 'Costas · Bíceps',                  false),
  ('legs-a', 'LEGS A',    'Quarta',  2, '#27AE60', 'Quadríceps · Posteriores · Panturrilha', false),
  ('push-b', 'PUSH B',    'Quinta',  3, '#E8572A', 'Peito · Ombro · Tríceps',          false),
  ('pull-b', 'PULL B',    'Sexta',   4, '#2A7BE8', 'Costas · Bíceps',                  false),
  ('legs-b', 'LEGS B',    'Sábado',  5, '#27AE60', 'Posteriores · Quadríceps · Panturrilha', false),
  ('rest',   'DESCANSO',  'Domingo', 6, '#8E8E93', 'Recuperação Ativa',                true);

-- ─── SEED: exercises ──────────────────────────────────────────────────────────
-- Dados iniciais dos exercícios. Cada bloco refere o dia pelo `id` (1 a 6). Colunas: dia, posição, nome, séries, repetições, descanso (s) e dica de execução.
-- PUSH A (id=1)
insert into public.exercises(workout_day_id, position, name, sets, reps, rest_seconds, tip) values
  (1,1,'Supino Inclinado com Halteres','4','8–10',90,'Maior ativação da porção clavicular. Controle a descida em 3s.'),
  (1,2,'Desenvolvimento com Halteres','3','10–12',75,'Cotovelos levemente à frente do tronco. Evita impingimento.'),
  (1,3,'Crucifixo na Polia (cabo cruzado)','3','12–15',60,'Tensão contínua no peitoral. Polia na altura do peito.'),
  (1,4,'Elevação Lateral com Halteres','3','15–20',60,'Cotovelo levemente dobrado. Suba até a altura do ombro.'),
  (1,5,'Tríceps Pulley (corda)','3','12–15',60,'Abra a corda na extensão total. Cotovelos fixos ao lado do corpo.');
-- PULL A (id=2)
insert into public.exercises(workout_day_id, position, name, sets, reps, rest_seconds, tip) values
  (2,1,'Puxada Frontal (pegada pronada)','4','8–10',90,'Puxe a barra até a altura do queixo. Retração escapular no topo.'),
  (2,2,'Remada Curvada com Barra','4','8–10',90,'Tronco a ~45°. Puxe em direção ao umbigo. Controle a descida.'),
  (2,3,'Remada Unilateral com Halter','3','10–12',75,'Apoie um joelho no banco. Eixo de rotação no cotovelo.'),
  (2,4,'Rosca Direta com Barra','3','10–12',75,'Sem balanço do tronco. Supinação completa no topo.'),
  (2,5,'Rosca Concentrada','3','12–15',60,'Cotovelo apoiado na coxa interna. Pico de contração no topo.');
-- LEGS A (id=3)
insert into public.exercises(workout_day_id, position, name, sets, reps, rest_seconds, tip) values
  (3,1,'Agachamento Livre','4','8–10',120,'Profundidade abaixo do paralelo. Joelhos na linha dos pés.'),
  (3,2,'Leg Press 45°','3','10–12',90,'Pés no meio da plataforma. Desça até 90° de joelho.'),
  (3,3,'Stiff com Halteres','3','10–12',90,'Quadril para trás, costas neutras. Sinta o alongamento dos posteriores.'),
  (3,4,'Cadeira Extensora','3','15–20',60,'Excelente isolamento de quadríceps. Pause 1s no topo.'),
  (3,5,'Panturrilha em Pé (Smith ou máquina)','4','15–20',60,'Amplitude total: calcanhar abaixo da plataforma.');
-- PUSH B (id=4)
insert into public.exercises(workout_day_id, position, name, sets, reps, rest_seconds, tip) values
  (4,1,'Supino Reto com Barra','4','6–8',90,'Variação de carga em relação ao Push A. Foco em força máxima.'),
  (4,2,'Press Arnold','3','10–12',75,'Rotação da mão durante o movimento. Ativa todos os feixes do deltóide.'),
  (4,3,'Peck Deck (voador)','3','12–15',60,'Ênfase na porção esternal. Cotovelo levemente dobrado.'),
  (4,4,'Elevação Frontal com Halter','3','12–15',60,'Alterna com elevação lateral do Push A.'),
  (4,5,'Tríceps Testa com Barra EZ','3','10–12',60,'Abaixa até a testa. Cotovelos apontados para o teto.');
-- PULL B (id=5)
insert into public.exercises(workout_day_id, position, name, sets, reps, rest_seconds, tip) values
  (5,1,'Barra Fixa (pegada supinada)','4','6–10',90,'Pegada supinada ativa mais bíceps. Use lastro se necessário.'),
  (5,2,'Remada Cavalinho (T-bar)','3','10–12',90,'Puxe até o peito. Variação ao Pull A para estímulo diferente.'),
  (5,3,'Puxada na Polia (pegada neutra)','3','12–15',75,'Pegada neutra favorece o grande dorsal.'),
  (5,4,'Rosca Martelo com Halteres','3','10–12',75,'Trabalha braquial e braquiorradial.'),
  (5,5,'Rosca 21 com Barra EZ','3','21',60,'7 reps na metade inferior, 7 superior, 7 completas.');
-- LEGS B (id=6)
insert into public.exercises(workout_day_id, position, name, sets, reps, rest_seconds, tip) values
  (6,1,'Levantamento Terra Romeno','4','8–10',120,'Ênfase nos posteriores. Barra perto do corpo. Quadril para trás.'),
  (6,2,'Avanço com Halteres (caminhando)','3','10–12/lado',90,'Joelho traseiro quase toca o chão. Tronco ereto.'),
  (6,3,'Cadeira Flexora','4','12–15',75,'Isola os posteriores. Aponte os dedos dos pés para baixo.'),
  (6,4,'Hack Squat ou Leg Press (pés altos)','3','12–15',90,'Pés altos desloca tensão para posteriores e glúteos.'),
  (6,5,'Panturrilha Sentado (máquina)','4','15–20',60,'Sóleo: responde melhor a repetições altas. Amplitude total.');
