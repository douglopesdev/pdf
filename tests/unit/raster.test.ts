import { describe, expect, it } from 'vitest';
import type { JpegInfo } from '../../src/lib/core/jpeg';
import { normalizeRotation, QUALITY } from '../../src/lib/core/options';
import { canPassthrough, targetSize } from '../../src/lib/core/raster';

describe('targetSize', () => {
  it('não amplia imagem que já cabe', () => {
    expect(targetSize(800, 600, 0, 2000)).toEqual({
      width: 800,
      height: 600,
      drawWidth: 800,
      drawHeight: 600,
    });
  });

  it('reduz pelo lado maior, mantendo a proporção', () => {
    expect(targetSize(8000, 6000, 0, 2000)).toMatchObject({ width: 2000, height: 1500 });
    expect(targetSize(6000, 8000, 0, 2000)).toMatchObject({ width: 1500, height: 2000 });
  });

  it('troca os lados do canvas em 90° e 270°', () => {
    for (const rotation of [90, 270] as const) {
      expect(targetSize(8000, 6000, rotation, 2000)).toEqual({
        width: 1500,
        height: 2000,
        drawWidth: 2000,
        drawHeight: 1500,
      });
    }
    expect(targetSize(8000, 6000, 180, 2000)).toMatchObject({ width: 2000, height: 1500 });
  });

  it('nunca zera um lado em imagem muito estreita', () => {
    expect(targetSize(10000, 1, 0, 1400)).toMatchObject({ width: 1400, height: 1 });
  });
});

describe('canPassthrough', () => {
  const jpeg: JpegInfo = {
    width: 2000,
    height: 1500,
    orientation: 1,
    components: 3,
    precision: 8,
    process: 0,
  };
  const max = QUALITY.medium.maxSide;

  it('aceita JPEG em pé que cabe no limite', () => {
    expect(canPassthrough(jpeg, 0, max)).toBe(true);
    expect(canPassthrough({ ...jpeg, components: 1 }, 0, max)).toBe(true);
    expect(canPassthrough({ ...jpeg, process: 2 }, 0, max)).toBe(true);
  });

  it('recusa quando o usuário girou ou o EXIF pede rotação', () => {
    expect(canPassthrough(jpeg, 90, max)).toBe(false);
    expect(canPassthrough({ ...jpeg, orientation: 6 }, 0, max)).toBe(false);
    expect(canPassthrough({ ...jpeg, orientation: 2 }, 0, max)).toBe(false);
  });

  it('recusa quando passa do limite da qualidade', () => {
    expect(canPassthrough({ ...jpeg, width: 2001 }, 0, max)).toBe(false);
    expect(canPassthrough({ ...jpeg, width: 2001 }, 0, QUALITY.high.maxSide)).toBe(true);
    expect(canPassthrough(jpeg, 0, QUALITY.low.maxSide)).toBe(false);
  });

  it('recusa CMYK, 12 bits e JPEG sem perdas ou aritmético', () => {
    expect(canPassthrough({ ...jpeg, components: 4 }, 0, max)).toBe(false);
    expect(canPassthrough({ ...jpeg, precision: 12 }, 0, max)).toBe(false);
    expect(canPassthrough({ ...jpeg, process: 3 }, 0, max)).toBe(false);
    expect(canPassthrough({ ...jpeg, process: 9 }, 0, max)).toBe(false);
  });
});

describe('normalizeRotation', () => {
  it('reduz qualquer valor a um quarto de volta', () => {
    expect(normalizeRotation(0)).toBe(0);
    expect(normalizeRotation(90)).toBe(90);
    expect(normalizeRotation(360)).toBe(0);
    expect(normalizeRotation(450)).toBe(90);
    expect(normalizeRotation(-90)).toBe(270);
    expect(normalizeRotation(undefined)).toBe(0);
    expect(normalizeRotation(Number.NaN)).toBe(0);
  });
});
