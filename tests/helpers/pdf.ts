// Leitura mínima de um PDF para os testes: confere a tabela xref byte a byte.

export async function blobBytes(blob: Blob): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(await blob.arrayBuffer());
}

/** Latin-1: cada byte vira um caractere, então índice de texto = offset no arquivo. */
export function latin1(bytes: Uint8Array): string {
  return new TextDecoder('latin1').decode(bytes);
}

export interface XrefInfo {
  /** Valor de /Size no trailer. */
  size: number;
  /** offsets[id] = posição do objeto `id` no arquivo. */
  offsets: number[];
}

export function readXref(text: string): XrefInfo {
  const startxref = /startxref\n(\d+)\n%%EOF\n$/.exec(text);
  if (!startxref) throw new Error('startxref não encontrado');
  const at = Number(startxref[1]);
  const header = /^xref\n0 (\d+)\n/.exec(text.slice(at));
  if (!header) throw new Error('startxref não aponta para a tabela xref');

  const count = Number(header[1]);
  const first = at + header[0].length;
  const offsets: number[] = [];
  for (let id = 0; id < count; id++) {
    // Cada entrada tem exatamente 20 bytes.
    const entry = text.slice(first + id * 20, first + (id + 1) * 20);
    const match = /^(\d{10}) (\d{5}) ([nf]) \n$/.exec(entry);
    if (!match) throw new Error(`entrada ${id} da xref malformada`);
    offsets.push(Number(match[1]));
  }

  const size = /trailer\n<< \/Size (\d+) \/Root 1 0 R >>/.exec(text.slice(first + count * 20));
  if (!size) throw new Error('trailer não encontrado');
  return { size: Number(size[1]), offsets };
}
