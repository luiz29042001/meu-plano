---
description: Gera um novo APK Android do app (EAS) com checagens antes e instrucoes de instalacao depois
model: claude-sonnet-5-5
argument-hint: [observacao opcional]
---
Gere um novo APK do app para o Luiz. Observacao dele (se houver): $ARGUMENTS

O Luiz nao e desenvolvedor: explique tudo em portugues simples, sem jargao, e nunca peca para ele editar arquivos ou colar codigo.

## 1. Verificacoes (voce faz, sem perguntar)
- `npx tsc --noEmit -p .` sem erros.
- Bundle Android compilando: `npx expo export --platform android --output-dir .tmp-export-android`. Apague a pasta temporaria depois.
- Se algo falhar, NAO gere o APK: conserte (ou, se for grande, explique ao Luiz o problema em linguagem simples) e rode as verificacoes de novo.

## 2. Preparacao
- `git --version`: se o git nao for encontrado (pendencia conhecida da maquina do Luiz), use a variante `EAS_NO_VCS=1`; se encontrado, use `EAS_NO_GIT_STATUS_CHECK=1`.
- `eas whoami`: se nao estiver logado, peca ao Luiz para rodar `eas login` ele mesmo no terminal. Nunca peca senha ou token no chat.
- Veja o que mudou desde o ultimo APK (docs/qa, docs/review, historico recente do trabalho) e prepare um resumo de 3 a 6 linhas, do ponto de vista de quem usa o app.

## 3. Confirmacao (obrigatoria)
Diga ao Luiz: o que o novo APK traz (o resumo acima), que a geracao roda nos servidores do EAS, leva alguns minutos e consome uma das geracoes do plano dele. Espere um OK claro.

## 4. Gerar
Perfil `preview`, sem esperar: `eas build --platform android --profile preview --no-wait`, com a variavel de ambiente escolhida acima. Adapte a sintaxe da variavel ao terminal em uso (cmd: `set VAR=1 && comando`; PowerShell: `$env:VAR='1'; comando`; bash: `VAR=1 comando`).

## 5. Entrega ao Luiz (portugues simples)
- O link da pagina do build (conta luiz2904s-team, projeto app-saude) e onde acompanhar o andamento.
- Como instalar: abrir o link no celular Android, baixar o APK quando estiver pronto e instalar por cima do app atual. Normalmente isso mantem login e dados; se o Android recusar a instalacao, ele deve avisar voce.
- A lista "Conferir no celular" do ultimo relatorio de QA (docs/qa/), para ele testar logo apos instalar.
