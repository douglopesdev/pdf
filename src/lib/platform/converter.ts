// Liga a interface ao convert.worker. Cada conversão usa um worker novo:
// cancelar é encerrar o worker, o que também devolve a memória na hora.

import { ConvertError } from '../core/errors';
import type { ConvertRequest, DoneMessage, WorkerResponse } from '../worker/protocol';

export interface ConvertJob {
  /** Rejeita com `ConvertError` (inclusive `cancelled`). */
  result: Promise<DoneMessage>;
  cancel(): void;
}

export function startConversion(
  request: ConvertRequest,
  onProgress: (page: number, total: number) => void,
): ConvertJob {
  const worker = new Worker(new URL('../worker/convert.worker.ts', import.meta.url), {
    type: 'module',
  });
  let cancel = (): void => {};

  const result = new Promise<DoneMessage>((resolve, reject) => {
    const fail = (error: ConvertError): void => {
      worker.terminate();
      reject(error);
    };
    cancel = () => fail(new ConvertError('cancelled'));

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;
      if (message.type === 'progress') {
        onProgress(message.page, message.total);
      } else if (message.type === 'done') {
        worker.terminate();
        resolve(message);
      } else {
        fail(new ConvertError(message.code, message.failures));
      }
    };
    worker.onerror = () => fail(new ConvertError('unknown'));
    worker.postMessage(request);
  });

  return { result, cancel: () => cancel() };
}
