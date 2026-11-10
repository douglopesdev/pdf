import { describe, expect, it, vi } from 'vitest';
import { convert, type ConvertDeps } from '../../src/lib/core/convert';
import { ConvertError, ImageError } from '../../src/lib/core/errors';
import { DEFAULT_OPTIONS, MAX_IMAGES, type PdfOptions } from '../../src/lib/core/options';
import type { Rasterizer } from '../../src/lib/core/raster';
import { fixture, fixtureBlob, heicHeader } from '../helpers/fixtures';
import { blobBytes, latin1 } from '../helpers/pdf';

/** Finge o canvas: devolve sempre o mesmo JPEG, de 60 × 40 (ou 40 × 60 girado). */
function fakeRasterizer() {
  return vi.fn<Rasterizer>(async (_source, rotation) => {
    const quarter = rotation === 90 || rotation === 270;
    return { bytes: fixture('photo.jpg'), width: quarter ? 40 : 60, height: quarter ? 60 : 40 };
  });
}

function run(
  files: Blob[],
  extra: { rotations?: number[]; options?: Partial<PdfOptions>; deps?: Partial<ConvertDeps> } = {},
) {
  const rasterize = extra.deps?.rasterize ?? fakeRasterizer();
  return convert(
    { files, rotations: extra.rotations ?? [], options: { ...DEFAULT_OPTIONS, ...extra.options } },
    { ...extra.deps, rasterize },
  );
}

describe('convert', () => {
  it('JPEG em pé e dentro do limite entra sem recompressão', async () => {
    const rasterize = fakeRasterizer();
    const result = await run([fixtureBlob('photo.jpg'), fixtureBlob('gray.jpg')], {
      deps: { rasterize },
    });

    expect(rasterize).not.toHaveBeenCalled();
    expect(result).toMatchObject({ pages: 2, skipped: [], failures: [] });
    expect(result.blob.type).toBe('application/pdf');

    const text = latin1(await blobBytes(result.blob));
    expect(text).toContain(`/Length ${fixture('photo.jpg').length} >>`);
    expect(text).toContain('/ColorSpace /DeviceGray');
  });

  it('JPEG girado pelo usuário ou pelo EXIF passa pelo rasterizador', async () => {
    const rasterize = fakeRasterizer();
    await run([fixtureBlob('photo.jpg'), fixtureBlob('exif-6.jpg'), fixtureBlob('exif-1.jpg')], {
      rotations: [90, 0, 0],
      deps: { rasterize },
    });

    expect(rasterize).toHaveBeenCalledTimes(2);
    expect(rasterize.mock.calls.map((call) => call[1])).toEqual([90, 0]);
  });

  it('a rotação muda a orientação da página', async () => {
    const result = await run([fixtureBlob('alpha.png'), fixtureBlob('alpha.png')], {
      rotations: [0, 90],
    });
    const text = latin1(await blobBytes(result.blob));
    expect(text).toContain('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 841.89 595.28]');
    expect(text).toContain('6 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89]');
  });

  it('repassa a qualidade e normaliza a rotação', async () => {
    const rasterize = fakeRasterizer();
    await run([fixtureBlob('alpha.webp')], {
      rotations: [-90],
      options: { quality: 'low' },
      deps: { rasterize },
    });
    expect(rasterize).toHaveBeenCalledWith(expect.any(Blob), 270, 'low');
  });

  it('pula HEIC e imagem que não decodifica, sem quebrar as outras', async () => {
    const rasterize = vi.fn<Rasterizer>(async () => {
      throw new ImageError('decode-failed');
    });
    const result = await run(
      [new Blob([heicHeader()]), fixtureBlob('photo.jpg'), new Blob(['não é imagem'])],
      { deps: { rasterize } },
    );

    expect(result.pages).toBe(1);
    expect(result.skipped).toEqual([0, 2]);
    expect(result.failures).toEqual([
      { index: 0, code: 'heic-unsupported' },
      { index: 2, code: 'decode-failed' },
    ]);
    // O HEIC nem chega ao rasterizador.
    expect(rasterize).toHaveBeenCalledTimes(1);
  });

  it('erro inesperado do rasterizador vira decode-failed', async () => {
    const rasterize = vi.fn<Rasterizer>(async () => {
      throw new TypeError('canvas estourou');
    });
    const result = await run([fixtureBlob('alpha.png'), fixtureBlob('photo.jpg')], {
      deps: { rasterize },
    });
    expect(result.failures).toEqual([{ index: 0, code: 'decode-failed' }]);
  });

  it('avisa o progresso a cada arquivo, inclusive os pulados', async () => {
    const onProgress = vi.fn();
    await run([fixtureBlob('photo.jpg'), new Blob([heicHeader()]), fixtureBlob('alpha.png')], {
      deps: { onProgress },
    });
    expect(onProgress.mock.calls).toEqual([
      [1, 3],
      [2, 3],
      [3, 3],
    ]);
  });

  it('falha com no-images quando a lista é vazia ou nada sobra', async () => {
    await expect(run([])).rejects.toMatchObject({ code: 'no-images', failures: [] });
    await expect(run([new Blob([heicHeader()])])).rejects.toMatchObject({
      code: 'no-images',
      failures: [{ index: 0, code: 'heic-unsupported' }],
    });
  });

  it(`aceita ${MAX_IMAGES} imagens e recusa ${MAX_IMAGES + 1}`, async () => {
    const files = Array.from({ length: MAX_IMAGES + 1 }, () => fixtureBlob('photo.jpg'));
    await expect(run(files)).rejects.toMatchObject({ code: 'too-many-images' });
    await expect(run(files.slice(1))).resolves.toMatchObject({ pages: MAX_IMAGES });
  });

  it('cancela antes de começar', async () => {
    const rasterize = fakeRasterizer();
    const error = await run([fixtureBlob('alpha.png')], {
      deps: { rasterize, signal: AbortSignal.abort() },
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ConvertError);
    expect(error).toMatchObject({ code: 'cancelled' });
    expect(rasterize).not.toHaveBeenCalled();
  });

  it('cancela no meio e não processa o resto', async () => {
    const controller = new AbortController();
    const rasterize = fakeRasterizer();
    const onProgress = vi.fn((page: number) => {
      if (page === 2) controller.abort();
    });
    const files = Array.from({ length: 5 }, () => fixtureBlob('alpha.png'));

    await expect(
      run(files, { deps: { rasterize, onProgress, signal: controller.signal } }),
    ).rejects.toMatchObject({ code: 'cancelled' });
    expect(rasterize).toHaveBeenCalledTimes(2);
  });

  it('cancelar durante a decodificação não vira página pulada', async () => {
    const controller = new AbortController();
    const rasterize = vi.fn<Rasterizer>(async () => {
      controller.abort();
      throw new ImageError('decode-failed');
    });
    await expect(
      run([fixtureBlob('alpha.png')], { deps: { rasterize, signal: controller.signal } }),
    ).rejects.toMatchObject({ code: 'cancelled' });
  });
});
