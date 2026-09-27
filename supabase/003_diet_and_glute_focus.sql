-- ============================================================================
-- 003 — Dieta por usuário (banco) + rotina com foco em glúteos e posteriores
-- ============================================================================

-- 1. Planos alimentares guardados no banco (protegidos por conta)
create table if not exists public.diet_plans (
  id         serial primary key,
  slug       text not null unique,
  name       text not null,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.diet_plans enable row level security;
alter table public.profiles add column if not exists diet_plan_id int references public.diet_plans(id);

drop policy if exists read_own_diet_plan on public.diet_plans;
create policy read_own_diet_plan on public.diet_plans
  for select to authenticated
  using (id = (select p.diet_plan_id from public.profiles p where p.id = (select auth.uid())));

insert into public.diet_plans (slug, name, data)
values ('ciclo-carbo-exemplo', 'Ciclo de carboidratos', $plan${"name": "Plano de exemplo", "subtitle": "Dados fictícios", "note": "Plano de exemplo. A dieta real de cada pessoa é prescrita por nutricionista e fica fora do repositório público.", "variants": [{"key": "A", "label": "Dia de treino", "banner": "Exemplo", "meals": [{"id": "cafe", "time": "08:00", "label": "Café da manhã", "icon": "🍳", "color": "#E0A85A", "kcal": 400, "macros": {"p": 25, "c": 40, "g": 15}, "items": [{"name": "Ovos mexidos", "detail": "3 unidades", "kcal": 240, "tip": "Exemplo.", "subs": []}]}]}, {"key": "B", "label": "Dia de descanso", "banner": "Exemplo", "meals": []}]}$plan$::jsonb)
on conflict (slug) do update set name = excluded.name, data = excluded.data, updated_at = now();

-- 2. Conta(s) do programa 5x recebem a dieta e a aba é liberada
update public.profiles
   set diet_plan_id = (select id from public.diet_plans where slug = 'ciclo-carbo-exemplo'),
       diet_enabled = true
 where program_id = (select id from public.workout_programs where slug = 'fem-5x');

-- 3. Novas contas já nascem com a rotina 5x e esta dieta
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, program_id, diet_enabled, diet_plan_id)
  values (
    new.id, new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    (select id from public.workout_programs where slug = 'fem-5x'),
    true,
    (select id from public.diet_plans where slug = 'ciclo-carbo-exemplo')
  );
  insert into public.user_stats (user_id) values (new.id);
  return new;
end;
$$;

-- 4. Inferior A: 1 série sai da extensora e vai para o Búlgaro (mais glúteo)
update public.exercises e set sets = '4'
  from public.workout_days d
 where e.workout_day_id = d.id and d.slug = 'f-inf-a' and e.position = 3;
update public.exercises e set sets = '2'
  from public.workout_days d
 where e.workout_day_id = d.id and d.slug = 'f-inf-a' and e.position = 4;

-- 5. Dia C passa a ser só glúteos e posteriores (atualiza no lugar, preservando histórico)
update public.workout_days
   set label = 'GLÚTEOS C', muscles = 'Glúteos · Posteriores'
 where slug = 'f-glu-c';

update public.exercises e
   set name = v.name, sets = v.sets, reps = v.reps, rest_seconds = v.rest, tip = v.tip
  from public.workout_days d,
  (values
    (1, 'Stiff com Halteres', '3', '10–12', 120, 'Quadril vai para trás com a coluna neutra e os halteres rentes às pernas. Desça até sentir o alongamento dos posteriores. Faça 1–2 séries leves de aquecimento antes.'),
    (2, 'Elevação Pélvica (Hip Thrust)', '3', '10–12', 120, 'Costelas fechadas e queixo levemente para baixo: suba estendendo o quadril sem arquear a lombar e segure 1s no topo.'),
    (3, 'Cadeira Flexora (sentada)', '3', '10–15', 75, 'A versão sentada trabalha os posteriores mais alongados e gera mais hipertrofia que a mesa flexora. Descida lenta em 3s.'),
    (4, 'Extensão 45° com Foco em Glúteo', '3', '12–15', 75, 'Pés levemente abertos, costas arredondadas de leve e movimento puxado pelo quadril, contraindo o glúteo no topo sem hiperestender a lombar.'),
    (5, 'Cadeira Abdutora (tronco inclinado)', '3', '15–20', 60, 'Inclinar o tronco à frente aumenta o trabalho do glúteo médio e superior. Pausa de 1s com as pernas abertas.'),
    (6, 'Glúteo na Polia (Kickback)', '2', '12–15/perna', 60, 'Movimento curto e controlado, estendendo o quadril sem arquear a lombar. Termine perto da falha.')
  ) as v(pos, name, sets, reps, rest, tip)
 where e.workout_day_id = d.id and d.slug = 'f-glu-c' and e.position = v.pos;
