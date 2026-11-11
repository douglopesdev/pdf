// Registro do service worker e aviso de nova versão.
// Com `registerType: 'prompt'`, a versão nova só entra quando o usuário aceita:
// trocar no meio de uma conversão recarregaria a página e perderia as páginas.

import { registerSW } from 'virtual:pwa-register';

class AppUpdate {
  /** Há uma versão nova baixada, esperando para entrar. */
  available = $state(false);

  #activate: ((reload?: boolean) => Promise<void>) | null = null;

  /** Chamado uma vez, ao abrir o app. Em desenvolvimento não registra nada. */
  start(): void {
    if (this.#activate) return;
    this.#activate = registerSW({
      onNeedRefresh: () => {
        this.available = true;
      },
    });
  }

  /** Ativa a versão nova e recarrega a página. */
  apply(): void {
    this.available = false;
    void this.#activate?.(true);
  }

  dismiss(): void {
    this.available = false;
  }
}

export const appUpdate = new AppUpdate();
