# Roadmap (decidido com o Luiz)


## 1. Cada usuário com seus próprios planos (base para os itens seguintes)
- Treinos e dietas passam a ter dono (`owner_id`), com RLS por dono. Migre os dados do Luiz e da esposa sem perder histórico de conclusões, checks e anotações.
- Conta nova começa **sem programa** e cai numa tela de onboarding. Altere o `handle_new_user`.

## 2. Onboarding com o Claude gerando o treino
- Questionário estruturado: objetivo, experiência, dias por semana, minutos por sessão, equipamentos, lesões, preferências e um campo livre.
- **Supabase Edge Function** guarda `ANTHROPIC_API_KEY` como segredo. **Nunca** coloque a chave no app.
- A função chama a API do Claude com saída estruturada (JSON schema), valida o resultado e grava o programa no nome do usuário.
- Proteções: limite de gerações por usuário e idade mínima de 18 anos.
- Gerar **apenas treino**. A dieta não deve ser gerada por IA: a prescrição dietética é privativa do nutricionista no Brasil (Lei 8.234/91). Mantenha a dieta como "pendente" ou permita cadastrar o plano do nutricionista. Inclua um aviso de que o treino é uma sugestão.
- LGPD: dados de saúde são dados pessoais sensíveis. Exija consentimento explícito no cadastro e ofereça política de privacidade e exclusão de conta.

## 3. Publicação na Google Play
- Conta Play Console: taxa única de US$ 25.
- Conta pessoal nova exige **teste fechado com 12 testadores por 14 dias seguidos** antes de pedir acesso à produção.
- Apps novos precisam ter como alvo a **API 36 (Android 16)**. Isso exige atualizar o Expo SDK, que hoje é o 51 com alvo na API 34. Teste o comportamento de "voltar preditivo" do Android 16.
- Itens obrigatórios: política de privacidade, formulário de Segurança dos dados, **exclusão de conta dentro do app**, e cadastrar no Google Cloud o SHA-1 da **chave de assinatura da Play** (sem isso, o login com Google quebra).
- iOS nativo está fora do escopo por enquanto (custo do Apple Developer Program). O iPhone continua atendido pela versão web.

