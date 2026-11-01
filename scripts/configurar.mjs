#!/usr/bin/env node
// Assistente de configuração do Meu Plano.
// Uso: npm run configurar
//
// Faz perguntas simples e grava as respostas no app.json, para quem está
// montando a SUA PRÓPRIA cópia do app (seu Supabase, seu Google, seu Expo).
// Não envia nada para a internet e não mexe em nenhum outro arquivo.
// Guia completo: docs/guia/instalacao.md

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { stdin, stdout, exit } from 'node:process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const caminhoApp = join(raiz, 'app.json');
const rl = createInterface({ input: stdin, output: stdout, terminal: false });

// Fila de linhas: funciona digitando, colando ou recebendo respostas por pipe.
const filaLinhas = [];
const esperando = [];
let fimEntrada = false;
rl.on('line', (l) => (esperando.length ? esperando.shift()(l) : filaLinhas.push(l)));
rl.on('close', () => {
  fimEntrada = true;
  while (esperando.length) esperando.shift()(null);
});
function lerLinha(texto) {
  stdout.write(texto);
  if (filaLinhas.length) return Promise.resolve(filaLinhas.shift());
  if (fimEntrada) return Promise.resolve(null);
  return new Promise((r) => esperando.push(r));
}
async function question(texto) {
  const l = await lerLinha(texto);
  if (l === null) {
    console.log('\n\nEntrada encerrada antes do fim. Nada foi gravado.');
    exit(1);
  }
  return l;
}

const app = JSON.parse(readFileSync(caminhoApp, 'utf8'));
const expo = app.expo;
const extra = (expo.extra ??= {});

function titulo(t) {
  console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 60 - t.length))}`);
}

/** Pergunta com valor atual entre colchetes; Enter mantém o atual. */
async function perguntar(texto, atual, validar) {
  for (;;) {
    const sufixo = atual ? ` [Enter = manter ${resumir(atual)}]` : '';
    const resposta = (await question(`${texto}${sufixo}\n> `)).trim();
    const valor = resposta || atual || '';
    const erro = validar ? validar(valor) : null;
    if (!erro) return valor;
    console.log(`  ⚠ ${erro}`);
  }
}

async function simNao(texto, padrao = false) {
  const r = (await question(`${texto} (${padrao ? 'S/n' : 's/N'})\n> `)).trim().toLowerCase();
  if (!r) return padrao;
  return r.startsWith('s') || r.startsWith('y');
}

function resumir(v) {
  return v.length > 40 ? `${v.slice(0, 18)}…${v.slice(-12)}` : v;
}

const obrigatorio = (nome) => (v) => (v ? null : `${nome} é obrigatório.`);

console.log(`
Assistente de configuração do Meu Plano
Você vai precisar de (ver docs/guia/instalacao.md, Partes 2 e 3):
  • Project URL e chave "anon public" do seu projeto Supabase
  • Web Client ID do Google (Google Cloud > Credenciais)
Nada é enviado para a internet; só o arquivo app.json é alterado
(uma cópia de segurança fica em app.json.bak).`);

titulo('1/4 Supabase');
const urlAtual = extra.supabaseUrl;
extra.supabaseUrl = await perguntar(
  'Project URL do Supabase (ex.: https://abcdefgh.supabase.co)',
  urlAtual,
  (v) =>
    /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(v)
      ? null
      : 'Formato esperado: https://<ref>.supabase.co (Supabase > Project Settings > API).',
).then((v) => v.replace(/\/$/, ''));
const trocouProjeto = urlAtual && urlAtual !== extra.supabaseUrl;
extra.supabaseAnonKey = await perguntar(
  'Chave "anon public" do Supabase (começa com eyJ... ou sb_publishable_...)',
  trocouProjeto ? '' : extra.supabaseAnonKey,
  (v) => {
    if (!v) return 'A chave anon é obrigatória.';
    if (/PLACEHOLDER/i.test(v)) return 'Esse é o valor de exemplo. Cole a sua chave anon do Supabase.';
    if (/service_role|sb_secret_/.test(v)) return 'Essa é a chave SECRETA. Use a "anon public" / "publishable".';
    try {
      if (v.startsWith('eyJ')) {
        const payload = JSON.parse(Buffer.from(v.split('.')[1], 'base64').toString('utf8'));
        if (payload.role === 'service_role') return 'Essa é a chave service_role (secreta). Use a "anon public".';
      }
    } catch {}
    return null;
  },
);

titulo('2/4 Google');
extra.googleWebClientId = await perguntar(
  'Web Client ID do Google (termina com .apps.googleusercontent.com)',
  trocouProjeto ? '' : extra.googleWebClientId,
  (v) =>
    !/\.apps\.googleusercontent\.com$/.test(v)
      ? 'Deve terminar com .apps.googleusercontent.com'
      : /^0+-/.test(v)
        ? 'Esse é o valor de exemplo. Cole o seu Web Client ID.'
        : null,
);
// Não é lido pelo código (o Android usa o Web Client ID), mas fica anotado.
const android = await perguntar(
  'Android Client ID (opcional, só para referência; Enter para pular)',
  trocouProjeto ? '' : extra.googleAndroidClientId,
);
if (android) extra.googleAndroidClientId = android;
else delete extra.googleAndroidClientId;

titulo('3/4 Identidade do app');
console.log('O "pacote" é o nome único do app no Android (e na Google Play).');
console.log('Se você não é o Luiz, troque para algo seu, ex.: com.seunome.meuplano');
const pacote = await perguntar('Pacote Android / iOS', expo.android?.package, (v) =>
  /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(v) ? null : 'Use letras minúsculas e pontos, ex.: com.seunome.meuplano',
);
expo.android.package = pacote;
if (expo.ios) expo.ios.bundleIdentifier = pacote;
expo.name = await perguntar('Nome que aparece no celular', expo.name, obrigatorio('O nome'));
if (expo.web) {
  expo.web.name = expo.name;
  expo.web.shortName = expo.name;
}

titulo('4/4 Expo (EAS, para gerar o APK Android)');
const temProjetoEas = Boolean(extra.eas?.projectId || expo.owner);
let limparEas = false;
if (temProjetoEas) {
  console.log(`Este app.json aponta para o projeto Expo de outra pessoa (dono: ${expo.owner ?? '?'}).`);
  limparEas = await simNao('Vai usar a SUA conta Expo? (recomendado se você não é o dono)', true);
  if (limparEas) {
    delete expo.owner;
    if (extra.eas) delete extra.eas.projectId;
    if (extra.eas && Object.keys(extra.eas).length === 0) delete extra.eas;
  }
}

if (!existsSync(caminhoApp + '.bak')) copyFileSync(caminhoApp, caminhoApp + '.bak');
writeFileSync(caminhoApp, JSON.stringify(app, null, 2) + '\n');
rl.close();

console.log(`
✔ app.json atualizado (cópia do original em app.json.bak).

Próximos passos (detalhes em docs/guia/instalacao.md):
  1. Testar no navegador:   npx expo start --web   → http://localhost:8081
  2. Entrar com Google e escolher seu programa (Parte 5 do guia).${
    limparEas
      ? `
  3. Para o APK Android:    npx eas-cli@latest login
                            npx eas-cli@latest init   (cria SEU projeto Expo)`
      : ''
  }
  • ${
    existsSync(join(raiz, 'google-services.json'))
      ? 'Confira se o google-services.json é do SEU projeto (Parte 7.2 do guia).'
      : 'Para o APK: crie o google-services.json do SEU projeto (Parte 7.2 do guia).'
  }`);
exit(0);
