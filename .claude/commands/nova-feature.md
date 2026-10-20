---
description: Pipeline completo para criar ou redesenhar uma tela/funcionalidade (plano + design, aprovação, dados, build, QA, revisão)
model: claude-opus-5-5
argument-hint: <nome e objetivo> [--auto]
---
Execute o pipeline completo para: $ARGUMENTS

O Luiz não é desenvolvedor: tudo que você disser a ele em português simples. Os agentes têm contexto isolado e se comunicam por arquivos em docs/. Se o projeto tiver agentes próprios em `.claude/agents/`, eles têm prioridade sobre os gerais.

## Etapa 1 — Planejamento (em paralelo)
- **tech-lead** → docs/tech/<feature>.md
- **design-director** → docs/design/<tela>.md + docs/design/<tela>.html (mockup)
**Checkpoint** (a menos que $ARGUMENTS contenha `--auto`): abra o mockup no navegador do Luiz e diga em linguagem simples (1) a ideia visual, (2) o que muda por trás, (3) se exige nova build nativa e/ou nova publicação web, (4) divergências entre plano e spec com sua recomendação. Espere o OK.

## Etapa 2 — Dados e base (se o plano tiver tarefas do backend-engineer)
- **backend-engineer** cria migrações (sem aplicar), serviços, hooks e dependências.
- Migração nova: explique o impacto em português simples (lendo docs/tech/<feature>-backend.md), rode `db push --dry-run`, peça OK, aplique, rode as consultas de conferência e mostre o resultado.

## Etapa 3 — Construção
- **ui-builder** implementa conforme spec e plano (checagem de tipos + builds de todas as plataformas).

## Etapa 4 — QA (máx. 3 rodadas)
- **qa-tester** valida a web e escreve docs/qa/<feature>.md (conta de teste, nunca contas reais).
- REPROVADO: desvios → ui-builder (ou backend-engineer) → QA de novo.
- Sem login no navegador do QA: pare e sugira `/preparar-qa`.
- Mesmo desvio em 2 rodadas: na 3ª, acione o corretor com o modelo `claude-opus-5-5` (nunca fable).
- 3 rodadas sem aprovar: pare e explique o impasse.

## Etapa 5 — Revisão
- **code-reviewer** → docs/review/<feature>.md. Bloqueantes voltam para correção e QA.

## Etapa 6 — Fechamento
Resumo curto ao Luiz: o que mudou para quem usa; resultado do QA e da revisão; o que conferir no celular; o que falta (`/lancar-versao`). Não publique nem faça commit sem ele pedir.
