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

export type RootStackParamList = {
  Home: undefined;
  Workout: { daySlug?: string } | undefined;
  Diet: undefined;
  Calendar: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** Qual item da barra fica ativo em cada rota (Calendário e Perfil contam como Início). */
const ACTIVE_BY_ROUTE: Record<keyof RootStackParamList, BarItem> = {
  Home: 'Home', Calendar: 'Home', Profile: 'Home', Workout: 'Workout', Diet: 'Diet',
};

const useStyles = makeStyles(c => ({
  // Web larga: fundo ocupa a janela; conteúdo numa coluna de até 560px (spec §3).
  frame: { flex: 1, backgroundColor: c.bg, alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: Layout.COLUMN_MAX, backgroundColor: c.bg },
  root: { flex: 1, backgroundColor: c.bg },
  loader: { flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' },
}));

function AppNavigator({ routeName }: { routeName: keyof RootStackParamList | undefined }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const keyboard = useKeyboardVisible();
  const { reduce } = useMotion();
  const active = ACTIVE_BY_ROUTE[routeName ?? 'Home'];

  // Destinos da barra trocam o histórico (Android: voltar do Treino/Dieta leva ao Início).
  const goBar = (name: BarItem) => {
    if (!navigationRef.isReady() || name === active) return;
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

export function Navigation() {
  const { session, loading } = useAuth();
  const { scheme, colors } = useTheme();
  const styles = useStyles();
  const [routeName, setRouteName] = useState<keyof RootStackParamList | undefined>(undefined);
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
