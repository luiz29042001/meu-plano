/**
 * # Configuração do Metro (empacotador do app)
 * Parte da configuração padrão do Expo e acrescenta uma única regra.
 */
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/**
 * ## Regra extra
 * O supabase-js tenta carregar de forma opcional o `@opentelemetry/api` (telemetria).
 * Na web o Metro exige que o módulo exista. Como o pacote não é usado, devolvemos
 * um módulo vazio **só na plataforma web**; o supabase-js lida bem com a ausência.
 * Android e iOS não são afetados.
 */
// O supabase-js tenta carregar opcionalmente '@opentelemetry/api' (telemetria).
// Na web o Metro exige que o módulo exista; como o pacote não é usado, devolvemos
// um módulo vazio — o próprio supabase-js trata a ausência e segue normalmente.
// Android/iOS não são afetados.
/**
 * Guarda o resolvedor original para continuar usando-o em todos os outros casos.
 */
const upstreamResolve = config.resolver.resolveRequest;
/**
 * Novo resolvedor: se for a web e o módulo for o de telemetria → módulo vazio; senão → resolvedor original.
 */
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === '@opentelemetry/api') {
    return { type: 'empty' };
  }
  return (upstreamResolve ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
