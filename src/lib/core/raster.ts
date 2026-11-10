// Decodifica, gira e redimensiona uma imagem, devolvendo um JPEG.
// As contas ficam em funções puras; só `rasterize` usa o OffscreenCanvas.

import { ImageError } from './errors';
import type { JpegInfo } from './jpeg';
import { QUALITY, type Quality, type Rotation } from './options';

export interface RasterResult {
  bytes: Uint8Array<ArrayBuffer>;
  /** Dimensões do JPEG gerado, já com a rotação aplicada. */
  width: number;
  height: number;
}

export type Rasterizer = (
  source: Blob,
  rotation: Rotation,
  quality: Quality,
) => Promise<RasterResult>;

export interface TargetSize {
  /** Tamanho do canvas (rotação aplicada). */
  width: number;
  height: number;
  /** Tamanho em que a imagem é desenhada, antes de girar. */
  drawWidth: number;
  drawHeight: number;
}

/** Reduz para caber em `maxSide` (nunca amplia) e troca os lados em 90° e 270°. */
export function targetSize(
  width: number,
  height: number,
  rotation: Rotation,
  maxSide: number,
): TargetSize {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const drawWidth = Math.max(1, Math.round(width * scale));
  const drawHeight = Math.max(1, Math.round(height * scale));
  const quarter = rotation === 90 || rotation === 270;
  return {
    width: quarter ? drawHeight : drawWidth,
    height: quarter ? drawWidth : drawHeight,
    drawWidth,
    drawHeight,
  };
}

/**
 * Um JPEG entra no PDF sem recompressão quando não precisa girar nem reduzir
 * e é de um tipo que o `/DCTDecode` lê em todo leitor: 8 bits, cinza ou
 * YCbCr, baseline, sequencial ou progressivo.
 */
export function canPassthrough(info: JpegInfo, rotation: Rotation, maxSide: number): boolean {
  return (
    rotation === 0 &&
    info.orientation === 1 &&
    Math.max(info.width, info.height) <= maxSide &&
    info.precision === 8 &&
    (info.components === 1 || info.components === 3) &&
    info.process <= 2
  );
}

/**
 * `createImageBitmap` já aplica a orientação EXIF (`from-image`) e, em GIF
 * animado, entrega só o primeiro quadro. Aqui entra apenas a rotação escolhida
 * pelo usuário. O fundo branco cobre a transparência antes de virar JPEG.
 */
export const rasterize: Rasterizer = async (source, rotation, quality) => {
  const preset = QUALITY[quality];

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' });
  } catch {
    throw new ImageError('decode-failed');
  }

  try {
    const size = targetSize(bitmap.width, bitmap.height, rotation, preset.maxSide);
    const canvas = new OffscreenCanvas(size.width, size.height);
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new ImageError('decode-failed');

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, size.width, size.height);
    ctx.imageSmoothingQuality = 'high';
    ctx.translate(size.width / 2, size.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(
      bitmap,
      -size.drawWidth / 2,
      -size.drawHeight / 2,
      size.drawWidth,
      size.drawHeight,
    );

    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: preset.jpeg });
    return {
      bytes: new Uint8Array(await blob.arrayBuffer()),
      width: size.width,
      height: size.height,
    };
  } finally {
    // Uma imagem por vez na memória.
    bitmap.close();
  }
};
