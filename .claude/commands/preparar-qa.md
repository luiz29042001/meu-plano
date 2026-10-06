---
description: Guia passo a passo o setup unico do QA com login (conta de teste, Google Cloud, Supabase, Playwright)
model: claude-sonnet-5-5
argument-hint:
---
Guie o Luiz pelo setup unico do QA automatico. Ele nao e desenvolvedor: va UM passo por vez, em portugues simples, e espere ele dizer "feito" antes do proximo. Nunca peca senha ou token no chat: o login e digitado por ele mesmo na janela do navegador.

Contexto: o app exige login Google e usa um unico Supabase (producao). Por isso o QA usa uma conta de teste dedicada, nunca as contas reais dele ou da Usuária 2.

## Parte A - O que voce verifica sozinho
1. `claude mcp list`: o servidor `playwright` aparece conectado? Se nao, explique e ajude a corrigir (no Windows nativo: `claude mcp add --scope project playwright -- cmd /c npx @playwright/mcp@latest --user-data-dir .playwright-profile`).
2. `.gitignore` contem `.playwright-profile/`? Se nao, adicione (a pasta guarda sessoes de login).
3. Registre no resumo final o que ja estava pronto.

## Parte B - O que so o Luiz pode fazer (guie, um por vez)
1. **Conta Google de teste.** Criar uma conta Google nova so para testes do app. (Anotar o e-mail; a senha fica so com ele.)
2. **Google Cloud** (projeto "MeuPlano"): na tela de consentimento OAuth / Google Auth Platform, secao de usuarios de teste (o menu pode se chamar "Publico" ou "Audience"), adicionar o e-mail da conta de teste. Isso e necessario porque o app ainda esta em modo Teste.
3. **Supabase** (painel do projeto app_saude): Authentication > URL Configuration > Redirect URLs, adicionar `http://localhost:8081/**`. Explique em uma frase: isso permite que o login volte para o app rodando no computador dele durante os testes; ele pode remover depois. Sem isso o login volta para o site publicado.
Reforce que os passos 2 e 3 sao configuracoes de producao e que a decisao e dele; se ele preferir nao fazer, o QA funcionara so ate a tela de login.

## Parte C - Primeiro login
1. Suba o app web em background: `npx expo start --web` (http://localhost:8081).
2. Use o Playwright MCP (diga explicitamente "playwright mcp") para abrir http://localhost:8081. Uma janela do navegador abre.
3. Peca ao Luiz para entrar com a **conta de teste** nessa janela.
4. Quando ele avisar, tire um screenshot para confirmar que chegou na Home e que a sessao ficou salva.

## Parte D - Fechamento
- Registre no CLAUDE.md, na secao "Limites do QA visual", a linha: "QA com login configurado (conta de teste dedicada, perfil `.playwright-profile/`)". Nao registre e-mails nem senhas.
- Explique ao Luiz que agora `/new-screen` e `/review-changes` conseguem testar telas logadas.
- Lembre: a conta nova cai no programa provisorio da esposa (trigger `handle_new_user`), o que serve para testar e muda no Roadmap item 1.
