// Lê dimensões e orientação EXIF de um JPEG sem decodificar a imagem.

export type ExifOrientation = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface JpegInfo {
  /** Dimensões gravadas no arquivo, antes de aplicar a orientação EXIF. */
  width: number;
  height: number;
  /** Tag EXIF 0x0112. Vale 1 quando o arquivo não tem EXIF ou o valor é inválido. */
  orientation: ExifOrientation;
  /** 1 = tons de cinza, 3 = YCbCr/RGB, 4 = CMYK. */
  components: number;
  /** Bits por componente (8 na imensa maioria dos arquivos). */
  precision: number;
  /** Número do marcador SOF: 0 = baseline, 1 = sequencial estendido, 2 = progressivo… */
  process: number;
}

const SOI = 0xd8;
const EOI = 0xd9;
const SOS = 0xda;
const APP1 = 0xe1;
const TAG_ORIENTATION = 0x0112;
const TYPE_SHORT = 3;

/** SOF0 a SOF15, menos DHT (C4), JPG (C8) e DAC (CC), que não são quadros. */
function isSof(marker: number): boolean {
  return marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
}

/** Marcadores sem tamanho nem dados: TEM e RST0 a RST7. */
function isStandalone(marker: number): boolean {
  return marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7);
}

function toOrientation(value: number): ExifOrientation {
  return value >= 1 && value <= 8 ? (value as ExifOrientation) : 1;
}

/** `start` aponta para o primeiro byte depois do tamanho do segmento APP1. */
function readExifOrientation(view: DataView, start: number, end: number): ExifOrientation | null {
  // "Exif\0\0" e, em seguida, o cabeçalho TIFF.
  if (end - start < 14) return null;
  if (view.getUint32(start) !== 0x45786966 || view.getUint16(start + 4) !== 0) return null;

  const tiff = start + 6;
  const order = view.getUint16(tiff);
  if (order !== 0x4949 && order !== 0x4d4d) return null;
  const little = order === 0x4949;
  if (view.getUint16(tiff + 2, little) !== 42) return null;

  const ifd = tiff + view.getUint32(tiff + 4, little);
  if (ifd + 2 > end) return null;
  const count = view.getUint16(ifd, little);

  for (let i = 0; i < count; i++) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > end) return null;
    if (view.getUint16(entry, little) !== TAG_ORIENTATION) continue;
    if (view.getUint16(entry + 2, little) !== TYPE_SHORT) return null;
    return toOrientation(view.getUint16(entry + 8, little));
  }
  return null;
}

/** Devolve `null` quando os bytes não são um JPEG legível. */
export function readJpegInfo(bytes: Uint8Array): JpegInfo | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const size = view.byteLength;
  if (size < 4 || view.getUint8(0) !== 0xff || view.getUint8(1) !== SOI) return null;

  let orientation: ExifOrientation | null = null;
  let pos = 2;

  while (pos + 1 < size) {
    if (view.getUint8(pos) !== 0xff) return null;
    // Bytes 0xFF de preenchimento podem vir antes do marcador.
    let marker = view.getUint8(pos + 1);
    while (marker === 0xff) {
      pos++;
      if (pos + 1 >= size) return null;
      marker = view.getUint8(pos + 1);
    }
    pos += 2;

    if (isStandalone(marker)) continue;
    // O quadro (SOF) sempre vem antes dos dados da imagem.
    if (marker === EOI || marker === SOS) return null;

    if (pos + 2 > size) return null;
    const length = view.getUint16(pos);
    const end = pos + length;
    if (length < 2 || end > size) return null;

    if (marker === APP1 && orientation === null) {
      orientation = readExifOrientation(view, pos + 2, end);
    } else if (isSof(marker)) {
      if (length < 8) return null;
      const height = view.getUint16(pos + 3);
      const width = view.getUint16(pos + 5);
      if (width === 0 || height === 0) return null;
      return {
        width,
        height,
        orientation: orientation ?? 1,
        components: view.getUint8(pos + 7),
        precision: view.getUint8(pos + 2),
        process: marker - 0xc0,
      };
    }
    pos = end;
  }
  return null;
}

/** As orientações 5 a 8 trocam largura e altura na exibição. */
export function swapsAxes(orientation: ExifOrientation): boolean {
  return orientation >= 5;
}

/** Dimensões como a imagem aparece, com a orientação EXIF aplicada. */
export function displaySize(info: Pick<JpegInfo, 'width' | 'height' | 'orientation'>): {
  width: number;
  height: number;
} {
  return swapsAxes(info.orientation)
    ? { width: info.height, height: info.width }
    : { width: info.width, height: info.height };
}
