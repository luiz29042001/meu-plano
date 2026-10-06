# Design System — Meu Plano

> A fonte da verdade dos valores é `src/utils/theme.ts`. Este arquivo define a DIREÇÃO e as REGRAS.
> Leia o `theme.ts` antes de qualquer decisão visual. Não duplique valores aqui: se mudar lá, vale lá.

## Direção visual
Tema escuro **suave**, inspirado no Spotify.
- Fundo base `#1A1A1C`, verde de destaque `#1DB954`, cores de categoria **dessaturadas**.
- **Pedido explícito do Luiz: menos contraste e menos escuridão.** Em caso de dúvida, suavize: nada de preto puro, branco puro sobre fundo escuro em blocos grandes, ou bordas duras.
- Respiro generoso e poucos elementos por tela.

## Regras
1. Só tokens do `theme.ts`. Valor solto (cor, tamanho, espaçamento) no código é defeito.
2. Token novo só entra se a spec justificar. Ele é adicionado ao `theme.ts` e listado na spec para aprovação.
3. Não trocar fonte, ícones ou o tema base sem aprovação do Luiz.
4. Todo texto de interface em **pt-BR**.
5. O app não usa bi-sets nos treinos.
6. O verde de destaque é para a ação principal e progresso. Não espalhar por toda a tela.

## Duas plataformas, uma tela
- **Luiz:** Android nativo (APK). **Usuária 2:** web/PWA no iPhone (Safari).
- Toda tela precisa funcionar nas duas. Considerar: área segura (notch e barra inferior do iPhone), alturas de aba no Android (armadilha 7), áudio do cronômetro no Safari (armadilha 4).
- Arquivos específicos de plataforma usam o padrão `.web.ts` / `.web.tsx` já existente.

## Como evitar o visual genérico (dentro dessas regras)
- Cada tela tem uma hierarquia clara: **uma** ação principal.
- Números são protagonistas (carga, repetições, tempo, progresso): dar a eles escala e peso tipográfico antes de dar enfeite.
- Usar as cores de categoria dos treinos para dar identidade a cada dia, em vez de decoração extra.
- Proibido: gradiente roxo/azul, grade de cards idênticos com ícone em círculo, sombra em tudo, glassmorphism gratuito.

## Estados obrigatórios em toda tela
Vazio, carregando, erro, sucesso, dados extremos (nome de exercício longo, números grandes).

## Acessibilidade
Alvos de toque >= 44px, contraste legível (mesmo no tema suave), labels em elementos interativos.

## Mockup de aprovação
O design-director gera `docs/design/<tela>.html` (arquivo único, abre no navegador, 390px) para o Luiz **ver** a proposta antes de qualquer código.
