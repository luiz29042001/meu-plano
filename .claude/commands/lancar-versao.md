---
description: Leva o trabalho pronto para produção de ponta a ponta (banco, web, APK, GitHub), com um OK do Luiz em cada passo
model: claude-opus-5-5
argument-hint: [observação opcional]
---
Lance uma nova versão do projeto atual. Observação do Luiz: $ARGUMENTS

Regras gerais valem (~/.claude/CLAUDE.md). Cada passo externo tem seu próprio OK; um OK não vale para o passo seguinte. Leia no CLAUDE.md do projeto: comandos de validação, plataformas, hospedagem da web, perfil EAS, pasta do repositório da web.

## 1. Pré-voo (sem perguntar)
- `git status`: liste o que vai entrar na versão. Se houver mudanças sem QA/revisão, avise e sugira `/revisar-mudancas` antes.
- Checagem de tipos e builds de todas as plataformas compilando. Falhou: não lance; conserte ou explique.
- Migrações pendentes: `npx.cmd supabase migration list` (local x remoto).
- Monte o **resumo da versão** (3 a 6 linhas, do ponto de vista de quem usa) e a **ordem**: banco antes do app quando o app novo depende do banco novo (e confirme que o app antigo continua funcionando com o banco novo).

## 2. Banco (se houver migração pendente) — OK 1
Explique em português simples o que muda e o risco; `db push --dry-run`; OK; `db push`; consultas de conferência (somente leitura) e resultado.

## 3. Web (se o projeto tiver web) — OK 2
Siga `/publicar-web` (gerar, copiar para o repositório da web preservando `.git` e `.nojekyll`, commit, push, conferir o site no ar).

## 4. Android (se houver mudança que afete o app nativo) — OK 3
Siga `/gerar-apk` (perfil `preview`, sem esperar; link do build e instruções de instalação).
Mudança só de JavaScript também exige APK novo enquanto o projeto não usar atualização pela internet (EAS Update).

## 5. Código no GitHub — OK 4 (pode ser junto com o OK 2 se o Luiz preferir)
Commit no repositório do app com mensagem descritiva em português e o rodapé de coautoria padrão; `git push`. Nunca force push. Se a branch remota estiver à frente, traga as mudanças (`git pull --ff-only`) antes; conflito → pare e explique.

## 6. Fechamento
- Resumo: o que foi ao ar, onde, links (site, build EAS), o que cada usuário precisa fazer (instalar APK, reabrir o app web).
- Lista "Conferir no celular" (do QA).
- Atualize o CLAUDE.md do projeto (pendências resolvidas, migrações aplicadas, decisões novas).
