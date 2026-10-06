---
description: Revisa as mudancas atuais do projeto (code-reviewer e, se houver UI alterada, qa-tester)
model: claude-sonnet-5-5
argument-hint: [contexto opcional]
---
Revise as mudancas atuais do projeto. Contexto adicional: $ARGUMENTS

O Luiz nao e desenvolvedor: o resumo final deve estar em portugues simples.

1. Acione o **code-reviewer**. Ele tenta `git diff`; se o git nao estiver disponivel, ele revisa os arquivos que voce listar (informe-lhe quais arquivos foram alterados, se souber). Relatorio em docs/review/.
2. Se as mudancas tocarem telas, componentes ou estilos, acione tambem o **qa-tester** para validar a versao web das telas afetadas.
3. Entregue um resumo unificado: o que esta bom, o que precisa ser corrigido (bloqueantes primeiro) e o que o Luiz deve conferir no Android. Nao edite codigo sem ele pedir.
