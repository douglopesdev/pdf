// Gera as imagens de teste em tests/fixtures. Rode com `pnpm fixtures`.
// As imagens são minúsculas (60 × 40) e ficam versionadas; este script existe
// para recriá-las sem depender de arquivos de fora.
//
// Desenho base, em pé: quatro quadrantes. Vermelho em cima à esquerda, verde em
// cima à direita, azul embaixo à esquerda e amarelo embaixo à direita.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const OUT = join('tests', 'fixtures');
const W = 60;
const H = 40;

/** @type {readonly (readonly [number, number, number])[]} */
const COLORS = [
  [220, 40, 40],
  [40, 170, 70],
  [40, 80, 220],
  [240, 210, 40],
];

/**
 * Cor do pixel (x, y) no desenho base.
 * @param {number} x
 * @param {number} y
 * @returns {readonly [number, number, number]}
 */
function colorAt(x, y) {
  const quadrant = (y < H / 2 ? 0 : 2) + (x < W / 2 ? 0 : 1);
  return COLORS[quadrant] ?? [0, 0, 0];
}

/**
 * Pixels RGBA de uma imagem cujo pixel (sx, sy) vem do ponto `source(sx, sy)`
 * do desenho base.
 * @param {number} width
 * @param {number} height
 * @param {(sx: number, sy: number) => readonly [number, number]} source
 * @param {(x: number, y: number) => number} [alpha]
 */
function pixels(width, height, source, alpha) {
  const data = Buffer.alloc(width * height * 4);
  for (let sy = 0; sy < height; sy++) {
    for (let sx = 0; sx < width; sx++) {
      const [x, y] = source(sx, sy);
      const [r, g, b] = colorAt(x, y);
      data.set([r, g, b, alpha ? alpha(x, y) : 255], (sy * width + sx) * 4);
    }
  }
  return sharp(data, { raw: { width, height, channels: 4 } });
}

/** @type {(sx: number, sy: number) => readonly [number, number]} */
const upright = (sx, sy) => [sx, sy];

/** O quadrante verde fica transparente. @type {(x: number, y: number) => number} */
const greenTransparent = (x, y) => (x >= W / 2 && y < H / 2 ? 0 : 255);

/**
 * Para cada orientação EXIF, de onde vem o pixel gravado (sx, sy), de modo que
 * a imagem exibida (com o EXIF aplicado) seja sempre o desenho base em pé.
 * @type {Record<number, (sx: number, sy: number) => readonly [number, number]>}
 */
const EXIF_SOURCE = {
  1: (sx, sy) => [sx, sy],
  2: (sx, sy) => [W - 1 - sx, sy],
  3: (sx, sy) => [W - 1 - sx, H - 1 - sy],
  4: (sx, sy) => [sx, H - 1 - sy],
  5: (sx, sy) => [sy, sx],
  6: (sx, sy) => [W - 1 - sy, sx],
  7: (sx, sy) => [W - 1 - sy, H - 1 - sx],
  8: (sx, sy) => [sy, H - 1 - sx],
};

/** BMP de 24 bits sem compressão, escrito à mão (o sharp não gera BMP). */
function bmp() {
  const rowSize = Math.ceil((W * 3) / 4) * 4;
  const data = Buffer.alloc(54 + rowSize * H);
  data.write('BM', 0, 'ascii');
  data.writeUInt32LE(data.length, 2);
  data.writeUInt32LE(54, 10);
  data.writeUInt32LE(40, 14);
  data.writeInt32LE(W, 18);
  data.writeInt32LE(H, 22); // positivo = linhas de baixo para cima
  data.writeUInt16LE(1, 26);
  data.writeUInt16LE(24, 28);
  data.writeUInt32LE(rowSize * H, 34);
  data.writeInt32LE(2835, 38);
  data.writeInt32LE(2835, 42);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const [r, g, b] = colorAt(x, H - 1 - y);
      data.set([b, g, r], 54 + y * rowSize + x * 3);
    }
  }
  return data;
}

/**
 * @param {string} name
 * @param {Buffer} data
 */
function save(name, data) {
  writeFileSync(join(OUT, name), data);
  console.log(`${name.padEnd(16)} ${data.length} bytes`);
}

mkdirSync(OUT, { recursive: true });

save('photo.jpg', await pixels(W, H, upright).jpeg({ quality: 85 }).toBuffer());
save(
  'gray.jpg',
  await pixels(W, H, upright).removeAlpha().toColourspace('b-w').jpeg({ quality: 85 }).toBuffer(),
);
save('progressive.jpg', await pixels(W, H, upright).jpeg({ progressive: true }).toBuffer());
save('alpha.png', await pixels(W, H, upright, greenTransparent).png().toBuffer());
save(
  'alpha.webp',
  await pixels(W, H, upright, greenTransparent).webp({ lossless: true }).toBuffer(),
);
save('alpha.avif', await pixels(W, H, upright, greenTransparent).avif({ quality: 80 }).toBuffer());
save('image.bmp', bmp());

// GIF animado: o primeiro quadro é o desenho base; o segundo, ele de ponta-cabeça.
const frames = await Promise.all([
  pixels(W, H, upright).png().toBuffer(),
  pixels(W, H, EXIF_SOURCE[3] ?? upright)
    .png()
    .toBuffer(),
]);
save(
  'animated.gif',
  await sharp(frames, { join: { animated: true } })
    .gif({ delay: [200, 200], loop: 0 })
    .toBuffer(),
);

for (let orientation = 1; orientation <= 8; orientation++) {
  const swapped = orientation >= 5;
  const image = pixels(swapped ? H : W, swapped ? W : H, EXIF_SOURCE[orientation] ?? upright);
  save(
    `exif-${orientation}.jpg`,
    await image.jpeg({ quality: 85 }).withMetadata({ orientation }).toBuffer(),
  );
}
