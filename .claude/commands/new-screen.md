---
description: Pipeline completo para criar ou redesenhar uma tela (plano tecnico + design, build, QA, review)
model: claude-sonnet-5-5
argument-hint: <nome da tela e objetivo> [--auto]
---
Execute o pipeline completo para: $ARGUMENTS

Lembrete: o Luiz nao e desenvolvedor. Tudo que voce disser a ele deve estar em portugues simples, sem jargao. Os agentes tem contexto isolado e se comunicam por arquivos em docs/.

## Regras de eficiencia (decisao do Luiz, 07/10/2026 - economizar tokens; valem sobre as etapas abaixo)
- **Uma sessao (contexto) por tela/funcionalidade:** ao terminar, registre a "Retomada" no CLAUDE.md e peca ao Luiz para usar `/clear`.
- **Planejamento:** sem mudanca de banco e sem padrao visual novo, um unico agente de planejamento (tech-lead) escreve plano + spec curta; design-director so para padrao visual novo. Telas no estilo ja aprovado dispensam o checkpoint visual.
- **Verificacao uma vez:** o ui-builder roda tsc + bundles + asserts; o QA NAO repete tsc/bundle Android e usa o roteiro `tests/qa/`; o revisor le so o diff.
- **QA: uma rodada** (nova so se reprovou, revalidando os desvios + regressao pelos scripts). Poucas capturas de tela.
- **Correcoes pequenas** (ate ~3 arquivos): a sessao principal faz direto; maiores: agente NOVO com lista curta, nunca retomar agente pesado.
- **Relatorios dos agentes: max. 10 linhas.** Commit e push no mesmo turno em que o agente termina.
- **Modelos:** Sonnet para tudo; Opus so para revisao de seguranca de migracao/RLS/Edge Function e impasse de QA na 3a rodada.

## Etapa 1 - Planejamento (em paralelo)
Acione ao mesmo tempo:
- **tech-lead** -> docs/tech/<feature>.md
- **design-director** -> docs/design/<tela>.md e docs/design/<tela>.html (mockup)

**Checkpoint de aprovacao:** a menos que $ARGUMENTS contenha `--auto`, PARE aqui. Diga ao Luiz, em linguagem simples: (1) a ideia visual da tela, (2) o que muda por tras (dados, se houver), (3) o caminho do mockup `docs/design/<tela>.html` para ele abrir no navegador, e (4) se vai exigir novo APK e/ou nova publicacao da web. Espere o OK antes de seguir.

## Etapa 2 - Dados (somente se o plano tiver tarefas de backend)
- **backend-engineer** cria as migracoes e servicos (sem aplicar nada no banco).
- Se houver migracao nova: PARE e explique ao Luiz, em portugues simples, o que ela muda e o risco para os dados existentes (le docs/tech/<feature>-backend.md). So aplique no Supabase (producao) depois do OK explicito dele.

## Etapa 3 - Construcao
- **ui-builder** implementa conforme spec e plano (inclui tsc e bundles Android e web).

## Etapa 4 - QA (repete, maximo 3 vezes)
- **qa-tester** valida a versao web e escreve docs/qa/<feature>.md. Ele usa conta de teste, nunca as contas reais.
- Se REPROVADO: envie os desvios ao **ui-builder** (ou **backend-engineer**) e rode o QA de novo.
- Se o QA nao conseguir logar (setup ainda nao feito), PARE e sugira ao Luiz rodar `/preparar-qa`. Se so faltar o login, avise-o para entrar na conta de teste na janela do navegador que abriu.
- **Escalonamento de modelo:** se o mesmo desvio sobreviver a 2 rodadas, na 3a rodada acione o agente corretor (ui-builder ou backend-engineer) pedindo explicitamente o modelo **claude-opus-5-5** para essa execucao (nunca fable ou outro modelo fora do teto do projeto), em vez do padrao dele.
- Apos 3 rodadas sem aprovar, pare e explique o impasse.

## Etapa 5 - Revisao
- **code-reviewer** escreve docs/review/<feature>.md.
- Se houver bloqueantes: corrija via ui-builder/backend-engineer e rode o QA de novo.

## Etapa 6 - Fechamento (portugues simples)
Resumo curto para o Luiz:
- O que mudou no app, do ponto de vista de quem usa.
- Resultado do QA e da revisao em uma frase cada.
- **O que ele precisa conferir no Android** (lista da secao "Conferir no celular" do relatorio do QA).
- **O que ele precisa fazer**: gerar novo APK (`/gerar-apk`)? publicar a web (`/publicar-web`)? aplicar migracao?
Nao faca commit nem publicacao sem ele pedir.
