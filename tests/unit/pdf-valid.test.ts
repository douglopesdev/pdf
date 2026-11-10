// Portão da Fase 1: os 6 formatos geram um PDF que passa no `qpdf --check`.
// O OffscreenCanvas não existe no Node, então o sharp faz o papel do canvas;
// todo o resto (identificação, EXIF, layout e pdf-writer) é o código do app.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { convert } from '../../src/lib/core/convert';
import { DEFAULT_OPTIONS, type PdfOptions } from '../../src/lib/core/options';
import { fixtureBlob, heicHeader } from '../helpers/fixtures';
import { blobBytes } from '../helpers/pdf';
import { sharpRasterize } from '../helpers/sharp-rasterizer';

const FORMATS = [
  'photo.jpg',
  'alpha.png',
  'alpha.webp',
  'animated.gif',
  'image.bmp',
  'alpha.avif',
] as const;
const EXIF = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `exif-${n}.jpg`);

const hasQpdf = spawnSync('qpdf', ['--version']).status === 0;
const dir = mkdtempSync(join(tmpdir(), 'pdf-test-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

async function make(names: readonly string[], options: Partial<PdfOptions> = {}, turn = 0) {
  return convert(
    {
      files: names.map(fixtureBlob),
      rotations: names.map(() => turn),
      options: { ...DEFAULT_OPTIONS, ...options },
    },
    { rasterize: sharpRasterize },
  );
}

/** Lança (com a saída do qpdf) se o arquivo tiver qualquer erro ou aviso. */
async function qpdfCheck(blob: Blob, name: string): Promise<string> {
  const path = join(dir, name);
  writeFileSync(path, await blobBytes(blob));
  return execFileSync('qpdf', ['--check', path], { encoding: 'utf8' });
}

describe('conversão dos formatos aceitos', () => {
  it.each(FORMATS)('%s vira uma página', async (name) => {
    const result = await make([name]);
    expect(result).toMatchObject({ pages: 1, skipped: [] });
  });

  it('as 8 orientações EXIF viram páginas deitadas, como a imagem exibida', async () => {
    const result = await make(EXIF);
    expect(result.pages).toBe(8);
    const text = new TextDecoder('latin1').decode(await blobBytes(result.blob));
    expect(text.match(/\/MediaBox \[0 0 841\.89 595\.28\]/g)).toHaveLength(8);
    // Toda imagem entra em pé no PDF, com 60 × 40.
    expect(text.match(/\/Width 60 \/Height 40 /g)).toHaveLength(8);
  });
});

describe('qpdf --check', () => {
  it('está instalado no CI', () => {
    if (process.env.CI) expect(hasQpdf).toBe(true);
  });

  it.runIf(hasQpdf).each(FORMATS)('%s gera PDF válido', async (name) => {
    const result = await make([name]);
    expect(await qpdfCheck(result.blob, `${name}.pdf`)).toContain('No syntax or stream');
  });

  it.runIf(hasQpdf).each([
    ['A4 com margem', {}],
    ['Carta sem margem', { pageSize: 'letter', margin: false }],
    ['original, qualidade alta', { pageSize: 'original', quality: 'high' }],
    ['A4 sem girar a página, qualidade leve', { autoOrient: false, quality: 'low' }],
  ] as const)('todos os formatos juntos: %s', async (label, options) => {
    const result = await make([...FORMATS, ...EXIF, 'gray.jpg', 'progressive.jpg'], options);
    expect(result.pages).toBe(FORMATS.length + EXIF.length + 2);
    expect(await qpdfCheck(result.blob, `${label}.pdf`)).toContain('No syntax or stream');
  });

  it.runIf(hasQpdf)('páginas giradas e um HEIC pulado no meio', async () => {
    const result = await convert(
      {
        files: [fixtureBlob('photo.jpg'), new Blob([heicHeader()]), fixtureBlob('alpha.png')],
        rotations: [90, 0, 270],
        options: DEFAULT_OPTIONS,
      },
      { rasterize: sharpRasterize },
    );
    expect(result).toMatchObject({ pages: 2, skipped: [1] });
    expect(await qpdfCheck(result.blob, 'giradas.pdf')).toContain('No syntax or stream');
  });
});
