import { describe, expect, it } from 'vitest';
import { MARGIN_PT, placeImage, type LayoutOptions } from '../../src/lib/core/layout';

const base: LayoutOptions = { pageSize: 'a4', margin: true, autoOrient: true };

describe('placeImage', () => {
  it('A4 em pé para imagem em pé', () => {
    const p = placeImage(1000, 2000, base);
    expect(p.pageWidth).toBe(595.28);
    expect(p.pageHeight).toBe(841.89);
  });

  it('A4 deitado para imagem deitada quando autoOrient está ligado', () => {
    const p = placeImage(2000, 1000, base);
    expect(p.pageWidth).toBe(841.89);
    expect(p.pageHeight).toBe(595.28);
  });

  it('mantém a página em pé quando autoOrient está desligado', () => {
    const p = placeImage(2000, 1000, { ...base, autoOrient: false });
    expect(p.pageWidth).toBe(595.28);
    expect(p.pageHeight).toBe(841.89);
    // Largura limita: a imagem ocupa toda a área útil na horizontal.
    expect(p.width).toBeCloseTo(595.28 - MARGIN_PT * 2, 6);
    expect(p.height).toBeCloseTo(p.width / 2, 6);
  });

  it('imagem quadrada fica em página em pé', () => {
    const p = placeImage(500, 500, base);
    expect(p.pageWidth).toBe(595.28);
  });

  it('Carta em pé e deitada', () => {
    expect(placeImage(3, 4, { ...base, pageSize: 'letter' })).toMatchObject({
      pageWidth: 612,
      pageHeight: 792,
    });
    expect(placeImage(4, 3, { ...base, pageSize: 'letter' })).toMatchObject({
      pageWidth: 792,
      pageHeight: 612,
    });
  });

  it('respeita 1 cm de margem e centraliza', () => {
    const p = placeImage(1000, 2000, base);
    expect(p.x).toBeGreaterThanOrEqual(MARGIN_PT - 1e-9);
    expect(p.y).toBeGreaterThanOrEqual(MARGIN_PT - 1e-9);
    // Altura limita: encosta na margem de cima e de baixo.
    expect(p.y).toBeCloseTo(MARGIN_PT, 6);
    expect(p.height).toBeCloseTo(841.89 - MARGIN_PT * 2, 6);
    // Centralizada nos dois eixos.
    expect(p.x * 2 + p.width).toBeCloseTo(p.pageWidth, 6);
    expect(p.y * 2 + p.height).toBeCloseTo(p.pageHeight, 6);
  });

  it('sem margem, a imagem encosta na borda', () => {
    const p = placeImage(59528, 84189, { ...base, margin: false });
    expect(p.x).toBeCloseTo(0, 6);
    expect(p.y).toBeCloseTo(0, 6);
    expect(p.width).toBeCloseTo(595.28, 6);
    expect(p.height).toBeCloseTo(841.89, 6);
  });

  it('nunca distorce a imagem', () => {
    for (const [w, h] of [
      [4000, 3000],
      [3000, 4000],
      [100, 1000],
      [1000, 100],
    ] as const) {
      for (const pageSize of ['a4', 'letter', 'original'] as const) {
        const p = placeImage(w, h, { ...base, pageSize });
        expect(p.width / p.height).toBeCloseTo(w / h, 6);
      }
    }
  });

  it('original: lado maior com 842 pt mais a margem', () => {
    const p = placeImage(4000, 3000, { ...base, pageSize: 'original' });
    expect(p.width).toBeCloseTo(842, 6);
    expect(p.height).toBeCloseTo(631.5, 6);
    expect(p.pageWidth).toBeCloseTo(842 + MARGIN_PT * 2, 6);
    expect(p.pageHeight).toBeCloseTo(631.5 + MARGIN_PT * 2, 6);
    expect(p.x).toBeCloseTo(MARGIN_PT, 6);
    expect(p.y).toBeCloseTo(MARGIN_PT, 6);
  });

  it('original sem margem: a página tem a proporção exata da imagem', () => {
    const p = placeImage(3000, 4000, { ...base, pageSize: 'original', margin: false });
    expect(p).toMatchObject({ pageWidth: 631.5, pageHeight: 842, x: 0, y: 0 });
  });

  it('recusa dimensões inválidas', () => {
    expect(() => placeImage(0, 100, base)).toThrow(RangeError);
    expect(() => placeImage(100, Number.NaN, base)).toThrow(RangeError);
  });
});
