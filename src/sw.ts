/// <reference lib="webworker" />
// Service worker: deixa o app abrir offline e recebe imagens do Compartilhar.
// Não guarda imagem nem PDF: o cache só tem os arquivos do próprio app.

import { cleanupOutdatedCaches, precacheAndRoute, type PrecacheEntry } from 'workbox-precaching';
import {
  SHARE_ACTION,
  SHARE_PARAM,
  SHARE_REQUEST,
  SHARE_RESPONSE,
  sharedFiles,
  type ShareResponse,
} from './lib/platform/share-target';

declare const self: ServiceWorkerGlobalScope & {
  /** Lista dos arquivos do build, injetada pelo vite-plugin-pwa. */
  __WB_MANIFEST: (PrecacheEntry | string)[];
};

const scope = new URL(self.registration.scope);
const sharePath = `${scope.pathname}${SHARE_ACTION}`;

/** Imagens recebidas pelo Compartilhar, esperando a página pedir. Só na memória. */
let pending: File[] = [];

async function receiveShare(request: Request): Promise<Response> {
  try {
    pending = sharedFiles(await request.formData());
  } catch {
    pending = [];
  }
  const landing = new URL(scope);
  landing.searchParams.set(SHARE_PARAM, '1');
  return Response.redirect(landing, 303);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method === 'POST' && new URL(request.url).pathname === sharePath) {
    event.respondWith(receiveShare(request));
  }
});

self.addEventListener('message', (event) => {
  const type = (event.data as { type?: string } | null)?.type;
  if (type === 'SKIP_WAITING') {
    // O usuário tocou em Atualizar no aviso de nova versão.
    void self.skipWaiting();
  } else if (type === SHARE_REQUEST) {
    const response: ShareResponse = { type: SHARE_RESPONSE, files: pending };
    pending = [];
    event.source?.postMessage(response);
  }
});

cleanupOutdatedCaches();
// Qualquer endereço do app com parâmetros (como ?shared) abre o index.html do cache.
precacheAndRoute(self.__WB_MANIFEST, { ignoreURLParametersMatching: [/.*/] });
