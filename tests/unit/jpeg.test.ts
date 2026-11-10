import { describe, expect, it } from 'vitest';
import { displaySize, readJpegInfo } from '../../src/lib/core/jpeg';
import { FIXTURE_HEIGHT, FIXTURE_WIDTH, fixture } from '../helpers/fixtures';

describe('readJpegInfo', () => {
  it('lê as dimensões de um JPEG sem EXIF', () => {
    expect(readJpegInfo(fixture('photo.jpg'))).toEqual({
      width: FIXTURE_WIDTH,
      height: FIXTURE_HEIGHT,
      orientation: 1,
      components: 3,
      precision: 8,
      process: 0,
    });
  });

  it('reconhece tons de cinza e progressivo', () => {
    expect(readJpegInfo(fixture('gray.jpg'))).toMatchObject({ components: 1, process: 0 });
    expect(readJpegInfo(fixture('progressive.jpg'))).toMatchObject({ components: 3, process: 2 });
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8] as const)('lê a orientação EXIF %i', (orientation) => {
    const info = readJpegInfo(fixture(`exif-${orientation}.jpg`));
    expect(info?.orientation).toBe(orientation);

    // De 5 a 8, o arquivo guarda a imagem deitada de lado.
    const swapped = orientation >= 5;
    expect(info?.width).toBe(swapped ? FIXTURE_HEIGHT : FIXTURE_WIDTH);
    expect(info?.height).toBe(swapped ? FIXTURE_WIDTH : FIXTURE_HEIGHT);

    // Exibida, toda variação volta a ter 60 × 40.
    expect(info && displaySize(info)).toEqual({ width: FIXTURE_WIDTH, height: FIXTURE_HEIGHT });
  });

  it('lê EXIF big-endian (MM) montado à mão', () => {
    // SOI, APP1 com TIFF "MM" e orientação 6, SOF0 de 4 × 2.
    const bytes = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe1, 0x00, 0x22, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0x4d, 0x4d, 0x00,
      0x2a, 0x00, 0x00, 0x00, 0x08, 0x00, 0x01, 0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01,
      0x00, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x02,
      0x00, 0x04, 0x01, 0x01, 0x11, 0x00,
    ]);
    expect(readJpegInfo(bytes)).toEqual({
      width: 4,
      height: 2,
      orientation: 6,
      components: 1,
      precision: 8,
      process: 0,
    });
  });

  it('funciona em uma fatia de um buffer maior', () => {
    const photo = fixture('photo.jpg');
    const padded = new Uint8Array(photo.length + 10);
    padded.set(photo, 7);
    expect(readJpegInfo(padded.subarray(7, 7 + photo.length))?.width).toBe(FIXTURE_WIDTH);
  });

  it('devolve null para o que não é JPEG', () => {
    expect(readJpegInfo(new Uint8Array())).toBeNull();
    expect(readJpegInfo(fixture('alpha.png'))).toBeNull();
    expect(readJpegInfo(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]))).toBeNull();
  });

  it('devolve null para JPEG truncado, sem estourar', () => {
    const photo = fixture('photo.jpg');
    for (let size = 0; size < 40; size++) {
      expect(readJpegInfo(photo.subarray(0, size))).toBeNull();
    }
  });
});
