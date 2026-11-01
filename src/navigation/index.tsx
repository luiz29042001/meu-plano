/**
 * # Navegação (`navigation/index.tsx`)
 * Define quais telas existem, como se passa entre elas, a barra inferior e o tema da navegação. Usa React Navigation (pilha nativa); **não** usa expo-router.
 */

import React, { useMemo, useState } from 'react';
import {
  NavigationContainer, DefaultTheme, DarkTheme, createNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, makeStyles } from '../contexts/ThemeContext';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { WorkoutScreen } from '../screens/WorkoutScreen';
import { DietScreen } from '../screens/DietScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { FloatingTimer } from '../components/FloatingTimer';
import { BottomBar, type BarItem } from '../components/BottomBar';
import { useKeyboardVisible } from '../hooks/useKeyboardVisible';
import { useMotion } from '../hooks/useMotion';
import { Layout } from '../utils/theme';

/**
 * ## `RootStackParamList`
 * Lista das rotas e dos parâmetros que cada uma aceita. `Workout` aceita `daySlug` para abrir direto na aba de um dia (usado pelo card "Próximo treino").
 */
export type RootStackParamList = {
  Home: undefined;
  Workout: { daySlug?: string } | undefined;
  Diet: undefined;
  Calendar: undefined;
  Profile: undefined;
};

/**
 * `Stack` é a pilha de telas; `navigationRef` permite navegar fora de componentes.
 */
const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * `ACTIVE_BY_ROUTE`: qual item da barra fica ativo em cada rota (Calendário e Perfil contam como Início).
 *
  * Qual item da barra fica ativo em cada rota (Calendário e Perfil contam como Início).
  */
const ACTIVE_BY_ROUTE: Record<keyof RootStackParamList, BarItem> = {
  Home: 'Home', Calendar: 'Home', Profile: 'Home', Workout: 'Workout', Diet: 'Diet',
};

/**
 * Estilos: coluna central (até 560 px na web larga), fundo e tela de carregamento.
 */
const useStyles = makeStyles(c => ({
  // Web larga: fundo ocupa a janela; conteúdo numa coluna de até 560px.
  frame: { flex: 1, backgroundColor: c.bg, alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: Layout.COLUMN_MAX, backgroundColor: c.bg },
  root: { flex: 1, backgroundColor: c.bg },
  loader: { flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' },
}));

/**
 * ## `AppNavigator({ routeName })`
 * Telas do usuário logado.
 *
 * 1. Descobre o item ativo da barra pela rota atual.
 * 2. `goBar(name)` troca de destino **reiniciando o histórico** (Início → destino), assim o botão "voltar" do Android leva ao Início.
 * 3. Escolhe as animações; com "reduzir movimento", nenhuma.
 * 4. Monta a pilha com as 5 telas, a barra inferior (escondida com teclado) e o cronômetro flutuante por cima de tudo.
 */
function AppNavigator({ routeName }: { routeName: keyof RootStackParamList | undefined }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const keyboard = useKeyboardVisible();
  const { reduce } = useMotion();
  const active = ACTIVE_BY_ROUTE[routeName ?? 'Home'];

  // Destinos da barra trocam o histórico (Android: voltar do Treino/Dieta leva ao Início).
  const goBar = (name: BarItem) => {
    if (!navigationRef.isReady() || name === (routeName ?? 'Home')) return;
    navigationRef.reset({
      index: name === 'Home' ? 0 : 1,
      routes: name === 'Home' ? [{ name: 'Home' }] : [{ name: 'Home' }, { name }],
    });
  };
  const barAnim = reduce ? 'none' : 'fade';
  return (
    <View style={styles.root}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: reduce ? 'none' : 'slide_from_right',
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ animation: barAnim }} />
        <Stack.Screen name="Workout" component={WorkoutScreen} options={{ animation: barAnim }} />
        <Stack.Screen name="Diet" component={DietScreen} options={{ animation: barAnim }} />
        <Stack.Screen name="Calendar" component={CalendarScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
      {keyboard ? null : <BottomBar active={active} onPress={goBar} />}
      {/* FloatingTimer overlays all screens */}
      <FloatingTimer />
    </View>
  );
}

/**
 * ## `Navigation()`
 * Decide o que mostrar.
 *
 * 1. Enquanto lê a sessão inicial → indicador de carregamento.
 * 2. Com sessão → `AppNavigator`; sem sessão → `LoginScreen`.
 * 3. `syncRoute` guarda o nome da rota atual (para a barra saber o item ativo).
 * 4. `navTheme` ajusta as cores do React Navigation ao tema do app, evitando o fundo claro padrão em transições.
 */
export function Navigation() {
  const { session, loading } = useAuth();
  const { scheme, colors } = useTheme();
  const styles = useStyles();
  const [routeName, setRouteName] = useState<keyof RootStackParamList | undefined>(undefined);
  // `syncRoute()`: guarda no estado o nome da rota atual (usado para marcar o item ativo da barra inferior).
  const syncRoute = () => setRouteName(navigationRef.getCurrentRoute()?.name as keyof RootStackParamList | undefined);

  // Evita o fundo claro padrão do React Navigation na transição entre telas.
  const navTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: scheme === 'dark',
      colors: {
        ...base.colors,
        background: colors.bg,
        card: colors.bg,
        text: colors.text,
        border: colors.border,
        primary: colors.primary,
      },
    };
  }, [scheme, colors]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.textMuted} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.frame}>
      <View style={styles.column}>
        <NavigationContainer
          theme={navTheme}
          ref={navigationRef}
          onReady={syncRoute}
          onStateChange={syncRoute}
        >
          {session ? <AppNavigator routeName={routeName} /> : <LoginScreen />}
        </NavigationContainer>
      </View>
    </View>
  );
}
