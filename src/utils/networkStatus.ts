// Estado de rede compartilhado. No Android não há NetInfo: o app marca "sem
// internet" quando uma requisição falha por rede e limpa na próxima que der certo.
let offline = false;
const listeners = new Set<() => void>();

function set(next: boolean) {
  if (offline === next) return;
  offline = next;
  listeners.forEach(l => l());
}

export const reportNetworkError = () => set(true);
export const reportNetworkOk = () => set(false);
export const getReportedOffline = () => offline;
export function subscribeNetwork(l: () => void): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
