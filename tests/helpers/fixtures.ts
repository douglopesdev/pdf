import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Todas as imagens de tests/fixtures têm 60 × 40 quando exibidas em pé. */
export const FIXTURE_WIDTH = 60;
export const FIXTURE_HEIGHT = 40;

export function fixture(name: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(readFileSync(join(import.meta.dirname, '..', 'fixtures', name)));
}

export function fixtureBlob(name: string): Blob {
  return new Blob([fixture(name)]);
}

/** Início de um arquivo HEIC como o das câmeras: caixa `ftyp` com a marca `heic`. */
export function heicHeader(): Uint8Array<ArrayBuffer> {
  const text = 'ftypheic\0\0\0\0mif1heic';
  const bytes = new Uint8Array(4 + text.length);
  bytes[3] = bytes.length;
  for (let i = 0; i < text.length; i++) bytes[4 + i] = text.charCodeAt(i);
  return bytes;
}
