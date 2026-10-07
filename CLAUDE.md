# CLAUDE.md — Meu Plano

Contexto do projeto para o Claude Code. Leia antes de qualquer alteração.

## Sobre o usuário

- **Luiz** é o dono do projeto e **não é desenvolvedor**. Explique em português do Brasil, de forma simples e direta, sem jargão.
- Ele prefere que você **execute** as mudanças. Evite pedir que ele cole código ou edite arquivos à mão.
- Antes de qualquer ação destrutiva no banco de produção ou no repositório, explique o que vai fazer e peça confirmação.
- Interface do app sempre em **pt-BR**.

## Regras gerais do Luiz (cópia de `~/.claude/CLAUDE.md`, para valer também na nuvem)

- **OK explícito antes de:** aplicar migração/SQL de escrita, publicar (web, `git push`), gerar build EAS, apagar arquivos/dados/branches, mudar configurações de serviços externos, instalar programas. Leitura não precisa de OK. Nunca peça senha ou token no chat. **Commit local é livre** (faça no turno em que o trabalho termina, sem pedir); **`git push` só com OK do Luiz**, e peça **uma vez por bloco de trabalho**, listando o que sobe — não a cada commit.
- **Modelos (economia de tokens, decisão do Luiz 07/10/2026):** padrão **Sonnet 5.5** (`claude-sonnet-5-5`) para todos os agentes e comandos. **Opus 5.5** (`claude-opus-5-5`) só no muito estratégico: revisão de segurança de migração/RLS/Edge Function (acionar o code-reviewer com `model: opus` nessa execução), impasse de QA na 3ª rodada e planejamento de funcionalidade nova de alto risco (ex.: IA/geração de treino). Nunca `fable`.
- **Onde roda:** no notebook (Windows: `npx.cmd` no PowerShell; `gh`, `eas` e Supabase CLI já logados; Supabase já linkado) ou na nuvem (Linux: `npx` normal; chaves do Expo e do Supabase via Credenciais de API do ambiente; o link do Supabase e o login do EAS NÃO existem lá). Testado na nuvem em 06/10/2026: **EAS funciona** com `EXPO_TOKEN=placeholder npx eas-cli@latest <comando>` (o proxy troca pelo token real; `whoami` → luiz2904); **Supabase funciona pela Management API** (`curl https://api.supabase.com/v1/projects/SEU_PROJECT_REF/database/query -d '{"query":"..."}'`; esse endpoint também ESCREVE, então mesma regra de OK para qualquer SQL de escrita); `db push` pela CLI segue no notebook. O Playwright MCP do `.mcp.json` só roda no Windows; na nuvem use o `playwright` global (`require($(npm root -g)/playwright)`) com o Chromium pré-instalado. Todo trabalho vai para o GitHub para a outra máquina enxergar.

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
supabase/migrations/         migrações no formato do Supabase CLI (base + 3 já aplicadas; pendentes listadas em Banco de dados)
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

O trigger `handle_new_user`, disparado no cadastro, cria o perfil com o programa `fem-5x` e **sem dieta**. **Isso é provisório e deve mudar no Roadmap item 1** (conta nova sem programa + onboarding).

Migrações em `supabase/migrations/`. Já aplicadas em produção (pelo SQL Editor): `20260717000000_schema_base` → `20260927200000_multi_program` → `20260927210000_diet_and_glute_focus` → `20260929120000_exercise_notes`. A base **não** reflete as posteriores; o estado real é a soma de todas. Aplicada via CLI em 06/10/2026: `20261005120000_seguranca_perfil_rls` (o app só pode atualizar `full_name`, `diet_variant`, `updated_at` no perfil; trigger `protect_profile_access_columns`; RLS explícita nas 9 tabelas; `profiles.diet_fixed` = true só no Luiz; conta nova recebe `fem-5x` **sem** dieta). Detalhes: `docs/tech/correcoes-revisao-2026-10-05-backend.md`.

**Supabase CLI integrado** (06/10/2026): projeto já linkado e logado; histórico de migrações sincronizado. Rode via `npx.cmd supabase ...` (o PowerShell bloqueia `npx.ps1`). Fluxo: `db push --dry-run` → explicar ao Luiz → OK → `db push` → conferência com `db query --linked -f <arquivo.sql>` (somente leitura não precisa de OK).

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

**Fonte da verdade dos tokens:** `src/utils/theme.ts`. Direção visual e regras detalhadas: @docs/design/design-system.md. Nenhuma cor, fonte ou espaçamento solto no código: só tokens.

## Pipeline de desenvolvimento (agentes especializados)

Agentes em `.claude/agents/`, cada um com contexto isolado. Eles se comunicam por **arquivos** em `docs/`. Para tela ou funcionalidade nova, use `/new-screen <nome e objetivo>`. Para revisar mudanças soltas, use `/review-changes`.

Comandos de apoio, todos com confirmação do Luiz antes de qualquer envio ou mudança externa:
- `/gerar-apk`: checa o código e gera o APK Android (EAS), com instruções de instalação.
- `/publicar-web`: gera a web, e publica no GitHub Pages (ou guia pelo GitHub Desktop se o `git` não funcionar).
- `/preparar-qa`: guia o setup único do QA com login (conta de teste, Google Cloud, Supabase, Playwright).

| Agente | Papel | Modelo | Escreve em |
|---|---|---|---|
| tech-lead | arquitetura, plano técnico, critérios de aceite | Sonnet 5.5 (Opus só quando indicado) | `docs/tech/` |
| design-director | direção visual, spec e mockup da tela | Sonnet 5.5 (Opus só quando indicado) | `docs/design/` |
| backend-engineer | Supabase: migrações, RLS, serviços | Sonnet 5.5 (Opus só quando indicado) | código + `supabase/migrations/` |
| ui-builder | implementa a tela conforme spec | Sonnet 5.5 | código de UI |
| qa-tester | valida a versão web via Playwright MCP | Sonnet 5.5 | `docs/qa/` |
| code-reviewer | revisa as mudanças | Sonnet 5.5 (Opus só quando indicado) | `docs/review/` |

Critério dos modelos: Sonnet por padrão em tudo (volume alto, falha verificável). Opus só onde a falha é cara e silenciosa: revisão de segurança de banco/RLS/Edge Function e impasses. Sempre que uma migração mexer em dados de produção, a revisão dessa migração é feita em Opus.

Fluxo: tech-lead + design-director (em paralelo) → **Luiz aprova** → backend-engineer (se houver dados) → ui-builder → qa-tester (**uma rodada**; nova só se reprovou) → code-reviewer (só antes de lançar versão ou em mudança de banco/RLS). Quem constrói nunca se auto-aprova. Tamanho decide o fluxo: **pequeno** (até ~3 arquivos, ajuste visual) = a sessão principal faz direto; **médio** = ui-builder + conferência; **grande ou com banco** = pipeline completo.

### Regras do pipeline

- **Teto de modelo: Opus 5.5**, e Sonnet 5.5 como padrão. Nunca usar `fable` nem qualquer modelo que consuma créditos. Opus só nas exceções da regra de modelos acima.
- **Resumos para o Luiz** (ele não é desenvolvedor): pt-BR simples, sem jargão. Dizer o que muda no app do ponto de vista dele e o que ele precisa fazer (ex.: gerar novo APK, publicar a web).
- **Só existe um ambiente do Supabase: produção.** Nenhum agente aplica migração, roda SQL ou executa `supabase db push` sem o Luiz confirmar. Os agentes apenas criam o arquivo em `supabase/migrations/`; a sessão principal explica o impacto em português simples e pede o OK.
- **Não há suíte de testes nem lint.** A validação é: `tsc`, os dois bundles (Android e web), QA na web e revisão. O QA guarda seu roteiro em `tests/qa/` (criar na primeira vez, com simulador do Supabase por `page.route`, e estender a cada tela). Se esse roteiro virar comando, registrar aqui.
- Antes de entregar, vale a regra já existente: `tsc` + bundle de Android e de web compilando.
- O `git` de linha de comando funciona (Git for Windows em `D:\Git`, reinstalado em 05/10/2026). Se um dia faltar, o code-reviewer revisa os arquivos listados no relatório do ui-builder / backend-engineer.

### Fluxo enxuto (economia de tokens — vindo do PetPlace, 07/10/2026)

Medição no PetPlace (181 M tokens processados em 25 h): 37% foi a conversa principal (contexto inflado de ~130 mil para ~445 mil tokens por chamada), 24% o ui-builder, 20% o QA, 7% backend, 5% revisor, 3% design, 3% tech-lead. O gasto é sobretudo **releitura de contexto** a cada chamada. Regras que valem aqui:
- **Uma sessão (contexto) por funcionalidade.** Ao terminar, registrar a "Retomada" em `docs/retomada.md` (não no CLAUDE.md, que é carregado em toda conversa) e usar `/clear`.
- **Sem checkpoint visual para telas no estilo já aprovado** (pedir aprovação visual só se mudar paleta/fontes/navegação).
- **Planejamento enxuto:** sem mudança de banco e sem padrão visual novo, um único agente de planejamento escreve plano + spec curta; design-director só para padrão visual novo.
- **Verificação uma vez:** o ui-builder roda `tsc` + bundles + seus asserts. O QA não repete `tsc`/bundle Android e usa roteiro de testes **salvo no repositório** (criar `tests/qa/` com um simulador do Supabase via `page.route` e estendê-lo a cada tela, em vez de recriar). O revisor lê só o diff.
- **QA: uma rodada;** nova rodada só se reprovou, revalidando apenas os desvios + regressão pelos scripts. Poucas capturas de tela (máx. 6): preferir asserts de DOM/rede.
- **Correções pequenas** (até ~3 arquivos): a sessão principal faz direto. Maiores: agente NOVO com a lista curta, nunca retomar agente que já ficou pesado.
- **Relatórios dos agentes com no máximo 10 linhas;** detalhes em `docs/`. Commit e push no mesmo turno em que o agente termina.

### Limites do QA visual

- O Playwright só enxerga a **versão web** (a da Usuária 2 no iPhone). Ele **não cobre o Android** (APK do Luiz): problemas como texto cortado nas abas (armadilha 7) exigem conferência manual no APK. O qa-tester lista isso no relatório, na seção "Conferir no celular".
- O app exige login Google. O QA usa uma **conta de teste dedicada**, logada uma vez no navegador do Playwright (perfil `.playwright-profile/`). **Nunca usar as contas reais do Luiz ou da Usuária 2 para ações que gravam dados** (concluir treino, anotações, etc.).
- Subir o app web para o QA: `npx expo start --web` (http://localhost:8081).

### Limites inegociáveis (do Roadmap)

- Dieta **nunca** é gerada por IA (Lei 8.234/91). Treino gerado por IA leva aviso de que é sugestão.
- `ANTHROPIC_API_KEY` só como segredo da Edge Function. Nunca no app, nunca no repositório.
- Dados de saúde são dados pessoais sensíveis (LGPD): consentimento explícito, política de privacidade, exclusão de conta.
- Toda tabela com dado de usuário mantém RLS. Nunca usar `service_role` no app.

## Pendências imediatas

Estado do trabalho e próximos passos ficam em **`docs/retomada.md`** (leia ao começar). Resumo em 07/10/2026:
- Versão tema claro/escuro, cronômetro móvel e notificação Android: **web publicada**; APK de teste gerado (ainda com ícone antigo), **falta o Luiz conferir no celular** (lista em `docs/review/tema-claro-escuro.md`). Logo nova pronta no código, vai no próximo APK/web.
- Próximo APK só junto com mais mudanças (decisão do Luiz). Depois: atualizar `design-system.md` e a seção Design para a nova direção; `/lancar-versao`.
- O token do GitHub colado em chat antigo deve ser **revogado**.

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
- **Supabase Auth:** Site URL `https://luiz29042001.github.io`, Redirect URL `https://luiz29042001.github.io/**`. O provedor Google está configurado com o Web Client ID e o secret. O provedor **E-mail fica ligado de propósito** (decisão do Luiz, 06/10/2026: no futuro haverá login com e-mail e senha para quem não quiser Google). O app ainda não tem tela para isso.
- **GitHub:** `gh` CLI logado como `luiz29042001` (credencial do git via `gh auth setup-git`). Pasta local do repositório github.io: `D:\.Pessoal\.appsaude\luiz29042001.github.io`.
- **Integração completa:** Claude Code opera Supabase (CLI), GitHub (`gh`/git) e EAS (`eas`, logado como `luiz2904`). O Luiz só dá OK; não precisa abrir os painéis.
- **EAS:** conta `luiz2904s-team`, projeto `app-saude`. O keystore é gerenciado pelo EAS.
