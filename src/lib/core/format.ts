// Identifica o formato pelos primeiros bytes. O tipo MIME informado pelo Android
// (galeria, Compartilhar) nem sempre vem preenchido ou correto.

export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'gif' | 'bmp' | 'avif' | 'heic' | 'unknown';

/** Quantos bytes do início do arquivo o `sniffFormat` precisa. */
export const SNIFF_BYTES = 64;

const HEIC_BRANDS = new Set(['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'hevm', 'hevs']);
const AVIF_BRANDS = new Set(['avif', 'avis']);
/** Marcas genéricas do contêiner HEIF: sozinhas, não dizem qual é o codec. */
const HEIF_BRANDS = new Set(['mif1', 'msf1']);

function ascii(bytes: Uint8Array, start: number, length: number): string {
  let text = '';
  for (let i = start; i < start + length && i < bytes.length; i++) {
    text += String.fromCharCode(bytes[i] ?? 0);
  }
  return text;
}

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  return signature.every((value, i) => bytes[i] === value);
}

/** Lê a caixa `ftyp` (ISO BMFF), usada tanto pelo AVIF quanto pelo HEIC. */
function sniffIsoBmff(bytes: Uint8Array): ImageFormat {
  if (ascii(bytes, 4, 4) !== 'ftyp') return 'unknown';
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const boxEnd = Math.min(view.getUint32(0), bytes.length);

  // Marca principal em 8..12, versão em 12..16 e as marcas compatíveis depois.
  const brands = [ascii(bytes, 8, 4)];
  for (let pos = 16; pos + 4 <= boxEnd; pos += 4) brands.push(ascii(bytes, pos, 4));

  if (brands.some((b) => AVIF_BRANDS.has(b))) return 'avif';
  if (brands.some((b) => HEIC_BRANDS.has(b))) return 'heic';
  // HEIF sem marca de codec conhecida: na prática, são fotos HEIC.
  if (brands.some((b) => HEIF_BRANDS.has(b))) return 'heic';
  return 'unknown';
}

export function sniffFormat(bytes: Uint8Array): ImageFormat {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (ascii(bytes, 0, 4) === 'GIF8') return 'gif';
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') return 'webp';
  if (ascii(bytes, 0, 2) === 'BM') return 'bmp';
  if (bytes.length >= 12) return sniffIsoBmff(bytes);
  return 'unknown';
}
