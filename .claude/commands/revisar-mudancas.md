---
description: Revisa as mudanças atuais do projeto (code-reviewer e, se houver UI alterada, qa-tester)
model: claude-sonnet-5-5
argument-hint: [contexto opcional]
---
Revise as mudanças atuais do projeto. Contexto adicional: $ARGUMENTS

1. Acione o **code-reviewer** (ele usa `git diff`/`git status`). Relatório em docs/review/.
2. Se as mudanças tocarem telas, componentes ou estilos, acione também o **qa-tester** para validar a versão web das telas afetadas.
3. Entregue ao Luiz um resumo em português simples: o que está bom, o que precisa ser corrigido (bloqueantes primeiro) e o que conferir no celular. Não edite código sem ele pedir.
