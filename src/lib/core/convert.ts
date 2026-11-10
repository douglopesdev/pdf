// Orquestra a conversão: identifica cada arquivo, decide entre usar o JPEG como
// está ou rasterizar, calcula o layout e monta o PDF. O rasterizador é injetado,
// então tudo aqui roda (e é testado) fora do navegador.

import { ConvertError, ImageError, type ImageFailure } from './errors';
import { SNIFF_BYTES, sniffFormat } from './format';
import { readJpegInfo } from './jpeg';
import { placeImage } from './layout';
import { MAX_IMAGES, QUALITY, normalizeRotation, type PdfOptions, type Rotation } from './options';
import { buildPdf, type PdfPage } from './pdf-writer';
import { canPassthrough, type Rasterizer } from './raster';

export interface ConvertInput {
  files: readonly Blob[];
  /** Rotação escolhida pelo usuário para cada arquivo, em graus. Faltando, vale 0. */
  rotations: readonly number[];
  options: PdfOptions;
}

export interface ConvertDeps {
  rasterize: Rasterizer;
  signal?: AbortSignal;
  /** Chamado ao terminar cada arquivo, inclusive os pulados. `page` começa em 1. */
  onProgress?: (page: number, total: number) => void;
}

export interface ConvertResult {
  blob: Blob;
  /** Número de páginas do PDF. */
  pages: number;
  /** Posições (na lista recebida) dos arquivos que ficaram de fora. */
  skipped: number[];
  /** O motivo de cada arquivo pulado. */
  failures: ImageFailure[];
}

type ImageData = Pick<PdfPage, 'jpeg' | 'width' | 'height' | 'gray'>;

async function loadImage(
  file: Blob,
  rotation: Rotation,
  options: PdfOptions,
  rasterize: Rasterizer,
): Promise<ImageData> {
  const head = new Uint8Array(await file.slice(0, SNIFF_BYTES).arrayBuffer());
  const format = sniffFormat(head);
  if (format === 'heic') throw new ImageError('heic-unsupported');

  if (format === 'jpeg') {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const info = readJpegInfo(bytes);
    if (info && canPassthrough(info, rotation, QUALITY[options.quality].maxSide)) {
      return {
        jpeg: bytes,
        width: info.width,
        height: info.height,
        gray: info.components === 1,
      };
    }
  }

  // Formato desconhecido também tenta: o navegador pode saber decodificar.
  const raster = await rasterize(file, rotation, options.quality);
  return { jpeg: raster.bytes, width: raster.width, height: raster.height };
}

export async function convert(input: ConvertInput, deps: ConvertDeps): Promise<ConvertResult> {
  const { files, rotations, options } = input;
  const { rasterize, signal, onProgress } = deps;

  if (files.length === 0) throw new ConvertError('no-images');
  if (files.length > MAX_IMAGES) throw new ConvertError('too-many-images');

  const pages: PdfPage[] = [];
  const failures: ImageFailure[] = [];
  const checkCancelled = (): void => {
    if (signal?.aborted) throw new ConvertError('cancelled');
  };

  for (const [index, file] of files.entries()) {
    checkCancelled();
    try {
      const image = await loadImage(file, normalizeRotation(rotations[index]), options, rasterize);
      pages.push({ ...image, placement: placeImage(image.width, image.height, options) });
    } catch (error) {
      checkCancelled();
      failures.push({ index, code: error instanceof ImageError ? error.code : 'decode-failed' });
    }
    checkCancelled();
    onProgress?.(index + 1, files.length);
  }

  if (pages.length === 0) throw new ConvertError('no-images', failures);

  return {
    blob: buildPdf(pages),
    pages: pages.length,
    skipped: failures.map((f) => f.index),
    failures,
  };
}
