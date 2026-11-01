-- Conferência da instalação (SÓ LEITURA: não muda nada).
-- Onde rodar: Supabase > SQL Editor > New query > cole tudo > Run.
-- Resultado esperado: as 9 tabelas com "rls_ligada = true" e os programas listados.

-- 1) Tabelas do app e se a proteção por usuário (RLS) está ligada
select c.relname as tabela, c.relrowsecurity as rls_ligada
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public'
   and c.relkind = 'r'
   and c.relname in ('profiles','workout_programs','workout_days','exercises',
                     'workout_completions','exercise_checks','exercise_notes',
                     'diet_plans','user_stats')
 order by 1;

-- 2) Programas de treino disponíveis e quantos dias/exercícios cada um tem
select p.slug, p.name,
       count(distinct d.id) filter (where not d.is_rest) as dias_de_treino,
       count(e.id) as exercicios
  from public.workout_programs p
  left join public.workout_days d on d.program_id = p.id
  left join public.exercises e on e.workout_day_id = d.id
 group by p.slug, p.name
 order by p.slug;

-- 3) Contas que já entraram no app e o que cada uma enxerga
select pr.email, wp.slug as programa, pr.diet_enabled as dieta_ligada,
       dp.slug as plano_de_dieta, pr.diet_fixed as dieta_fixa_do_codigo
  from public.profiles pr
  left join public.workout_programs wp on wp.id = pr.program_id
  left join public.diet_plans dp on dp.id = pr.diet_plan_id
 order by pr.email;
