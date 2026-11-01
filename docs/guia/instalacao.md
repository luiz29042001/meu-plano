# Guia de instalação do Meu Plano (do zero)

Este guia leva você de "não tenho nada" até **o app rodando no navegador, no iPhone (como app da tela de início) e no Android (APK)**, com **os seus próprios dados**: seu banco, seu login Google, sua conta Expo.

Não precisa saber programar. Onde dá para automatizar, tem comando pronto. Onde depende de você (criar contas, clicar em painéis), tem o passo a passo clique a clique.

> **Atalho com IA:** se você usa o Claude Code (ou outra IA que roda comandos), abra o projeto e diga: *"Siga o docs/guia/instalacao.md comigo. Faça você os passos de terminal e me guie nos passos de painel, um de cada vez."* Veja também [trabalhando-com-ia.md](trabalhando-com-ia.md).

---

## Visão geral

| Parte | O que é | Quem faz | Tempo |
|---|---|---|---|
| 0 | Instalar Node e Git no computador | você (instaladores) | 10 min |
| 1 | Copiar o projeto e instalar as dependências | comando | 5 min |
| 2 | Banco de dados (Supabase) | painel + 1 colagem | 10 min |
| 3 | Login com Google (Google Cloud) | painel | 20 min |
| 4 | Ligar tudo no app (`npm run configurar`) | comando com perguntas | 2 min |
| 5 | Primeiro teste no navegador + escolher seu treino | comando + 1 SQL | 5 min |
| 6 | Publicar a versão web (para usar no celular, inclusive iPhone) | painel/comando | 10 min |
| 7 | Gerar o APK Android | comando + 1 painel | 20 min (fila do Expo) |

Ao fim de cada parte há um **✅ Confira** dizendo como saber que deu certo. Se algo der errado, vá em [Problemas comuns](#problemas-comuns).

### Contas gratuitas que você vai precisar

- **GitHub** (guardar o código e publicar a web): https://github.com/signup
- **Supabase** (banco de dados e login): https://supabase.com/dashboard
- **Google Cloud** (permite "Entrar com Google"; use sua conta Google normal): https://console.cloud.google.com
- **Expo** (só para gerar o APK Android): https://expo.dev/signup

Todas têm plano gratuito suficiente para uso pessoal.

### Antes de começar: segurança

- **Nunca** cole senhas, tokens ou a chave `service_role` / `secret` do Supabase em chats, nem no código. O app só usa a chave **anon/publishable**, que é pública por natureza (a proteção real fica no banco, pela RLS).
- Dados de treino e dieta são **dados de saúde** (LGPD). Se for usar com outras pessoas, peça consentimento e saiba apagar a conta delas.

---

## Parte 0 — Preparar o computador

### Windows

1. **Node.js (versão LTS):** baixe em https://nodejs.org → botão "LTS" → instale clicando em "Next" até o fim (deixe as opções padrão).
2. **Git:** baixe em https://git-scm.com/download/win → instale com as opções padrão.
3. Abra o **PowerShell** (tecla Windows → digite "PowerShell" → Enter) e teste:
   ```powershell
   node -v
   git --version
   ```
   Deve aparecer algo como `v22.x.x` e `git version 2.x`.

> **Importante no Windows:** o PowerShell às vezes bloqueia `npx`. Se aparecer erro de "execução de scripts desabilitada", use **`npx.cmd`** no lugar de `npx` em todos os comandos deste guia (ex.: `npx.cmd expo start --web`).

### Mac

1. Instale o Node LTS em https://nodejs.org.
2. Abra o **Terminal** e rode `git --version`. Se o Mac pedir para instalar as "ferramentas de linha de comando", aceite.

✅ **Confira:** `node -v` e `git --version` respondem com números de versão.

---

## Parte 1 — Copiar o projeto

1. Entre no GitHub, abra a página do projeto e clique em **Fork** (canto superior direito) → **Create fork**. Agora você tem uma cópia sua.
2. No PowerShell/Terminal, escolha uma pasta e baixe a sua cópia (troque `SEU-USUARIO`):
   ```bash
   cd Documents
   git clone https://github.com/SEU-USUARIO/meu-plano.git
   cd meu-plano
   ```
3. Instale as dependências **exatamente** nas versões testadas (não use `npm install` aqui; o `ci` respeita o `package-lock.json`):
   ```bash
   npm ci
   ```

✅ **Confira:** o comando termina sem `ERR!` e aparece a pasta `node_modules`.

---

## Parte 2 — Banco de dados (Supabase)

### 2.1 Criar o projeto

1. Acesse https://supabase.com/dashboard → **New project**.
2. Preencha: **Name** `meu-plano`; **Database Password**: clique em *Generate* e guarde num gerenciador de senhas (você quase nunca vai precisar dela); **Region**: *South America (São Paulo)*.
3. Clique **Create new project** e espere ~2 minutos.

### 2.2 Criar as tabelas (colar as migrações)

As "migrações" são os arquivos que montam o banco: tabelas, regras de segurança e os dois programas de treino que já vêm prontos. Ficam em `supabase/migrations/` e **precisam rodar em ordem**.

**Jeito mais simples (pelo navegador):**

1. No Supabase, menu da esquerda → **SQL Editor** → **New query**.
2. Abra o primeiro arquivo da lista abaixo no seu computador (pode ser no Bloco de Notas), copie **tudo**, cole no editor e clique **Run**. Deve aparecer "Success".
3. Repita para cada arquivo, **nesta ordem**:
   1. `20260717000000_schema_base.sql`
   2. `20260927200000_multi_program.sql`
   3. `20260927210000_diet_and_glute_focus.sql`
   4. `20260929120000_exercise_notes.sql`
   5. `20261005120000_seguranca_perfil_rls.sql`
   6. `20261023120000_treino_4x_superior_inferior.sql`

   Mensagens de "NOTICE ... does not exist, skipping" são normais.

**Jeito por comando (opcional, para quem usa terminal ou IA):**
```bash
npx supabase login
npx supabase link --project-ref SEU_REF     # o "ref" é o código na URL do painel
npx supabase db push
```

✅ **Confira:** no SQL Editor, cole e rode o conteúdo de [`sql/01-conferir-instalacao.sql`](sql/01-conferir-instalacao.sql). Devem aparecer 9 tabelas com `rls_ligada = true` e os programas `fem-5x` e `ul-4x`.

### 2.3 Pegar os dois dados de conexão

Menu → **Project Settings** → **API** (ou **API Keys**). Anote:
- **Project URL** (ex.: `https://abcdefgh.supabase.co`). O trecho `abcdefgh` é o seu **ref**.
- **anon public** (ou **publishable**) key. **Não** use a `service_role`/`secret`.

---

## Parte 3 — Login com Google (Google Cloud)

Esta é a parte mais "clicada". Faça com calma.

### 3.1 Criar o projeto no Google Cloud

1. https://console.cloud.google.com → seletor de projetos no topo → **Novo projeto** → nome `MeuPlano` → **Criar**. Confirme que ele está selecionado no topo.

### 3.2 Tela de consentimento (o que aparece quando alguém clica "Entrar com Google")

1. Menu ☰ → **APIs e serviços** → **Tela de consentimento OAuth** (em algumas contas aparece como **Google Auth Platform → Branding**).
2. Tipo de usuário: **Externo** → Criar.
3. Preencha **Nome do app** (`Meu Plano`), **e-mail de suporte** e **e-mail do desenvolvedor**. Salve e avance (escopos: não precisa adicionar nada).
4. Em **Usuários de teste** (ou **Público-alvo → Test users**), clique **Add users** e adicione **o seu e-mail Google e o de cada pessoa que vai usar o app**.

> Enquanto o app estiver em modo **Teste**, só os e-mails dessa lista conseguem entrar. Isso é bom para uso pessoal. Abrir ao público exige "publicar" o app, com páginas de início e política de privacidade.

### 3.3 Credencial Web (usada pelo navegador **e** pelo Android)

1. **APIs e serviços** → **Credenciais** → **+ Criar credenciais** → **ID do cliente OAuth**.
2. Tipo: **Aplicativo da Web**. Nome: `Meu Plano Web`.
3. Em **URIs de redirecionamento autorizados**, adicione (troque pelo seu ref do Supabase):
   ```
   https://SEU_REF.supabase.co/auth/v1/callback
   ```
4. **Criar**. Copie o **ID do cliente** (termina com `.apps.googleusercontent.com`) e a **Chave secreta do cliente**.

### 3.4 Ligar o Google dentro do Supabase

1. Supabase → **Authentication** → **Sign In / Providers** (ou **Providers**) → **Google** → ligue.
2. Cole o **Client ID** e o **Client Secret** do passo 3.3 → **Save**.
3. Supabase → **Authentication** → **URL Configuration**:
   - **Site URL:** o endereço onde a web vai ficar (Parte 6). Se ainda não sabe, use `http://localhost:8081` por enquanto e troque depois.
   - **Redirect URLs** → **Add URL**, adicione as duas:
     ```
     http://localhost:8081/**
     https://SEU-USUARIO.github.io/**
     ```

### 3.5 Android (só se for gerar o APK; pode deixar para a Parte 7)

O Android precisa de uma segunda credencial, ligada à "impressão digital" (SHA-1) da chave que assina o APK. Essa chave só existe depois do primeiro build no Expo, por isso o passo a passo completo está na [Parte 7](#parte-7--gerar-o-apk-android).

✅ **Confira:** no Supabase, o provedor Google aparece como **Enabled**.

---

## Parte 4 — Ligar tudo no app (automático)

Na pasta do projeto, rode:
```bash
npm run configurar
```
O assistente pergunta, um por vez: a URL e a chave anon do Supabase, o Web Client ID do Google, o nome do pacote do app (ex.: `com.seunome.meuplano`), o nome que aparece no celular e se você vai usar a sua conta Expo (responda **s**). Ele grava tudo no `app.json` e guarda o original em `app.json.bak`. Ele recusa a chave secreta se você colar por engano.

✅ **Confira:** o assistente termina com "✔ app.json atualizado".

---

## Parte 5 — Primeiro teste e escolher o seu treino

1. Rode:
   ```bash
   npx expo start --web
   ```
   e abra http://localhost:8081 no navegador (Chrome ou Edge).
2. Clique **Entrar com Google** e use um e-mail que está na lista de usuários de teste (Parte 3.2).
3. Toda conta nova entra com o programa `fem-5x` e **sem dieta**. Para escolher outro programa:
   - Abra [`sql/02-escolher-programa-e-dieta.sql`](sql/02-escolher-programa-e-dieta.sql), troque o e-mail e o programa, cole no **SQL Editor** do Supabase e rode **só o bloco A**.
   - Recarregue o app.

**Programas que vêm prontos:**

| Slug | Nome | Frequência |
|---|---|---|
| `ul-4x` | Superior · Inferior (A e B) | 4x por semana |
| `fem-5x` | Inferiores · Superiores + Glúteos | 5x por semana, até 1h |

**Quer um treino seu?** Peça à IA para criar uma migração nova com o seu programa (exemplo de pedido em [trabalhando-com-ia.md](trabalhando-com-ia.md#exemplos-de-pedidos-bem-feitos)). Atenção: quem está no mesmo programa compartilha a mesma lista de exercícios; mudar um exercício muda para todos daquele programa.

**Dieta:** a aba Dieta mostra "Dieta em criação" até você ligar um plano. Para só ver como a tela funciona, ligue o plano fictício que já vem no banco (`ciclo-carbo-exemplo`, bloco B do arquivo SQL). Pela lei (Lei 8.234/91), a dieta tem de vir de um(a) **nutricionista**. A IA pode só **transcrever** a prescrição para o formato do app; nunca criar. Bloco B do mesmo arquivo SQL.

✅ **Confira:** você entra, vê "Próximo treino" na tela inicial, abre o treino, marca um exercício, recarrega a página e a marcação continua lá.

Para parar o servidor local: `Ctrl + C` no terminal.

---

## Parte 6 — Publicar a versão web (e instalar no iPhone)

A versão web é a forma mais fácil de usar no celular, **inclusive no iPhone**, sem loja de apps.

### 6.1 Gerar os arquivos do site

```bash
npx expo export --platform web --output-dir dist
```
Isso cria a pasta `dist` com o site pronto.

### 6.2 Opção A: GitHub Pages (grátis, o que o projeto usa)

O app espera ficar na **raiz** de um endereço, então use o site de usuário `SEU-USUARIO.github.io`:

1. No GitHub: **+** → **New repository** → nome **exatamente** `SEU-USUARIO.github.io` → **Public** → **Create repository**.
2. Na página do repositório recém-criado: **uploading an existing file** → arraste **todo o conteúdo de dentro** da pasta `dist` (não a pasta em si) → **Commit changes**.
3. Crie também um arquivo vazio chamado **`.nojekyll`** na raiz (**Add file → Create new file**, nome `.nojekyll`, sem conteúdo → Commit). **Sem ele, o site fica em branco** (o GitHub ignora a pasta `_expo`).
4. **Settings** → **Pages** → Source: **Deploy from a branch** → Branch `main` / `(root)` → Save. Espere 1–2 minutos (aba **Actions** mostra o andamento).
5. Volte ao Supabase (Parte 3.4) e coloque `https://SEU-USUARIO.github.io` como **Site URL**.

**Para atualizar depois:** gere o `dist` de novo e substitua todo o conteúdo do repositório pelo novo, mantendo o `.nojekyll`.

### 6.3 Opção B: Netlify (arrastar e soltar)

1. https://app.netlify.com/drop → arraste a pasta `dist`.
2. Ele dá um endereço (ex.: `https://nome-aleatorio.netlify.app`). Adicione `https://nome-aleatorio.netlify.app/**` nas **Redirect URLs** do Supabase e use-o como **Site URL**.

### 6.4 Instalar no celular como app

- **iPhone (Safari):** abra o endereço → botão **Compartilhar** → **Adicionar à Tela de Início**.
- **Android (Chrome):** abra o endereço → menu ⋮ → **Instalar app** / **Adicionar à tela inicial**.

> No iPhone, o som do cronômetro só funciona depois do primeiro toque na tela (regra do Safari).

✅ **Confira:** o endereço abre o app, o login volta para o app (e não para `localhost`) e o ícone aparece na tela de início.

---

## Parte 7 — Gerar o APK Android

O APK é o app "de verdade" no Android (com notificação do cronômetro e vibração). O Expo compila na nuvem dele; você não precisa de Android Studio.

### 7.1 Entrar no Expo e criar o seu projeto

```bash
npx eas-cli@latest login
npx eas-cli@latest init
```
O `init` cria o projeto na sua conta e grava o `projectId` no `app.json` (responda **Yes**).

### 7.2 Arquivo do Google para Android (`google-services.json`)

O projeto traz só um modelo (`google-services.example.json`); o arquivo de verdade é seu e fica fora do Git. Para criar:

1. https://console.firebase.google.com → **Adicionar projeto** → escolha **o mesmo projeto `MeuPlano` do Google Cloud** (aparece na lista) → pode desligar o Analytics.
2. Na tela do projeto, clique no ícone **Android** → **Nome do pacote**: o mesmo que você digitou no `npm run configurar` (ex.: `com.seunome.meuplano`) → **Registrar app**.
3. **Baixe o `google-services.json`** e salve na raiz do projeto com esse nome exato (ao lado do `app.json`). Pode pular os passos seguintes do Firebase. Sem esse arquivo o build do APK falha.

### 7.3 Primeiro build

```bash
npx eas-cli@latest build --platform android --profile preview
```
- Quando perguntar sobre o **Android keystore** (a chave que assina o app), responda **Yes, generate a new keystore**. O Expo guarda essa chave para você; não perca a conta Expo.
- O build entra numa fila (5 a 30 minutos no plano grátis). Ao fim, aparece um link e um QR code para baixar o APK.

> Windows: se aparecer erro de Git, rode antes `set EAS_NO_VCS=1` (Prompt de Comando) ou `$env:EAS_NO_VCS=1` (PowerShell).

### 7.4 Registrar a "impressão digital" no Google (senão o login falha no Android)

1. Pegue o SHA-1:
   ```bash
   npx eas-cli@latest credentials --platform android
   ```
   Escolha o perfil `preview` → **Keystore** → copie o valor **SHA1 Fingerprint**.
2. No **Firebase** (projeto da 7.2) → ⚙️ **Configurações do projeto** → seu app Android → **Adicionar impressão digital** → cole o SHA-1 → Salvar. Isso cria a credencial Android no Google Cloud automaticamente.
   *(Sem Firebase: Google Cloud → Credenciais → Criar credenciais → ID do cliente OAuth → tipo **Android** → pacote + SHA-1.)*
3. Não precisa gerar outro APK por causa disso: a liberação é do lado do Google e vale em alguns minutos.

### 7.5 Instalar no celular

1. Abra o link do build no celular Android e baixe o APK.
2. Ao abrir, o Android avisa "fonte desconhecida": toque em **Configurações** → permita **instalar apps desta fonte** → volte e **Instalar**.
3. Na primeira vez, o app pede permissão de **notificações** (para o cronômetro de descanso): permita.

✅ **Confira:** você entra com o Google no APK e vê os mesmos treinos da web (os dados são os mesmos, vêm do mesmo banco).

**Nova versão do APK:** sempre que mudar algo no código que precise chegar ao Android, rode o mesmo comando da 7.3 e instale por cima (os dados não se perdem).

---

## Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `npx` não roda no PowerShell ("execução de scripts desabilitada") | Política do Windows | Use `npx.cmd` no lugar de `npx` |
| Login Google: "Acesso bloqueado / app não verificado" ou erro 403 `access_denied` | E-mail fora da lista de testadores | Parte 3.2, adicionar o e-mail em **Usuários de teste** |
| Login Google: `redirect_uri_mismatch` | URI de callback errada | Parte 3.3: deve ser `https://SEU_REF.supabase.co/auth/v1/callback` (sem barra no fim) |
| Depois do login, volta para `localhost` em vez do site publicado | Site URL/Redirect URLs do Supabase | Parte 3.4: incluir o endereço do site com `/**` no fim |
| Site publicado fica todo em branco | Falta o `.nojekyll`, ou subiu a pasta `dist` em vez do conteúdo dela | Parte 6.2, passos 2 e 3 |
| Login funciona na web e falha no APK (`DEVELOPER_ERROR` / código 10) | SHA-1 não registrado ou pacote diferente | Parte 7.4; conferir se o pacote do Firebase é igual ao do `app.json` |
| App abre mas "sem treino" / lista vazia | Migrações incompletas ou fora de ordem | Rodar `sql/01-conferir-instalacao.sql`; colar as que faltam, em ordem |
| Aba Dieta: "Dieta em criação" | Normal: nenhuma dieta cadastrada | Parte 5, bloco B (com prescrição de nutricionista) |
| Erro "Campos de acesso do perfil não podem ser alterados pelo app" | Tentou trocar programa/dieta pelo app | É proteção de propósito; trocar pelo SQL Editor (Parte 5) |
| `npm ci` falha | Versão do Node muito antiga | Instalar o Node LTS atual (Parte 0) |
| Build EAS: "Not logged in" | Não fez login no Expo | `npx eas-cli@latest login` |

Ainda travado? Peça ajuda à IA colando **a mensagem de erro inteira** e dizendo **em qual parte e passo** do guia você está (veja [trabalhando-com-ia.md](trabalhando-com-ia.md)).

---

## Checklist final

- [ ] `npm ci` rodou sem erro
- [ ] 6 migrações aplicadas; `01-conferir-instalacao.sql` mostra 9 tabelas com RLS
- [ ] Google: consentimento com usuários de teste + credencial Web + provedor ligado no Supabase
- [ ] `npm run configurar` concluído
- [ ] Login funciona em `http://localhost:8081`
- [ ] Programa escolhido pelo SQL (e dieta, se houver prescrição)
- [ ] Web publicada, Site URL atualizada no Supabase, app na tela de início do celular
- [ ] (Android) projeto Expo próprio, `google-services.json` próprio, SHA-1 registrado, APK instalado
