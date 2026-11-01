/**
 * # `App.tsx` — ponto de entrada
 * Monta o app inteiro em camadas (de fora para dentro): áreas seguras → tema → portão de carregamento → login → cronômetro → navegação.
 */

import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
/**
 * Importa só os 6 pesos de fonte usados, por subcaminho. Nunca o índice do pacote, que traria todas as variações e engordaria o app.
 */
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { BarlowCondensed_500Medium } from '@expo-google-fonts/barlow-condensed/500Medium';
import { BarlowCondensed_600SemiBold } from '@expo-google-fonts/barlow-condensed/600SemiBold';
import { BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed/700Bold';
import { ThemeProvider, useTheme, makeStyles } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { TimerProvider } from './src/contexts/TimerContext';
import { Navigation } from './src/navigation';

/**
 * Mantém a tela de abertura (splash) até o tema e as fontes carregarem. Na web não faz nada.
 */
SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * `FONT_TIMEOUT_MS`: com rede ruim, depois de 3 s segue com a fonte de reserva.
 */
const FONT_TIMEOUT_MS = 3000;

/**
 * Estilo raiz com o fundo do tema.
 */
const useStyles = makeStyles(c => ({
  root: { flex: 1, backgroundColor: c.bg },
}));

/**
 * ## `ThemedStatusBar()`
 * Barra de status do celular: ícones claros no tema escuro e escuros no claro.
 */
function ThemedStatusBar() {
  const { scheme, colors } = useTheme();
  // Único lugar (junto do ThemeContext) que testa `scheme`.
  return (
    <StatusBar
      style={scheme === 'dark' ? 'light' : 'dark'}
      backgroundColor={colors.bg}
      translucent={false}
    />
  );
}

/**
 * ## `AppGate({ children })`
 * "Portão": só mostra o app quando tema e fontes estão prontos.
 *
 * 1. Pede as 6 fontes (`useFonts`).
 * 2. Um temporizador de 3 s libera mesmo que as fontes demorem.
 * 3. `open` = tema pronto **e** fontes resolvidas (carregadas, com erro ou tempo esgotado).
 * 4. Quando abre, esconde a splash.
 * 5. Enquanto fecha, devolve `null` (a splash nativa cobre, e na web o `<html>` já está pintado).
 */
function AppGate({ children }: { children: React.ReactNode }) {
  const { ready } = useTheme();
  const styles = useStyles();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    BarlowCondensed_500Medium,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
  });
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setTimedOut(true), FONT_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, []);

  const fontsDone = fontsLoaded || !!fontError || timedOut;
  const open = ready && fontsDone;

  useEffect(() => {
    if (open) SplashScreen.hideAsync().catch(() => {});
  }, [open]);

  // Enquanto espera: Android tem a splash por cima; na web o <html> já está pintado.
  if (!open) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemedStatusBar />
      {children}
    </GestureHandlerRootView>
  );
}

/**
 * ## `App()`
 * Componente raiz. A ordem das camadas importa: o tema vem antes do login (a tela de login já usa as cores), e o cronômetro vem dentro do login.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppGate>
          <AuthProvider>
            <TimerProvider>
              <Navigation />
            </TimerProvider>
          </AuthProvider>
        </AppGate>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
