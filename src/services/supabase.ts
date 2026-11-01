/**
 * # Cliente Supabase (`supabase.ts`)
 * Cria **uma única conexão** com o banco/autenticação, compartilhada pelo app inteiro.
 */

// Polyfill: dá ao React Native a classe `URL` que o supabase-js espera.
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * ## Configuração
 * URL e chave pública (`anon`) vêm de `app.json > expo.extra`. A chave `anon` é pública por desenho: quem protege os dados é o RLS do banco. A chave `service_role` **nunca** entra no app.
 */
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string;

/**
 * ## `supabase`
 * Cliente exportado. Opções de autenticação:
 * - `storage: AsyncStorage` → guarda a sessão no aparelho.
 * - `autoRefreshToken` → renova o login sozinho.
 * - `persistSession` → mantém o login entre aberturas do app.
 * - `detectSessionInUrl` → só na web, para capturar a volta do login Google na URL.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
