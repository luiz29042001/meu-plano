import React, { useMemo } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
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

export type RootStackParamList = {
  Home: undefined;
  Workout: { daySlug?: string } | undefined;
  Diet: undefined;
  Calendar: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const useStyles = makeStyles(c => ({
  // Web larga: fundo ocupa a janela; conteúdo numa coluna de até 560px (spec §3).
  frame: { flex: 1, backgroundColor: c.bg, alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: 560, backgroundColor: c.bg },
  root: { flex: 1, backgroundColor: c.bg },
  loader: { flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' },
}));

function AppNavigator() {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.root}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Workout" component={WorkoutScreen} />
        <Stack.Screen name="Diet" component={DietScreen} />
        <Stack.Screen name="Calendar" component={CalendarScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
      {/* FloatingTimer overlays all screens */}
      <FloatingTimer />
    </View>
  );
}

export function Navigation() {
  const { session, loading } = useAuth();
  const { scheme, colors } = useTheme();
  const styles = useStyles();

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
        <NavigationContainer theme={navTheme}>
          {session ? <AppNavigator /> : <LoginScreen />}
        </NavigationContainer>
      </View>
    </View>
  );
}
