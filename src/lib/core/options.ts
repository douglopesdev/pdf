// Opções do PDF e limites da conversão. Lógica pura: sem Svelte nem DOM.

export type PageSize = 'a4' | 'letter' | 'original';
export type Quality = 'high' | 'medium' | 'low';
export type Rotation = 0 | 90 | 180 | 270;

export interface PdfOptions {
  pageSize: PageSize;
  quality: Quality;
  /** true = 1 cm de margem branca de cada lado. */
  margin: boolean;
  /** true = página em pé ou deitada conforme a imagem. */
  autoOrient: boolean;
}

export const DEFAULT_OPTIONS: Readonly<PdfOptions> = {
  pageSize: 'a4',
  quality: 'medium',
  margin: true,
  autoOrient: true,
};

export interface QualityPreset {
  /** Limite do lado maior da imagem, em pixels. */
  maxSide: number;
  /** Qualidade do JPEG, de 0 a 1. */
  jpeg: number;
}

export const QUALITY: Readonly<Record<Quality, QualityPreset>> = {
  high: { maxSide: 3000, jpeg: 0.9 },
  medium: { maxSide: 2000, jpeg: 0.78 },
  low: { maxSide: 1400, jpeg: 0.6 },
};

/** Limite de imagens por PDF, para não estourar a memória dos telefones. */
export const MAX_IMAGES = 60;

/** Aceita qualquer número (inclusive negativo) e devolve um quarto de volta válido. */
export function normalizeRotation(value: number | undefined): Rotation {
  if (value === undefined || !Number.isFinite(value)) return 0;
  const turns = ((Math.round(value / 90) % 4) + 4) % 4;
  return (turns * 90) as Rotation;
}
