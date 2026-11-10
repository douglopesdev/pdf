import { describe, expect, it } from 'vitest';
import { placeImage } from '../../src/lib/core/layout';
import { DEFAULT_OPTIONS } from '../../src/lib/core/options';
import { buildPdf, type PdfPage } from '../../src/lib/core/pdf-writer';
import { FIXTURE_HEIGHT, FIXTURE_WIDTH, fixture } from '../helpers/fixtures';
import { blobBytes, latin1, readXref } from '../helpers/pdf';

function page(name = 'photo.jpg', gray = false): PdfPage {
  return {
    jpeg: fixture(name),
    width: FIXTURE_WIDTH,
    height: FIXTURE_HEIGHT,
    gray,
    placement: placeImage(FIXTURE_WIDTH, FIXTURE_HEIGHT, DEFAULT_OPTIONS),
  };
}

async function build(pages: PdfPage[]): Promise<{ bytes: Uint8Array; text: string }> {
  const blob = buildPdf(pages);
  expect(blob.type).toBe('application/pdf');
  const bytes = await blobBytes(blob);
  return { bytes, text: latin1(bytes) };
}

describe('buildPdf', () => {
  it('começa com o cabeçalho 1.4 e termina com %%EOF', async () => {
    const { text } = await build([page()]);
    expect(text.startsWith('%PDF-1.4\n%')).toBe(true);
    expect(text.endsWith('%%EOF\n')).toBe(true);
  });

  it.each([1, 2, 7])('xref com offsets exatos para %i página(s)', async (count) => {
    const { text } = await build(Array.from({ length: count }, () => page()));
    const xref = readXref(text);

    expect(xref.size).toBe(3 + count * 3);
    expect(xref.offsets).toHaveLength(xref.size);
    expect(xref.offsets[0]).toBe(0);
    for (let id = 1; id < xref.size; id++) {
      const at = xref.offsets[id] ?? -1;
      expect(text.slice(at, at + `${id} 0 obj\n`.length)).toBe(`${id} 0 obj\n`);
    }
  });

  it('declara o número de páginas e os filhos na ordem', async () => {
    const { text } = await build([page(), page(), page()]);
    expect(text).toContain('/Type /Pages /Kids [3 0 R 6 0 R 9 0 R] /Count 3 >>');
    expect(text.match(/\/Type \/Page /g)).toHaveLength(3);
    expect(text).toContain('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>');
  });

  it('cada página aponta para o seu conteúdo e a sua imagem', async () => {
    const { text } = await build([page(), page()]);
    expect(text).toContain(
      '6 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 841.89 595.28] ' +
        '/Resources << /XObject << /Im0 8 0 R >> >> /Contents 7 0 R >>',
    );
  });

  it('o conteúdo posiciona a imagem e o /Length confere', async () => {
    const p = page();
    const { text } = await build([p]);
    const content = /4 0 obj\n<< \/Length (\d+) >>\nstream\n([^]*?)endstream/.exec(text);
    expect(content?.[2]).toMatch(/^q [\d.]+ 0 0 [\d.]+ [\d.]+ [\d.]+ cm \/Im0 Do Q\n$/);
    expect(Number(content?.[1])).toBe(content?.[2]?.length);

    // 60 × 40 em A4 deitado com margem: a largura limita.
    const [, w, h, x, y] = /^q ([\d.]+) 0 0 ([\d.]+) ([\d.]+) ([\d.]+) cm/.exec(
      content?.[2] ?? '',
    )!;
    expect(Number(w)).toBeCloseTo(p.placement.width, 2);
    expect(Number(h)).toBeCloseTo(p.placement.height, 2);
    expect(Number(x)).toBeCloseTo(28.35, 2);
    expect(Number(y)).toBeCloseTo(p.placement.y, 2);
  });

  it('embute os bytes do JPEG intactos, com /Length exato', async () => {
    const jpeg = fixture('photo.jpg');
    const { bytes, text } = await build([page()]);
    const header =
      `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${FIXTURE_WIDTH} /Height ${FIXTURE_HEIGHT} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`;
    const at = text.indexOf(header);
    expect(at).toBeGreaterThan(0);

    const start = at + header.length;
    expect(Array.from(bytes.subarray(start, start + jpeg.length))).toEqual(Array.from(jpeg));
    expect(text.slice(start + jpeg.length, start + jpeg.length + 18)).toBe('\nendstream\nendobj\n');
  });

  it('usa /DeviceGray em JPEG de tons de cinza', async () => {
    const { text } = await build([page('gray.jpg', true), page()]);
    expect(text.match(/\/ColorSpace \/DeviceGray/g)).toHaveLength(1);
    expect(text.match(/\/ColorSpace \/DeviceRGB/g)).toHaveLength(1);
  });

  it('escreve números com no máximo duas casas', async () => {
    const p = page();
    p.placement = { ...p.placement, pageWidth: 100.126, pageHeight: 200 };
    const { text } = await build([p]);
    expect(text).toContain('/MediaBox [0 0 100.13 200]');
  });

  it('recusa PDF sem páginas', () => {
    expect(() => buildPdf([])).toThrow(RangeError);
  });
});
