import { describe, expect, it } from 'vitest';
import { SNIFF_BYTES, sniffFormat } from '../../src/lib/core/format';
import { fixture, heicHeader } from '../helpers/fixtures';

describe('sniffFormat', () => {
  it.each([
    ['photo.jpg', 'jpeg'],
    ['exif-6.jpg', 'jpeg'],
    ['alpha.png', 'png'],
    ['alpha.webp', 'webp'],
    ['animated.gif', 'gif'],
    ['image.bmp', 'bmp'],
    ['alpha.avif', 'avif'],
  ] as const)('%s é %s', (name, format) => {
    expect(sniffFormat(fixture(name).subarray(0, SNIFF_BYTES))).toBe(format);
  });

  it('reconhece HEIC pela caixa ftyp', () => {
    expect(sniffFormat(heicHeader())).toBe('heic');
  });

  it('HEIF genérico (mif1) com marca avif é AVIF', () => {
    const bytes = heicHeader();
    bytes.set(new TextEncoder().encode('mif1'), 8);
    bytes.set(new TextEncoder().encode('avif'), 20);
    expect(sniffFormat(bytes)).toBe('avif');
  });

  it('devolve unknown para o resto', () => {
    expect(sniffFormat(new Uint8Array())).toBe('unknown');
    expect(sniffFormat(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBe(
      'unknown',
    );
    expect(sniffFormat(new TextEncoder().encode('%PDF-1.4\n%\n1 0 obj'))).toBe('unknown');
  });
});
