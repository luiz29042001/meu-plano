/**
 * # `ProfileScreen` — tela Perfil
 * Identidade da conta, programa de treino, estado das notificações do cronômetro (Android), escolha de **aparência** (tema), opção de **descanso automático** e botão de sair.
 */

import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, Vibration, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, makeStyles } from '../contexts/ThemeContext';
import { useTimerInsets } from '../hooks/useTimerInsets';
import { useRestNotification } from '../hooks/useRestNotification';
import { loadAutoRest, saveAutoRest } from '../services/devicePrefs';
import { confirmAction } from '../utils/confirm';
import { ScreenHeader } from '../components/ScreenHeader';
import { OutlineButton } from '../components/Buttons';
import { Skeleton } from '../components/Skeleton';
import { Segmented } from '../components/Segmented';
import {
  Font, FontSize, LineHeight, Radius, Spacing, Touch, Tracking,
  type ThemePreference,
} from '../utils/theme';

/**
 * `OPTIONS`: as três escolhas de tema (Sistema, Claro, Escuro).
 */
const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
];

/**
 * `REST_OPTIONS`: Sim/Não para o descanso automático.
 */
const REST_OPTIONS: { value: 'on' | 'off'; label: string }[] = [
  { value: 'on', label: 'Sim' },
  { value: 'off', label: 'Não' },
];

/**
 * `SCHEME_NAME`: nome em português de cada tema, usado no texto de ajuda.
 */
const SCHEME_NAME = { light: 'claro', dark: 'escuro' } as const;

/**
 * Estilos da tela.
 */
const useStyles = makeStyles(c => ({
  container: { flex: 1, backgroundColor: c.bg },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.section },
  identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, paddingVertical: Spacing.xl },
  avatar: {
    width: Touch.primary, height: Touch.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: c.border, borderRadius: Radius.sm,
  },
  avatarText: {
    fontFamily: Font.condBold, fontSize: FontSize.numeral, color: c.text,
    includeFontPadding: false, textTransform: 'uppercase',
  },
  identityText: { flex: 1, gap: Spacing.xs },
  name: { fontFamily: Font.bodySemi, fontSize: FontSize.lg, color: c.text },
  nameSub: { fontFamily: Font.body, fontSize: FontSize.md, color: c.textMuted },
  row: {
    minHeight: Touch.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: Spacing.lg, borderTopWidth: 1, borderTopColor: c.border,
  },
  rowLast: { borderBottomWidth: 1, borderBottomColor: c.border },
  rowHover: { backgroundColor: c.cardHover },
  rowLabel: { fontFamily: Font.body, fontSize: FontSize.base, color: c.text, flexShrink: 0 },
  rowValueWrap: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: Spacing.sm },
  rowValue: { flexShrink: 1, textAlign: 'right', fontFamily: Font.body, fontSize: FontSize.base, color: c.textMuted },
  chevron: { fontFamily: Font.condMedium, fontSize: FontSize.xl, color: c.textMuted, includeFontPadding: false },
  sectionTitle: {
    marginTop: Spacing.xxxl, marginBottom: Spacing.md,
    fontFamily: Font.condSemi, fontSize: FontSize.xl, color: c.text,
    textTransform: 'uppercase', letterSpacing: Tracking.caps, includeFontPadding: false,
  },
  help: { marginTop: Spacing.md, fontFamily: Font.body, fontSize: FontSize.md, color: c.textMuted, lineHeight: LineHeight.md },
  signOutWrap: { marginTop: Spacing.section },
}));

/**
 * ## `Row({ label, value, onPress, last, a11yHint })`
 * Linha "rótulo — valor". Sem `onPress` é só informação; com `onPress` vira botão com seta. `last` tira a linha divisória da última linha do grupo e `a11yHint` dá uma dica a leitores de tela.
 */
function Row({
  label, value, onPress, last, a11yHint,
}: { label: string; value: string; onPress?: () => void; last?: boolean; a11yHint?: string }) {
  const styles = useStyles();
  // `content`: o miolo da linha (rótulo, valor e seta), reaproveitado nas versões com e sem toque.
  const content = (
    <>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValueWrap}>
        <Text style={styles.rowValue} numberOfLines={2}>{value}</Text>
        {onPress ? <Text style={styles.chevron}>›</Text> : null}
      </View>
    </>
  );
  if (!onPress) {
    return <View style={[styles.row, last && styles.rowLast]}>{content}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      accessibilityHint={a11yHint}
      style={({ pressed }) => [styles.row, last && styles.rowLast, pressed && styles.rowHover]}
    >
      {content}
    </Pressable>
  );
}

/**
 * ## `ProfileScreen()`
 */
export function ProfileScreen() {
  const styles = useStyles();
  // Dados: perfil, tema, estado das notificações (`useRestNotification`) e espaço do cronômetro.
  const { profile, profileStatus, signOut } = useAuth();
  const { scheme, preference, setPreference } = useTheme();
  const rest = useRestNotification();
  const timerInsets = useTimerInsets();
  // Estado do "descanso automático", lido do aparelho ao abrir.
  const [autoRest, setAutoRest] = useState<'on' | 'off'>('off');
  // Efeito: lê a preferência salva uma vez, ao abrir.
  useEffect(() => { loadAutoRest().then(v => setAutoRest(v ? 'on' : 'off')); }, []);

  // ### `chooseAutoRest(v)`
  // Ignora se não mudou; senão atualiza a tela, salva no aparelho e dá uma leve vibração no Android como confirmação.
  const chooseAutoRest = (v: 'on' | 'off') => {
    if (v === autoRest) return;
    setAutoRest(v);
    void saveAutoRest(v === 'on');
    if (Platform.OS === 'android') Vibration.vibrate(10);
  };

  // `loadingProfile`: o perfil ainda está carregando?
  const loadingProfile = profileStatus === 'idle' || profileStatus === 'loading';
  // ### Dados exibidos
  // Se o perfil falhar, mostra "Atleta"; o seletor de tema e o botão Sair continuam funcionando. Calcula nome completo, inicial do avatar e nome do programa (ou "Sem programa").
  // Erro ao carregar o perfil: mostra "Atleta"; seletor e Sair seguem funcionando.
  const fullName = profile?.full_name?.trim() || 'Atleta';
  const initial = fullName[0]?.toUpperCase() ?? '?';
  const programName = profile?.program?.name ?? (loadingProfile ? '' : 'Sem programa');

  // ### `handleSignOut()`
  // Pergunta "Deseja realmente sair?" antes de sair da conta.
  const handleSignOut = () => {
    confirmAction('Sair da conta', 'Deseja realmente sair?', 'Sair', () => { signOut(); });
  };

  // ### `choose(p)`
  // Troca o tema (se for diferente do atual) e vibra levemente no Android.
  const choose = (p: ThemePreference) => {
    if (p === preference) return;
    setPreference(p);
    if (Platform.OS === 'android') Vibration.vibrate(10);
  };

  // ### `help`
  // Texto explicativo sob o seletor: muda conforme a escolha (automático mostra o tema atual).
  const help =
    preference === 'system'
      ? `Segue o tema do celular. Agora: ${SCHEME_NAME[scheme]}.`
      : preference === 'light'
        ? 'Sempre claro, mesmo com o celular no modo escuro.'
        : 'Sempre escuro, mesmo com o celular no modo claro.';

  // `notif`/`showNotifRows`: as linhas de notificação só aparecem onde há suporte (Android com módulo nativo).
  const notif = rest.status;
  const showNotifRows = !!notif && notif.supported;

  // ### `handleNotif()`
  // Pede a permissão de notificação; se a pessoa negar, abre os ajustes do Android para ela ativar manualmente.
  const handleNotif = async () => {
    const ok = await rest.requestPermission();
    if (!ok) rest.openAppNotificationSettings();
  };

  // ### O que a tela desenha
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Perfil" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: timerInsets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {timerInsets.top > 0 && <View style={{ height: timerInsets.top }} />}
        {/* Identidade: avatar com a inicial e o nome (esqueleto enquanto carrega). */}
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{loadingProfile ? ' ' : initial}</Text>
          </View>
          <View style={styles.identityText}>
            {loadingProfile ? (
              <Skeleton width={160} height={22} />
            ) : (
              <Text style={styles.name} numberOfLines={2}>{fullName}</Text>
            )}
            <Text style={styles.nameSub}>Conta Google conectada</Text>
          </View>
        </View>

        {/* Linhas de informação: programa e, no Android, estado dos avisos e do alarme (tocar abre a ação correspondente). */}
        <Row label="Programa" value={programName} last={!showNotifRows} />
        {showNotifRows && notif && (
          <>
            <Row
              label="Avisos do cronômetro"
              value={notif.notifications ? 'Ativados' : 'Desativados'}
              onPress={notif.notifications ? undefined : handleNotif}
              a11yHint={notif.notifications ? undefined : 'Toque para ativar os avisos'}
            />
            <Row
              label="Alarme na hora certa"
              value={notif.exactAlarm ? 'Ativado' : 'Desativado'}
              onPress={notif.exactAlarm ? undefined : rest.openExactAlarmSettings}
              a11yHint={notif.exactAlarm ? undefined : 'Abre os ajustes de alarmes do Android'}
              last
            />
          </>
        )}

        {/* Seção **Aparência**: seletor de tema e o texto de ajuda. */}
        <Text style={styles.sectionTitle} accessibilityRole="header">Aparência</Text>
        <Segmented
          label="Aparência"
          options={OPTIONS}
          value={preference}
          onChange={choose}
        />
        <Text style={styles.help} accessibilityLiveRegion="polite">{help}</Text>

        {/* Seção **Treino**: liga/desliga o descanso automático. */}
        <Text style={styles.sectionTitle} accessibilityRole="header">Treino</Text>
        <Segmented
          label="Iniciar descanso ao marcar série"
          options={REST_OPTIONS}
          value={autoRest}
          onChange={chooseAutoRest}
        />
        <Text style={styles.help}>Iniciar descanso ao marcar série. O cronômetro começa sozinho a cada série feita.</Text>

        {/* Botão de sair da conta (estilo de perigo, com confirmação). */}
        <View style={styles.signOutWrap}>
          <OutlineButton label="Sair da conta" tone="danger" onPress={handleSignOut} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
