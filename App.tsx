import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Fontes por subcaminho (só os 6 pesos usados); nunca importar o índice do pacote.
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

// Segura a splash nativa até a preferência de tema e as fontes carregarem (no-op na web).
SplashScreen.preventAutoHideAsync().catch(() => {});

// Se as fontes demorarem (rede ruim na web), segue com a fonte de reserva.
const FONT_TIMEOUT_MS = 3000;

const useStyles = makeStyles(c => ({
  root: { flex: 1, backgroundColor: c.bg },
}));

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
