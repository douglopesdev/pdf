// Receber imagens pelo Compartilhar do Android (share_target do manifest).
//
// O Android faz um POST multipart em <escopo>/share-target. O service worker
// guarda os arquivos só na memória, redireciona para o app com ?shared e os
// entrega quando a página pede. Nada é gravado em disco.
//
// Este arquivo é usado pelo service worker e pela página.

/** Caminho do POST, relativo ao escopo do app. */
export const SHARE_ACTION = 'share-target';
/** Nome do campo dos arquivos no formulário. */
export const SHARE_FIELD = 'images';
/** Parâmetro que avisa a página de que há arquivos esperando. */
export const SHARE_PARAM = 'shared';

export const SHARE_REQUEST = 'pdf:shared-files?';
export const SHARE_RESPONSE = 'pdf:shared-files';

export interface ShareResponse {
  type: typeof SHARE_RESPONSE;
  files: File[];
}

/** Os arquivos do campo `images`, ignorando textos e arquivos vazios. */
export function sharedFiles(form: FormData): File[] {
  return form
    .getAll(SHARE_FIELD)
    .filter((entry): entry is File => typeof entry !== 'string' && entry.size > 0);
}

/** Quanto a página espera a resposta do service worker. */
const TIMEOUT_MS = 3000;

/**
 * Chamado pela página ao abrir. Se ela veio de um compartilhamento, limpa o
 * endereço e busca os arquivos com o service worker. Sem compartilhamento
 * (ou sem resposta), devolve uma lista vazia.
 */
export async function takeSharedFiles(): Promise<File[]> {
  const url = new URL(location.href);
  if (!url.searchParams.has(SHARE_PARAM)) return [];
  url.searchParams.delete(SHARE_PARAM);
  history.replaceState(history.state, '', url);

  const worker = navigator.serviceWorker?.controller;
  if (!worker) return [];

  return new Promise<File[]>((resolve) => {
    const finish = (files: File[]): void => {
      clearTimeout(timer);
      navigator.serviceWorker.removeEventListener('message', onMessage);
      resolve(files);
    };
    const onMessage = (event: MessageEvent<Partial<ShareResponse>>): void => {
      if (event.data?.type === SHARE_RESPONSE) finish(event.data.files ?? []);
    };
    const timer = setTimeout(() => finish([]), TIMEOUT_MS);
    navigator.serviceWorker.addEventListener('message', onMessage);
    worker.postMessage({ type: SHARE_REQUEST });
  });
}
