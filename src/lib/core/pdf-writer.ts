// Monta um PDF 1.4 a partir de JPEGs: uma página por imagem, sem dependências.
// Porte do protótipo em docs/reference/pdf-writer-prototype.js.
//
// Objetos: 1 = catálogo, 2 = árvore de páginas e, para cada página i (de 0),
// 3+3i = Page, 4+3i = conteúdo e 5+3i = XObject da imagem (/DCTDecode).

import type { Placement } from './layout';

export interface PdfPage {
  /** Bytes do JPEG, colocados no PDF como estão. */
  jpeg: Uint8Array<ArrayBuffer>;
  /** Dimensões do JPEG em pixels. */
  width: number;
  height: number;
  /** true para JPEG de um componente (tons de cinza). */
  gray?: boolean;
  placement: Placement;
}

/** Comentário binário: avisa as ferramentas de que o arquivo não é texto. */
const BINARY_MARKER = new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]);

/** Número com no máximo duas casas, sem notação científica. */
function num(value: number): string {
  return (Math.round(value * 100) / 100).toString();
}

export function buildPdf(pages: readonly PdfPage[]): Blob {
  if (pages.length === 0) throw new RangeError('O PDF precisa de pelo menos uma página.');

  const encoder = new TextEncoder();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  const offsets: number[] = [];
  let length = 0;

  const push = (data: string | Uint8Array<ArrayBuffer>): void => {
    const bytes = typeof data === 'string' ? encoder.encode(data) : data;
    chunks.push(bytes);
    length += bytes.length;
  };
  const beginObject = (id: number): void => {
    offsets[id] = length;
    push(`${id} 0 obj\n`);
  };

  push('%PDF-1.4\n');
  push(BINARY_MARKER);

  const total = 3 + pages.length * 3;
  const kids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ');

  beginObject(1);
  push('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  beginObject(2);
  push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>\nendobj\n`);

  pages.forEach((page, i) => {
    const pageId = 3 + i * 3;
    const contentId = pageId + 1;
    const imageId = pageId + 2;
    const p = page.placement;

    beginObject(pageId);
    push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(p.pageWidth)} ${num(p.pageHeight)}] ` +
        `/Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`,
    );

    const content = encoder.encode(
      `q ${num(p.width)} 0 0 ${num(p.height)} ${num(p.x)} ${num(p.y)} cm /Im0 Do Q\n`,
    );
    beginObject(contentId);
    push(`<< /Length ${content.length} >>\nstream\n`);
    push(content);
    push('endstream\nendobj\n');

    beginObject(imageId);
    push(
      `<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} ` +
        `/ColorSpace ${page.gray ? '/DeviceGray' : '/DeviceRGB'} /BitsPerComponent 8 ` +
        `/Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`,
    );
    push(page.jpeg);
    push('\nendstream\nendobj\n');
  });

  const xrefAt = length;
  let xref = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let id = 1; id < total; id++) {
    xref += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  }
  push(xref);
  push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`);

  return new Blob(chunks, { type: 'application/pdf' });
}
