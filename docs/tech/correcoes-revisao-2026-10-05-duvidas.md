# Dúvidas e decisões: correções da revisão 05/10/2026 (backend)

1. **`handle_new_user`: programa da conta nova.** A revisão sugere `program_id = null` (Roadmap 1). Como o app ainda não trata "sem programa" e a conta de teste do QA precisa de treino, mantive `fem-5x` e tirei só a dieta (o dado sensível). Mudar para `null` junto com o onboarding.

2. **Critério da dieta fixa.** A revisão pede critério explícito. Criei a coluna `profiles.diet_fixed` (protegida contra alteração pelo app) em vez de deduzir por slug do programa. A migração marca `true` em quem tem `ppl-6x` + dieta ativa + sem plano: pelo histórico das migrações, só o Luiz. Conferir com a consulta do doc de backend antes de aplicar.

3. **Conta de teste do QA já existente.** Se foi criada antes da migração, ela tem a dieta da Usuária 2. A migração não corrige, para não arriscar tirar a dieta da Usuária 2 por engano (o banco não distingue as duas sem o e-mail). Correção manual descrita no doc de backend, com OK do Luiz.

4. **S1/S2 incluídas.** "Todas as correções aprovadas" foi lido como incluindo as sugestões de banco (S1, S2): baixo risco, o app nunca grava em `user_stats`.

5. **Ordem de publicação.** Migração antes do app novo; senão o Luiz vê "Dieta em criação" até a migração (sem perda de dados).

6. **Bundle web não verificado nesta máquina**: `react-dom`/`react-native-web` ausentes no `node_modules` local. Não instalei (armadilha 6). Sugestão: `npm ci` e repetir `npx expo export --platform web`.
