// Mensagens trocadas com o convert.worker. Só tipos: a interface importa daqui
// sem puxar o código do worker para o bundle principal.

import type { ConvertErrorCode, ImageFailure } from '../core/errors';
import type { PdfOptions } from '../core/options';

export interface ConvertRequest {
  type?: 'convert';
  files: File[];
  /** Rotação de cada arquivo, em graus (0, 90, 180 ou 270). */
  rotations: number[];
  options: PdfOptions;
}

export interface CancelRequest {
  type: 'cancel';
}

export type WorkerRequest = ConvertRequest | CancelRequest;

export interface ProgressMessage {
  type: 'progress';
  page: number;
  total: number;
}

export interface DoneMessage {
  type: 'done';
  blob: Blob;
  pages: number;
  skipped: number[];
  failures: ImageFailure[];
}

export interface ErrorMessage {
  type: 'error';
  /** Depois de um pedido de cancelamento, chega `cancelled`. */
  code: ConvertErrorCode;
  failures: ImageFailure[];
}

export type WorkerResponse = ProgressMessage | DoneMessage | ErrorMessage;
