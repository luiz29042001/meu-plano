const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// O supabase-js tenta carregar opcionalmente '@opentelemetry/api' (telemetria).
// Na web o Metro exige que o módulo exista; como o pacote não é usado, devolvemos
// um módulo vazio — o próprio supabase-js trata a ausência e segue normalmente.
// Android/iOS não são afetados.
const upstreamResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === '@opentelemetry/api') {
    return { type: 'empty' };
  }
  return (upstreamResolve ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
