-- ============================================================================
-- 002 — Multi-programa: cada usuário acessa apenas a sua rotina de treino
-- ============================================================================

-- O que esta migração faz (resumo): troca o modelo de "uma rotina para todos" por **programas de treino**. Cada pessoa passa a ter o seu e só enxerga os dias e exercícios dele.
-- 1. Catálogo de programas
-- Tabela `workout_programs`: o catálogo de programas (ex.: PPL 6x, Inferiores/Superiores 5x). `if not exists` torna a migração segura para rodar mais de uma vez.
create table if not exists public.workout_programs (
  id          serial primary key,
  slug        text not null unique,
  name        text not null,
  description text
);
-- RLS ligado. A política abaixo deixa qualquer pessoa logada **ler** o catálogo (é só uma lista de nomes), mas ninguém altera.
alter table public.workout_programs enable row level security;
drop policy if exists read_programs on public.workout_programs;
create policy read_programs on public.workout_programs
  for select to authenticated using (true);

-- Cadastra os dois programas iniciais. `on conflict do nothing` ignora se já existirem.
insert into public.workout_programs (slug, name, description) values
  ('ppl-6x', 'Push · Pull · Legs', '6 treinos por semana'),
  ('fem-5x', 'Inferiores · Superiores', '5 treinos por semana · até 1h')
on conflict (slug) do nothing;

-- Cada dia de treino passa a pertencer a um programa.
-- 2. Dias de treino passam a pertencer a um programa
-- 1. Cria a coluna `program_id` (ainda opcional, para não quebrar as linhas existentes).
alter table public.workout_days add column if not exists program_id int references public.workout_programs(id);
-- 2. Os dias já existentes (rotina PPL) são ligados ao programa `ppl-6x`.
update public.workout_days
   set program_id = (select id from public.workout_programs where slug = 'ppl-6x')
 where program_id is null;
-- 3. Agora que todas as linhas têm programa, a coluna passa a ser obrigatória (`not null`).
alter table public.workout_days alter column program_id set not null;
-- Índice para filtrar dias por programa rapidamente.
create index if not exists idx_workout_days_program on public.workout_days(program_id);

-- O perfil guarda o programa escolhido e se a aba de dieta está liberada.
-- 3. Perfil guarda o programa e se a dieta está liberada
alter table public.profiles add column if not exists program_id int references public.workout_programs(id);
alter table public.profiles add column if not exists diet_enabled boolean not null default false;

-- Quem já existia (a conta do dono do app) ganha o programa PPL e a dieta liberada.
-- Perfis já existentes (conta do Luiz) ficam no PPL com dieta ativa
update public.profiles
   set program_id   = (select id from public.workout_programs where slug = 'ppl-6x'),
       diet_enabled = true
 where program_id is null;

-- Atualiza o gatilho de cadastro: toda conta nova recebe o programa 5x e a dieta ainda pendente. `set search_path = public` evita que um objeto de mesmo nome em outro esquema seja executado por engano (boa prática de segurança em funções `security definer`).
-- 4. Novas contas recebem o programa 5x e dieta pendente
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, program_id, diet_enabled)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    (select id from public.workout_programs where slug = 'fem-5x'),
    false
  );
  insert into public.user_stats (user_id) values (new.id);
  return new;
end;
$$;

-- Insere os 6 dias do programa 5x (inferior/superior com foco em glúteos). O `select ... from (values ...)` monta as linhas e liga cada uma ao programa `fem-5x`.
-- 5. Rotina 5x/semana (hipertrofia, ≤ 60 min, sem bi-set)
insert into public.workout_days (slug, label, weekday, weekday_index, color, muscles, is_rest, program_id)
select v.slug, v.label, v.weekday, v.weekday_index, v.color, v.muscles, v.is_rest, p.id
from public.workout_programs p,
(values
  ('f-inf-a', 'INFERIOR A', 'Segunda', 0, '#E07A9A', 'Quadríceps · Glúteos · Panturrilha', false),
  ('f-sup-a', 'SUPERIOR A', 'Terça',   1, '#5A93D4', 'Peito · Ombros · Tríceps · Costas',  false),
  ('f-inf-b', 'INFERIOR B', 'Quinta',  2, '#42B968', 'Posteriores · Glúteos · Panturrilha', false),
  ('f-sup-b', 'SUPERIOR B', 'Sexta',   3, '#A878D4', 'Costas · Ombros · Bíceps',          false),
  ('f-glu-c', 'GLÚTEOS C',  'Sábado',  4, '#E0A85A', 'Glúteos · Posteriores · Braços',    false),
  ('f-rest',  'DESCANSO',   'Qua/Dom', 5, '#8E8E96', 'Recuperação Ativa',                 true)
) as v(slug, label, weekday, weekday_index, color, muscles, is_rest)
where p.slug = 'fem-5x'
on conflict (slug) do nothing;

-- Insere os exercícios de cada dia, ligando pelo `slug` do dia. O `where not exists` evita duplicar se a migração rodar de novo.
insert into public.exercises (workout_day_id, position, name, sets, reps, rest_seconds, tip)
select d.id, v.pos, v.name, v.sets, v.reps, v.rest, v.tip
from (values
  -- INFERIOR A — Quadríceps & Glúteos (19 séries)
  ('f-inf-a',1,'Agachamento Livre (ou no Smith)','4','6–10',150,'Principal exercício do dia. Desça pelo menos até o paralelo com o tronco firme. Termine cada série com 1–2 repetições em reserva.'),
  ('f-inf-a',2,'Leg Press 45° (pés no meio)','3','10–12',120,'Desça até o joelho formar cerca de 90°, sem tirar o quadril do banco.'),
  ('f-inf-a',3,'Afundo Búlgaro com Halteres','3','8–12/perna',90,'Incline levemente o tronco à frente para recrutar mais glúteo. Comece pela perna mais fraca.'),
  ('f-inf-a',4,'Cadeira Extensora','3','12–15',60,'Pausa de 1s no topo e descida controlada em 2–3s.'),
  ('f-inf-a',5,'Elevação Pélvica (Hip Thrust)','3','8–12',120,'Queixo levemente para baixo e costelas fechadas. Contraia forte o glúteo por 1s no topo.'),
  ('f-inf-a',6,'Panturrilha em Pé','3','12–15',60,'Amplitude total: alongue embaixo e pause 1s no ponto mais alto.'),
  -- SUPERIOR A — Peito, Ombros & Tríceps (18 séries)
  ('f-sup-a',1,'Supino Inclinado com Halteres','3','8–12',120,'Banco a 30°. Escápulas retraídas e descida controlada até a linha do peito.'),
  ('f-sup-a',2,'Desenvolvimento com Halteres (sentada)','3','8–12',90,'Cotovelos levemente à frente do tronco para proteger o ombro.'),
  ('f-sup-a',3,'Puxada Frontal (pegada aberta)','3','10–12',90,'Puxe a barra até o alto do peito, levando os cotovelos para baixo e para trás.'),
  ('f-sup-a',4,'Elevação Lateral com Halteres','4','12–20',60,'Suba até a linha do ombro com os cotovelos levemente flexionados. Carga moderada, sem balanço.'),
  ('f-sup-a',5,'Crucifixo na Máquina (Peck Deck)','2','12–15',60,'Foque em aproximar os cotovelos, não as mãos. Pausa curta com o peito contraído.'),
  ('f-sup-a',6,'Tríceps na Polia (corda)','3','10–15',60,'Cotovelos fixos ao lado do corpo. Abra a corda no final do movimento.'),
  -- INFERIOR B — Posteriores & Glúteos (20 séries)
  ('f-inf-b',1,'Stiff com Barra (Terra Romeno)','4','8–10',150,'Quadril vai para trás com a coluna neutra. Desça até sentir o alongamento dos posteriores.'),
  ('f-inf-b',2,'Elevação Pélvica com Barra (Hip Thrust)','4','8–12',120,'Exercício com maior ativação de glúteo máximo. Use almofada na barra e suba até o quadril estender totalmente.'),
  ('f-inf-b',3,'Cadeira Flexora','3','10–15',75,'Evite levantar o quadril do banco. Descida lenta em 3s.'),
  ('f-inf-b',4,'Leg Press 45° (pés altos e afastados)','3','10–12',90,'Pés no alto da plataforma deslocam o estímulo para glúteos e posteriores.'),
  ('f-inf-b',5,'Cadeira Abdutora','3','15–20',60,'Tronco inclinado à frente aumenta o trabalho do glúteo médio e superior.'),
  ('f-inf-b',6,'Panturrilha Sentada','3','15–20',60,'Trabalha o sóleo, que responde melhor a repetições mais altas.'),
  -- SUPERIOR B — Costas, Ombros & Bíceps (18 séries)
  ('f-sup-b',1,'Remada Baixa na Polia (triângulo)','3','8–12',120,'Peito aberto e tronco estável. Puxe o triângulo em direção ao umbigo.'),
  ('f-sup-b',2,'Puxada Neutra na Polia','3','10–12',90,'Pegada neutra favorece a amplitude do dorsal. Controle a subida.'),
  ('f-sup-b',3,'Remada Unilateral com Halter','3','10–12/lado',75,'Apoie joelho e mão no banco. Leve o cotovelo em direção ao quadril.'),
  ('f-sup-b',4,'Crucifixo Inverso (máquina ou halteres)','3','12–20',60,'Trabalha o deltoide posterior, essencial para postura e ombros equilibrados.'),
  ('f-sup-b',5,'Elevação Lateral na Polia','3','12–15',60,'A polia mantém tensão constante durante todo o movimento.'),
  ('f-sup-b',6,'Rosca Direta com Halteres','3','10–12',60,'Supine o punho durante a subida. Sem balançar o tronco.'),
  -- GLÚTEOS C — Glúteos, Posteriores & Braços (18 séries)
  ('f-glu-c',1,'Elevação Pélvica (Hip Thrust)','3','10–12',120,'Terceiro estímulo semanal de glúteo. Use carga um pouco menor que no Inferior B e foque na contração.'),
  ('f-glu-c',2,'Passada Reversa com Halteres','3','10–12/perna',90,'Passo para trás e tronco levemente inclinado. Empurre o chão com o calcanhar da perna da frente.'),
  ('f-glu-c',3,'Mesa Flexora','3','10–15',75,'Completa o volume semanal de posteriores. Descida controlada.'),
  ('f-glu-c',4,'Glúteo na Polia (Kickback)','3','12–15/perna',60,'Movimento curto e controlado, estendendo o quadril sem arquear a lombar.'),
  ('f-glu-c',5,'Rosca Martelo com Halteres','3','10–12',60,'Trabalha braquial e antebraço, dando volume ao braço.'),
  ('f-glu-c',6,'Tríceps Francês na Polia (corda)','3','10–12',60,'Braços acima da cabeça alongam a cabeça longa do tríceps, a maior porção do músculo.')
) as v(slug, pos, name, sets, reps, rest, tip)
join public.workout_days d on d.slug = v.slug
where not exists (select 1 from public.exercises e where e.workout_day_id = d.id and e.position = v.pos);

-- **Isolamento (a parte de segurança):** apaga as políticas antigas de leitura (que liberavam tudo) e cria duas novas: a pessoa só vê os dias do **seu** programa e só os exercícios desses dias. O `(select auth.uid())` entre parênteses permite ao banco calcular o usuário uma só vez por consulta (mais rápido).
-- 6. Isolamento: cada usuário só enxerga os dias e exercícios do seu programa
drop policy if exists read_workout_days on public.workout_days;
drop policy if exists read_exercises on public.exercises;
drop policy if exists read_own_program_days on public.workout_days;
drop policy if exists read_own_program_exercises on public.exercises;

create policy read_own_program_days on public.workout_days
  for select to authenticated
  using (program_id = (select p.program_id from public.profiles p where p.id = (select auth.uid())));

create policy read_own_program_exercises on public.exercises
  for select to authenticated
  using (workout_day_id in (
    select d.id from public.workout_days d
    where d.program_id = (select p.program_id from public.profiles p where p.id = (select auth.uid()))
  ));
