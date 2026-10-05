# CLAUDE.md — Meu Plano

Contexto do projeto para o Claude Code. Leia antes de qualquer alteração.

## Sobre o usuário

- **Luiz** é o dono do projeto e **não é desenvolvedor**. Explique em português do Brasil, de forma simples e direta, sem jargão.
- Ele prefere que você **execute** as mudanças. Evite pedir que ele cole código ou edite arquivos à mão.
- Antes de qualquer ação destrutiva no banco de produção ou no repositório, explique o que vai fazer e peça confirmação.
- Interface do app sempre em **pt-BR**.

## O que é o app

App pessoal de treino e dieta usado hoje por 2 pessoas:

| Usuário | Plataforma | Programa de treino | Dieta |
|---|---|---|---|
| Luiz | Android (APK via EAS) | `ppl-6x`: Push/Pull/Legs, 6x/semana, treino em jejum de manhã | Fixa no código (`src/services/dietData.ts`), variantes A/B, déficit calórico |
| Esposa (Usuária 2) | Web/PWA no iPhone (Safari) | `fem-5x`: Inferior/Superior + Glúteos C, 5x/semana, foco em glúteos e posteriores | No banco (`diet_plans`, slug `ciclo-carbo-exemplo`): ciclo de carboidratos com variantes Treino/Descanso, prescrita pela nutricionista a nutricionista |

## Stack

- React Native **0.74.3** + **Expo SDK 51**, TypeScript. Entrada: `App.tsx`, via `expo/AppEntry`. Navegação com React Navigation (native-stack). **Não** usa expo-router, apesar de o plugin aparecer no `app.json`.
- **Supabase** (Postgres + Auth + RLS). Projeto `app_saude`, ref `SEU_PROJECT_REF`. URL e anon key ficam em `app.json > expo.extra`.
- Login com **Google**:
  - **Android/iOS:** `@react-native-google-signin/google-signin` + `supabase.auth.signInWithIdToken` (`src/services/auth.ts`).
  - **Web:** OAuth com redirecionamento do Supabase (`src/services/auth.web.ts`). O Metro escolhe o arquivo `.web.ts` automaticamente.
- **Build Android:** EAS (`eas.json`). O perfil `preview` gera APK.
- **Web:** `expo export --platform web` (saída `single`, PWA) hospedado no **GitHub Pages**, no repositório público `luiz29042001/luiz29042001.github.io` → https://luiz29042001.github.io

## Estrutura

```
App.tsx                      SafeAreaProvider > GestureHandler > AuthProvider > TimerProvider > Navigation
metro.config.js              shim: '@opentelemetry/api' vazio só na web (ver Armadilhas)
public/                      index.html (meta tags PWA/iOS), manifest.json, ícones
supabase/                    schema.sql (base) + migrações 002, 003, 004 (já aplicadas em produção)
src/contexts/AuthContext     sessão + perfil (com join de program e diet_plan)
src/contexts/TimerContext    cronômetro global baseado em horário de término (endsAt)
src/hooks/useWorkout         dias, checks, conclusão, último treino, próximo treino, anotações
src/hooks/useCalendar        conclusões do mês + dias do programa (legenda dinâmica)
src/services/                supabase, auth(.web), workout, profile, diet, dietData
src/screens/                 Login, Home, Workout, Diet, Calendar
src/utils/                   theme (tokens de cor), date (datas LOCAIS), workoutSequence
src/components/FloatingTimer overlay do cronômetro, sobre todas as telas
```

## Banco de dados (estado atual em produção)

Tabelas:
- `profiles`: `id`, `email`, `full_name`, `diet_variant` ('A'|'B'), `program_id`, `diet_enabled`, `diet_plan_id`.
- `workout_programs`: `slug`, `name`, `description` → `ppl-6x`, `fem-5x`.
- `workout_days`: `slug` (único global; a esposa usa o prefixo `f-`), `label`, `weekday_index` (ordem da sequência), `color`, `muscles`, `is_rest`, `program_id`.
- `exercises`: `workout_day_id`, `position`, `name`, `sets`, `reps`, `rest_seconds`, `tip`.
- `workout_completions`: um registro por usuário por dia (`unique(user_id, completed_date)`). Um trigger recalcula `user_stats`.
- `exercise_checks`: exercício marcado por dia.
- `exercise_notes`: anotação por **(user_id, exercise_id)**, que é a chave primária. Usada para o usuário registrar peso e observações de execução.
- `diet_plans`: `slug`, `name`, `data` (jsonb no formato `DietPlanData` de `src/types`).
- `user_stats`: total de treinos e sequências. O app hoje mostra só o total.

Regras de acesso (RLS):
- Cada usuário lê e escreve **apenas** as próprias linhas em completions, checks, notes, stats e profile.
- `workout_days` e `exercises` só são visíveis se pertencerem ao `program_id` do perfil de quem consulta.
- `diet_plans` só é visível se for o `diet_plan_id` do perfil de quem consulta.

O trigger `handle_new_user`, disparado no cadastro, cria o perfil com o programa `fem-5x` e a dieta da esposa. **Isso é provisório e deve mudar no Roadmap item 2.**

Migrações já aplicadas: `schema.sql` → `002_multi_program.sql` → `003_diet_and_glute_focus.sql` → `004_exercise_notes.sql`. O `schema.sql` **não** reflete as migrações posteriores; o estado real é a soma de todas.

**Até agora não havia acesso via linha de comando**: as migrações foram aplicadas pelo SQL Editor do painel. Com o Claude Code, prefira o **Supabase CLI** (`supabase link --project-ref SEU_PROJECT_REF`, depois `supabase db push` / `supabase migration`). Converta as migrações existentes para `supabase/migrations/` antes de criar novas.

## Comandos (Windows, terminal na pasta do projeto)

```bat
:: Build Android (APK)
set EAS_NO_GIT_STATUS_CHECK=1 && eas build --platform android --profile preview --no-wait
:: Se o terminal não encontrar o git (acontece na máquina do Luiz):
set EAS_NO_VCS=1 && eas build --platform android --profile preview --no-wait

:: Checagem de tipos
npx tsc --noEmit -p .

:: Build web
npx expo export --platform web --output-dir dist
```

**Publicar a web:**
1. Gere o `dist`.
2. Substitua todo o conteúdo do repositório `luiz29042001.github.io` (branch `main`) pelo `dist`.
3. Mantenha um arquivo **`.nojekyll`** na raiz. Sem ele, o GitHub Pages ignora a pasta `_expo`.
4. Faça push e confira o status de build do Pages.

**Antes de entregar qualquer mudança**, rode `tsc` e confirme que o bundle de **Android e de web** compila (`expo export --platform android|web`).

## Armadilhas já resolvidas (não reintroduzir)

1. **Travamento do Supabase na web.** Nunca chame o Supabase de dentro do callback de `onAuthStateChange`. No navegador, a renovação de token (cerca de 1h) segura uma trava (`navigator.locks`), e qualquer consulta feita dentro do callback trava todas as requisições seguintes. O sintoma foi o botão "Marcar como concluído" sem resposta no fim do treino. Solução atual: adiar com `setTimeout` e só recarregar o perfil em `SIGNED_IN`/`USER_UPDATED`.
2. **Datas sempre no fuso local.** Use `todayISO()`/`formatDate()` de `src/utils/date.ts`. `toISOString()` usa UTC e jogava treinos feitos após as 21h (horário de Brasília) para o dia seguinte.
3. **`@opentelemetry/api`.** O supabase-js tenta um import opcional que quebra o bundle web. O `metro.config.js` devolve um módulo vazio, **só para a plataforma web**.
4. **Cronômetro.** Calcula o tempo restante a partir de `endsAt`, para continuar correto quando o app vai para segundo plano. No iOS/Safari, o áudio precisa ser destravado num toque do usuário (`unlockAudio`). No Android nativo, o alerta é vibração, porque Web Audio não existe lá.
5. **`SafeAreaView`.** Importe sempre de `react-native-safe-area-context`, nunca de `react-native`.
6. **`package-lock.json`.** Não regenere sem necessidade. As versões de dependências web são as compatíveis com o SDK 51: `react-dom 18.2.0`, `react-native-web ~0.19.10`, `@expo/metro-runtime ~3.2.3`.
7. **Abas de treino no Android.** Use altura fixa, `includeFontPadding: false` e `numberOfLines={1}`; sem isso o texto aparece cortado.
8. **Navegação para o treino.** A rota `Workout` aceita o parâmetro `{ daySlug }`. O card "Próximo treino" da Home passa esse parâmetro para abrir na aba certa.
9. **Próximo treino.** É definido pelo **último treino concluído**, seguindo a ordem de `weekday_index` dos dias que não são descanso (`src/utils/workoutSequence.ts`). **Não** é definido pelo dia da semana.
10. **Totais de dieta.** Ignoram refeições com `isAlternative: true`. Substitutos com `kcal: 0` não exibem calorias.

## Design

Tema escuro suave, inspirado no Spotify. Use os tokens de `src/utils/theme.ts`, com fundo `#1A1A1C`, verde `#1DB954` e cores de categoria mais dessaturadas. O Luiz pediu explicitamente **menos contraste e menos escuridão**. O app não usa bi-sets nos treinos.

## Pendências imediatas

- Gerar um novo APK do Luiz com as últimas mudanças (anotações, correções de data e de autenticação).
- O Git de linha de comando não é encontrado na máquina do Luiz. O GitHub Desktop usa um Git embutido próprio. Corrija o PATH ou reinstale o Git.
- O token do GitHub colado no chat antigo deve ser **revogado**.

## Roadmap (decidido com o Luiz, nesta ordem)

### 1. Cada usuário com seus próprios planos (base para os itens seguintes)
- Treinos e dietas passam a ter dono (`owner_id`), com RLS por dono. Migre os dados do Luiz e da esposa sem perder histórico de conclusões, checks e anotações.
- Conta nova começa **sem programa** e cai numa tela de onboarding. Altere o `handle_new_user`.

### 2. Onboarding com o Claude gerando o treino
- Questionário estruturado: objetivo, experiência, dias por semana, minutos por sessão, equipamentos, lesões, preferências e um campo livre.
- **Supabase Edge Function** guarda `ANTHROPIC_API_KEY` como segredo. **Nunca** coloque a chave no app.
- A função chama a API do Claude com saída estruturada (JSON schema), valida o resultado e grava o programa no nome do usuário.
- Proteções: limite de gerações por usuário e idade mínima de 18 anos.
- Gerar **apenas treino**. A dieta não deve ser gerada por IA: a prescrição dietética é privativa do nutricionista no Brasil (Lei 8.234/91). Mantenha a dieta como "pendente" ou permita cadastrar o plano do nutricionista. Inclua um aviso de que o treino é uma sugestão.
- LGPD: dados de saúde são dados pessoais sensíveis. Exija consentimento explícito no cadastro e ofereça política de privacidade e exclusão de conta.

### 3. Publicação na Google Play
- Conta Play Console: taxa única de US$ 25.
- Conta pessoal nova exige **teste fechado com 12 testadores por 14 dias seguidos** antes de pedir acesso à produção.
- Apps novos precisam ter como alvo a **API 36 (Android 16)**. Isso exige atualizar o Expo SDK, que hoje é o 51 com alvo na API 34. Teste o comportamento de "voltar preditivo" do Android 16.
- Itens obrigatórios: política de privacidade, formulário de Segurança dos dados, **exclusão de conta dentro do app**, e cadastrar no Google Cloud o SHA-1 da **chave de assinatura da Play** (sem isso, o login com Google quebra).
- iOS nativo está fora do escopo por enquanto (custo do Apple Developer Program). O iPhone continua atendido pela versão web.

## Contas e configurações externas (sem segredos aqui)

- **Google Cloud**, projeto "MeuPlano": a tela de consentimento OAuth está em modo **Teste**, e a conta da esposa está cadastrada como usuária de teste. Para abrir o app ao público, é preciso **publicar**, o que exige páginas de início e de política de privacidade no Branding.
- **Supabase Auth:** Site URL `https://luiz29042001.github.io`, Redirect URL `https://luiz29042001.github.io/**`. O provedor Google está configurado com o Web Client ID e o secret.
- **EAS:** conta `luiz2904s-team`, projeto `app-saude`. O keystore é gerenciado pelo EAS.
