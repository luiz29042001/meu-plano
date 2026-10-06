APROVADO COM RESSALVAS

# Revisão geral do código: Meu Plano (05/10/2026)

**Método:** revisão do código inteiro como está no commit `1d1a57c` (git funcionou). O `git status` mostra apenas `.gitignore` alterado (3 linhas novas: `.playwright-profile/`, `.tmp-export-*`) e arquivos novos `.claude/`, `.mcp.json`, `CLAUDE.md` e `docs/`, nenhum deles código do app. O `.mcp.json` não tem segredo. O banco **não** foi acessado: os itens de RLS se baseiam na soma `schema.sql` + `002` + `003` + `004`, e onde o estado real pode ser diferente eu indico o que conferir.

**Verificação:** `npx tsc --noEmit -p .` terminou com **exit 0**, sem erros. Os bundles Android e web não fazem parte desta revisão (não houve mudança).

---

## Armadilhas do CLAUDE.md: as 10 correções estão no código

| # | Armadilha | Situação | Onde |
|---|---|---|---|
| 1 | Supabase dentro de `onAuthStateChange` | OK. Nenhuma consulta no callback; perfil adiado com `setTimeout` e só em `SIGNED_IN`/`USER_UPDATED` | `src/contexts/AuthContext.tsx:46-56` |
| 2 | Datas em UTC | OK. `todayISO()`/`formatDate()` locais; o calendário monta as strings no fuso local. `toISOString()` aparece só em `updated_at` (timestamptz), o que está correto | `src/utils/date.ts:3-12`, `src/hooks/useWorkout.ts:17`, `src/screens/CalendarScreen.tsx:93` |
| 3 | `@opentelemetry/api` | OK. Módulo vazio só quando `platform === 'web'` | `metro.config.js:10-15` |
| 4 | Cronômetro por `endsAt` | OK. Tempo restante sempre derivado de `endsAtRef`; `unlockAudio` em `launchTimer`/`toggleTimer`; vibração no nativo; recalcula em `AppState` e `visibilitychange` | `src/contexts/TimerContext.tsx:72-148` |
| 5 | `SafeAreaView` | OK. Todas as 5 telas importam de `react-native-safe-area-context` | |
| 6 | `package-lock` / versões web | OK. Sem alteração; `react-dom 18.2.0`, `react-native-web ~0.19.10`, `@expo/metro-runtime ~3.2.3` | `package.json` |
| 7 | Abas Android | OK. `height: 40`, `includeFontPadding: false`, `numberOfLines={1}` | `src/screens/WorkoutScreen.tsx:221, 366-383` |
| 8 | Rota `Workout` com `daySlug` | OK, inclusive re-sincroniza com `appliedSlug` | `src/screens/WorkoutScreen.tsx:145-157`, `HomeScreen.tsx:51` |
| 9 | Próximo treino pelo último concluído | OK | `src/utils/workoutSequence.ts:13-22`, `useWorkout.ts:118-119` |
| 10 | Totais de dieta sem `isAlternative`; substituto com `kcal: 0` sem calorias | OK | `src/services/dietData.ts:294`, `DietScreen.tsx:24, 46` |

Segredos: nada de `service_role`, `ANTHROPIC_API_KEY`, client secret ou token no repositório (busca em todos os arquivos versionados). A anon key e o `google-services.json` são públicos por natureza.

---

## Bloqueantes

Nenhum bloqueante no código em si. O item I1 abaixo precisa de **conferência imediata no painel do Supabase**: se a condição se confirmar, ele passa a ser bloqueante (vazamento de dado de saúde de terceiro).

---

## Importantes

### I1. Toda conta nova recebe o plano alimentar da Usuária 2 (dado de saúde de terceiro)
- **Onde:** `supabase/003_diet_and_glute_focus.sql:32-47` (`handle_new_user` grava `diet_plan_id` = plano da nutricionista/Usuária 2 e `diet_enabled = true`) combinado com `003:17-19` (a política libera o plano para quem tem esse `diet_plan_id`).
- **Risco:** qualquer conta criada passa a ler a prescrição da nutricionista da Usuária 2. O CLAUDE.md já trata isso como provisório, mas hoje já afeta a **conta de teste do QA** (`/preparar-qa`). E o fechamento não depende só do Google em modo Teste: o provedor **Email** do Supabase Auth vem ligado por padrão. Se estiver ligado, qualquer pessoa com a anon key (que é pública) consegue criar conta por `auth.signUp` com e-mail e senha e ler o plano pela API REST.
- **Correção:**
  1. Agora, no painel: Authentication > Providers, confirmar que **Email** está desligado (ou "Allow new users to sign up" desativado).
  2. Na migração do Roadmap item 1: `handle_new_user` cria o perfil com `program_id = null`, `diet_plan_id = null` e `diet_enabled = false`.
  3. Antes de o QA logar, conferir que a conta de teste não tem `diet_plan_id` (ou atribuir a ela um plano fictício).

### I2. O usuário pode alterar o próprio `program_id`/`diet_plan_id`, e é isso que libera a leitura dos dados de programa e dieta
- **Onde:** `supabase/schema.sql:24-25` (UPDATE em `profiles` sem restrição de colunas). A RLS de `diet_plans` (`003:17-19`), `workout_days` e `exercises` (`002:121-130`) confia nesses campos.
- **Risco:** basta um `PATCH /profiles` com `diet_plan_id = X` para ler qualquer plano alimentar, e o mesmo vale para qualquer programa. Hoje são 2 usuárias de confiança, mas é a base de segurança do Roadmap item 1. `src/services/profile.ts:22-31` (`upsertProfile`, que não é usado) aceita gravar qualquer campo.
- **Correção:** no Roadmap item 1, a RLS de planos e programas passa a ser por `owner_id = auth.uid()`, sem depender de campos editáveis do perfil. Até lá: `revoke update on public.profiles from authenticated; grant update (diet_variant, full_name, updated_at) on public.profiles to authenticated;`. Apagar `upsertProfile`.

### I3. A RLS de `workout_days` e `exercises` não está ligada em nenhuma migração do repositório
- **Onde:** `supabase/schema.sql:28-49` cria as tabelas sem `enable row level security`; `002:116-130` cria as políticas, mas também não liga a RLS. Já `002:116-117` remove políticas `read_workout_days`/`read_exercises` que não existem em nenhum arquivo, então a RLS foi ligada pelo painel.
- **Risco:** com a RLS desligada, as políticas não valem nada e qualquer cliente, até sem login, lê todos os programas. Como `fetchWorkoutDays` (`src/services/workout.ts:6-18`) não filtra por programa, o Luiz veria os dias da Usuária 2 misturados aos dele. O app funciona hoje, o que indica que a RLS está ligada em produção, mas recriar o banco a partir do repositório (por exemplo, ao converter para `supabase/migrations/`) produziria um banco aberto.
- **Correção:** conferir com `select relname, relrowsecurity from pg_class where relname in ('workout_days','exercises');` e incluir `alter table ... enable row level security` na migração base ao converter para o CLI. Como defesa extra, filtrar a consulta no app por `program_id`.

### I4. A tela de treino recarrega inteira quando o usuário volta ao app (web) e a cada renovação de token, apagando a anotação em edição
- **Onde:** `src/hooks/useWorkout.ts:63` (dependência `[user, ...]`), `src/hooks/useCalendar.ts:28` e `src/contexts/AuthContext.tsx:47` (`setSession(session)` a cada evento).
- **Causa:** o supabase-js instalado (2.108.2, `auth-js GoTrueClient.js:4599-4629` e `4045`) emite **`SIGNED_IN` toda vez que a aba volta a ficar visível**, com um objeto `user` novo. Ele também emite `TOKEN_REFRESHED` mais ou menos de hora em hora. Cada novo objeto `user` recria o `load` e o executa de novo: `setLoading(true)` faz o `WorkoutScreen` trocar tudo pelo spinner (`WorkoutScreen.tsx:187-193`), o que desmonta os `ExerciseCard`.
- **Efeito para a Usuária 2 (iPhone):** bloquear a tela entre séries e voltar faz a tela piscar, voltar ao topo e **perder o texto da anotação ainda não salvo**. Também recarrega o perfil a cada retorno.
- **Correção:** usar `const userId = user?.id` e depender de `userId` nos dois hooks. Mostrar o spinner de tela cheia só no primeiro carregamento (`loading && days.length === 0`). No `AuthContext`, opcionalmente, só chamar `setSession` quando `access_token` ou `user.id` mudar.

### I5. A Home fica desatualizada depois de concluir o treino
- **Onde:** `src/screens/HomeScreen.tsx:22`. A Home e o Workout chamam `useWorkout()` cada um com o próprio estado, e a Home continua montada na pilha.
- **Risco:** depois de marcar o treino como concluído e voltar, a Home ainda mostra "Sem treino hoje", o total antigo e o **mesmo "Próximo treino" que acabou de ser feito**, até reiniciar o app (no Android) ou trocar de aba (na web, por causa do I4). Isso contradiz a regra do próximo treino (armadilha 9) do ponto de vista do usuário.
- **Correção:** `useFocusEffect(useCallback(() => { refresh(); }, [refresh]))` na Home (sem spinner de tela cheia) ou levar o estado de treino para um contexto compartilhado.

### I6. Se o perfil falhar ao carregar, a Usuária 2 vê a dieta do Luiz
- **Onde:** `src/contexts/AuthContext.tsx:25-30` (o erro é engolido com `catch {}` e `profile` fica `null`), `src/screens/DietScreen.tsx:152, 164` (`planId` nulo vira `isLegacy = true`, que mostra a dieta fixa do Luiz) e `HomeScreen.tsx:28` (`diet_enabled !== false` com `profile` nulo deixa a dieta ativa).
- **Risco:** uma falha de rede no início deixa a Usuária 2 vendo como "Plano Alimentar" o déficit calórico do Luiz. No Roadmap item 1 é pior: qualquer conta com `diet_enabled = true` e sem plano cai na dieta do Luiz.
- **Correção:** com `profile === null`, a `DietScreen` mostra carregando ou erro com botão "Tentar de novo" (`refreshProfile`). A dieta fixa só aparece por critério explícito (por exemplo, um flag ou slug no perfil), nunca por ausência de `diet_plan_id`. Remover o fallback de compatibilidade `!== false` da Home e o regex de compatibilidade em `src/services/profile.ts:12-16`, que mascara erros. O `AuthContext` deve expor `profileError`.

### I7. Estados de erro e de vazio ausentes: spinner infinito
- **Onde:** `src/screens/WorkoutScreen.tsx:146` e `187`. Se `days` vier vazio (erro de rede ou perfil sem programa), `activeDayIdx` nunca sai de `null` e o spinner fica para sempre. O `error` de `useWorkout` não é lido por nenhuma tela. `src/hooks/useCalendar.ts:15-27` usa `try/finally` sem `catch`: dá rejeição não tratada e um calendário vazio sem aviso. Na Home, com erro, o card "Próximo treino" simplesmente some.
- **Risco:** sem rede, o usuário fica preso num loading. É exatamente o caso "conta sem programa" do Roadmap item 1.
- **Correção:** tratar `error` com mensagem em pt-BR e botão "Tentar de novo"; tratar `days.length === 0` sem erro com um estado vazio ("Você ainda não tem um programa de treino", que no futuro leva ao onboarding); adicionar `catch` no `useCalendar` com estado de erro.

### I8. Mensagens de erro do login em inglês
- **Onde:** `src/services/auth.ts:23` ("No ID token returned from Google"), `:34` ("Sign in cancelled"), `:37` ("Sign in already in progress"), e `src/screens/LoginScreen.tsx:25-26`, que mostra `error.message` cru (mensagens do Supabase e do Google também em inglês).
- **Correção:** mapear para pt-BR na tela ("Não foi possível entrar. Tente de novo.", "Login já em andamento") e comparar por código, não pelo texto `'Sign in cancelled'`.

### I9. Valores soltos fora do `theme.ts`
- **Cores fixas:** `'#000'` como texto sobre o verde/cor do dia (`WorkoutScreen.tsx:114, 303, 384, 413`, `HomeScreen.tsx:190`); `'#fff'` no seletor de variante (`DietScreen.tsx:195`, inconsistente com o `#000` usado no resto); `'#1A2A1A'`/`'#1A1A2A'` no banner (`DietScreen.tsx:246`); `'#18181B'` no fundo do cronômetro (`FloatingTimer.tsx:107`, mais escuro que o `bg`, ao contrário do pedido de "menos escuro"); `'#2A1010'`, `'#C0392B44'`, `'#E74C3C'` na caixa de erro (`LoginScreen.tsx:123-129`, em vez de `Colors.red`); `'#E8572A'` (`TimerContext.tsx:17`); `"#0F0F0F"` na StatusBar (`App.tsx:15`) e no splash/adaptive icon (`app.json:12, 24`), destoando do `bg #1A1A1C`.
- **Números soltos:** cerca de 140 `fontSize`/`padding`/`margin`/`borderRadius`/`gap` numéricos (DietScreen 55, WorkoutScreen 28, FloatingTimer 22, LoginScreen 15, HomeScreen 13, CalendarScreen 9).
- **Correção:** criar tokens `Colors.onAccent` (texto sobre verde), `Colors.timerBg`, `Colors.errorBg`/`errorBorder`, `Colors.bannerA`/`bannerB` e substituir. Os números podem migrar aos poucos para `Spacing`/`FontSize`/`Radius` (talvez seja preciso `Spacing.xxxl = 32`), sempre que uma tela for tocada.

---

## Sugestões

- **S1. `refresh_user_stats` exposta via RPC e sem `search_path`.** `supabase/schema.sql:124-125`: `security definer` sem `set search_path`, e as funções em `public` são executáveis por `anon`/`authenticated`. Qualquer um consegue mandar recalcular as estatísticas de outro usuário (não vaza nada, mas não deveria ser possível). Correção: `alter function public.refresh_user_stats(uuid) set search_path = public; revoke execute on function public.refresh_user_stats(uuid) from public, anon, authenticated;`, e o mesmo `search_path` em `trigger_refresh_stats` (`schema.sql:184-185`).
- **S2. Políticas de INSERT/UPDATE em `user_stats`** (`schema.sql:118-121`) deixam o usuário forjar o próprio total. O trigger já mantém a tabela; dá para remover as duas políticas.
- **S3. Concluir um segundo treino no mesmo dia sobrescreve o primeiro sem avisar.** `WorkoutScreen.tsx:168` só bloqueia se for o mesmo dia de treino; `markWorkoutComplete` (`workout.ts:69-88`) faz upsert por `(user_id, completed_date)`. Correção: perguntar "Substituir o treino de hoje (X)?".
- **S4. Timeout de 20s** (`useWorkout.ts:82-85, 100-103`): a requisição continua depois do timeout e pode gravar mesmo com a mensagem de erro na tela. Como é upsert, repetir é seguro; vale ajustar a mensagem ("pode ter sido salvo, confira") e limpar o `setTimeout`.
- **S5. Corridas sem cancelamento:** `useCalendar` ao trocar de mês rápido, ou `fetchExerciseNotes` (`useWorkout.ts:57`) chegando depois de um `saveNote`, podem sobrescrever dados novos com dados velhos. Usar a flag `alive` (como já faz a `DietScreen:155-161`).
- **S6. `handleVariantChange`** (`DietScreen.tsx:170-176`): `await updateDietVariant` sem `try/catch` gera rejeição não tratada se estiver sem rede.
- **S7. Sair ao tocar no avatar** (`HomeScreen.tsx:40`) sem confirmação é fácil de acionar sem querer. Pedir confirmação.
- **S8. `AuthContext.tsx:35-39`:** `getSession()` sem `catch` deixa o loader global para sempre se falhar. Imports e variáveis não usados: `User`, `upsertProfile`, `data` (linha 62). Código morto: `fetchAllCompletions`, `removeWorkoutCompletion`, `todayWeekdayIndex`, `upsertProfile`.
- **S9. Consultas com `select('*')`** (`workout.ts:10-12, 33, 46, 60, 112, 151, 166`): listar as colunas explicitamente. O volume é pequeno, então é questão de higiene e de evitar trazer colunas futuras (por exemplo, `owner_id`) sem querer.
- **S10. Cronômetro no Android em segundo plano:** o JS para, e a vibração só acontece quando o usuário volta ao app. É uma limitação conhecida; resolver com notificação local agendada para `endsAt` (`expo-notifications`) se o Luiz sentir falta.
- **S11. `app.json`:** o plugin `expo-router` e `experiments.typedRoutes` (`app.json:56, 70-72`) não são usados e vão atrapalhar a atualização de SDK do Roadmap item 3. O `intentFilters` com `autoVerify` para `meuplano.app` (`app.json:28-44`), domínio que o projeto não usa, também é configuração morta.
- **S12. `.gitignore`:** acrescentar `google-play-key.json` (referenciado em `eas.json:28`) e `.env*` antes do Roadmap item 3, para a chave da Play nunca ir parar no repositório.
- **S13. Texto de hidratação** para planos do banco (`DietScreen.tsx:287`) é uma orientação escrita no código e exibida junto ao plano da nutricionista ("já que o treino é em jejum", o que nem bate com o banner do plano, que fala em treino às 20h20). Mover esse texto para dentro do `data` do plano, escrito ou aprovado pela nutricionista, ou trocar por texto neutro.

---

## Pontos que vão atrapalhar o Roadmap item 1 (só apontando)

1. **`workout_days.slug` é único no banco todo** (`schema.sql:30`). Com programas por dono e, no item 2, gerados por IA, o slug precisa ser único por programa (`unique(program_id, slug)`). O app usa slug para navegação (`daySlug`) e para o próximo treino (`lastCompletion.workout_day.slug`).
2. **Histórico preso aos IDs:** `workout_completions.workout_day_id` e `exercise_checks.exercise_id` referenciam os IDs sem `on delete` (`schema.sql:57, 83`), e `exercise_notes.exercise_id` tem `on delete cascade` (`004:6`). Migrar por cópia e exclusão **apagaria as anotações** e seria barrado pelo histórico. A migração precisa **atualizar no lugar** (adicionar `owner_id` às linhas existentes de `workout_programs`/`diet_plans`), nunca recriar dias e exercícios.
3. **Histórico some ao trocar de programa:** a RLS de `workout_days` (`002:121-123`) só mostra os dias do programa atual. Os joins `workout_day:workout_days(*)` do calendário e do último treino viriam `null` para conclusões de um programa antigo: dias sem cor e sem rótulo, e o próximo treino volta ao primeiro. A nova RLS deve liberar os dias que pertencem ao usuário (`owner_id`), não só ao programa ativo.
4. **RLS dependente de campos editáveis do perfil** (I2), que precisa virar `owner_id = auth.uid()`.
5. **Conta sem programa não tem tela:** o `WorkoutScreen` fica em spinner infinito (I7), a Home some com o card e não há rota de onboarding. `Navigation` (`src/navigation/index.tsx:51`) só distingue "tem sessão" de "não tem"; vai precisar de um terceiro estado (sessão sem programa, que leva ao onboarding), o que exige que o `profile` já esteja carregado antes de decidir (hoje `loading` vira `false` antes do perfil, em `AuthContext.tsx:38`).
6. **Dieta "legada" por ausência de plano** (I6) e `handle_new_user` com programa e dieta da Usuária 2 (I1).
7. **`programKey`** em `useWorkout.ts:25, 63` já recarrega ao mudar de programa, o que ajuda. O `useCalendar`, porém, não recarrega.

---

## O que está bom

- As 10 correções históricas estão todas no lugar e comentadas no código, explicando o porquê.
- RLS correta e com `(select auth.uid())` em `exercise_notes` (004), inclusive `with check` no update e limite de 2000 caracteres no banco e no `TextInput`.
- O cronômetro por `endsAt` é robusto (refs e recálculo ao voltar ao app), com um único `AudioContext` reaproveitado.
- O fluxo de concluir o treino dá retorno claro: estado "Salvando…", mensagem de erro em pt-BR e atualizações secundárias que não bloqueiam a confirmação.
- A `DietScreen` já cancela a requisição com a flag `alive`, o padrão que deveria ser usado nos hooks.
- Nenhum segredo sensível no repositório.
