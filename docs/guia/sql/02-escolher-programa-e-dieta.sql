-- Define o programa de treino (e, se quiser, a dieta) de UMA conta.
-- Onde rodar: Supabase > SQL Editor. Este arquivo ALTERA dados.
--
-- Por que pelo SQL Editor? Por segurança, o próprio app não deixa ninguém
-- trocar o próprio programa ou dieta (trigger protect_profile_access_columns).
-- O SQL Editor roda como administrador do banco, então pode.
--
-- Antes: a pessoa precisa ter entrado no app UMA vez com o Google
-- (é isso que cria o perfil). Confira com o arquivo 01-conferir-instalacao.sql.
--
-- Como usar: troque o e-mail e o slug abaixo e rode UM bloco por vez.

-- ── A) Programa de treino ────────────────────────────────────────────────────
-- Slugs que vêm prontos: 'ul-4x' (Superior/Inferior 4x) e 'fem-5x'
-- (Inferior/Superior + Glúteos, 5x). Conta nova já começa com 'fem-5x'.
update public.profiles
   set program_id = (select id from public.workout_programs where slug = 'ul-4x'),
       updated_at = now()
 where email = 'seu-email@gmail.com';

-- ── B) Dieta (opcional) ──────────────────────────────────────────────────────
-- IMPORTANTE (Lei 8.234/91): a dieta deve vir de um(a) nutricionista.
-- Nunca peça a uma IA para criar a dieta; peça só para TRANSCREVER a
-- prescrição no formato do app (ver docs/guia/trabalhando-com-ia.md).
--
-- B0) Só para conhecer a tela: o banco já traz um plano FICTÍCIO,
--     'ciclo-carbo-exemplo'. Pule o B1 e use esse slug no B2.
--
-- B1) Cadastrar o plano (o formato de "data" está em src/types/index.ts,
--     tipo DietPlanData; exemplo real na migração 20260927210000).
-- insert into public.diet_plans (slug, name, data)
-- values ('minha-dieta-2026-11', 'Minha dieta', '{ ...json do plano... }'::jsonb);
--
-- B2) Ligar o plano na conta:
-- update public.profiles
--    set diet_plan_id = (select id from public.diet_plans where slug = 'minha-dieta-2026-11'),
--        diet_enabled = true,
--        updated_at   = now()
--  where email = 'seu-email@gmail.com';
--
-- Sem dieta: deixe como está; a aba Dieta mostra "Dieta em criação".
-- "diet_fixed" = true mostra a dieta escrita no código (src/services/dietData.ts),
-- que aqui é um exemplo fictício. Prefira o plano no banco (B1/B2).
