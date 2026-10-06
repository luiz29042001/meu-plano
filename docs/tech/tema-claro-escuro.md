# Plano técnico: tema claro/escuro (redesign Splits59)

Autor: tech-lead. Data: 06/10/2026. Status: **aguardando aprovação do Luiz**.
Entradas: `docs/design/tema-claro-escuro.md` (**spec definitiva**, fonte dos valores, nomes de token e layouts), `docs/design/direcao-splits59.md`, `docs/design/auditoria-2026-10-05.md`, `docs/tech/correcoes-revisao-2026-10-05-backend.md`.
Ponto de partida: o código **atual**, com as correções funcionais do ui-builder já concluídas e revisadas (estados `loading/error/empty/ready`, `useDiet()`, `dietMode`, `saveError`, confirmação de "Sair").

Este plano define o **como**. Cor, tipografia e layout de cada tela estão na spec; aqui não se repetem valores.

---

## Objetivo

Aplicar a linguagem Splits59 (Barlow Condensed + Inter, nova escala, cantos quase retos, linhas finas, toque 44/48/56) com dois temas, **Claro** e **Escuro suave**, com os mesmos nomes de token.
O app segue o tema do aparelho por padrão, e o usuário pode forçar Claro ou Escuro (ou voltar ao Automático) na tela Perfil, no Android (APK) e na web/PWA (iPhone).

## Estado atual relevante (conferido no código em 06/10)

- `src/utils/theme.ts` exporta `Colors` estático (escuro antigo, `#1A1A1C`). Os tokens do item I9 da revisão (`onAccent`, `timerBg`, `errorBg`...) **não** foram criados. Ainda há cores soltas: `#fff`/`#1A2A1A`/`#1A1A2A` (Dieta), `#000` (Home e Treino), `#2A1010`/`#C0392B44`/`#E74C3C` (Login), `#18181B`/`#000` (cronômetro), `#0F0F0F` (`App.tsx`, `app.json`). Esta feature **absorve o I9**: nenhum desses tokens provisórios será criado; tudo vira token da spec.
- 7 arquivos consomem `Colors` via `StyleSheet.create` no topo do módulo: 5 telas, `FloatingTimer`, `navigation/index.tsx`.
- Cores do banco usadas direto (e com alfa concatenado, `cor + '26'`/`'55'`): Home (próximo treino), Treino (abas, faixa, séries), Calendário (células, legenda), cronômetro (`TimerState.color`).
- O botão da inicial na Home chama `handleSignOut` (com confirmação). Não existe tela de perfil.
- `app.json`: `"userInterfaceStyle": "dark"`. `expo-system-ui` **não** está instalado. `@react-native-async-storage/async-storage` 1.23.1 **está** (usado pelo Supabase). `expo-font` 12.0.10, `expo-splash-screen`, `expo-status-bar`, `expo-haptics` já instalados.

---

## Abordagem escolhida

1. **Duas paletas estáticas + `ThemeContext` + `makeStyles` com cache por tema.**
   - `theme.ts` exporta `lightColors` e `darkColors` (as 26 chaves da spec §1, tipo `ThemeColors`) e `palettes = { light, dark }`. `Font`, `FontSize`, `Tracking`, `Radius`, `Spacing`, `Touch` continuam **constantes estáticas** (não passam pelo contexto).
   - `ThemeProvider` resolve o tema efetivo: `preference === 'system' ? useColorScheme() : preference`.
   - Cada arquivo troca `StyleSheet.create({... Colors.x ...})` por `const useStyles = makeStyles(c => ({... c.x ...}))`. O `makeStyles` cria **uma** `StyleSheet` por tema por arquivo e guarda em cache: trocar de tema re-renderiza a árvore uma vez (evento raro); o cronômetro, que re-renderiza a cada segundo, só faz uma leitura de cache.
   - As telas **nunca** testam `scheme === 'light'`. Toda diferença entre temas mora nos tokens (ex.: `primary` é tinta no claro e verde no escuro).
2. **Preferência salva no aparelho** (AsyncStorage, que na web grava direto no `localStorage` com a chave crua; conferido em `node_modules/@react-native-async-storage/async-storage/lib/module/AsyncStorage.js`). Chave **`meu-plano:tema`** (da spec), valores `system | light | dark`.
3. **Cores do banco traduzidas no app**: `dayColor(hex, scheme)` com o mapa fixo da spec §2.1 e a regra de reserva da §2.2. **Sem migração.**
4. **Sem flash**: no Android a splash nativa segura a tela até a preferência e as fontes carregarem; na web, um script inline no `index.html` pinta o fundo certo antes do bundle.
5. **Uma passada por tela**: cada arquivo recebe, de uma vez, o layout novo da spec e o tema dinâmico. Não há uma "migração de tema" separada do redesign.

### Alternativa descartada

**`Colors` mutável/Proxy com remount do app ao trocar o tema.** Quase zero churn nas telas, mas `StyleSheet.create` congela os valores no carregamento do módulo; seria preciso remontar a árvore inteira a cada troca, perdendo o treino aberto, a anotação em digitação e o cronômetro na tela, e contrariando a spec ("troca imediata, sem reiniciar"). Como o redesign já reescreve todos os estilos, o custo do `makeStyles` é absorvido.

Outras descartadas:
- **Preferência no perfil do Supabase:** exige migração e liberar `grant update` numa coluna nova (o perfil tem colunas travadas por privilégio e pelo trigger `protect_profile_access_columns`, migração `20261005120000`); só fica disponível após login + perfil carregado (flash garantido e Login sem tema); tema é preferência do aparelho.
- **`Appearance.setColorScheme()`** para forçar o tema no nativo: no Android chama `AppCompatDelegate.setDefaultNightMode`, que pode recriar a Activity. O ganho (diálogos nativos no tema forçado) não paga o risco. A spec já aceita a confirmação de "Sair" no tema do aparelho (§10.10).
- **Embutir fontes pelo plugin `expo-font` no build:** cria dois caminhos (nativo x web) e nomes de família diferentes. `useFonts` atende os dois.
- **Migração para mudar `workout_days.color`:** quebraria o tema escuro. A tradução atende os dois temas e qualquer cor futura.
- **`expo-navigation-bar`** (barra de navegação inferior do Android no tema forçado; spec §8 marca como desejável): mais um módulo nativo para um caso raro (tema forçado diferente do aparelho). Fica **fora**; com `userInterfaceStyle: automatic` a barra já acompanha o aparelho, que é o caso padrão. Registrado como limitação.

### Existe solução que elimine código?

Sim, e o plano usa:
- `dayColor` torna **desnecessária a migração A10** da auditoria (as cores saturadas antigas do Luiz estão no mapa).
- Os tokens provisórios do I9 (`timerBg`, `errorBg`, `errorBorder`, `bannerA`, `bannerB`) **não** são criados: a spec resolve com `bgElevated`, bloco de erro com faixa `red` e sem banners tingidos.
- Concatenações `cor + '26'` somem (spec §1 regra 2): menos manipulação de cor.
- O `Colors` estático e o `StyleSheet` de cada arquivo são substituídos, não duplicados.

---

## Mudanças por camada

### Dados (Supabase)

**Nenhuma.** Sem migração, sem RLS nova, nenhuma chamada nova ao Supabase.

### Dependências e configuração nativa (exigem APK novo)

| Item | Mudança | Por quê |
|---|---|---|
| `expo-system-ui` | `npx expo install expo-system-ui` (resolve `~3.0.7` no SDK 51) | No Android, `userInterfaceStyle` **só funciona** com ele instalado (documentado em `@expo/config-types`, `ExpoConfig.d.ts`). Também pinta o fundo da janela raiz (`SystemUI.setBackgroundColorAsync`), evitando faixa da cor errada em transições e com teclado. Módulo nativo. |
| Fontes | `npm install --save-exact @expo-google-fonts/barlow-condensed@0.4.1 @expo-google-fonts/inter@0.4.2` | Só JS + `.ttf`, sem dependências nem peer deps (conferido no npm). Usar o `useFonts` do **`expo-font` já instalado**, não o reexportado. |
| `package-lock.json` | Só pode ganhar as entradas desses 3 pacotes | Armadilha 6. Nada de apagar o lock, `npm install` geral ou `npm audit fix`. Conferir `git diff --stat package-lock.json` e que `react-dom 18.2.0`, `react-native-web ~0.19.10`, `@expo/metro-runtime ~3.2.3` seguem iguais. Se o `node_modules` local não tiver `react-dom`/`react-native-web`, rodar `npm ci` antes do export web. |
| `app.json` | `"userInterfaceStyle": "automatic"` | Hoje `"dark"` força escuro no Android: `useColorScheme()` sempre responde `dark`. |
| `app.json` splash | `splash.backgroundColor: "#F1F1EF"`; `android.splash.dark.backgroundColor: "#222221"` (e `ios.splash.dark` por consistência). Imagem atual, salvo se o design-director pedir variante (`android.splash.dark.image`) | O campo `android.splash.dark` existe no SDK 51 (conferido no `ExpoConfig.d.ts`). A splash segue o **aparelho**, não a escolha do app (spec §8). |
| `app.json` `android.adaptiveIcon.backgroundColor` | `#0F0F0F` → `#222221` | Auditoria A1; o ícone não muda com o tema. |
| `app.json` `web.themeColor`/`backgroundColor` | `#222221` | Consistência; na web quem manda é o `public/`. |

**Importar só os 6 pesos usados**, por subcaminho, nunca do índice do pacote (o Inter 0.4.2 tem ~8 MB com todos os pesos; importar o índice leva todos para o APK e para o `dist`). Na 0.4.x: `@expo-google-fonts/inter/400Regular`, `/500Medium`, `/600SemiBold`; `@expo-google-fonts/barlow-condensed/500Medium`, `/600SemiBold`, `/700Bold`. Conferir o caminho exato em `node_modules` ao implementar.

### Serviços / utilitários

| Arquivo | Novo/alterado | Conteúdo |
|---|---|---|
| `src/utils/theme.ts` | alterado | `ThemeColors`, `lightColors`, `darkColors`, `palettes`, `Font` (com `Platform.select` para pilha de reserva na web, ex. `'BarlowCondensed_600SemiBold, "DIN Condensed", sans-serif'`; no nativo só o nome), `FontSize` (+`display`, `hero`, `timer`), `Tracking`, `Touch`, `Spacing` (+`xxxl`, `section`), `Radius` novos. Durante a migração mantém `export const Colors = darkColors` com `@deprecated`, para cada passo compilar; removido na última tarefa. |
| `src/utils/dayColor.ts` | novo | `dayColor(hex, scheme)`: normaliza (maiúsculas, sem espaço), consulta o mapa da spec §2.1, senão aplica a reserva da §2.2 (HSL, contraste ≥ 4,5:1 contra o `bg` do tema); inválida/vazia → `restColor`. Puro, sem React, memoizado em `Map` por `scheme+hex`. `resolveAccent(value, scheme)`: se `value` é nome de token (`'pushColor'`, `'red'`...), devolve o token da paleta; senão `dayColor(value)`. Serve às refeições do `dietData` (token) e às do banco (hex). |
| `src/services/devicePrefs.ts` | novo | `loadThemePreference()` / `saveThemePreference()` com AsyncStorage. Valor inválido ou erro → `'system'`. Falha ao gravar: ignora (spec §5.4). |
| `src/utils/systemChrome.ts` | novo | Nativo: `SystemUI.setBackgroundColorAsync(colors.bg)`. |
| `src/utils/systemChrome.web.ts` | novo | Web: troca as duas `<meta name="theme-color">` por uma única com o `bg` do tema quando a escolha é manual (e restaura as duas com `media` no Automático); `document.documentElement.style.backgroundColor` e `style.colorScheme` (caret, rolagem e autofill do campo de anotação no tema certo). |
| `src/services/dietData.ts` | alterado | Auditoria A9: `color` das refeições do Luiz vira **nome de token** (`'suppColor'`, `'red'`, `'orange'`, `'purple'`, `'pushColor'`, `'legsColor'`, `'pullColor'`, `'restColor'`), resolvido na tela por `resolveAccent`. O tipo `Meal.color` continua `string`. |

### Estado / contextos

`src/contexts/ThemeContext.tsx` (novo):

- Lê a preferência no mount; até ler, `ready = false`.
- `systemScheme = useColorScheme()` (no Android depende do `automatic` + `expo-system-ui`; na web o react-native-web usa `matchMedia('(prefers-color-scheme: dark)')` e escuta mudanças). `null` → `'dark'`.
- `scheme = preference === 'system' ? systemScheme : preference`.
- Valor memoizado por `[scheme, preference, ready]`. Efeito em `scheme` chama `applySystemChrome`.
- `setPreference` atualiza o estado na hora e grava em segundo plano. A vibração de 10 ms (spec §5.3) fica na tela Perfil, só no Android (`Platform.OS === 'android'`), com o `Vibration` já usado no `TimerContext`.

**Árvore em `App.tsx`:**
`SafeAreaProvider > ThemeProvider > AppGate > GestureHandlerRootView > ThemedStatusBar > AuthProvider > TimerProvider > Navigation`

- `ThemeProvider` **acima** do `AuthProvider`: Login e carregador inicial já saem no tema certo; o tema não depende da sessão.
- `AppGate`: `SplashScreen.preventAutoHideAsync()` no nível do módulo (no-op na web); espera `useFonts(...)` **e** `ready`; então `SplashScreen.hideAsync()`. Enquanto espera, devolve `null` (Android: a splash cobre; web: o `<html>` já está pintado). **Teto de 3 s**: se as fontes não carregarem ou derem erro, segue com a reserva (nunca tela em branco no 4G).
- `ThemedStatusBar`: `<StatusBar style={scheme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.bg} translucent={false} />` (resolve também a auditoria A1). Com o `ThemeContext` e o `systemChrome`, é o único lugar que testa `scheme`.

`TimerContext`: guarda a cor **crua** do banco em `launchTimer` (sem mudança); o padrão `'#E8572A'` vira `''` (vazio → `restColor` pelo `dayColor`). O `FloatingTimer` traduz na **renderização**, então trocar o tema com o cronômetro aberto já mostra a cor certa. Lógica de `endsAt`, `unlockAudio` e vibração intocada (armadilha 4).

### UI

Regras para todo arquivo, numa única passada (layout da spec §4 e §6 + tema dinâmico):
1. `const useStyles = makeStyles(c => ({ ... }))` no lugar do `StyleSheet.create`; no componente, `const styles = useStyles(); const { colors, dayColor } = useTheme();`. Subcomponentes do mesmo arquivo (`ExerciseCard`, `MealItem`, `SubsPanel`) também chamam `useStyles()`.
2. **Toda** cor vinda do banco passa por `dayColor` (Home, Treino, Calendário, cronômetro) e toda cor de refeição por `resolveAccent` (Dieta). Sem `cor + 'xx'`.
3. **Peso pelo nome da família, sem `fontWeight`** junto de `Font.*` (no Android, `fontWeight` com fonte customizada faz o texto cair na Roboto).
4. Textos Barlow com `includeFontPadding: false`; números grandes com `lineHeight` = 0,92 × tamanho e `fontVariant: ['tabular-nums']`; `display`/`hero`/`timer` com `maxFontSizeMultiplier={1.2}` (spec §9). Abas mantêm a armadilha 7 (altura fixa, `includeFontPadding: false`, `numberOfLines={1}`).
5. Caixa alta só via `textTransform: 'uppercase'`.
6. Web larga: conteúdo com `maxWidth: 560` centralizado, `bg` na janela inteira (spec §3).
7. Manter os contratos funcionais das correções: decisão por `status`/`dietMode`, `retry`, `saveError`, `confirmAction` para sair, `useWorkout({ refreshOnFocus: true })` na Home, `refreshing` sem desmontar os `ExerciseCard`.

**Ordem de migração** (cada passo compila sozinho graças ao `Colors` deprecado; segue a ordem da spec §10.12):
1. Infra (`theme.ts`, `ThemeContext`, `makeStyles`, `dayColor`, `devicePrefs`, `systemChrome`, `App.tsx`, `navigation`, `app.json`, `public/`).
2. **Perfil** (permite ao QA alternar o tema desde o começo).
3. **Treino + `FloatingTimer`** (o cronômetro faz parte do fluxo do treino na spec §6.3).
4. Home.
5. Dieta (+ `dietData.ts`).
6. Calendário.
7. Login.
8. Remover `Colors` deprecado; greps finais.

### Navegação

- Rota nova **`Profile`** na native-stack (`RootStackParamList` ganha `Profile: undefined`), conforme spec §5: tela da pilha, não painel.
- Botão da inicial na Home: deixa de chamar `handleSignOut` e faz `navigation.navigate('Profile')`, `accessibilityLabel="Abrir perfil e ajustes"`. A lógica de sair (`confirmAction` + `signOut`) **muda de lugar** para o Perfil, sem duplicar.
- `ProfileScreen` (`src/screens/ProfileScreen.tsx`): identidade (inicial, nome; `profileStatus` para esqueleto/erro como na spec §5.4), linha "Programa", seletor Aparência (`radiogroup`, 3 segmentos 48 px), texto de apoio dinâmico ("Agora: claro/escuro" usa `scheme`), "Sair da conta". Lugar natural para exclusão de conta e política de privacidade do Roadmap 3.
- `NavigationContainer` recebe `theme` derivado da paleta (`dark`, `background`/`card` = `bg`, `text`, `border`, `primary`), para a transição `slide_from_right` não mostrar o fundo claro padrão do React Navigation.
- Nada de expo-router.

### Web / PWA (`public/`)

`public/index.html`:
- Duas metas `theme-color` com `media` (claro `#F1F1EF`, escuro `#222221`) e `<meta name="color-scheme" content="light dark">`.
- `apple-mobile-web-app-status-bar-style`: `black-translucent` → **`default`** fixo nos dois temas (spec §8; com `black-translucent` os ícones ficam sempre brancos e somem no claro). O `SafeAreaView` já trata o topo.
- `<style id="expo-reset">`: `html` com fundo claro e `@media (prefers-color-scheme: dark)` com o escuro; `body` com `background-color: transparent` (hoje fixo em `#1A1A1C`).
- **Script inline no `<head>`, antes de qualquer outro script**, para a escolha manual não piscar:

```html
<script>
(function () {
  try {
    var p = localStorage.getItem('meu-plano:tema');
    var dark = p === 'dark' || (p !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var bg = dark ? '#222221' : '#F1F1EF';
    var r = document.documentElement;
    r.style.backgroundColor = bg;
    r.style.colorScheme = dark ? 'dark' : 'light';
    if (p === 'light' || p === 'dark') {
      var m = document.querySelectorAll('meta[name="theme-color"]');
      for (var i = 0; i < m.length; i++) { m[i].setAttribute('content', bg); m[i].removeAttribute('media'); }
    }
  } catch (e) {}
})();
</script>
```

- `public/manifest.json`: `background_color` e `theme_color` = `#222221` (o manifest aceita um valor só; spec §10.9).
- Limitação aceita (spec §8): no PWA instalado, o iPhone pode pintar a barra de status pela aparência do **aparelho**; com tema forçado diferente, aparece uma faixa fina da outra cor, mas legível. Conferir no iPhone real; se a barra não mudar após publicar, readicionar o atalho à tela de início.

---

## Contratos

```ts
// src/utils/theme.ts
export type ColorScheme = 'light' | 'dark';
export type ThemePreference = 'system' | 'light' | 'dark';

export interface ThemeColors {                 // 26 chaves, spec §1
  bg: string; bgElevated: string; card: string; cardHover: string; cardAlt: string;
  surface: string; border: string; borderStrong: string;
  text: string; textMuted: string; textFaint: string;
  primary: string; onPrimary: string; onAccent: string;
  green: string; greenDim: string; onGreen: string;
  pushColor: string; pullColor: string; legsColor: string; restColor: string; pinkColor: string;
  orange: string; red: string; purple: string; suppColor: string;
}
export type ColorToken = keyof ThemeColors;
export const lightColors: ThemeColors;
export const darkColors: ThemeColors;
export const palettes: Record<ColorScheme, ThemeColors>;
export const Font: { condMedium: string; condSemi: string; condBold: string;
                     body: string; bodyMedium: string; bodySemi: string };
export const FontSize: { xs; sm; md; base; lg; xl; xxl; xxxl; display; hero; timer }; // spec §3
export const Tracking: { caps: 0.5; tight: -0.5; tighter: -1.5 };
export const Touch: { min: 44; comfort: 48; primary: 56 };
// Radius, Spacing: mesmos nomes, valores da spec §3 (+ Spacing.xxxl, Spacing.section)
/** @deprecated só durante a migração */
export const Colors: ThemeColors;

// src/contexts/ThemeContext.tsx
export interface ThemeValue {
  scheme: ColorScheme;                  // efetivo (Automático já resolvido)
  preference: ThemePreference;
  colors: ThemeColors;                  // = palettes[scheme]
  ready: boolean;                       // preferência já lida
  setPreference(p: ThemePreference): void;
  dayColor(hex: string | null | undefined): string;      // = dayColor(hex, scheme)
  resolveAccent(value: string | null | undefined): string; // token ou hex
}
export function ThemeProvider(props: { children: React.ReactNode }): JSX.Element;
export function useTheme(): ThemeValue;
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (c: ThemeColors) => T,
): () => T;

// src/utils/dayColor.ts
export function dayColor(hex: string | null | undefined, scheme: ColorScheme): string; // '#RRGGBB'
export function resolveAccent(value: string | null | undefined, scheme: ColorScheme): string;

// src/services/devicePrefs.ts
export const THEME_STORAGE_KEY = 'meu-plano:tema';   // igual ao script do index.html
export function loadThemePreference(): Promise<ThemePreference>;
export function saveThemePreference(p: ThemePreference): Promise<void>;

// src/utils/systemChrome.ts | systemChrome.web.ts
export function applySystemChrome(scheme: ColorScheme, preference: ThemePreference, colors: ThemeColors): void;

// src/navigation/index.tsx
export type RootStackParamList = {
  Home: undefined; Workout: { daySlug?: string } | undefined;
  Diet: undefined; Calendar: undefined; Profile: undefined;
};
```

O ponto que evita recriar estilos e re-render excessivo:

```ts
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(factory: (c: ThemeColors) => T) {
  const cache: Partial<Record<ColorScheme, T>> = {};
  return function useStyles(): T {
    const { scheme } = useTheme();
    return (cache[scheme] ??= StyleSheet.create(factory(palettes[scheme])));
  };
}
```

---

## Impacto por usuário e plataforma

| | Luiz (Android, APK) | Usuária 2 (web/PWA no iPhone) |
|---|---|---|
| Entrega | **Novo APK obrigatório** (`expo-system-ui` é nativo; `userInterfaceStyle` e splash só mudam no build; o app não tem atualização pelo ar). | **Nova publicação web obrigatória.** Fechar e abrir o app; se a barra de status não mudar, readicionar à tela de início. |
| Primeira abertura | Celular no escuro: tema escuro (parecido com hoje, um pouco mais claro). Celular no claro: tema claro. | Idem pelo tema do iPhone. Baixa as fontes na primeira vez (estimativa ~1 a 1,5 MB; medir). |
| Escolha manual | Perfil > Aparência. Salva no celular. | Perfil > Aparência. Salva no Safari daquele aparelho. |
| Arquivos `.web` | — | `systemChrome.web.ts`. O resto é igual nas duas plataformas. |

A escolha é **por aparelho**; nada é gravado no banco.

## Compatibilidade com o Roadmap

- Nada depende de quantos usuários existem ou de quem é quem: tema é do aparelho; nenhum `if` por e-mail, slug ou programa.
- **Programas com dono / gerados por IA** (Roadmap 1 e 2) terão cores arbitrárias: a reserva do `dayColor` garante ≥ 4,5:1 nos dois temas. Sugestão para o Roadmap 2: a Edge Function escolher cores do mapa (§2.1 da spec), mas o app não depende disso.
- **Conta sem programa**: estados `empty` (Home "SEM PROGRAMA", Treino) usam os mesmos tokens; nada no tema assume programa ou dieta. A tela de onboarding futura usa `makeStyles` igual.
- **Roadmap 3 (Play Store, SDK novo, API 36):** a tela Perfil recebe exclusão de conta e política de privacidade. Ao atualizar o SDK: a splash passa a ser configurada pelo plugin `expo-splash-screen` (SDK 52+) e o Android 15+ é edge-to-edge (ignora `backgroundColor` da barra de status; o fundo da tela passa a aparecer atrás dela). Rever `ThemedStatusBar` nessa hora.

---

## Riscos

| Risco | Mitigação |
|---|---|
| Faltar `userInterfaceStyle: "automatic"` ou `expo-system-ui` → Android sempre escuro | Critérios 18 e 21. |
| `fontWeight` com fonte customizada no Android cai na Roboto | Regra "peso pelo nome"; critério 14; conferir no APK. |
| Barlow corta/desalinha no Android (armadilha 7) | `includeFontPadding: false`; conferir abas no APK. |
| Peso das fontes na web | Só 6 pesos; teto de 3 s com reserva; medir o `dist`. Se pesar demais: subconjunto latino em woff2 servido do próprio `public/` (nunca Google Fonts externo, por privacidade/LGPD). |
| Flash do tema errado | Android: splash até preferência + fontes. Web: script inline + CSS por `prefers-color-scheme`. Exceção aceita: a splash nativa do Android segue o aparelho. |
| Cor do banco ilegível no claro | `dayColor`/`resolveAccent` em toda cor de dado; critérios 9 e 13. |
| Re-render excessivo | Contexto memoizado; `StyleSheet` em cache por tema; o tick do cronômetro não toca o contexto do tema. |
| `useColorScheme` mudando sozinho com o app em segundo plano (bug conhecido do RN, mais comum no iOS) | Observar no QA; só se aparecer, ignorar mudanças com `AppState !== 'active'`. |
| Barra de status do PWA no tema forçado | `default` fixo (legível sempre); faixa fina da outra cor aceita pela spec; conferir no iPhone. |
| Regressão nas correções recém-revisadas (estados, `retry`, `saveError`, foco) | Regra 7 da UI; critério 20; o code-reviewer compara com `correcoes-revisao-2026-10-05-backend.md`. |
| Armadilha 1 (Supabase na web) | O tema não chama o Supabase (critério 16). |
| Armadilhas 2, 8, 9 (datas, rota do treino, próximo treino) | Não tocadas; só estilo. QA confere o "Próximo treino" e a aba aberta. |
| Armadilha 4 (cronômetro) | Só a cor muda, calculada na renderização. |
| Armadilha 6 (`package-lock`) | Só 3 pacotes; critério 17. |
| Diálogos nativos e barra de navegação do Android seguem o aparelho no tema forçado | Limitações aceitas (spec §10.10 e decisão sobre `expo-navigation-bar`). |

---

## Plano de tarefas

Cada tarefa termina com `npx tsc --noEmit -p .` e os dois bundles (`npx expo export --platform android` e `--platform web`) compilando.

- [ ] **T0 (sessão principal)** Luiz aprova este plano e a spec `docs/design/tema-claro-escuro.md`.
- [x] **T1 (backend-engineer)** (feito 06/10, ver `tema-claro-escuro-backend.md`) Dependências e configuração: `expo-system-ui`, fontes (`--save-exact`), conferir diff do lock, `app.json` (`userInterfaceStyle`, splash claro/escuro, ícone adaptativo, `web.*`).
- [x] **T2 (backend-engineer)** (feito 06/10) Lógica de tema sem UI: `theme.ts` (paletas da spec, tokens compartilhados, `Colors` deprecado), `dayColor.ts` (mapa §2.1 + reserva §2.2 + `resolveAccent`), `devicePrefs.ts`, `ThemeContext.tsx` (`ThemeProvider`, `useTheme`, `makeStyles`), `systemChrome.ts`/`.web.ts`, `dietData.ts` com nomes de token.
- [ ] **T3 (ui-builder)** Raiz e moldura: `App.tsx` (árvore, `AppGate`, fontes, splash, `ThemedStatusBar`), `navigation/index.tsx` (tema do container, rota `Profile`, carregador), `public/index.html`, `public/manifest.json`.
- [ ] **T4 (ui-builder)** `ProfileScreen` (spec §5) + botão da inicial da Home navegando para ela (o "Sair" muda para o Perfil).
- [ ] **T5 (ui-builder)** `WorkoutScreen` + `FloatingTimer` (spec §6.3); `TimerContext` sem cor fixa.
- [ ] **T6 (ui-builder)** `HomeScreen` (spec §6.2).
- [ ] **T7 (ui-builder)** `DietScreen` (spec §6.4).
- [ ] **T8 (ui-builder)** `CalendarScreen` (spec §6.5).
- [ ] **T9 (ui-builder)** `LoginScreen` (spec §6.1; sem `'serif'`).
- [ ] **T10 (ui-builder)** Remover `Colors` deprecado; greps dos critérios; medir o peso das fontes no `dist` e registrar no relatório.
- [ ] **T11 (qa-tester)** Web nos dois temas (`emulateMedia({ colorScheme })` + seletor manual), critérios 1 a 11 e 20; lista "Conferir no celular" (21, 22).
- [ ] **T12 (code-reviewer)** Revisão.
- [ ] **T13 (sessão principal, com OK do Luiz)** Atualizar `docs/design/design-system.md` (design-director) e as seções "Estrutura" e "Design" do `CLAUDE.md` (dois temas, `ThemeContext`/`makeStyles`, `dayColor`, chave `meu-plano:tema`; nova armadilha: sem `fontWeight` com fonte customizada). Gerar APK (`/gerar-apk`) e publicar a web (`/publicar-web`).

Nenhuma tarefa de banco.

---

## Critérios de aceite

**Tema e preferência**
1. Web com `prefers-color-scheme: light` e sem preferência salva: abre no claro (`#F1F1EF` no `<html>` e na raiz do app). Com `dark`: abre no escuro (`#222221`).
2. Com "Automático", trocar a emulação do sistema com o app aberto troca o tema sem recarregar e sem perder estado (anotação em digitação, aba do treino, cronômetro correndo).
3. Perfil > Aparência mostra Automático / Claro / Escuro com o atual marcado. "Claro" com o sistema escuro deixa o app claro na hora (incluindo a tela por trás); recarregar mantém; "Automático" volta a seguir o sistema. O texto de apoio segue a spec §5.2.
4. `localStorage.getItem('meu-plano:tema')` reflete a escolha; apagar a chave volta ao Automático.
5. Sem flash: com "Claro" salvo e sistema escuro, recarregar a web não mostra nenhum quadro escuro desde o primeiro paint (capturas sequenciais do Playwright). O mesmo ao contrário.
6. `<meta name="theme-color">` tem o `bg` do tema efetivo após trocar a preferência; `apple-mobile-web-app-status-bar-style` = `default`.
7. Perfil alcançável em 1 toque a partir da Home; o botão da inicial **não** faz logout; "Sair da conta" pede confirmação. Segmentos ≥ 48 px com `radiogroup`/`radio` e `checked`.

**Visual**
8. Em Login, Home, Treino, Dieta, Calendário, Perfil e cronômetro, nos **dois** temas, nenhum texto abaixo de 4,5:1 (QA confere por amostragem os pares da spec §1.1).
9. Claro: Inferior A da Usuária 2 sai `#A6486B`, Push sai `#A9502F`. Escuro: as cores antigas `#E8572A`, `#2A7BE8`, `#27AE60` saem `#E07856`, `#5A93D4`, `#42B968`.
10. Títulos, números e abas em Barlow Condensed; nomes e textos em Inter (`font-family` computado na web). Com as fontes bloqueadas na rede, o app abre em ~3 s com a reserva, sem tela em branco permanente.
11. Trocar o tema com o cronômetro aberto muda a cor dele na hora e o tempo restante segue correto.

**Código**
12. `grep -rn "Colors\b" src App.tsx` vazio fora de `src/utils/theme.ts`, e lá o `Colors` deprecado não existe mais.
13. `grep -rnE "#[0-9A-Fa-f]{3,8}\b" src/screens src/components src/navigation App.tsx` vazio; nenhuma concatenação `+ '26'`, `+ '55'`, `+ '22'` etc. em cor.
14. Nenhum estilo com `Font.*` tem `fontWeight`.
15. `grep -rn "scheme ===" src/screens src/components` vazio.
16. Nenhum arquivo do tema (`ThemeContext`, `dayColor`, `devicePrefs`, `systemChrome`) importa `services/supabase`.
17. `package-lock.json` só ganhou `expo-system-ui`, `@expo-google-fonts/barlow-condensed`, `@expo-google-fonts/inter`; `react-dom 18.2.0`, `react-native-web ~0.19.10`, `@expo/metro-runtime ~3.2.3` inalterados.
18. `app.json`: `userInterfaceStyle` = `"automatic"`; `android.splash.dark` presente; nenhum `#0F0F0F`.
19. `tsc` sem erros; `expo export` Android e web compilam; relatório informa o tamanho das fontes no `dist` e confirma que só 6 `.ttf` foram incluídos.

**Regressão**
20. Com a conta de teste, nos dois temas: "Próximo treino" e a aba aberta pelo card iguais a antes (armadilhas 8 e 9); concluir treino, anotar, trocar variante da dieta e navegar no calendário funcionam; estados de erro mostram "Tentar de novo".

**Conferir no celular (o QA web não cobre)**
21. Android (APK): celular claro → splash clara, app claro, barra de status clara com ícones escuros; celular escuro → o inverso. "Escuro" forçado com o celular claro: app e barra de status escuros. Abas do treino sem corte (armadilha 7). Texto em Barlow/Inter nos pesos certos (não Roboto).
22. iPhone (PWA da Usuária 2): abre no tema do iPhone; barra de status legível nos dois temas; tema forçado aplica na hora no app.

---

## Adendo (06/10/2026): cronômetro móvel + notificação do descanso, na mesma build

Pedido do Luiz depois da aprovação do tema. Plano completo: **`docs/tech/cronometro-mover-notificacao.md`** (abordagem, contratos, riscos, tarefas **T14 a T17** e critérios de aceite **23 a 38**, que somam aos deste documento).

Resumo e efeitos neste plano:
- **Cronômetro móvel:** segurar e arrastar até o topo ou a base, com `react-native-gesture-handler` 2.16.2 + `react-native-reanimated` 3.10.1, **já instalados e configurados**. Botão ↑/↓ como alternativa sem gesto. Posição salva no aparelho (`meu-plano:cronometro-posicao`). Entra na T5 (Treino + cronômetro).
- **Notificação com contagem ao vivo e alarme no fim (só Android):** **módulo nativo local** (`modules/rest-timer`, Expo Modules API, Kotlin), sem pacote novo no lock. Novas permissões no `app.json`: `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `VIBRATE`. O APK novo já era necessário.
- **iPhone (web):** sem notificação nem contagem ao vivo em segundo plano (limitação do Safari, sem servidor de push). Fora do escopo; nada muda na web.
- **Mudanças em tarefas deste plano:** a T2 cria `src/services/devicePrefs.ts` (tema + posição do cronômetro + controle do pedido de permissão) **no lugar** de `themePreference.ts`; o contrato `loadThemePreference`/`saveThemePreference` e a chave `meu-plano:tema` não mudam. A T4 (Perfil) ganha as linhas de status das notificações (só Android). A T5 passa a seguir também a T16. O `TimerContext` ganha `addTime` (o "+15 s" da spec) e é dividido em `useTimerActions`/`useTimerLayout`, para a tela de Treino não re-renderizar a cada segundo.
- **Ordem:** T1 → T2 → **T14** → **T15** (pode correr em paralelo com T3/T4) → T3 … T5 (+T16, T17) … T13.
