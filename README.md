# Meu Plano

App pessoal de **treino e dieta**, em uso real por duas pessoas (Android via APK e iPhone via PWA). Construído de ponta a ponta por [Luiz Felipe](https://github.com/luiz29042001), que **não vem de formação em programação**: o projeto mostra como conduzir produto, arquitetura e qualidade orquestrando agentes de IA especializados.

[![CI](https://github.com/luiz29042001/meu-plano/actions/workflows/ci.yml/badge.svg)](https://github.com/luiz29042001/meu-plano/actions/workflows/ci.yml)

> **English summary.** A workout & diet tracking app (React Native/Expo, TypeScript, Supabase with row-level security on every table, a native Kotlin module for the rest-timer notification) used daily by two people on Android and iOS/PWA. It was built end to end by one person with a role-separated AI-agent pipeline (tech lead → design director → human approval → backend → UI → QA → code review), documented in `.claude/` and `docs/`. The commit history is intact (personal data was scrubbed from every commit). Docs are in Brazilian Portuguese.

> Os dados pessoais (dietas reais, prescrição de nutricionista, chaves e IDs do projeto) foram removidos de todo o histórico. A dieta aqui é um exemplo fictício e as chaves são placeholders.

## O que o app faz
- Programas de treino por usuário (ex.: Superior/Inferior 4x, Inferior/Superior + Glúteos 5x), com próximo treino calculado pelo último concluído, séries marcadas, anotações de carga por exercício e cronômetro de descanso (notificação no Android).
- Plano alimentar por usuário (fixo no código ou vindo do banco), com variantes e substitutos.
- Calendário de conclusões, tema claro/escuro, login com Google.

## Stack
React Native 0.74 + Expo SDK 51 + TypeScript · React Navigation · Supabase (Postgres, Auth, **RLS em todas as tabelas**) · módulo nativo Kotlin para a notificação do cronômetro · EAS (APK) · web/PWA no GitHub Pages.

## Segurança (decisões que valem destaque)
- RLS explícita nas 9 tabelas; o app só consegue alterar colunas permitidas do próprio perfil (grant + trigger `protect_profile_access_columns`) — ver `supabase/migrations/20261005120000_seguranca_perfil_rls.sql`.
- Nunca `service_role` no app; segredos só em Edge Function; dieta nunca gerada por IA (Lei 8.234/91); dados de saúde tratados conforme a LGPD.
- Auditorias e correções documentadas em `docs/review/` e `docs/tech/`.

## Como foi construído: pipeline de agentes
O desenvolvimento segue um fluxo com papéis separados, definidos em [`.claude/agents/`](.claude/agents) e acionados por comandos em [`.claude/commands/`](.claude/commands). **Quem constrói nunca se aprova.**

| Agente | Papel | Entrega em |
|---|---|---|
| tech-lead | arquitetura, plano técnico, critérios de aceite | `docs/tech/` |
| design-director | direção visual, spec e mockup | `docs/design/` |
| backend-engineer | migrações, RLS, serviços (nunca aplica em produção) | `supabase/migrations/` |
| ui-builder | implementa a tela conforme a spec | código |
| qa-tester | valida a versão web (Playwright) | `docs/qa/` |
| code-reviewer | revisão de corretude e segurança | `docs/review/` |

Fluxo: planejamento + design → **aprovação humana** → dados → UI → QA → revisão → publicação, sempre com OK humano antes de qualquer ação em produção. Os modelos são escolhidos por custo/risco (modelo médio por padrão; o mais forte só em revisão de segurança e impasses). O [`CLAUDE.md`](CLAUDE.md) é o "manual do projeto" lido pelos agentes — regras, armadilhas já resolvidas e decisões.

**Para navegar a evolução:** o histórico de commits conta a história (versão inicial → multi-programa → web/PWA → segurança → redesign → fluxo enxuto de agentes). Veja também `docs/retomada.md`, `docs/roadmap.md` e os relatórios em `docs/review/`.

## Estrutura
```
App.tsx · src/{screens,components,hooks,services,contexts,utils,types}
modules/rest-timer/   módulo nativo Android (Kotlin): alarme e notificação do cronômetro
supabase/migrations/  schema, RLS e dados de programa, em ordem cronológica
.claude/              agentes e comandos do pipeline
docs/                 plano técnico, design, QA e revisões (uma pasta por papel)
public/               PWA (manifest, ícones)
```
Pontos de leitura sugeridos: `docs/review/` (revisões que acharam falhas reais e as correções), `docs/tech/` (planos e decisões) e as "Armadilhas já resolvidas" no `CLAUDE.md`.

## Rodando
```bash
npm install
# preencha app.json > expo.extra (supabaseUrl, supabaseAnonKey, client IDs do Google)
# e coloque o seu google-services.json na raiz
npx expo start --web      # web
npx tsc --noEmit -p .     # checagem de tipos
```
É preciso um projeto Supabase próprio com as migrações de `supabase/migrations/` aplicadas.
