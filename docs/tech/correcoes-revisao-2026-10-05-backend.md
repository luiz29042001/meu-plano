# Correções da revisão de 05/10/2026: camada de dados (backend)

Plano de origem: `docs/review/revisao-geral-2026-10-05.md` (aprovado pelo Luiz).
Dúvidas e decisões: `docs/tech/correcoes-revisao-2026-10-05-duvidas.md`.

**Nada foi aplicado no banco.** Os arquivos estão prontos; quem aplica é a sessão principal, depois do OK do Luiz.

---

## Resumo para o Luiz (português simples)

1. **Organizei os arquivos do banco** no formato da ferramenta oficial do Supabase (pasta `supabase/migrations/`). Não muda nada no app nem no banco.
2. **Criei uma correção de segurança** (ainda não aplicada) que:
   - impede que alguém, pelo próprio app, troque o próprio programa ou a própria dieta para ler os de outra pessoa;
   - garante que contas novas **não** recebam mais a dieta da Usuária 2;
   - deixa por escrito que as proteções de acesso estão ligadas em todas as tabelas;
   - deixa só o banco calcular o total de treinos (ninguém consegue "forjar" o número).
3. **Corrigi o comportamento do app** (parte invisível, sem mexer no visual):
   - a tela de treino não recarrega mais inteira quando a Usuária 2 volta para o app (não perde mais a anotação que estava digitando);
   - se o perfil falhar ao carregar, o app **não mostra mais a dieta do Luiz** para a Usuária 2: vai mostrar erro com "Tentar de novo" (assim que o ui-builder ajustar as telas);
   - mensagens de erro do login agora em português;
   - a tela inicial vai poder se atualizar sozinha depois de concluir o treino.

**Ordem obrigatória:** aplicar a migração **antes** de publicar a nova versão web / gerar o novo APK. Se o app novo for publicado antes, a dieta do Luiz aparece como "Dieta em criação" até a migração ser aplicada (nenhum dado se perde, só a exibição).

---

## Tarefa 1: migrações convertidas para `supabase/migrations/`

Arquivos **movidos** com `git mv` (sem duplicar; conteúdo idêntico, byte a byte):

| Antes | Agora | Versão |
|---|---|---|
| `supabase/schema.sql` | `supabase/migrations/20260717000000_schema_base.sql` | 20260717000000 |
| `supabase/002_multi_program.sql` | `supabase/migrations/20260927200000_multi_program.sql` | 20260927200000 |
| `supabase/003_diet_and_glute_focus.sql` | `supabase/migrations/20260927210000_diet_and_glute_focus.sql` | 20260927210000 |
| `supabase/004_exercise_notes.sql` | `supabase/migrations/20260929120000_exercise_notes.sql` | 20260929120000 |

Os prefixos seguem a data do commit de cada arquivo, mantendo a ordem. O `README.md` foi ajustado (apontava para `supabase/schema.sql`).

### Importante antes do primeiro `supabase db push`

Essas 4 já estão aplicadas em produção (pelo SQL Editor), mas o banco **não sabe disso** (não existe registro na tabela de histórico do CLI). Se rodar `db push` direto, o CLI tentaria reexecutá-las: a base (`schema.sql`) falharia logo no `create table public.profiles` e, pior, os `insert` de seed poderiam duplicar linhas se algo passasse. Por isso, **na primeira vez**:

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase migration repair --status applied 20260717000000 20260927200000 20260927210000 20260929120000
supabase migration list          # conferir: as 4 aparecem como aplicadas (Local e Remote)
supabase db push --dry-run       # deve listar SÓ 20261005120000_seguranca_perfil_rls.sql
supabase db push                 # só depois do OK do Luiz
```

`migration repair` só grava o registro "já aplicada"; não executa SQL das migrações nem altera dados.

Observação: o estado real do banco tem coisas feitas pelo painel que não estão nos arquivos antigos (ex.: RLS ligada em `workout_days`/`exercises`). A nova migração registra isso no repositório. Recriar o banco do zero a partir da pasta agora resulta num banco com RLS ligada.

---

## Tarefa 2: nova migração `20261005120000_seguranca_perfil_rls.sql` (NÃO aplicada)

Arquivo: `supabase/migrations/20261005120000_seguranca_perfil_rls.sql`. Idempotente (pode rodar duas vezes), roda numa transação: ou aplica tudo, ou nada.

### O que muda, item por item

| # | O que faz | Em português simples | Item da revisão |
|---|---|---|---|
| 1 | `enable row level security` em todas as 9 tabelas | Confirma, por escrito, que as "travas de acesso" estão ligadas em todas as tabelas. Em produção já estavam; não muda nada para ninguém. | I3 |
| 2 | Nova coluna `profiles.diet_fixed` (padrão `false`) e marca `true` em quem tem programa `ppl-6x` + dieta ativa + sem plano no banco | O app passa a saber **explicitamente** quem usa a dieta fixa (a do Luiz). Antes ele deduzia "se não tem plano, é a do Luiz", e uma falha de rede fazia a Usuária 2 ver a dieta do Luiz. | I6 |
| 3a | Usuário só pode alterar `full_name`, `diet_variant` e `updated_at` do próprio perfil; não pode criar nem apagar perfil | Ninguém consegue, pelo app ou pela API, trocar o próprio programa/dieta para ler os de outra pessoa. A troca de Dieta A/B continua funcionando (é o único campo que o app grava, conferido em `src/services/profile.ts`). | I2 |
| 3b | Trigger `protect_profile_access_columns` | Segunda trava: mesmo que alguém reabra a permissão no painel por engano, o banco recusa mudança em `program_id`, `diet_plan_id`, `diet_enabled`, `diet_fixed` vinda do app. O SQL Editor, migrações e futuras Edge Functions continuam podendo mudar. | I2 |
| 4 | Nova versão de `handle_new_user` | Conta nova recebe o treino `fem-5x` (conteúdo genérico, sem dado pessoal), **sem dieta** (`diet_enabled = false`, `diet_plan_id = null`). Ela vê "Dieta em criação". | I1 |
| 5 | `refresh_user_stats` sem acesso pelo app; `search_path` fixo; remove políticas de INSERT/UPDATE em `user_stats` | Só o banco calcula o total de treinos. O cálculo automático ao concluir um treino continua igual. | S1, S2 |

### Por que essa escolha no `handle_new_user` (item 4)

- Opção A, `program_id = null` (o que o Roadmap 1 quer): o app hoje não tem tela de "sem programa"/onboarding. Até o ui-builder tratar o estado `empty`, a conta nova veria carregamento infinito, e a conta de teste do QA não conseguiria testar o treino.
- **Opção B, escolhida:** mantém o treino `fem-5x` e tira a dieta. O que é dado de saúde de terceiro (a prescrição da nutricionista para a Usuária 2) deixa de vazar; o programa de treino é um modelo genérico, sem dado pessoal de ninguém. O app continua funcionando igual para contas novas.
- No Roadmap item 1 troca-se para `program_id = null` + onboarding.

### Impacto nos dados existentes

- **Conclusões, checks e anotações: nenhum impacto.** A migração não toca `workout_completions`, `exercise_checks`, `exercise_notes`.
- `user_stats`: valores intactos; só deixa de aceitar gravação vinda do app (o app nunca gravava).
- `profiles`: ganha a coluna `diet_fixed`. **Uma única linha** deve virar `true`: a do Luiz. Nenhuma outra coluna de nenhum perfil é alterada.
- Contas **já existentes** continuam como estão. Se a conta de teste do QA já foi criada, ela **continua** com a dieta da Usuária 2: a migração não a corrige, porque o banco não tem como distinguir a conta de teste da Usuária 2 sem usar o e-mail. Ver "Conferências" abaixo.
- App antigo (APK atual do Luiz, web atual) com o banco novo: continua funcionando. Ele só grava `diet_variant`, que segue permitido.

### Conferências antes de aplicar (só leitura, SQL Editor)

```sql
-- Quem vai receber diet_fixed = true (esperado: só o Luiz)
select p.id, p.email, w.slug as programa, p.diet_enabled, p.diet_plan_id
  from public.profiles p left join public.workout_programs w on w.id = p.program_id
 where p.diet_enabled = true and p.diet_plan_id is null;

-- Quem tem o plano da Usuária 2 (esperado: só a Usuária 2; se aparecer a conta de teste, ver abaixo)
select p.id, p.email from public.profiles p
  join public.diet_plans d on d.id = p.diet_plan_id
 where d.slug = 'ciclo-carbo-exemplo';
```

Se a conta de teste aparecer na segunda consulta, a sessão principal pode, **com OK do Luiz**, rodar:
`update public.profiles set diet_plan_id = null, diet_enabled = false where email = '<e-mail da conta de teste>';`

No fim do arquivo da migração há 3 consultas de conferência para rodar **depois** de aplicar.

### Também no painel (não é migração)

Authentication > Providers: conferir que **Email** está desligado (ou "Allow new users to sign up" desativado). Revisão I1.

### Como reverter (se algo der errado)

Rodar no SQL Editor (com OK do Luiz). Não apaga dado de ninguém:

```sql
begin;
drop trigger if exists protect_profile_access_columns on public.profiles;
drop function if exists public.protect_profile_access_columns();
grant insert, update, delete on public.profiles to anon, authenticated;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
grant execute on function public.refresh_user_stats(uuid) to anon, authenticated;
create policy "Users upsert own stats" on public.user_stats for insert with check (auth.uid() = user_id);
create policy "Users update own stats" on public.user_stats for update using (auth.uid() = user_id);
commit;
```

- `handle_new_user`: **não recomendo** voltar (voltaria a entregar a dieta da Usuária 2). Se for preciso, reexecutar o bloco 3 da migração `20260927210000`.
- Coluna `diet_fixed`: só apagar (`alter table public.profiles drop column diet_fixed;`) depois de voltar o app para a versão anterior; o app novo depende dela para mostrar a dieta do Luiz.
- RLS ligada: não há motivo para desligar.
- Depois de reverter manualmente, rodar `supabase migration repair --status reverted 20261005120000`.

---

## Tarefa 3: hooks, serviços e contextos

| Item | O que mudou | Arquivo |
|---|---|---|
| I4 | Hooks dependem de `userId` (string), não do objeto `user`. `setSession` só troca o objeto quando token/usuário mudam. Em `SIGNED_IN` (que a web emite ao voltar à aba) o perfil só é recarregado se ainda não estiver carregado. Nada de Supabase dentro do `onAuthStateChange` (armadilha 1 mantida, `setTimeout`). Recarga nunca volta para o spinner de tela cheia. | `src/contexts/AuthContext.tsx`, `src/hooks/useWorkout.ts`, `src/hooks/useCalendar.ts` |
| I5 | `useWorkout({ refreshOnFocus: true })` recarrega em silêncio ao voltar o foco. | `src/hooks/useWorkout.ts` |
| I6 | `AuthContext` expõe `profileStatus`, `profileError`, `dietMode`. Regra única em `resolveDietMode`: dieta fixa **só** com perfil carregado e `diet_fixed = true`; perfil com erro → `'error'`. Removido o fallback por regex em `fetchProfile`. Novo hook `useDiet` (busca do plano, erro, "Tentar de novo", troca de variante com `try/catch`, S6). | `src/contexts/AuthContext.tsx`, `src/utils/dietAccess.ts`, `src/hooks/useDiet.ts`, `src/services/profile.ts` |
| I7 | `useWorkout` e `useCalendar` expõem `status`, `error` (pt-BR) e `retry`. `useCalendar` agora tem `catch`. Conta sem programa → `status: 'empty'` (sem consultar). | hooks |
| I3 (defesa) | `fetchWorkoutDays(programId)` filtra por programa além da RLS. | `src/services/workout.ts` |
| I8 | Login devolve `{ code, message }` com mensagem em pt-BR; comparar por `code`. Corrigido também: o SDK do Google v13 devolve `{ type: 'cancelled' }` ao cancelar (antes virava o erro "No ID token returned from Google"). Web também mapeada. | `src/services/auth.ts`, `src/services/auth.web.ts`, `src/services/authErrors.ts` |
| S4 | `withTimeout` limpa o timer; no timeout do "concluir", a mensagem avisa que pode ter sido salvo e que repetir é seguro. | `src/utils/errors.ts`, `useWorkout.ts` |
| S5 | Respostas antigas descartadas (troca rápida de mês; anotações que chegam depois de um `saveNote`; perfil carregado duas vezes). | hooks e `AuthContext` |
| S8 | `getSession()` com `catch` (não trava o loader). Removidos: `upsertProfile`, `fetchAllCompletions`, `removeWorkoutCompletion`, `todayWeekdayIndex`, imports sem uso. | vários |
| S9 | Colunas explícitas nas consultas de treino. Em `profiles` mantive `*` de propósito: se o app sair antes da migração, a falta de `diet_fixed` não derruba o login. | `src/services/workout.ts`, `src/services/profile.ts` |

Novos utilitários: `src/utils/errors.ts` (`friendlyError`, `withTimeout`, `isNetworkError`, `isTimeoutError`, `MSG_NETWORK`).

### Verificação

- `npx tsc --noEmit -p .`: sem erros.
- `npx expo export --platform android`: compila (1176 módulos).
- `npx expo export --platform web`: **não rodou nesta máquina**: o `node_modules` local não tem `react-dom`/`react-native-web` instalados ("CommandError: ... install react-native-web@~0.19.10, react-dom@18.2.0"). Não instalei para não mexer no `package-lock.json` (armadilha 6). Rodar `npm ci` (instala exatamente o lock) e repetir o export antes de publicar.

---

## Status das tarefas do relatório (camada de dados)

- [x] Converter migrações para `supabase/migrations/`
- [x] I1 `handle_new_user` sem dieta (migração, não aplicada) | [ ] conferir conta de teste e provedor Email no painel (sessão principal + Luiz)
- [x] I2 perfil protegido (migração, não aplicada); `upsertProfile` removido
- [x] I3 RLS explícita (migração) + filtro por programa no app
- [x] I4, I5 (hook), I6 (contexto/hook), I7 (hooks), I8 (serviço), S1, S2, S4, S5, S6 (hook), S8, S9
- [ ] Telas: I5, I6, I7, I8, I9, S3, S6, S7, S13 → ui-builder (abaixo)
- Fora do escopo desta rodada: S10, S11, S12 (configuração, não camada de dados)

---

## Para o ui-builder

**Não** chame serviços do Supabase nas telas. Tudo pelos hooks/contexto abaixo.

### Contratos disponíveis

```ts
// src/types
type ProfileStatus  = 'idle' | 'loading' | 'ready' | 'error';
type DietMode       = 'loading' | 'error' | 'pending' | 'fixed' | 'plan';
type DietStatus     = DietMode;
type WorkoutStatus  = 'loading' | 'error' | 'empty' | 'ready';
type CalendarStatus = 'loading' | 'error' | 'ready';
type LoginErrorCode = 'cancelled' | 'in_progress' | 'play_services' | 'network' | 'unknown';
interface LoginError { code: LoginErrorCode; message: string }   // message já em pt-BR
Profile.diet_fixed?: boolean

// useAuth()  (src/contexts/AuthContext.tsx)
{ session, user, userId: string | null, profile, profileStatus, profileError: string | null,
  dietMode: DietMode, loading, signIn(): Promise<{ error: LoginError | null }>,
  signOut(): Promise<void>, refreshProfile(): Promise<boolean> }

// useWorkout(options?: { refreshOnFocus?: boolean })  (src/hooks/useWorkout.ts)
{ status: WorkoutStatus, days, checks, todayCompletion /* inclui workout_day */, lastCompletion,
  nextWorkout, stats, loading /* = status==='loading' */, refreshing, error: string | null,
  saveError: string | null, toggleCheck, completeWorkout(dayId): Promise<boolean>,
  notes, saveNote(exId, text): Promise<boolean>, refresh(), retry() }

// useCalendar(year, month)  (src/hooks/useCalendar.ts)
{ status: CalendarStatus, completions, completionByDate, stats, programDays,
  loading /* consulta do mês em andamento */, error: string | null, refresh(), retry() }

// useDiet()  (src/hooks/useDiet.ts)  — NOVO
{ status: DietStatus, error: string | null, plan: DietPlan | null /* só com status 'plan' */,
  variant: 'A' | 'B', changeVariant(v): Promise<boolean>, retry() }
```

### Mudanças de tela necessárias

1. **LoginScreen** (I8, I9)
   - Trocar `error.message !== 'Sign in cancelled'` por `error.code !== 'cancelled'`; mostrar `error.message` (já em pt-BR).
   - Caixa de erro com tokens (`Colors.red` etc.), sem `'#2A1010'`, `'#C0392B44'`, `'#E74C3C'`.

2. **HomeScreen** (I5, I6, I7, S7)
   - `useWorkout({ refreshOnFocus: true })`. Não chamar `useFocusEffect` na tela (o hook já faz, sem carga dupla).
   - Card "Próximo treino" por `status`: `loading` → indicador só no card; `error` → `error` + botão "Tentar de novo" (`retry`); `empty` → "Você ainda não tem um programa de treino"; `ready` → como hoje.
   - Card da dieta por `dietMode` de `useAuth()` (remover `profile?.diet_enabled !== false`):
     `fixed` → "Dietas A e B · déficit calórico"; `plan` → `${profile.diet_plan?.name} · treino e descanso`; `pending` → "Pendente · em criação"; `loading` → texto neutro/indicador; `error` → "Não foi possível carregar".
   - S7: pedir confirmação antes de sair ao tocar no avatar.

3. **WorkoutScreen** (I4, I7, S3, S4)
   - Trocar `if (loading || activeDayIdx === null)` por decisão por `status`: `loading` → spinner; `error` → mensagem `error` + "Tentar de novo" (`retry`); `empty` → estado vazio ("Você ainda não tem um programa de treino"); `ready` → conteúdo. Com `ready`, nunca ficar em spinner por `activeDayIdx === null` (usar índice 0 como padrão).
   - Recarga (`refreshing`) não pode desmontar os `ExerciseCard` (não usar `refreshing` para spinner de tela cheia).
   - Erro ao concluir: mostrar `saveError` (pt-BR; no timeout já diz que pode ter sido salvo) em vez do texto fixo.
   - S3: antes de `completeWorkout`, se `todayCompletion && todayCompletion.workout_day_id !== activeDay.id`, confirmar "Substituir o treino de hoje (`todayCompletion.workout_day?.label`)?".
   - I9: `'#000'` sobre verde/cor do dia → token (ex.: `Colors.onAccent`).

4. **DietScreen** (I6, S6, S13, I9)
   - Remover `fetchDietPlan`, `updateDietVariant`, `useState` de plano e a regra `isLegacy = !planId`. Usar `useDiet()`:
     `loading` → spinner; `error` → `error` + "Tentar de novo" (`retry`); `pending` → tela "Dieta em criação" atual; `fixed` → `legacyVariants()`; `plan` → `plan.data.variants`.
   - Variante: `variant` + `changeVariant(v)`; se devolver `false`, aviso discreto ("Não foi possível salvar sua escolha").
   - S13: texto de hidratação neutro para planos do banco (ou vindo do `plan.data`).
   - I9: `'#fff'` do seletor e cores do banner → tokens.

5. **CalendarScreen** (I7)
   - `status === 'error'` → mensagem `error` + "Tentar de novo" (`retry`) no lugar da grade vazia. `loading` segue como hoje.

6. **Navigation**: nenhuma mudança obrigatória agora (o terceiro estado "sem programa → onboarding" é do Roadmap 1).

7. **I9 geral**: tokens novos em `src/utils/theme.ts` (`onAccent`, `timerBg`, `errorBg`/`errorBorder`, `bannerA`/`bannerB`) e troca nas telas/FloatingTimer.
