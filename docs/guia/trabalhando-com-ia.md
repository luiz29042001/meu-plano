# Como tocar o Meu Plano com IA

Este projeto foi feito por uma pessoa que **não é desenvolvedora**, trabalhando com o **Claude Code**. Ele já vem organizado para que uma IA entenda o contexto sozinha, siga as regras e peça autorização antes de qualquer coisa arriscada. Este guia mostra **como pedir mudanças de um jeito que dá certo** e **como passar o projeto adiante** (para outra pessoa, outra IA ou uma nova conversa).

Instalação do app: [instalacao.md](instalacao.md).

---

## 1. Como o projeto "conversa" com a IA

A IA não lembra de conversas anteriores. Toda a memória do projeto mora em **arquivos**, que ela lê no começo de cada conversa:

| Arquivo / pasta | Papel | Quando muda |
|---|---|---|
| `CLAUDE.md` | **Manual fixo**: quem é o dono, regras, tecnologias, armadilhas já resolvidas. O Claude Code lê sozinho em toda conversa. | Quando uma regra ou decisão permanente muda |
| `docs/retomada.md` | **Diário de bordo**: onde paramos, o que está pendente, próximos passos | Ao fim de cada bloco de trabalho |
| `docs/roadmap.md` | Plano de longo prazo, na ordem decidida | Quando muda a prioridade |
| `docs/tech/`, `docs/design/`, `docs/review/` | Planos técnicos, especificações visuais e revisões de cada funcionalidade | A cada funcionalidade |
| `.claude/agents/` | A "equipe" especializada: líder técnico, diretor de design, banco de dados, construtor de telas, testador, revisor | Raramente |
| `.claude/commands/` | Atalhos prontos: `/nova-feature`, `/revisar-mudancas`, `/gerar-apk`, `/publicar-web`, `/lancar-versao`, `/preparar-qa` | Raramente |
| `.claude/skills/README.md` | Lista das skills de design de terceiros que os agentes usam (instale à parte; não vêm no repositório) | Raramente |
| `supabase/migrations/` | Histórico de todas as mudanças no banco, em ordem | A cada mudança de banco |

**Regra de ouro:** se uma decisão não está escrita num desses arquivos, para a próxima conversa ela não existe. Peça sempre: *"registre isso no CLAUDE.md"* (se for permanente) ou *"atualize a retomada"* (se for estado do trabalho).

### Usando outra IA (Cursor, Copilot, ChatGPT, Gemini…)

Funciona, mas elas não leem o `CLAUDE.md` sozinhas. Na primeira mensagem, diga: *"Leia CLAUDE.md, docs/retomada.md e siga essas regras durante toda a conversa."* Os agentes e atalhos de `.claude/` são específicos do Claude Code; em outras ferramentas, peça para a IA ler o arquivo do agente correspondente e seguir o papel dele.

---

## 2. Assumindo o projeto (handover)

Se você fez fork ou está herdando o projeto, o `CLAUDE.md` ainda descreve **o Luiz, os usuários dele e as contas dele**. A IA vai seguir essas informações ao pé da letra, então o primeiro trabalho é adaptá-lo.

### 2.1 Primeira conversa: prompt pronto

Abra o projeto no Claude Code e cole:

```text
Estou assumindo este projeto. Leia o CLAUDE.md, o docs/retomada.md, o
docs/roadmap.md e o docs/guia/trabalhando-com-ia.md.

Depois:
1. Me explique em linguagem simples o que o app faz e como está organizado.
2. Liste tudo no CLAUDE.md que é específico do dono anterior (nome, usuários,
   contas, IDs do Supabase/Expo/GitHub, endereço do site, dieta fixa no código)
   e me pergunte o valor novo de cada um.
3. Com minhas respostas, reescreva o CLAUDE.md para mim, mantendo TODAS as
   regras técnicas, armadilhas e limites legais. Recomece o docs/retomada.md.
4. Ajuste os atalhos de .claude/commands/ que citam repositório, conta ou
   endereço do dono anterior.
Não mude código do app nesta conversa. Faça commit local no fim e me mostre
o que mudou.
```

### 2.2 O que precisa mudar no `CLAUDE.md` (checklist)

- [ ] **"Sobre o usuário"**: seu nome, se você programa ou não, como prefere as explicações.
- [ ] **Tabela "O que é o app"**: quem usa, em qual aparelho, qual programa e qual dieta.
- [ ] **IDs e endereços**: ref do Supabase, conta e projeto do Expo, endereço da web, repositório do site.
- [ ] **Dieta fixa do código** (`src/services/dietData.ts`): aqui é um exemplo fictício (no app original era a dieta do dono). Prefira dietas no banco, uma por pessoa; se ninguém usar a do código, peça para a IA removê-la (em conversa separada).
- [ ] **"Pendências imediatas"** e **"Contas e configurações externas"**: zerar e reescrever com o seu estado.
- [ ] **Manter intactos**: "Armadilhas já resolvidas", "Limites inegociáveis", regras de RLS, regra de datas no fuso local, fluxo de OKs.

### 2.3 Passando o projeto para outra pessoa (checklist de saída)

- [ ] `docs/retomada.md` atualizado: o que está pronto, o que está pela metade, próximos passos.
- [ ] Nada importante só "na cabeça" ou num chat: decisões no `CLAUDE.md`, contexto em `docs/`.
- [ ] Todo o trabalho com commit e enviado ao GitHub (`git push`); branches abandonadas apagadas ou explicadas.
- [ ] Migrações: todas as que estão em `supabase/migrations/` foram aplicadas? Se alguma não foi, está escrito na retomada.
- [ ] Acesso transferido: convidar a pessoa no GitHub (Settings → Collaborators), no Supabase (configurações da organização → **Team**) e no Expo (organização → **Members**). **Nunca** passar senhas ou tokens por chat; cada um usa o próprio login.
- [ ] Tokens antigos que já apareceram em chats: revogados.

---

## 3. Como pedir mudanças (o que mais faz diferença)

### 3.1 A receita de um bom pedido

Descreva **o problema e o resultado que você quer**, não a solução técnica. A IA escolhe a solução; você decide se o resultado está bom.

```text
O QUE:     [o que quer mudar ou o problema que viu]
ONDE:      [tela / parte do app; web, iPhone ou Android]
POR QUÊ:   [para quem e por que isso importa]
PRONTO É:  [como você vai saber que ficou certo]
NÃO MEXER: [o que deve continuar igual]
```

### 3.2 Exemplos de pedidos bem feitos

**Ajuste pequeno:**
> Na tela de Treino, o nome dos exercícios longos é cortado no meio. Quero ler o nome inteiro, nem que quebre em duas linhas. Pronto é: "Remada Curvada com Barra" aparece completo no Android. Não mexer no tamanho dos cards.

**Bug (com evidência):**
> Ontem marquei o treino como concluído às 22h30 e no calendário ele apareceu no dia de hoje. Era para ficar no dia de ontem. Uso a web no iPhone. [print do calendário]. Investigue a causa antes de corrigir e me explique em linguagem simples.

**Treino novo (mudança de banco):**
> Quero um programa novo "Full Body 3x" para minha conta: 3 treinos por semana, até 50 min, máquinas de academia comum. Segue a lista de exercícios, séries e repetições: [lista]. Crie a migração, me explique o que ela faz e só aplique depois do meu OK. Pronto é: depois de trocar meu programa pelo SQL, vejo os 3 dias no app.

**Dieta (sempre de nutricionista):**
> Minha nutricionista me passou esta dieta [foto/PDF]. Transcreva exatamente para o formato do app (diet_plans), sem alterar alimentos nem quantidades, e me mostre para eu conferir antes de gravar.

**Funcionalidade nova:**
> /nova-feature Gráfico da evolução de carga por exercício, usando as anotações de peso que já registro. Quero ver se estou progredindo.

### 3.3 Pedidos que costumam dar errado (e como reescrever)

| Evite | Prefira |
|---|---|
| "Melhora a tela de dieta" | "Na tela de dieta, quero ver o total de proteína do dia logo no topo" |
| "Arruma o bug" | "Ao tocar em 'Concluir' nada acontece (web, iPhone). Aconteceu depois de ~1h com o app aberto." |
| "Usa a biblioteca X e muda o componente Y" (sem saber o porquê) | Descreva o resultado; se quiser uma opção técnica, pergunte "quais são as opções e qual você recomenda?" |
| Cinco pedidos diferentes na mesma mensagem | Um assunto por vez; anote os outros e peça depois |
| "Cria uma dieta para mim" | Proibido por lei para IA. "Transcreva a dieta da minha nutricionista" |
| "Faz tudo e publica" | "Faz e me mostra; eu dou OK para publicar" |

### 3.4 O tamanho do pedido decide o caminho

| Tamanho | Exemplos | Como pedir |
|---|---|---|
| **Pequeno** (até ~3 arquivos, ajuste visual) | texto, cor, espaçamento, corrigir um bug localizado | Pedido direto na conversa |
| **Médio** (uma tela, sem banco) | reorganizar uma tela, novo componente | Pedido direto; a IA pode usar o agente `ui-builder` e conferir |
| **Grande ou com banco** | tela nova, tabela nova, regra de acesso, treino novo | `/nova-feature <nome e objetivo>`: planejamento, sua aprovação, construção, teste e revisão |

### 3.5 Durante o trabalho

- **Peça explicação antes de aprovar.** "Explique em linguagem simples o que essa mudança faz e o que pode dar errado."
- **Mande evidência**: print, mensagem de erro inteira, em qual aparelho, a que horas. Isso economiza várias idas e vindas.
- **Confira você mesmo** o resultado no aparelho (principalmente Android: o teste automático da IA só enxerga a versão web).
- **Se a IA se perder** (repete o mesmo erro, contradiz o que já decidiu), não insista: peça para ela registrar o estado em `docs/retomada.md`, faça commit, limpe a conversa (`/clear`) e recomece.

---

## 4. O que sempre precisa do seu OK

A IA deste projeto foi instruída a **parar e perguntar** antes de:

- aplicar migração ou qualquer SQL que **altere** o banco (só existe banco de produção: seus dados reais);
- enviar código ao GitHub (`git push`) ou publicar a web;
- gerar build do APK (consome cota do Expo);
- apagar arquivos, dados ou branches;
- mudar configurações de serviços externos (Google, Supabase, Expo) ou instalar programas.

Commit **local** ela faz sozinha (é só "salvar uma versão" no seu computador). Se ela fizer algo da lista sem perguntar, diga "pare" e peça para ela explicar e desfazer.

**Como dar um bom OK:** leia o resumo, pergunte "o que acontece se der errado e como desfaz?", e só então responda "OK, pode aplicar".

---

## 5. Ritmo de uma conversa produtiva

**Começo**
```text
Leia docs/retomada.md e me diga em 3 linhas onde paramos. Hoje quero: [pedido].
```

**Meio:** um assunto por conversa. Aprovações explícitas. Conferência no aparelho.

**Fim**
```text
Terminamos por hoje. Faça commit local, atualize o docs/retomada.md com o
estado atual e os próximos passos, e me liste o que precisa de OK meu para
subir (push, web, APK).
```
Depois, `/clear` (no Claude Code) para começar a próxima conversa leve. Conversas longas ficam lentas, caras e confusas: a IA relê tudo a cada mensagem.

---

## 6. Regras que nenhuma mudança pode quebrar

Estão no `CLAUDE.md`; vale saber que existem para estranhar se a IA propuser o contrário:

1. **Dieta nunca gerada por IA** (Lei 8.234/91). Só transcrição de prescrição de nutricionista. Treino gerado por IA leva aviso de que é sugestão.
2. **Segredos fora do app e do repositório.** Chaves de API (ex.: da Anthropic) só como segredo de Edge Function no Supabase. Nunca a chave `service_role` no app. Nunca cole tokens no chat.
3. **Toda tabela com dado de usuário tem RLS** (cada pessoa só vê o que é dela).
4. **Dados de saúde = dados sensíveis (LGPD):** consentimento, política de privacidade, exclusão de conta antes de abrir para o público.
5. **Antes de entregar:** checagem de tipos (`npx tsc --noEmit -p .`) e os dois bundles compilando (Android e web).
6. **Armadilhas já resolvidas** (lista no `CLAUDE.md`): datas sempre no fuso local; nunca chamar o Supabase dentro do `onAuthStateChange`; não regenerar o `package-lock.json` sem motivo; etc. Se a IA quiser mexer nisso, peça a justificativa.

---

## 7. Economia (tempo e custo)

- **Modelo padrão mais barato** para o dia a dia; o mais forte só para revisão de segurança (banco, RLS, Edge Functions), impasses e planejamento de risco. As regras estão no `CLAUDE.md`.
- **Uma funcionalidade por conversa**, com `/clear` ao terminar.
- **Não peça "revise tudo"** sem motivo: peça revisão das mudanças (`/revisar-mudancas`) antes de lançar uma versão.
- Para ajustes pequenos, dispense o pipeline completo: peça direto.

---

## 8. Atalhos do Claude Code neste projeto

| Atalho | Para quê |
|---|---|
| `/nova-feature <nome e objetivo>` | Funcionalidade ou tela nova, com plano, aprovação, construção, teste e revisão |
| `/revisar-mudancas` | Revisão do que mudou (código e, se mexeu em tela, teste visual na web) |
| `/publicar-web` | Gera e publica a versão web (pede OK antes) |
| `/gerar-apk` | Checa o código e gera o APK Android (pede OK antes) |
| `/lancar-versao` | Banco, web, APK e GitHub de ponta a ponta, com OK em cada passo |
| `/preparar-qa` | Configura uma conta de teste para o testador automático |

Se você fez fork, peça para a IA adaptar `/publicar-web` e `/gerar-apk` ao seu repositório e à sua conta Expo (item 2.1).
