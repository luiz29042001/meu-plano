/**
 * # Estado da rede (`networkStatus.ts`)
 * Guarda, em um só lugar, se o app acredita estar **sem internet**. Qualquer tela pode "assinar" e reagir quando muda.
 *
 * No Android não usamos a biblioteca NetInfo: o app marca "offline" quando uma requisição falha por rede e volta ao normal na próxima que der certo.
 */

// Estado de rede compartilhado. No Android não há NetInfo: o app marca "sem
// internet" quando uma requisição falha por rede e limpa na próxima que der certo.
/**
 * ## Estado interno
 * - `offline`: `true` quando a última requisição falhou por rede.
 * - `listeners`: funções que querem ser avisadas quando o valor muda (padrão "observador").
 */
let offline = false;
const listeners = new Set<() => void>();

/**
 * ## `set(next)`
 * Troca o estado e avisa os assinantes. Se o valor não mudou, não faz nada (evita atualizar telas à toa).
 */
function set(next: boolean) {
  if (offline === next) return;
  offline = next;
  listeners.forEach(l => l());
}

/**
 * ## API pública
 * - `reportNetworkError()` → marca como offline.
 * - `reportNetworkOk()` → marca como online.
 * - `getReportedOffline()` → lê o estado atual.
 */
export const reportNetworkError = () => set(true);
export const reportNetworkOk = () => set(false);
export const getReportedOffline = () => offline;
/**
 * ## `subscribeNetwork(l)`
 * Cadastra um assinante e devolve a função que o **remove** (usada na limpeza dos hooks do React).
 */
export function subscribeNetwork(l: () => void): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
