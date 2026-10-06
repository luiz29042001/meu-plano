# Meu Plano — React Native + Expo + Supabase

## Stack
- React Native 0.74 + Expo SDK 51
- Supabase (PostgreSQL + Auth + RLS)
- Google Sign-In via `@react-native-google-signin/google-signin`
- React Navigation v6
- EAS Build para Android

---

## 1. Supabase — Setup

1. Crie um projeto em https://supabase.com
2. Aplique as migrações de `supabase/migrations/` em ordem (Supabase CLI: `supabase db push`). O projeto de produção já tem as migrações antigas aplicadas: veja `docs/tech/correcoes-revisao-2026-10-05-backend.md` antes de usar o CLI nele.
3. Em **Authentication → Providers → Google**, ative e adicione suas credenciais OAuth
4. Copie `Project URL` e `anon key` de **Settings → API**

---

## 2. Google OAuth — Credenciais

1. Acesse https://console.cloud.google.com
2. Crie um projeto → **APIs & Services → Credentials**
3. Crie **OAuth 2.0 Client ID**:
   - **Web application** → copie o `Web Client ID`
   - **Android** → use o SHA-1 do keystore + package `com.meuplano.app` → copie o `Android Client ID`
4. Adicione o Web Client ID também nas configurações do Supabase Google Provider

---

## 3. Configuração do projeto

### app.json — substitua os placeholders:
```json
"extra": {
  "supabaseUrl": "https://xxxx.supabase.co",
  "supabaseAnonKey": "eyJ...",
  "googleWebClientId": "xxxx.apps.googleusercontent.com",
  "googleAndroidClientId": "xxxx.apps.googleusercontent.com",
  "eas": { "projectId": "seu-eas-project-id" }
}
```

### google-services.json
Baixe do Google Cloud Console (Android → Download JSON) e coloque na raiz do projeto.

---

## 4. Instalação

```bash
npm install
npx expo install
```

---

## 5. Build de desenvolvimento (teste no dispositivo)

```bash
# Instale EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure o projeto (primeira vez)
eas build:configure

# Build APK de desenvolvimento
eas build --platform android --profile development

# Ou rode direto com expo-dev-client instalado no device
npx expo start --dev-client
```

---

## 6. Build de produção

```bash
# APK para distribuição interna
eas build --platform android --profile preview

# AAB para Google Play
eas build --platform android --profile production
```

---

## Estrutura do projeto

```
meu-plano-app/
├── App.tsx                      # Entry point
├── app.json                     # Expo config
├── eas.json                     # EAS Build profiles
├── supabase/
│   └── schema.sql               # Schema completo + seeds
└── src/
    ├── types/index.ts           # TypeScript types
    ├── contexts/
    │   ├── AuthContext.tsx      # Sessão Supabase
    │   └── TimerContext.tsx     # Timer global flutuante
    ├── services/
    │   ├── supabase.ts          # Client Supabase
    │   ├── auth.ts              # Google Sign-In
    │   ├── workout.ts           # CRUD treinos/checks
    │   ├── profile.ts           # CRUD perfil/dieta
    │   └── dietData.ts          # Dados estáticos da dieta
    ├── hooks/
    │   ├── useWorkout.ts        # Hook principal de treino
    │   └── useCalendar.ts       # Hook do calendário
    ├── navigation/index.tsx     # Stack navigator
    ├── screens/
    │   ├── LoginScreen.tsx
    │   ├── HomeScreen.tsx       # Dashboard com stats reais
    │   ├── WorkoutScreen.tsx    # Treino com checks persistidos
    │   ├── DietScreen.tsx       # Dieta A/B com preferência no DB
    │   └── CalendarScreen.tsx   # Calendário persistente
    ├── components/
    │   └── FloatingTimer.tsx    # Timer overlay global
    └── utils/
        ├── theme.ts             # Cores e constantes de UI
        └── date.ts              # Helpers de data
```

---

## Persistência implementada

| Dado | Tabela Supabase |
|------|----------------|
| Perfil e variante de dieta | `profiles` |
| Treinos concluídos | `workout_completions` |
| Checks de exercícios por dia | `exercise_checks` |
| Estatísticas (streak, total) | `user_stats` (auto-calculado por trigger) |
| Dias e exercícios | `workout_days` + `exercises` (seed) |

Todos protegidos por **Row Level Security** — cada usuário só acessa seus próprios dados.
