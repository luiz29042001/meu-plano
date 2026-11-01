-- Migração de **dados**: troca a rotina do dono do app de PPL 6x para Superior/Inferior 4x. **Reaproveita as linhas existentes** (mesmos ids), então o histórico de treinos e as anotações de carga continuam valendo. Nada é apagado.
-- Luiz: de PPL 6x para Superior/Inferior 4x (rotina de estudos de IA).
-- Reaproveita as linhas existentes (ids), então histórico e anotações de carga continuam valendo.
-- Nenhum exercício é apagado; os que saem do plano ficam nos dias "arquivados" (Pull A / Pull B).
-- Abre uma transação: ou tudo é aplicado, ou nada (se algo falhar, o banco volta ao estado anterior).
begin;

-- Dias do programa do Luiz (guardados antes de renomear/arquivar). Tudo abaixo fica restrito a eles: a Usuária 2 não é tocada.
-- Guarda, numa tabela temporária, os ids dos dias do programa antigo. Todas as alterações abaixo ficam **restritas** a esses dias; a rotina da outra usuária não é tocada. A tabela some ao final (`on commit drop`).
create temp table _luiz_days on commit drop as
  select d.id from public.workout_days d join public.workout_programs p on p.id = d.program_id where p.slug = 'ppl-6x';

-- Renomeia o programa: `ppl-6x` → `ul-4x` ("Superior · Inferior", 4 treinos por semana).
-- 1) Programa
update public.workout_programs
   set slug = 'ul-4x', name = 'Superior · Inferior', description = '4 treinos por semana'
 where slug = 'ppl-6x';

-- Renomeia os dias reaproveitando as mesmas linhas: Push A → Superior A, Legs A → Inferior A, Push B → Superior B, Legs B → Inferior B; ajusta a ordem e o descanso.
-- 2) Dias (mesmas linhas): Push A -> Superior A, Legs A -> Inferior A, Push B -> Superior B, Legs B -> Inferior B
update public.workout_days set slug='upper-a', label='SUPERIOR A', weekday_index=0, muscles='Peito · Costas · Ombro · Braços' where slug='push-a';
update public.workout_days set slug='lower-a', label='INFERIOR A', weekday_index=1, muscles='Quadríceps · Posteriores · Panturrilha · Abdômen' where slug='legs-a';
update public.workout_days set slug='upper-b', label='SUPERIOR B', weekday_index=2, muscles='Peito · Costas · Ombro · Braços' where slug='push-b';
update public.workout_days set slug='lower-b', label='INFERIOR B', weekday_index=3, muscles='Posteriores · Glúteos · Quadríceps · Panturrilha' where slug='legs-b';
update public.workout_days set weekday_index=4 where slug='rest';

-- Os dias Pull saem do plano ativo: vão para um programa de **arquivo** (`ppl-6x-arquivo`). Somem do app, mas o histórico continua no banco.
-- Pull A / Pull B saem do plano ativo (programa de arquivo; some do app, histórico fica no banco)
-- Cria o programa de arquivo (se ainda não existir).
insert into public.workout_programs (slug, name, description)
values ('ppl-6x-arquivo', 'PPL 6x (arquivo)', 'Arquivado em 23/10/2026')
on conflict (slug) do nothing;
update public.workout_days
   set program_id = (select id from public.workout_programs where slug = 'ppl-6x-arquivo')
 where slug in ('pull-a','pull-b');

-- Reorganiza os exercícios: cada um é movido **pelo nome** para o novo dia e posição, mantendo seu id (e portanto as anotações).
-- 3) Exercícios: move por nome, mantendo o id (anotações preservadas)
-- Tabela temporária de "movimentação": nome do exercício → dia de destino → posição.
create temp table _mv (name text, day_slug text, pos int) on commit drop;
insert into _mv values
  -- Superior A
  ('Supino Inclinado com Halteres','upper-a',1), ('Puxada Frontal (pegada pronada)','upper-a',2),
  ('Desenvolvimento com Halteres','upper-a',3), ('Remada Curvada com Barra','upper-a',4),
  ('Crucifixo na Polia (cabo cruzado)','upper-a',5), ('Elevação Lateral com Halteres','upper-a',6),
  ('Tríceps Pulley (corda)','upper-a',7), ('Rosca Direta com Barra','upper-a',8),
  -- Superior B
  ('Supino Reto com Barra','upper-b',1), ('Barra Fixa (pegada supinada)','upper-b',2),
  ('Press Arnold','upper-b',3), ('Remada Cavalinho (T-bar)','upper-b',4),
  ('Peck Deck (voador)','upper-b',5), ('Face Pull','upper-b',6),
  ('Tríceps Testa com Barra EZ','upper-b',7), ('Rosca Martelo com Halteres','upper-b',8),
  -- Inferior A (+ abdômen)
  ('Agachamento Livre','lower-a',1), ('Leg Press 45°','lower-a',2), ('Stiff com Halteres','lower-a',3),
  ('Cadeira Extensora','lower-a',4), ('Abdução na Máquina','lower-a',5),
  ('Panturrilha em Pé (Smith ou máquina)','lower-a',6), ('Crunch na polia','lower-a',7),
  -- Inferior B (já está certo; só reposiciona)
  ('Levantamento Terra Romeno','lower-b',1), ('Avanço com Halteres (caminhando)','lower-b',2),
  ('Cadeira Flexora','lower-b',3), ('Hack Squat ou Leg Press (pés altos)','lower-b',4),
  ('Hip Thrust','lower-b',5), ('Panturrilha Sentado (máquina)','lower-b',6), ('Pallof Press','lower-b',7);

-- Soma 100 às posições para evitar choques de posição durante a reorganização.
-- posição provisória (só nos dias do Luiz)
update public.exercises set position = position + 100 where workout_day_id in (select id from _luiz_days);

-- Aplica a movimentação: cada exercício da lista vai para o dia e a posição novos.
update public.exercises e
   set workout_day_id = d.id, position = m.pos
  from _mv m
  join public.workout_days d on d.slug = m.day_slug
 where e.name = m.name and e.workout_day_id in (select id from _luiz_days);

-- Os exercícios que ficaram de fora do novo plano (ainda com posição > 100) vão para o dia arquivado Pull A, com a posição original restaurada. Nada é apagado.
-- Exercícios que saíram do plano: vão para o dia arquivado Pull A (nada é apagado)
update public.exercises
   set workout_day_id = (select id from public.workout_days where slug = 'pull-a'), position = position - 100
 where position > 100 and workout_day_id in (select id from _luiz_days);

-- Confirma a transação: todas as mudanças passam a valer de uma vez.
commit;
