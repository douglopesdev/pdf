// Tamanho da página, margem e encaixe da imagem. Tudo em pontos (1 pt = 1/72 pol).

import type { PdfOptions } from './options';

/** 1 cm em pontos. */
export const MARGIN_PT = 28.35;

/** Largura × altura em pé. */
export const PAGE_PT = {
  a4: [595.28, 841.89],
  letter: [612, 792],
} as const;

/** Em `original`, o lado maior da imagem ocupa esta medida (a altura de um A4). */
export const ORIGINAL_LONG_SIDE_PT = 842;

export interface Placement {
  pageWidth: number;
  pageHeight: number;
  /** Canto inferior esquerdo da imagem (a origem do PDF fica embaixo, à esquerda). */
  x: number;
  y: number;
  /** Tamanho da imagem na página. */
  width: number;
  height: number;
}

export type LayoutOptions = Pick<PdfOptions, 'pageSize' | 'margin' | 'autoOrient'>;

/**
 * Calcula a página e a posição de uma imagem de `imgWidth` × `imgHeight` pixels
 * (já com a rotação final aplicada). A imagem é encaixada sem distorcer e
 * centralizada na área útil.
 */
export function placeImage(imgWidth: number, imgHeight: number, options: LayoutOptions): Placement {
  if (!(imgWidth > 0) || !(imgHeight > 0)) {
    throw new RangeError('A imagem precisa ter largura e altura positivas.');
  }
  const margin = options.margin ? MARGIN_PT : 0;

  let pageWidth: number;
  let pageHeight: number;
  if (options.pageSize === 'original') {
    const k = ORIGINAL_LONG_SIDE_PT / Math.max(imgWidth, imgHeight);
    pageWidth = imgWidth * k + margin * 2;
    pageHeight = imgHeight * k + margin * 2;
  } else {
    const [short, long] = PAGE_PT[options.pageSize];
    const landscape = options.autoOrient && imgWidth > imgHeight;
    pageWidth = landscape ? long : short;
    pageHeight = landscape ? short : long;
  }

  const boxWidth = pageWidth - margin * 2;
  const boxHeight = pageHeight - margin * 2;
  const scale = Math.min(boxWidth / imgWidth, boxHeight / imgHeight);
  const width = imgWidth * scale;
  const height = imgHeight * scale;

  return {
    pageWidth,
    pageHeight,
    x: (pageWidth - width) / 2,
    y: (pageHeight - height) / 2,
    width,
    height,
  };
}
