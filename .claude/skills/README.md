# Skills usadas no processo (instalar à parte)

Os agentes de `.claude/agents/` chamam algumas skills públicas de terceiros. Elas **não vêm neste repositório** (são de outros autores). Instale estas para trabalhar do mesmo jeito que o projeto original. A lista tem **só** as skills que os agentes de fato usam.

| Skill | Quem usa | Para quê | Obrigatória? |
|---|---|---|---|
| `ui-ux-pro-max` | `design-director` | Pesquisar estilos, paletas, fontes e regras de usabilidade (inclusive para React Native) antes de desenhar uma tela | Recomendada: sem ela, o design-director desenha só com o design system do projeto |
| `web-design-guidelines` | `qa-tester` e `code-reviewer` | Revisar as telas alteradas contra boas práticas de interface (acessibilidade, formulários, foco, animação) | Recomendada: sem ela, os dois avisam no relatório e seguem sem essa checagem |
| `frontend-design` | `design-director` (se estiver instalada) | Direção estética para a interface não ficar com cara de modelo pronto | Opcional |

O design system do projeto (`docs/design/design-system.md` e `src/utils/theme.ts`) **vence** qualquer sugestão das skills.

## Como instalar

Rode na **pasta do projeto** (a raiz, onde está o `package.json`). Assim as skills ficam em `.claude/skills/`, que é onde os agentes as procuram.

### 1. `ui-ux-pro-max` (precisa de Python 3)

```bash
npx ui-ux-pro-max-cli init --ai claude
```
- Precisa do **Python 3** instalado (https://python.org; no Windows, marque "Add Python to PATH" no instalador). O script de busca não instala nada e não acessa a internet.
- Fonte: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- Instale **no projeto** (como acima), não como plugin global: o design-director chama o script pelo caminho `.claude/skills/ui-ux-pro-max/scripts/search.py`.

### 2. `web-design-guidelines`

```bash
npx skills add vercel-labs/agent-skills --skill web-design-guidelines -a claude-code
```
- Fonte: https://github.com/vercel-labs/agent-skills (Vercel).
- Precisa de internet na hora da revisão: ela baixa a versão mais recente das regras.

### 3. `frontend-design` (opcional, oficial da Anthropic)

Dentro do Claude Code, digite:
```text
/plugin install frontend-design@claude-plugins-official
```
Se o Claude Code disser que não conhece esse catálogo, rode antes `/plugin marketplace add anthropics/claude-plugins-official`.

## Conferir

Abra o Claude Code na pasta do projeto e pergunte: *"Quais skills você tem disponíveis?"*. Devem aparecer `ui-ux-pro-max` e `web-design-guidelines` (e `frontend-design`, se instalou).

> As pastas das skills instaladas ficam fora do Git (`.gitignore`), para não voltarem a ser publicadas junto com o projeto.
