// Roda a conversão fora da thread da interface.
// Uso: new Worker(new URL('./convert.worker.ts', import.meta.url), { type: 'module' })

import { convert } from '../core/convert';
import { ConvertError } from '../core/errors';
import { rasterize } from '../core/raster';
import type { ConvertRequest, WorkerRequest, WorkerResponse } from './protocol';

// O tsconfig usa a lib DOM, não a WebWorker: declara só o que o worker usa.
interface WorkerScope {
  postMessage(message: WorkerResponse): void;
  addEventListener(type: 'message', listener: (event: MessageEvent<WorkerRequest>) => void): void;
}
const scope = self as unknown as WorkerScope;

let current: AbortController | null = null;

async function run(request: ConvertRequest): Promise<void> {
  // Um pedido novo substitui o anterior.
  current?.abort();
  const controller = new AbortController();
  current = controller;
  const isCurrent = (): boolean => current === controller;

  try {
    const result = await convert(request, {
      rasterize,
      signal: controller.signal,
      onProgress: (page, total) => {
        if (isCurrent()) scope.postMessage({ type: 'progress', page, total });
      },
    });
    if (isCurrent()) scope.postMessage({ type: 'done', ...result });
  } catch (error) {
    if (!isCurrent()) return;
    const known = error instanceof ConvertError;
    scope.postMessage({
      type: 'error',
      code: known ? error.code : 'unknown',
      failures: known ? error.failures : [],
    });
  } finally {
    if (isCurrent()) current = null;
  }
}

scope.addEventListener('message', (event) => {
  const message = event.data;
  if (message.type === 'cancel') {
    current?.abort();
    return;
  }
  void run(message);
});
