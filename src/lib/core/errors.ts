// Erros tipados da conversão. A interface traduz o `code` em mensagem (i18n).

/** Problema em uma imagem: ela é pulada e as outras páginas seguem. */
export type ImageErrorCode = 'heic-unsupported' | 'decode-failed';

export class ImageError extends Error {
  readonly code: ImageErrorCode;

  constructor(code: ImageErrorCode) {
    super(code);
    this.name = 'ImageError';
    this.code = code;
  }
}

/** Problema que impede o PDF inteiro. */
export type ConvertErrorCode = 'no-images' | 'too-many-images' | 'cancelled' | 'unknown';

export interface ImageFailure {
  /** Posição do arquivo na lista recebida. */
  index: number;
  code: ImageErrorCode;
}

export class ConvertError extends Error {
  readonly code: ConvertErrorCode;
  /** Preenchido em `no-images`, quando todas as imagens foram puladas. */
  readonly failures: ImageFailure[];

  constructor(code: ConvertErrorCode, failures: ImageFailure[] = []) {
    super(code);
    this.name = 'ConvertError';
    this.code = code;
    this.failures = failures;
  }
}
