APROVADO COM RESSALVAS

# Revisão: correções da revisão geral (05/10/2026)

**Método:** `git status` e `git diff` (o git funcionou) sobre as mudanças não commitadas em `src/`, `tsconfig.json` e `supabase/`, mais leitura completa dos arquivos novos (`useDiet.ts`, `authErrors.ts`, `errors.ts`, `dietAccess.ts`, `confirm*.ts` e a migração `20261005120000`). Como pedido, ignorei `.claude/`, `docs/`, `CLAUDE.md`, `.mcp.json`, `.gitignore` e `README.md`. O banco **não** foi acessado: a análise da migração parte das 4 migrações anteriores, e os pontos que dependem do estado real estão marcados como conferência.

**Verificação:**
- `npx tsc --noEmit -p .`: **exit 0**.
- `npx expo export --platform android` (saída gerada no scratchpad, fora do repositório): **compilou** (bundle de 3,53 MB).
- **Web: não verificado.** O `node_modules` local não tem `react-dom`/`react-native-web` (ver o relatório do backend). Não há relatório do QA.
- `package.json` e `package-lock.json` não mudaram (armadilha 6).

---

## Bloqueantes

Nenhum.

---

## Importantes

### I1. O bundle web precisa ser gerado antes de publicar
- **Onde:** ambiente (não é código). A web é a plataforma da Usuária 2, e `confirm.web.ts` e `auth.web.ts` só existem nesse bundle.
- **Correção:** rodar `npm ci` (instala exatamente o que está no lock, sem alterá-lo), depois `npx expo export --platform web`, e testar no navegador: login, Home, concluir treino com outro treino já feito no dia (para ver o `window.confirm`), Dieta e sair.

### I2. Conferências obrigatórias antes de aplicar a migração (no SQL Editor, só leitura)
- **Onde:** `supabase/migrations/20261005120000_seguranca_perfil_rls.sql:33-38` e o banco real.
- **Risco:** o `update` que marca `diet_fixed = true` vale para **qualquer** perfil com `ppl-6x`, dieta ativa e sem plano. Se existir outra conta nessa situação, ela passa a ver a dieta fixa do Luiz. Outro ponto: a conta de teste do QA, se já existe, continua com o plano da Usuária 2, porque a migração não a corrige.
- **Correção:** rodar as duas consultas da seção "Conferências antes de aplicar" do `docs/tech/correcoes-revisao-2026-10-05-backend.md`. O resultado esperado é só o Luiz na primeira e só a Usuária 2 na segunda. Se não for isso, parar e decidir com o Luiz. Conferir também, no painel, que o provedor Email do Auth está desligado (pendência I1 da revisão anterior).

---

## A migração `20261005120000_seguranca_perfil_rls.sql`

Linha a linha, está correta. Os detalhes que conferi:

| Ponto | Situação |
|---|---|
| RLS explícita nas 9 tabelas (`:14-22`) | OK. Todas existem; `enable` é idempotente. |
| `diet_fixed` (`:28-38`) | OK. Em PG 11+, `add column ... not null default false` não reescreve a tabela. O `update` é idempotente e roda antes do trigger existir (não que fizesse diferença, já que roda como `postgres`). |
| Privilégios de coluna (`:44-45`) | OK. O app só grava `diet_variant` e `updated_at` (`src/services/profile.ts:24-31`, por PATCH sem `select`). O UPDATE precisa de SELECT em `id` para o `where`, e esse privilégio continua. A policy `"Users can update own profile"` (base `:24-25`) continua valendo. |
| Remoção da policy de INSERT (`:49`) | OK. Nenhum código insere em `profiles` (`upsertProfile` foi removido). O nome bate com a base `:22`. Mesmo que a policy tivesse outro nome em produção, o `revoke insert` já bloqueia. |
| Trigger `protect_profile_access_columns` (`:56-87`) | OK. Não é `security definer`, então `current_user` é o papel que executa: `authenticated`/`anon` via PostgREST e `postgres` em `handle_new_user` (security definer), no SQL Editor e nas migrações. A exclusão por FK cascade (exclusão em `auth.users`) não é afetada, porque o trigger só cobre insert/update. O erro `42501` vira 403 no PostgREST. |
| `handle_new_user` (`:94-120`) | OK. Continua `security definer`, com `search_path` fixo, passa a usar `on conflict do nothing`, não entrega dieta e mantém `fem-5x` (decisão registrada em `-duvidas.md`, item 1, que aceito). O trigger `on_auth_user_created` não muda, porque o `create or replace` mantém o vínculo. `diet_variant` usa o default `'A'`. |
| `refresh_user_stats` / `trigger_refresh_stats` (`:123-128`) | OK. As duas são `security definer` (base `:125` e `:185`). Sem o EXECUTE, o trigger continua chamando a função como dono, e o corpo usa nomes qualificados com `public.`. |
| `user_stats` sem insert/update (`:131-132`) | OK. O app só lê (`workout.ts:146`), e quem grava são as duas funções security definer, que pertencem ao dono da tabela e por isso ignoram a RLS. |
| Histórico | **Preservado.** Não há nenhum comando em `workout_completions`, `exercise_checks` ou `exercise_notes`. |
| Idempotência | OK. Todos os comandos são `if exists`/`if not exists`/`or replace`, ou `revoke`/`grant`/`enable`. |

**Compatibilidade entre versões:**
- **App antigo com banco novo:** funciona. Ele só grava `diet_variant`/`updated_at`. A Dieta do Luiz continua por "sem plano", a da Usuária 2 pelo plano, e contas novas veem "em criação".
- **App novo com banco antigo:** o Luiz vê "Dieta em criação" (a coluna `diet_fixed` não existe e vem `undefined`), sem perda de dados. O `select('*')` em `profiles` evita quebrar o login.

**Veredito:** **segura para aplicar em produção** depois das conferências do I2. **Ordem:** (1) conferências; (2) `supabase migration repair --status applied` das 4 versões antigas, `db push --dry-run` listando **só** a `20261005120000` e então `db push`, com OK do Luiz; (3) as consultas de conferência do fim do arquivo (`:135-142`); (4) só então publicar a web e gerar o APK. O roteiro de reversão do doc de backend está correto.

---

## Hooks e contexto

- **Armadilha 1:** OK. Dentro de `onAuthStateChange` só há `setSession`/`clearProfile` (estado local), e o perfil carrega via `setTimeout` (`AuthContext.tsx:111-122`). `INITIAL_SESSION` e `TOKEN_REFRESHED` não recarregam o perfil. `SIGNED_IN` ao voltar à aba só recarrega se o perfil ainda não estiver carregado, e com isso um perfil que falhou se recupera sozinho ao voltar à aba.
- **Dependência por `userId`:** OK (`useWorkout.ts:34-89`, `useCalendar.ts:9-47`). `sameSession` evita trocar o objeto de sessão sem necessidade. Trocar a variante da dieta recarrega o perfil, mas não muda `programId`, então o treino não recarrega.
- **Corridas:** OK. Contadores `profileReq`, `loadReq`, `notesReq` e `req` no calendário; `alive` em `useDiet`. Os casos "logout no meio" e "duas cargas do perfil (getSession + SIGNED_IN no redirect OAuth)" são descartados corretamente.
- **Estados de erro:** OK. Depois da primeira carga, o status nunca volta para `loading`, o que resolve o I4 anterior (os `ExerciseCard` não desmontam mais). Perfil com erro leva `dietMode = 'error'`, **nunca** a dieta fixa (`dietAccess.ts:9-15`). Isso fecha o I6 anterior.
- **`refreshOnFocus`:** OK (`useWorkout.ts:94-101`). Ignora o primeiro foco e usa `loadRef`, então não há carga dupla nem recriação do callback.
- **Timeout (S4):** `withTimeout` limpa o timer, e a mensagem diz que o treino pode ter sido salvo.

## Telas

- **Login:** compara por `error.code` e mostra a mensagem já em pt-BR. O tratamento de `{ type: 'cancelled' }` do SDK novo (`auth.ts:21-23`) é um bom achado.
- **Home:** o card de treino tem os estados loading, error com "Tentar de novo", empty e ready. A dieta é decidida por `dietMode`, sem o antigo `!== false`. Sair pede confirmação.
- **Workout:** os estados de loading, erro e vazio mantêm o cabeçalho com o botão voltar, e o spinner infinito acabou (`resolvedIdx = activeDayIdx ?? 0`). Pede confirmação antes de substituir o treino do dia (S3). O `saveError` vem do hook.
- **Diet:** só o hook `useDiet`. A dieta fixa aparece apenas com `status === 'fixed'`. Tem estado de erro com "Tentar de novo" e aviso quando a variante não é salva. O texto de hidratação ficou neutro (S13).
- **Calendar:** estado de erro com "Tentar de novo".
- **`confirm.web.ts`:** `window.confirm`, correto para a web (o `Alert.alert` não aparece no react-native-web). O rótulo do botão é ignorado (o navegador mostra OK/Cancelar), o que é aceitável.

**Armadilhas:**

| # | Armadilha | Situação |
|---|---|---|
| 2 | Datas em UTC | OK. `toISOString` só em `updated_at` (`profile.ts:27`, `workout.ts:200`). |
| 4 | Cronômetro por `endsAt` | OK. Não foi tocado. |
| 5 | `SafeAreaView` | OK. As 5 telas importam de `react-native-safe-area-context`. |
| 7 | Abas Android | OK. `height: 40` e `includeFontPadding: false` (`WorkoutScreen.tsx:412, 425`); `numberOfLines={1}` mantido. |
| 8 | Rota `Workout` com `daySlug` | OK. Lógica de `appliedSlug` intacta. |
| 9 | Próximo treino pelo último concluído | OK (`useWorkout.ts:159-160`). |
| 10 | Totais de dieta sem `isAlternative` | OK. `calcTotals` e `makeMeals` não mudaram. |

---

## Sugestões (não bloqueiam)

- **S1. Tirar os outros privilégios de `profiles`:** `migração:44` remove INSERT/UPDATE/DELETE, mas `anon`/`authenticated` mantêm TRUNCATE, REFERENCES e TRIGGER (grant padrão do Supabase). Pelo PostgREST não dá para explorar, mas por higiene: `revoke truncate, references, trigger on public.profiles from anon, authenticated;`. Pode ficar para a migração do Roadmap item 1.
- **S2. Piscada na troca rápida de variante:** `useDiet.ts:132-147`. Se o usuário trocar A, depois B, e a recarga do perfil disparada pela troca para A chegar depois, o `useEffect` da linha 134 leva a tela para A por um instante, até a segunda recarga terminar. Correção simples: não chamar `refreshProfile()` em `changeVariant` (a escolha local já está certa), ou ignorar `profileVariant` enquanto houver gravação em andamento.
- **S3. Calendário refaz consultas fixas a cada mês:** `useCalendar.ts:30-34`. `fetchUserStats` e `fetchWorkoutDays` rodam a cada troca de mês, mas só as conclusões dependem do mês. Dá para separá-las num efeito que depende só de `userId`/`programId`.
- **S4. `saveError` sobrevive à troca de aba de dia:** `WorkoutScreen.tsx:347`. O erro de um dia continua aparecendo no outro. Limpar no `onPress` da aba (o hook poderia expor um `clearSaveError`).
- **S5. `tsconfig.json`:** a mudança (incluir `.expo/types/**/*.ts`) parece ter sido feita automaticamente pela Expo CLI e não tem relação com a feature. É inofensiva; pode commitar ou reverter.
- **S6. Valores soltos novos:** `DietScreen.tsx:302` (`paddingHorizontal: 20, paddingVertical: 8`), onde as outras telas usaram `Spacing.xl`/`Spacing.sm` no mesmo botão. Fica para a feature tema-claro-escuro, conforme combinado.
- **S7. Redundância:** em `CalendarScreen.tsx:96`, `(loading || status === 'loading')`. Com `status` já calculado, basta `status === 'loading'`.

---

## O que está bom

- A migração é cuidadosa: defesa em duas camadas (privilégio de coluna e trigger), comentários que explicam o porquê, compatibilidade nos dois sentidos de deploy e reversão documentada.
- Uma regra única de qual dieta mostrar (`resolveDietMode`), usada pela Home e pela Dieta. A dieta do Luiz só aparece com o critério explícito.
- Os hooks expõem `status`/`error`/`retry` de forma consistente, e as telas tratam todos os estados em pt-BR.
- O código morto pedido (S8 anterior) foi removido e as consultas de treino têm colunas explícitas.
