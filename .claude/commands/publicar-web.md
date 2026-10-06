---
description: Publica a versao web/PWA (GitHub Pages) apos checagens e confirmacao do Luiz
model: claude-opus-5-5
argument-hint: [observacao opcional]
---
Publique a versao web do app para a Usuária 2 e demais usuarios. Observacao dele (se houver): $ARGUMENTS

O Luiz nao e desenvolvedor: explique em portugues simples. Publicar altera um site PUBLICO (https://luiz29042001.github.io), entao a confirmacao dele e obrigatoria antes do envio. Nunca peca senha ou token no chat.

## 1. Verificacoes (sem perguntar)
- `npx tsc --noEmit -p .` sem erros.
- Gerar o site: `npx expo export --platform web --output-dir dist`. Se falhar, nao publique: conserte ou explique o problema.

## 2. Localizar o repositorio de publicacao
Procure no CLAUDE.md a linha "Pasta local do repositorio github.io". Se nao existir, pergunte ao Luiz UMA vez onde essa pasta esta no computador (ele pode ver o caminho no GitHub Desktop: Repository > Show in Explorer) e, com o OK dele, registre o caminho no CLAUDE.md na secao "Contas e configuracoes externas".

## 3. Preparar os arquivos (ainda sem publicar)
Na pasta do repositorio github.io: substituir TODO o conteudo pelo conteudo de `dist`, preservando a pasta `.git` e garantindo que existe o arquivo `.nojekyll` na raiz (sem ele, o GitHub Pages ignora a pasta `_expo` e o site quebra).

## 4. Confirmacao (obrigatoria)
Resuma ao Luiz, em portugues simples: o que muda para quem usa o app (a partir do trabalho recente) e que isso vai ao ar para todos. Espere um OK claro.

## 5. Enviar
- Se o `git` funcionar (`git --version`): commit na branch `main` com mensagem descritiva e `git push`. Nunca use force push. Se o push pedir login ou falhar por permissao, nao tente contornar: va para a opcao abaixo.
- Se o git nao estiver disponivel (pendencia conhecida da maquina do Luiz) ou o push falhar: deixe os arquivos prontos na pasta e guie o Luiz no **GitHub Desktop**: abrir o repositorio, conferir que aparecem as mudancas, escrever um resumo, "Commit to main" e "Push origin". Um passo por vez.

## 6. Depois do envio
- Diga que o GitHub leva cerca de 1 a 2 minutos para atualizar. Quando possivel, confira se https://luiz29042001.github.io responde; se nao conseguir conferir, peca ao Luiz para abrir.
- Avise: no iPhone da Usuária 2, pode ser preciso fechar totalmente o app e reabrir (ou recarregar a pagina) para ver a versao nova.
